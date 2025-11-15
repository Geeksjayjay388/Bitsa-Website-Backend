const express = require('express');
const router = express.Router();
const {
  submitFeedback,
  getAllFeedback,
  getFeedback,
  updateFeedbackStatus,
  deleteFeedback
} = require('../controllers/feedbackController');

const { protect, authorize } = require('../middleware/auth');



// @route   POST /api/feedback
// @desc    Submit feedback (Public - but links to user if logged in)
// @access  Public
router.post('/', submitFeedback);

// @route   GET /api/feedback
// @desc    Get all feedback (with optional status filter)
// @access  Private/Admin
router.get('/', protect, authorize('admin'), getAllFeedback);

// @route   GET /api/feedback/:id
// @desc    Get single feedback by ID
// @access  Private/Admin
router.get('/:id', protect, authorize('admin'), getFeedback);

// @route   PUT /api/feedback/:id/status
// @desc    Update feedback status (pending/read/replied) and add admin notes
// @access  Private/Admin
router.put('/:id/status', protect, authorize('admin'), updateFeedbackStatus);

// @route   DELETE /api/feedback/:id
// @desc    Delete feedback
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), deleteFeedback);

module.exports = router;