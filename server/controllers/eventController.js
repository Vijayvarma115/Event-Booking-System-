const Event = require('../models/Event');

// @desc    Get all events
// @route   GET /api/events
// @access  Public
exports.getEvents = async (req, res) => {
  try {
    const { category, city, search, featured } = req.query;
    let query = {};

    if (category) query.category = category;
    if (city) query.city = new RegExp(city, 'i');
    if (featured) query.featured = featured === 'true';
    if (search) {
      query.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') }
      ];
    }

    const events = await Event.find(query)
      .populate('organizer', 'name email')
      .sort({ date: 1 });

    res.status(200).json({
      success: true,
      count: events.length,
      events
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single event
// @route   GET /api/events/:id
// @access  Public
exports.getEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizer', 'name email');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    res.status(200).json({
      success: true,
      event
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create event
// @route   POST /api/events
// @access  Private/Admin
exports.createEvent = async (req, res) => {
  try {
    req.body.organizer = req.user.id;
    
    const event = await Event.create(req.body);

    res.status(201).json({
      success: true,
      event
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update event
// @route   PUT /api/events/:id
// @access  Private/Admin
exports.updateEvent = async (req, res) => {
  try {
    let event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Update fields manually
    Object.keys(req.body).forEach(key => {
      event[key] = req.body[key];
    });

    // Save the event (this triggers pre-save hooks)
    await event.save();

    res.status(200).json({
      success: true,
      event
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private/Admin
exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    await event.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get event seat map
// @route   GET /api/events/:id/seat-map
// @access  Public
exports.getSeatMap = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    if (!event.seatMapEnabled) {
      return res.status(400).json({
        success: false,
        message: 'Seat map not enabled for this event'
      });
    }

    // Calculate availability statistics
    const statistics = {
      totalSeats: 0,
      availableSeats: 0,
      bookedSeats: 0,
      lockedSeats: 0,
      sectionStats: []
    };

    for (const section of event.sections) {
      let sectionAvailable = 0;
      let sectionBooked = 0;
      let sectionLocked = 0;
      let sectionTotal = 0;

      for (const row of section.rows) {
        for (const seat of row.seats) {
          sectionTotal++;
          if (seat.status === 'available') sectionAvailable++;
          else if (seat.status === 'booked') sectionBooked++;
          else if (seat.status === 'locked') sectionLocked++;
        }
      }

      statistics.sectionStats.push({
        sectionId: section.sectionId,
        sectionName: section.name,
        total: sectionTotal,
        available: sectionAvailable,
        booked: sectionBooked,
        locked: sectionLocked,
        price: section.price
      });

      statistics.totalSeats += sectionTotal;
      statistics.availableSeats += sectionAvailable;
      statistics.bookedSeats += sectionBooked;
      statistics.lockedSeats += sectionLocked;
    }

    res.status(200).json({
      success: true,
      seatMap: event.sections,
      statistics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Validate seat availability
// @route   POST /api/events/:id/validate-seats
// @access  Public
exports.validateSeats = async (req, res) => {
  try {
    const { seats } = req.body;

    if (!seats || !Array.isArray(seats) || seats.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide seats array'
      });
    }

    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    if (!event.seatMapEnabled) {
      return res.status(400).json({
        success: false,
        message: 'Seat map not enabled for this event'
      });
    }

    const unavailableSeats = [];
    const availableSeats = [];

    for (const reqSeat of seats) {
      const section = event.sections.find(s => s.sectionId === reqSeat.sectionId);
      if (!section) {
        unavailableSeats.push({ ...reqSeat, reason: 'Section not found' });
        continue;
      }

      const row = section.rows.find(r => r.rowId === reqSeat.rowId);
      if (!row) {
        unavailableSeats.push({ ...reqSeat, reason: 'Row not found' });
        continue;
      }

      const seat = row.seats.find(s => s.seatId === reqSeat.seatId);
      if (!seat) {
        unavailableSeats.push({...reqSeat, reason: 'Seat not found' });
        continue;
      }

      if (seat.status !== 'available') {
        unavailableSeats.push({
          ...reqSeat,
          reason: `Seat is ${seat.status}`,
          currentStatus: seat.status
        });
      } else {
        availableSeats.push({
          ...reqSeat,
          price: section.price,
          sectionName: section.name
        });
      }
    }

    const allAvailable = unavailableSeats.length === 0;

    res.status(200).json({
      success: true,
      allAvailable,
      availableSeats,
      unavailableSeats,
      message: allAvailable
        ? 'All seats are available'
        : `${unavailableSeats.length} seat(s) are not available`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
