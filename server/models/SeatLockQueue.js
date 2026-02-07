const mongoose = require('mongoose');

const seatLockQueueSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  requestedSeats: [{
    sectionId: String,
    rowId: String,
    seatId: String
  }],
  queuePosition: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['waiting', 'processing', 'granted', 'expired', 'released'],
    default: 'waiting'
  },
  requestedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  grantedAt: {
    type: Date
  },
  expiresAt: {
    type: Date,
    index: true
  },
  lockDuration: {
    type: Number,
    default: 600000 // 10 minutes in milliseconds
  }
});

// Compound indexes for performance
seatLockQueueSchema.index({ eventId: 1, queuePosition: 1 });
seatLockQueueSchema.index({ eventId: 1, status: 1, requestedAt: 1 });

module.exports = mongoose.model('SeatLockQueue', seatLockQueueSchema);
