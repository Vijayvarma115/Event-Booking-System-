const Booking = require('../models/Booking');
const Event = require('../models/Event');
const SeatLockQueue = require('../models/SeatLockQueue');
const { sendEmail } = require('../utils/sendEmail');
const { sendSMS } = require('../utils/sendSMS');
const QRCode = require('qrcode');

// Helper function to check for time overlaps
const checkTimeOverlap = (event1Date, event1Time, event1Duration, event2Date, event2Time, event2Duration) => {
  // Parse dates
  const date1 = new Date(event1Date);
  const date2 = new Date(event2Date);

  // Check if on same day
  if (date1.toDateString() !== date2.toDateString()) {
    return false;
  }

  // Parse times (assuming format like "14:30" or "2:30 PM")
  const parseTime = (timeStr, date) => {
    const timeParts = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (!timeParts) return null;

    let hours = parseInt(timeParts[1]);
    const minutes = parseInt(timeParts[2]);
    const meridiem = timeParts[3];

    if (meridiem) {
      if (meridiem.toUpperCase() === 'PM' && hours !== 12) hours += 12;
      if (meridiem.toUpperCase() === 'AM' && hours === 12) hours = 0;
    }

    const result = new Date(date);
    result.setHours(hours, minutes, 0, 0);
    return result;
  };

  const start1 = parseTime(event1Time, date1);
  const start2 = parseTime(event2Time, date2);

  if (!start1 || !start2) return false;

  const end1 = new Date(start1.getTime() + event1Duration * 60000);
  const end2 = new Date(start2.getTime() + event2Duration * 60000);

  // Check overlap: event1 starts before event2 ends AND event1 ends after event2 starts
  return start1 < end2 && end1 > start2;
};

// @desc    Create booking
// @route   POST /api/bookings
// @access  Private
exports.createBooking = async (req, res) => {
  try {
    const { eventId, numberOfTickets, selectedSeats } = req.body;

    // Get event
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    let totalAmount;
    let bookingData = {
      event: eventId,
      user: req.user.id,
      paymentStatus: 'pending'
    };

    // Handle seat-based booking
    if (event.seatMapEnabled && selectedSeats && selectedSeats.length > 0) {
      // Verify user has valid lock on these seats
      const lockEntry = await SeatLockQueue.findOne({
        eventId,
        userId: req.user.id,
        status: 'granted'
      });

      if (!lockEntry) {
        return res.status(400).json({
          success: false,
          message: 'No valid seat lock found. Please select seats again.'
        });
      }

      // Check if lock has expired
      if (lockEntry.expiresAt && new Date() > lockEntry.expiresAt) {
        return res.status(400).json({
          success: false,
          message: 'Seat lock expired. Please select seats again.'
        });
      }

      // Prepare seat details and price breakdown
      const seatDetails = [];
      const priceBreakdown = {};
      totalAmount = 0;

      for (const reqSeat of selectedSeats) {
        const section = event.sections.find(s => s.sectionId === reqSeat.sectionId);
        if (!section) {
          return res.status(400).json({
            success: false,
            message: `Section ${reqSeat.sectionId} not found`
          });
        }

        const row = section.rows.find(r => r.rowId === reqSeat.rowId);
        if (!row) {
          return res.status(400).json({
            success: false,
            message: `Row ${reqSeat.rowId} not found in section ${section.name}`
          });
        }

        const seat = row.seats.find(s => s.seatId === reqSeat.seatId);
        if (!seat) {
          return res.status(400).json({
            success: false,
            message: `Seat ${reqSeat.seatId} not found`
          });
        }

        // Verify seat is locked by this user
        if (seat.status !== 'locked' || seat.lockedBy.toString() !== req.user.id) {
          return res.status(400).json({
            success: false,
            message: `Seat ${reqSeat.seatId} is not locked by you`
          });
        }

        // Add to seat details
        seatDetails.push({
          sectionId: section.sectionId,
          sectionName: section.name,
          rowId: row.rowId,
          seatId: seat.seatId,
          seatNumber: seat.number,
          price: section.price
        });

        // Calculate price breakdown
        if (!priceBreakdown[section.name]) {
          priceBreakdown[section.name] = {
            sectionName: section.name,
            quantity: 0,
            pricePerSeat: section.price,
            subtotal: 0
          };
        }
        priceBreakdown[section.name].quantity++;
        priceBreakdown[section.name].subtotal += section.price;

        totalAmount += section.price;

        // Update seat status from 'locked' to 'booked'
        seat.status = 'booked';
        seat.bookingId = null; // Will set after booking created
        seat.lockedBy = null;
        seat.lockedAt = null;
        seat.lockExpiry = null;
      }

      bookingData.selectedSeats = seatDetails;
      bookingData.seatPriceBreakdown = Object.values(priceBreakdown);
      bookingData.numberOfTickets = selectedSeats.length;
      bookingData.totalAmount = totalAmount;

      // Create booking
      const booking = await Booking.create(bookingData);

      // Update seat bookingId references
      for (const reqSeat of selectedSeats) {
        const section = event.sections.find(s => s.sectionId === reqSeat.sectionId);
        const row = section.rows.find(r => r.rowId === reqSeat.rowId);
        const seat = row.seats.find(s => s.seatId === reqSeat.seatId);
        seat.bookingId = booking._id;
      }

      await event.save();

      // Remove lock queue entry
      await SeatLockQueue.deleteOne({ _id: lockEntry._id });

      // Emit real-time update
      const io = req.app.get('io');
      if (io) {
        io.to(`event:${eventId}`).emit('seats-booked', {
          eventId,
          seats: selectedSeats,
          userId: req.user.id
        });
      }

      const populatedBooking = await Booking.findById(booking._id)
        .populate('event')
        .populate('user', 'name email');

      return res.status(201).json({
        success: true,
        booking: populatedBooking
      });
    }

    // ==========================================
    // SIMPLE BOOKING SYSTEM (Non-seat-specific)
    // ==========================================
    // Uses atomic operations to prevent race conditions during concurrent bookings.
    // For advanced seat-level locking, see Future Enhancement: FIFO Queue + 2PL

    // Legacy simple booking (backwards compatible)
    // Check availability
    if (event.availableSeats < numberOfTickets) {
      return res.status(400).json({
        success: false,
        message: `Only ${event.availableSeats} seats available`
      });
    }

    // Calculate total amount
    totalAmount = event.price * numberOfTickets;

    // ATOMIC OPERATION: Use findOneAndUpdate to prevent race conditions
    // This ensures that the availability check and seat decrement happen atomically
    const updatedEvent = await Event.findOneAndUpdate(
      {
        _id: eventId,
        availableSeats: { $gte: numberOfTickets } // Ensure seats still available
      },
      {
        $inc: { availableSeats: -numberOfTickets } // Atomic decrement
      },
      {
        new: true // Return updated document
      }
    );

    // If update failed, seats were taken by another request (race condition)
    if (!updatedEvent) {
      return res.status(400).json({
        success: false,
        message: 'Seats no longer available. Please try again with fewer tickets.'
      });
    }

    // Create booking only after successful seat reservation
    const booking = await Booking.create({
      event: eventId,
      user: req.user.id,
      numberOfTickets,
      totalAmount,
      paymentStatus: 'pending'
    });

    const populatedBooking = await Booking.findById(booking._id)
      .populate('event')
      .populate('user', 'name email');

    res.status(201).json({
      success: true,
      booking: populatedBooking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get user bookings
// @route   GET /api/bookings
// @access  Private
exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id })
      .populate('event')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all bookings (Admin)
// @route   GET /api/bookings/all
// @access  Private/Admin
exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('event')
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single booking
// @route   GET /api/bookings/:id
// @access  Private
exports.getBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('event')
      .populate('user', 'name email phone');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Make sure user owns booking or is admin
    if (booking.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this booking'
      });
    }

    res.status(200).json({
      success: true,
      booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Cancel booking
// @route   DELETE /api/bookings/:id
// @access  Private
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Make sure user owns booking
    if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this booking'
      });
    }

    // Check if already cancelled
    if (booking.bookingStatus === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Booking already cancelled'
      });
    }

    // Update booking status
    booking.bookingStatus = 'cancelled';
    await booking.save();

    // ATOMIC OPERATION: Return seats to event inventory
    await Event.findByIdAndUpdate(
      booking.event,
      {
        $inc: { availableSeats: booking.numberOfTickets } // Atomic increment
      }
    );

    // Send cancellation email
    const user = await require('../models/User').findById(booking.user);
    if (user) {
      await sendEmail({
        to: user.email,
        subject: 'Booking Cancelled',
        html: `
          <h2>Booking Cancelled</h2>
          <p>Your booking (${booking.bookingReference}) has been cancelled.</p>
          <p>Refund will be processed within 5-7 business days.</p>
        `
      });
    }

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update booking payment status
// @route   PUT /api/bookings/:id/payment
// @access  Private
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { paymentStatus, paymentIntentId } = req.body;

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    booking.paymentStatus = paymentStatus;
    if (paymentIntentId) {
      booking.paymentIntentId = paymentIntentId;
    }

    // Generate QR code when payment is completed
    if (paymentStatus === 'completed' && !booking.qrCode) {
      const qrData = JSON.stringify({
        bookingReference: booking.bookingReference,
        bookingId: booking._id.toString(),
        eventId: booking.event.toString(),
        userId: booking.user.toString()
      });

      const qrCodeDataUrl = await QRCode.toDataURL(qrData);
      booking.qrCode = qrCodeDataUrl;
    }

    await booking.save();

    // Send confirmation email if payment completed
    if (paymentStatus === 'completed') {
      const populatedBooking = await Booking.findById(booking._id)
        .populate('event')
        .populate('user');

      // Send real-time notification if user is online
      const io = req.app.get('io');
      const connectedUsers = req.app.get('connectedUsers');
      const userSocketId = connectedUsers.get(populatedBooking.user._id.toString());

      if (userSocketId) {
        io.to(userSocketId).emit('booking-confirmed', {
          message: 'Your booking has been confirmed!',
          bookingReference: populatedBooking.bookingReference,
          eventTitle: populatedBooking.event.title,
          bookingId: populatedBooking._id
        });
      }

      // Generate ICS file for Google Calendar
      const { generateIcsFile } = require('../utils/generateIcs');
      const icsContent = await generateIcsFile(populatedBooking.event);

      // Convert QR code data URL to buffer for email attachment
      const qrCodeBase64 = populatedBooking.qrCode.replace(/^data:image\/png;base64,/, '');
      const qrCodeBuffer = Buffer.from(qrCodeBase64, 'base64');

      await sendEmail({
        to: populatedBooking.user.email,
        subject: 'Booking Confirmed',
        html: `
          <h2>Booking Confirmation</h2>
          <p>Dear ${populatedBooking.user.name},</p>
          <p>Your booking has been confirmed!</p>
          <h3>Booking Details:</h3>
          <ul>
            <li><strong>Booking Reference:</strong> ${populatedBooking.bookingReference}</li>
            <li><strong>Event:</strong> ${populatedBooking.event.title}</li>
            <li><strong>Date:</strong> ${new Date(populatedBooking.event.date).toLocaleDateString()}</li>
            <li><strong>Time:</strong> ${populatedBooking.event.time}</li>
            <li><strong>Venue:</strong> ${populatedBooking.event.venue}</li>
            <li><strong>Number of Tickets:</strong> ${populatedBooking.numberOfTickets}</li>
            <li><strong>Total Amount:</strong> $${populatedBooking.totalAmount}</li>
          </ul>
          <h3>Your QR Code Ticket:</h3>
          <img src="cid:qrcode" alt="QR Code" style="width: 200px; height: 200px; display: block; margin: 20px auto;" />
          <p style="text-align: center;"><em>Please show this QR code at the event entrance.</em></p>
          <p style="text-align: center;"><strong>📎 Attached files: QR Code Ticket & Calendar Event</strong></p>
          <p>Please arrive 30 minutes before the event starts.</p>
          <p>Thank you for booking with us!</p>
        `,
        attachments: [
          {
            filename: 'qr-code.png',
            content: qrCodeBuffer,
            contentType: 'image/png',
            cid: 'qrcode' // Content-ID for embedding in email
          },
          {
            filename: `ticket-${populatedBooking.bookingReference}.png`,
            content: qrCodeBuffer,
            contentType: 'image/png'
            // No CID - this makes it a downloadable attachment
          },
          {
            filename: 'event.ics',
            content: icsContent,
            contentType: 'text/calendar'
          }
        ]
      });

      // Send SMS confirmation if user has phone number
      if (populatedBooking.user.phone) {
        try {
          // Short message for Twilio trial (160 char limit)
          const smsMessage = `Booking confirmed! ${populatedBooking.event.title} - ${new Date(populatedBooking.event.date).toLocaleDateString()} at ${populatedBooking.event.time}. Ref: ${populatedBooking.bookingReference}`;

          const smsResult = await sendSMS(populatedBooking.user.phone, smsMessage);

          if (smsResult.success) {
            console.log(`✅ Booking confirmation SMS sent to ${populatedBooking.user.phone}`);
          } else {
            console.warn(`⚠️ Failed to send booking confirmation SMS: ${smsResult.error}`);
          }
        } catch (smsError) {
          // Log error but don't fail the booking
          console.error('❌ SMS send error (non-critical):', smsError.message);
        }
      }
    }

    res.status(200).json({
      success: true,
      booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};