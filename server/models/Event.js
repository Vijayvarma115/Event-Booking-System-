const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide event title'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please provide event description']
  },
  category: {
    type: String,
    required: true,
    enum: ['concert', 'conference', 'workshop', 'sports', 'festival', 'other']
  },
  venue: {
    type: String,
    required: [true, 'Please provide venue']
  },
  address: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: [true, 'Please provide event date']
  },
  time: {
    type: String,
    required: [true, 'Please provide event time']
  },
  duration: {
    type: Number,
    default: 120 // Duration in minutes, default 2 hours
  },
  price: {
    type: Number,
    min: 0,
    default: 0
  },
  totalSeats: {
    type: Number,
    min: 0,
    default: 0
  },
  availableSeats: {
    type: Number
  },
  image: {
    type: String,
    default: 'https://via.placeholder.com/600x400'
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  featured: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  // Seat map configuration
  seatMapEnabled: {
    type: Boolean,
    default: false
  },
  sections: [{
    sectionId: {
      type: String
    },
    name: {
      type: String
    },
    price: {
      type: Number,
      min: 0,
      default: 0
    },
    color: {
      type: String,
      default: '#3b82f6'
    },
    rows: [{
      rowId: {
        type: String,
        required: true
      },
      seats: [{
        seatId: {
          type: String,
          required: true
        },
        number: {
          type: String,
          required: true
        },
        status: {
          type: String,
          enum: ['available', 'booked', 'locked'],
          default: 'available'
        },
        lockedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          default: null
        },
        lockedAt: {
          type: Date,
          default: null
        },
        lockExpiry: {
          type: Date,
          default: null
        },
        bookingId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Booking',
          default: null
        }
      }]
    }]
  }]
});

// Validate price and totalSeats based on seatMapEnabled
eventSchema.pre('save', function(next) {
  if (!this.seatMapEnabled) {
    // For traditional events (non-seat map), require price and totalSeats
    if (this.price === undefined || this.price === null) {
      return next(new Error('Please provide ticket price'));
    }
    if (this.totalSeats === undefined || this.totalSeats === null || this.totalSeats < 1) {
      return next(new Error('Please provide total seats (minimum 1)'));
    }
  } else {
    // For seat map events, validate sections
    if (!this.sections || this.sections.length === 0) {
      return next(new Error('Please provide at least one section for the seat map'));
    }

    // Validate each section has required fields
    for (let i = 0; i < this.sections.length; i++) {
      const section = this.sections[i];
      if (!section.sectionId || !section.name) {
        return next(new Error(`Section ${i + 1} must have sectionId and name`));
      }
      if (section.price === undefined || section.price === null || section.price < 0) {
        return next(new Error(`Section ${i + 1} must have a valid price`));
      }
    }
  }
  next();
});

// Set available seats and total seats before saving
eventSchema.pre('save', function(next) {
  if (this.seatMapEnabled && this.sections && this.sections.length > 0) {
    // Calculate total seats from seat map
    let total = 0;
    let available = 0;

    this.sections.forEach(section => {
      section.rows.forEach(row => {
        total += row.seats.length;
        available += row.seats.filter(seat => seat.status === 'available').length;
      });
    });

    this.totalSeats = total;
    this.availableSeats = available;
  } else if (this.isNew && !this.seatMapEnabled) {
    // For traditional events, set available seats to total seats on creation
    this.availableSeats = this.totalSeats;
  }
  next();
});

// Update status based on date
eventSchema.methods.updateStatus = function() {
  const now = new Date();
  const eventDate = new Date(this.date);
  
  if (eventDate < now) {
    this.status = 'completed';
  } else if (eventDate.toDateString() === now.toDateString()) {
    this.status = 'ongoing';
  } else {
    this.status = 'upcoming';
  }
};

module.exports = mongoose.model('Event', eventSchema);