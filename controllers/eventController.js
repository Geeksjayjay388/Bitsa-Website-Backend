const Event = require('../models/Event');
const User = require('../models/User');

// Get all events (public)
exports.getAllEvents = async (req, res) => {
  try {
    const { status, upcoming } = req.query;
    let query = {};

    if (status) {
      query.status = status;
    }

    // Filter upcoming events
    if (upcoming === 'true') {
      query.date = { $gte: new Date() };
    }

    const events = await Event.find(query)
      .populate('registeredUsers', 'fullName email') // CHANGED: name → fullName
      .sort({ date: 1 });

    res.status(200).json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching events',
      error: error.message
    });
  }
};

// Get single event (public)
exports.getEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('registeredUsers', 'fullName email'); // CHANGED: name → fullName

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    res.status(200).json({
      success: true,
      data: event
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching event',
      error: error.message
    });
  }
};

// Register for event (protected)
exports.registerForEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if event is open for registration
    if (event.status !== 'upcoming') {
      return res.status(400).json({
        success: false,
        message: 'Event registration is not open'
      });
    }

    // Check if already registered
    if (event.registeredUsers.includes(req.userId)) {
      return res.status(400).json({
        success: false,
        message: 'You are already registered for this event'
      });
    }

    // Check capacity
    if (event.registeredUsers.length >= event.capacity) {
      return res.status(400).json({
        success: false,
        message: 'Event is full'
      });
    }

    // Add user to registered users
    event.registeredUsers.push(req.userId);
    await event.save();

    // Populate before sending response
    await event.populate('registeredUsers', 'fullName email'); // CHANGED: name → fullName

    res.status(200).json({
      success: true,
      message: 'Successfully registered for event',
      data: event
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error registering for event',
      error: error.message
    });
  }
};

// Unregister from event (protected)
exports.unregisterFromEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if user is registered
    const index = event.registeredUsers.indexOf(req.userId);
    if (index === -1) {
      return res.status(400).json({
        success: false,
        message: 'You are not registered for this event'
      });
    }

    // Remove user from registered users
    event.registeredUsers.splice(index, 1);
    await event.save();

    res.status(200).json({
      success: true,
      message: 'Successfully unregistered from event'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error unregistering from event',
      error: error.message
    });
  }
};

// Get user's registered events (protected)
exports.getMyEvents = async (req, res) => {
  try {
    const events = await Event.find({ registeredUsers: req.userId })
      .populate('registeredUsers', 'fullName email'); // CHANGED: name → fullName

    res.status(200).json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching your events',
      error: error.message
    });
  }
};