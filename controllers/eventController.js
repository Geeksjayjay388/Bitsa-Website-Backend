const Event = require('../models/Event');
const User = require('../models/User');

// Helper: populate only valid users
const cleanPopulate = async (event) => {
  await event.populate('registeredUsers.user', 'fullName email');
  event.registeredUsers = event.registeredUsers.filter(u => u && u.user);
  return event;
};

// ======================================================
// PUBLIC CONTROLLERS
// ======================================================

// GET all events
exports.getAllEvents = async (req, res) => {
  try {
    let events = await Event.find()
      .sort({ date: 1 })
      .populate('registeredUsers.user', 'fullName email');

    const clean = events.map(ev => ({
      ...ev.toObject(),
      registeredUsers: ev.registeredUsers.filter(u => u && u.user)
    }));

    res.status(200).json({ success: true, count: clean.length, data: clean });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET single event
exports.getEvent = async (req, res) => {
  try {
    let event = await Event.findById(req.params.id)
      .populate('registeredUsers.user', 'fullName email');

    if (!event)
      return res.status(404).json({ success: false, message: 'Event not found' });

    event.registeredUsers = event.registeredUsers.filter(u => u && u.user);

    res.status(200).json({ success: true, data: event });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Register for event
exports.registerForEvent = async (req, res) => {
  try {
    const userId = req.user.id;
    const event = await Event.findById(req.params.id);

    if (!event)
      return res.status(404).json({ success: false, message: 'Event not found' });

    if (event.registeredUsers.find(u => u.user.toString() === userId))
      return res.status(400).json({ success: false, message: 'Already registered' });

    if (event.registeredUsers.length >= event.capacity)
      return res.status(400).json({ success: false, message: 'Event is full' });

    event.registeredUsers.push({ user: userId, status: 'pending' });
    await event.save();
    await cleanPopulate(event);

    res.status(200).json({ success: true, message: 'Registered', data: event });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Unregister
exports.unregisterFromEvent = async (req, res) => {
  try {
    const userId = req.user.id;
    const event = await Event.findById(req.params.id);

    if (!event)
      return res.status(404).json({ success: false, message: 'Event not found' });

    event.registeredUsers = event.registeredUsers.filter(
      u => u.user.toString() !== userId
    );

    await event.save();
    await cleanPopulate(event);

    res.status(200).json({ success: true, message: 'Unregistered', data: event });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// User’s events
exports.getMyEvents = async (req, res) => {
  try {
    const userId = req.user.id;

    const events = await Event.find({ 'registeredUsers.user': userId })
      .sort({ date: 1 })
      .populate('registeredUsers.user', 'fullName email');

    const clean = events.map(ev => ({
      ...ev.toObject(),
      registeredUsers: ev.registeredUsers.filter(u => u && u.user)
    }));

    res.status(200).json({ success: true, count: clean.length, data: clean });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ======================================================
// ADMIN CONTROLLERS
// ======================================================

// Get all registrations for an event
// Replace the getEventRegistrations function with this:

exports.getEventRegistrations = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('registeredUsers.user', 'fullName email');

    if (!event)
      return res.status(404).json({ success: false, message: 'Event not found' });

    // Filter out any null users and format the response
    const registrations = event.registeredUsers
      .filter(u => u && u.user)
      .map(reg => ({
        _id: reg._id,
        user: reg.user,
        status: reg.status,
        registeredAt: reg.registeredAt,
        notes: reg.notes
      }));

    // Return in consistent format with 'data' key
    res.status(200).json({
      success: true,
      eventId: event._id,
      count: registrations.length,
      data: registrations  // <-- Changed from 'users' to 'data'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Approve a user registration
exports.approveRegistration = async (req, res) => {
  try {
    const { id, userId } = req.params;
    const event = await Event.findById(id);

    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    const registration = event.registeredUsers.find(u => u.user.toString() === userId);
    if (!registration) return res.status(404).json({ success: false, message: 'User not registered' });

    registration.status = 'approved';
    await event.save();

    res.status(200).json({ success: true, message: 'Registration approved' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Reject registration (remove)
exports.rejectRegistration = async (req, res) => {
  try {
    const { id, userId } = req.params;
    const event = await Event.findById(id);

    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    event.registeredUsers = event.registeredUsers.filter(u => u.user.toString() !== userId);
    await event.save();

    res.status(200).json({ success: true, message: 'Registration rejected' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
