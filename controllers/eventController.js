const Event = require('../models/Event');
const User = require('../models/User');
const Registration = require('../models/Registration');

// Helper: populate registered users and remove nulls
const populateRegisteredUsers = async (event) => {
  await event.populate('registeredUsers', 'fullName email');
  event.registeredUsers = event.registeredUsers.filter(u => u);
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
      .populate('registeredUsers', 'fullName email');

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

    event.registeredUsers = event.registeredUsers.filter(u => u);
    res.status(200).json({ success: true, data: event });
  } catch (error) {
    console.error('Error in getEvent:', error);
    res.status(500).json({ success: false, message: 'Error fetching event', error: error.message });
  }
};

// POST /:id/register (protected) - UPDATED WITH REGISTRATION MODEL
exports.registerForEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    // Check if already registered
    const existingRegistration = await Registration.findOne({
      user: userId,
      event: req.params.id
    });

    if (existingRegistration) {
      return res.status(400).json({ 
        success: false, 
        message: 'Already registered',
        status: existingRegistration.status
      });
    }

    // Check capacity
    const approvedCount = await Registration.countDocuments({
      event: req.params.id,
      status: 'approved'
    });

    if (approvedCount >= event.capacity) {
      return res.status(400).json({ success: false, message: 'Event is full' });
    }

    // Create pending registration
    const registration = await Registration.create({
      user: userId,
      event: req.params.id,
      status: 'pending'
    });

    res.status(200).json({ 
      success: true, 
      message: 'Registration submitted! Awaiting admin approval.',
      data: registration
    });
  } catch (error) {
    console.error('Error in registerForEvent:', error);
    res.status(500).json({ success: false, message: 'Error registering for event', error: error.message });
  }
};

// DELETE /:id/unregister (protected)
exports.unregisterFromEvent = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const registration = await Registration.findOneAndDelete({
      user: userId,
      event: req.params.id
    });

    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }

    // Remove from event's registeredUsers if approved
    if (registration.status === 'approved') {
      await Event.findByIdAndUpdate(req.params.id, {
        $pull: { registeredUsers: userId }
      });
    }

    res.status(200).json({ success: true, message: 'Successfully unregistered' });
  } catch (error) {
    console.error('Error in unregisterFromEvent:', error);
    res.status(500).json({ success: false, message: 'Error unregistering from event', error: error.message });
  }
};

// GET /my/events (protected) - UPDATED TO INCLUDE REGISTRATION STATUS
// GET /my/events (protected) - FIXED VERSION
exports.getMyEvents = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    // Get all registrations for this user
    const registrations = await Registration.find({ user: userId })
      .populate('event')
      .sort({ createdAt: -1 });

    // Filter out any registrations where event was deleted
    const validRegistrations = registrations.filter(reg => reg.event);

    // Map to include registration status with event data
    const eventsWithStatus = validRegistrations.map(reg => {
      const eventObj = reg.event.toObject ? reg.event.toObject() : { ...reg.event };
      
      return {
        ...eventObj,
        registrationStatus: reg.status, // ⚠️ This is the critical field
        registrationId: reg._id,
        registeredAt: reg.createdAt
      };
    });

    console.log('📤 Sending events with status:', eventsWithStatus); // DEBUG

    res.status(200).json({ 
      success: true, 
      count: eventsWithStatus.length, 
      data: eventsWithStatus 
    });
  } catch (error) {
    console.error('❌ Error in getMyEvents:', error);
    res.status(500).json({ success: false, message: 'Error fetching your events', error: error.message });
  }
};
// GET /:id/registrations (Admin only) - NEW ENDPOINT
exports.getEventRegistrations = async (req, res) => {
  try {
    const registrations = await Registration.find({ event: req.params.id })
      .populate('user', 'fullName email course year')
      .populate('reviewedBy', 'fullName')
      .sort({ registeredAt: -1 });

    res.status(200).json({
      success: true,
      count: registrations.length,
      data: registrations
    });
  } catch (error) {
    console.error('Error in getEventRegistrations:', error);
    res.status(500).json({ success: false, message: 'Error fetching registrations', error: error.message });
  }
};

// PUT /registrations/:id/approve (Admin only) - NEW ENDPOINT
exports.approveRegistration = async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.id)
      .populate('event')
      .populate('user');

    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }

    if (registration.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Registration already processed' });
    }

    // Check capacity
    const approvedCount = await Registration.countDocuments({
      event: registration.event._id,
      status: 'approved'
    });

    if (approvedCount >= registration.event.capacity) {
      return res.status(400).json({ success: false, message: 'Event is at full capacity' });
    }

    // Update registration
    registration.status = 'approved';
    registration.reviewedAt = Date.now();
    registration.reviewedBy = req.user.id;
    registration.notes = req.body.notes || '';
    await registration.save();

    // Add user to event's registeredUsers array
    await Event.findByIdAndUpdate(registration.event._id, {
      $addToSet: { registeredUsers: registration.user._id }
    });

    res.status(200).json({
      success: true,
      message: 'Registration approved successfully',
      data: registration
    });
  } catch (error) {
    console.error('Error in approveRegistration:', error);
    res.status(500).json({ success: false, message: 'Error approving registration', error: error.message });
  }
};

// PUT /registrations/:id/reject (Admin only) - NEW ENDPOINT
exports.rejectRegistration = async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.id);

    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }

    if (registration.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Registration already processed' });
    }

    registration.status = 'rejected';
    registration.reviewedAt = Date.now();
    registration.reviewedBy = req.user.id;
    registration.notes = req.body.notes || 'Registration rejected by admin';
    await registration.save();

    res.status(200).json({
      success: true,
      message: 'Registration rejected',
      data: registration
    });
  } catch (error) {
    console.error('Error in rejectRegistration:', error);
    res.status(500).json({ success: false, message: 'Error rejecting registration', error: error.message });
  }
};