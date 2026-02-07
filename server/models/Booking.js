const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  numberOfTickets: {
    type: Number,
    required: [true, 'Please provide number of tickets'],
    min: 1
  },
  totalAmount: {
    type: Number,
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentIntentId: {
    type: String
  },
  bookingStatus: {
    type: String,
    enum: ['confirmed', 'cancelled', 'attended'],
    default: 'confirmed'
  },
  bookingReference: {
    type: String,
    unique: true
  },
  qrCode: {
    type: String
  },
  // Seat-based booking fields
  selectedSeats: [{
    sectionId: String,
    sectionName: String,
    rowId: String,
    seatId: String,
    seatNumber: String,
    price: Number
  }],
  seatPriceBreakdown: [{
    sectionName: String,
    quantity: Number,
    pricePerSeat: Number,
    subtotal: Number
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Generate booking reference before saving
bookingSchema.pre('save', function(next) {
  if (this.isNew) {
    this.bookingReference = 'BK' + Date.now() + Math.random().toString(36).substr(2, 9).toUpperCase();
  }
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);