const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');
const { protect } = require('../middleware/auth');

// @desc    Submit feedback
// @route   POST /api/feedback
// @access  Public
router.post('/', async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body;

    const feedback = await Feedback.create({
      name,
      email,
      subject,
      message
    });

    res.status(201).json({
      success: true,
      data: feedback,
      message: 'Feedback submitted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get my feedback
// @route   GET /api/feedback/my
// @access  Private
router.get('/my', protect, async (req, res, next) => {
  try {
    const feedback = await Feedback.find({ email: req.user.email }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: feedback.length,
      data: feedback
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;