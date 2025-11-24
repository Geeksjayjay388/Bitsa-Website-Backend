// controllers/eventController.js
const Event = require('../models/Event');
const User = require('../models/User');

// Helper: populate only valid users
const cleanPopulate = async (event) => {
  await event.populate('registeredUsers', 'fullName email');
  event.registeredUsers = event.registeredUsers.filter(u => u);
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
      .populate('registeredUsers', 'fullName email');

    const clean = events.map(ev => ({
      ...ev.toObject(),
      registeredUsers: ev.registeredUsers.filter(u => u)
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
      .populate('registeredUsers', 'fullName email');

    if (!event)
      return res.status(404).json({ success: false, message: 'Event not found' });

    event.registeredUsers = event.registeredUsers.filter(u => u);

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

    if (event.registeredUsers.includes(userId))
      return res.status(400).json({ success: false, message: 'Already registered' });

    if (event.registeredUsers.length >= event.capacity)
      return res.status(400).json({ success: false, message: 'Event is full' });

    event.registeredUsers.push(userId);
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
      (u) => u.toString() !== userId.toString()
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

    const events = await Event.find({ registeredUsers: userId })
      .sort({ date: 1 })
      .populate('registeredUsers', 'fullName email');

    const clean = events.map(ev => ({
      ...ev.toObject(),
      registeredUsers: ev.registeredUsers.filter(u => u)
    }));

    res.status(200).json({ success: true, count: clean.length, data: clean });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ======================================================
// ADMIN CONTROLLERS — THE PART YOU WERE MISSING
// ======================================================

// Get all registrations for an event
exports.getEventRegistrations = async (req, res) => {
  try {
    let event = await Event.findById(req.params.id)
      .populate('registeredUsers', 'fullName email')

    if (!event)
      return res.status(404).json({ success: false, message: 'Event not found' });

    event.registeredUsers = event.registeredUsers.filter(u => u);

    res.status(200).json({
      success: true,
      eventId: event._id,
      total: event.registeredUsers.length,
      users: event.registeredUsers
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

    if (!event.registeredUsers.includes(userId))
      return res.status(404).json({ success: false, message: 'User not registered' });

    // If you want to mark approved status, add logic here

    res.status(200).json({
      success: true,
      message: 'Registration approved'
    });
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

    event.registeredUsers = event.registeredUsers.filter(
      u => u.toString() !== userId.toString()
    );

    await event.save();

    res.status(200).json({
      success: true,
      message: 'Registration rejected'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
