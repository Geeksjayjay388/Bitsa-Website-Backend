const express = require('express');
const router = express.Router();
const {
  getEventRegistrations,
  approveRegistration,
  rejectRegistration
} = require('../controllers/eventController');

const { protect, authorize } = require('../middleware/auth');

// Admin only routes
router.get('/events/:id/registrations', protect, authorize('admin'), getEventRegistrations);
router.put('/registrations/:id/approve', protect, authorize('admin'), approveRegistration);
router.put('/registrations/:id/reject', protect, authorize('admin'), rejectRegistration);

module.exports = router;