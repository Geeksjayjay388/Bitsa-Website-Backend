// controllers/eventController.js
const Event = require('../models/Event');
const User = require('../models/User');

// Helper: populate registered users and remove nulls
const populateRegisteredUsers = async (event) => {
  await event.populate('registeredUsers', 'fullName email');
  event.registeredUsers = event.registeredUsers.filter(u => u); // remove nulls
  return event;
};

// GET all events (public)
exports.getAllEvents = async (req, res) => {
  try {
    const { status, upcoming } = req.query;
    let query = {};
    if (status) query.status = status;
    if (upcoming === 'true') query.date = { $gte: new Date() };

    const events = await Event.find(query)
      .sort({ date: 1 })
      .populate('registeredUsers', 'fullName email'); // populate here

    // Remove any null users
    const cleanEvents = events.map(ev => ({
      ...ev.toObject(),
      registeredUsers: ev.registeredUsers.filter(u => u)
    }));

    res.status(200).json({ success: true, count: cleanEvents.length, data: cleanEvents });
  } catch (error) {
    console.error('Error in getAllEvents:', error);
    res.status(500).json({ success: false, message: 'Error fetching events', error: error.message });
  }
};

// GET single event (public)
exports.getEvent = async (req, res) => {
  try {
    let event = await Event.findById(req.params.id)
      .populate('registeredUsers', 'fullName email');

    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    event.registeredUsers = event.registeredUsers.filter(u => u); // remove nulls
    res.status(200).json({ success: true, data: event });
  } catch (error) {
    console.error('Error in getEvent:', error);
    res.status(500).json({ success: false, message: 'Error fetching event', error: error.message });
  }
};

// POST /:id/register (protected)
exports.registerForEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    if (event.registeredUsers.includes(userId))
      return res.status(400).json({ success: false, message: 'Already registered' });

    if (event.registeredUsers.length >= event.capacity)
      return res.status(400).json({ success: false, message: 'Event is full' });

    event.registeredUsers.push(userId);
    await populateRegisteredUsers(event);

    await event.save();
    res.status(200).json({ success: true, message: 'Successfully registered', data: event });
  } catch (error) {
    console.error('Error in registerForEvent:', error);
    res.status(500).json({ success: false, message: 'Error registering for event', error: error.message });
  }
};

// DELETE /:id/unregister (protected)
exports.unregisterFromEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    event.registeredUsers = event.registeredUsers.filter(id => id.toString() !== userId.toString());
    await populateRegisteredUsers(event);

    await event.save();
    res.status(200).json({ success: true, message: 'Successfully unregistered', data: event });
  } catch (error) {
    console.error('Error in unregisterFromEvent:', error);
    res.status(500).json({ success: false, message: 'Error unregistering from event', error: error.message });
  }
};

// GET /my/events (protected)
exports.getMyEvents = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const events = await Event.find({ registeredUsers: userId })
      .sort({ date: 1 })
      .populate('registeredUsers', 'fullName email');

    const cleanEvents = events.map(ev => ({
      ...ev.toObject(),
      registeredUsers: ev.registeredUsers.filter(u => u)
    }));

    res.status(200).json({ success: true, count: cleanEvents.length, data: cleanEvents });
  } catch (error) {
    console.error('Error in getMyEvents:', error);
    res.status(500).json({ success: false, message: 'Error fetching your events', error: error.message });
  }
};
