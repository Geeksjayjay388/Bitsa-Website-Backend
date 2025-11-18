// routes/events.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getAllEvents,
  getEvent,
  registerForEvent,
  unregisterFromEvent,
  getMyEvents
} = require('../controllers/eventController');

// PRIVATE — Get events the logged-in user is registered for
router.get('/my/events', protect, getMyEvents);

// PUBLIC — Get all events (with populated registered users)
router.get('/', getAllEvents);

// PUBLIC — Get single event (with populated registered users)
router.get('/:id', getEvent);

// PRIVATE — Register for event
router.post('/:id/register', protect, registerForEvent);

// PRIVATE — Unregister from event
router.delete('/:id/unregister', protect, unregisterFromEvent);

module.exports = router;
