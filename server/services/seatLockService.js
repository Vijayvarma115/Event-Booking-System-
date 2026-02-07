const mongoose = require('mongoose');
const Event = require('../models/Event');
const SeatLockQueue = require('../models/SeatLockQueue');
const Booking = require('../models/Booking');

/**
 * Request a seat lock - Entry point for FIFO queue
 */
async function requestSeatLock(userId, eventId, requestedSeats, io, connectedUsers) {
  try {
    // Validate event exists
    const event = await Event.findById(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    if (!event.seatMapEnabled) {
      throw new Error('Seat map not enabled for this event');
    }

    // Validate all requested seats exist and are not booked
    const invalidSeats = [];
    for (const reqSeat of requestedSeats) {
      const section = event.sections.find(s => s.sectionId === reqSeat.sectionId);
      if (!section) {
        invalidSeats.push(reqSeat);
        continue;
      }

      const row = section.rows.find(r => r.rowId === reqSeat.rowId);
      if (!row) {
        invalidSeats.push(reqSeat);
        continue;
      }

      const seat = row.seats.find(s => s.seatId === reqSeat.seatId);
      if (!seat || seat.status === 'booked') {
        invalidSeats.push(reqSeat);
      }
    }

    if (invalidSeats.length > 0) {
      throw new Error('Some seats are invalid or already booked');
    }

    // Check if user already has a pending request for this event
    const existingRequest = await SeatLockQueue.findOne({
      eventId,
      userId,
      status: { $in: ['waiting', 'processing', 'granted'] }
    });

    if (existingRequest) {
      return {
        granted: existingRequest.status === 'granted',
        queuePosition: existingRequest.queuePosition,
        expiresAt: existingRequest.expiresAt,
        message: existingRequest.status === 'granted'
          ? 'Lock already granted'
          : 'Already in queue'
      };
    }

    // Get next queue position
    const lastQueueEntry = await SeatLockQueue
      .findOne({ eventId })
      .sort({ queuePosition: -1 });

    const queuePosition = lastQueueEntry ? lastQueueEntry.queuePosition + 1 : 1;

    // Create queue entry
    const queueEntry = await SeatLockQueue.create({
      eventId,
      userId,
      requestedSeats,
      queuePosition,
      status: 'waiting'
    });

    // Process queue immediately if this is first in line
    if (queuePosition === 1) {
      return await processQueue(eventId, io, connectedUsers);
    }

    return {
      granted: false,
      queuePosition,
      message: 'Added to queue'
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Process the queue - Grant lock to next user in FIFO order
 */
async function processQueue(eventId, io, connectedUsers) {
  try {
    // Find next waiting entry in queue (FIFO)
    const nextEntry = await SeatLockQueue
      .findOne({
        eventId,
        status: 'waiting'
      })
      .sort({ queuePosition: 1 });

    if (!nextEntry) {
      return { granted: false, message: 'No pending requests' };
    }

    // Update status to processing
    nextEntry.status = 'processing';
    await nextEntry.save();

    // Attempt to acquire lock
    const lockResult = await acquireSeatsLock(nextEntry, io, connectedUsers);

    return lockResult;
  } catch (error) {
    throw error;
  }
}

/**
 * Two-Phase Locking - Growing Phase (Acquire Locks)
 */
async function acquireSeatsLock(queueEntry, io, connectedUsers) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const event = await Event.findById(queueEntry.eventId).session(session);

    if (!event) {
      await session.abortTransaction();
      session.endSession();
      throw new Error('Event not found');
    }

    // Sort requested seats to prevent deadlocks (consistent ordering)
    const sortedSeats = queueEntry.requestedSeats.sort((a, b) => {
      if (a.sectionId !== b.sectionId) return a.sectionId.localeCompare(b.sectionId);
      if (a.rowId !== b.rowId) return a.rowId.localeCompare(b.rowId);
      return a.seatId.localeCompare(b.seatId);
    });

    const lockExpiry = new Date(Date.now() + queueEntry.lockDuration);
    const unavailableSeats = [];
    let totalPrice = 0;

    // Validate and lock all seats atomically
    for (const reqSeat of sortedSeats) {
      const section = event.sections.find(s => s.sectionId === reqSeat.sectionId);
      if (!section) {
        unavailableSeats.push(reqSeat);
        continue;
      }

      const row = section.rows.find(r => r.rowId === reqSeat.rowId);
      if (!row) {
        unavailableSeats.push(reqSeat);
        continue;
      }

      const seat = row.seats.find(s => s.seatId === reqSeat.seatId);

      // Check if seat is available
      if (!seat || seat.status === 'booked' ||
          (seat.status === 'locked' && seat.lockedBy.toString() !== queueEntry.userId.toString())) {
        unavailableSeats.push(reqSeat);
        continue;
      }

      // Lock the seat
      seat.status = 'locked';
      seat.lockedBy = queueEntry.userId;
      seat.lockedAt = new Date();
      seat.lockExpiry = lockExpiry;

      totalPrice += section.price;
    }

    // If any seat is unavailable, abort transaction
    if (unavailableSeats.length > 0) {
      await session.abortTransaction();
      session.endSession();

      // Release the queue entry
      queueEntry.status = 'expired';
      await queueEntry.save();

      // Notify user seats are unavailable
      if (io && connectedUsers) {
        const userSocketId = connectedUsers.get(queueEntry.userId.toString());
        if (userSocketId) {
          io.to(userSocketId).emit('lock-failed', {
            message: 'Some seats are no longer available',
            unavailableSeats
          });
        }
      }

      // Process next in queue
      await processQueue(queueEntry.eventId, io, connectedUsers);

      throw new Error('Some seats are no longer available');
    }

    // Save event with locked seats
    await event.save({ session });

    // Update queue entry to granted
    queueEntry.status = 'granted';
    queueEntry.grantedAt = new Date();
    queueEntry.expiresAt = lockExpiry;
    await queueEntry.save({ session });

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    // Emit real-time notifications
    if (io && connectedUsers) {
      // Notify user lock granted
      const userSocketId = connectedUsers.get(queueEntry.userId.toString());
      if (userSocketId) {
        io.to(userSocketId).emit('lock-granted', {
          seats: queueEntry.requestedSeats,
          expiresAt: lockExpiry,
          totalPrice,
          message: 'Seats locked successfully!'
        });
      }

      // Broadcast seat status changes to all clients in event room
      io.to(`event:${queueEntry.eventId}`).emit('seat-status-changed', {
        eventId: queueEntry.eventId,
        seats: queueEntry.requestedSeats.map(s => ({
          ...s,
          status: 'locked',
          lockedBy: queueEntry.userId
        }))
      });
    }

    // Set automatic expiry timer
    setTimeout(async () => {
      await cleanupExpiredLock(queueEntry.userId, queueEntry.eventId, io, connectedUsers);
    }, queueEntry.lockDuration);

    return {
      granted: true,
      expiresAt: lockExpiry,
      totalPrice,
      message: 'Seats locked successfully!'
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
}

/**
 * Two-Phase Locking - Shrinking Phase (Release Locks)
 */
async function releaseSeatsLock(userId, eventId, io, connectedUsers) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const event = await Event.findById(eventId).session(session);

    if (!event) {
      await session.abortTransaction();
      session.endSession();
      throw new Error('Event not found');
    }

    const releasedSeats = [];

    // Find and release all seats locked by this user
    for (const section of event.sections) {
      for (const row of section.rows) {
        for (const seat of row.seats) {
          if (seat.status === 'locked' &&
              seat.lockedBy &&
              seat.lockedBy.toString() === userId.toString()) {
            seat.status = 'available';
            seat.lockedBy = null;
            seat.lockedAt = null;
            seat.lockExpiry = null;

            releasedSeats.push({
              sectionId: section.sectionId,
              rowId: row.rowId,
              seatId: seat.seatId
            });
          }
        }
      }
    }

    await event.save({ session });

    // Remove from queue
    await SeatLockQueue.deleteOne({ eventId, userId, status: 'granted' }).session(session);

    await session.commitTransaction();
    session.endSession();

    // Emit real-time updates
    if (io && connectedUsers && releasedSeats.length > 0) {
      io.to(`event:${eventId}`).emit('seat-status-changed', {
        eventId,
        seats: releasedSeats.map(s => ({ ...s, status: 'available' }))
      });
    }

    // Process next user in queue
    await processQueue(eventId, io, connectedUsers);

    return {
      success: true,
      message: 'Seats released successfully',
      releasedSeats
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
}

/**
 * Check lock status for a user
 */
async function getLockStatus(userId, eventId) {
  try {
    const queueEntry = await SeatLockQueue.findOne({
      eventId,
      userId,
      status: { $in: ['waiting', 'processing', 'granted'] }
    });

    if (!queueEntry) {
      return {
        hasLock: false,
        message: 'No active lock or queue entry'
      };
    }

    return {
      hasLock: queueEntry.status === 'granted',
      status: queueEntry.status,
      queuePosition: queueEntry.queuePosition,
      expiresAt: queueEntry.expiresAt,
      requestedSeats: queueEntry.requestedSeats
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Cleanup expired locks (called by cron or timeout)
 */
async function cleanupExpiredLock(userId, eventId, io, connectedUsers) {
  try {
    const queueEntry = await SeatLockQueue.findOne({
      eventId,
      userId,
      status: 'granted'
    });

    if (!queueEntry) {
      return; // Already processed or released
    }

    // Check if lock has actually expired
    if (queueEntry.expiresAt && new Date() < queueEntry.expiresAt) {
      return; // Lock still valid
    }

    // Check if booking was created with this lock
    const booking = await Booking.findOne({
      event: eventId,
      user: userId,
      createdAt: { $gte: queueEntry.grantedAt }
    });

    if (booking && booking.paymentStatus === 'completed') {
      // Booking completed, just clean up queue
      await SeatLockQueue.deleteOne({ _id: queueEntry._id });
      return;
    }

    // Release the lock
    await releaseSeatsLock(userId, eventId, io, connectedUsers);

    // Delete any unpaid bookings
    if (booking && booking.paymentStatus === 'pending') {
      await Booking.deleteOne({ _id: booking._id });
    }

    // Notify user
    if (io && connectedUsers) {
      const userSocketId = connectedUsers.get(userId.toString());
      if (userSocketId) {
        io.to(userSocketId).emit('lock-expired', {
          message: 'Your seat lock has expired. Please select seats again.'
        });
      }
    }
  } catch (error) {
    console.error('Error cleaning up expired lock:', error);
  }
}

/**
 * Cleanup all expired locks (cron job function)
 */
async function cleanupAllExpiredLocks(io, connectedUsers) {
  try {
    const now = new Date();

    // Find all expired locks
    const expiredLocks = await SeatLockQueue.find({
      status: 'granted',
      expiresAt: { $lt: now }
    });

    for (const lock of expiredLocks) {
      await cleanupExpiredLock(lock.userId, lock.eventId, io, connectedUsers);
    }

    return {
      success: true,
      cleanedCount: expiredLocks.length
    };
  } catch (error) {
    console.error('Error in cleanupAllExpiredLocks:', error);
    throw error;
  }
}

module.exports = {
  requestSeatLock,
  acquireSeatsLock,
  releaseSeatsLock,
  getLockStatus,
  cleanupExpiredLock,
  cleanupAllExpiredLocks,
  processQueue
};
