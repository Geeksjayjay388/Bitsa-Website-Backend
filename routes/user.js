const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');

// @desc    Get user's registered events
// @route   GET /api/users/:userId/events
// @access  Private
router.get('/:userId/events', protect, async (req, res) => {
  try {
    const { userId } = req.params;

    console.log('📋 Fetching events for user:', userId);
    console.log('🔐 Authenticated user:', req.user.id);

    // Check authorization - user can only see their own events (unless admin)
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this resource'
      });
    }

    // Find user and populate their registered events
    const user = await User.findById(userId).populate({
      path: 'registeredEvents',
      select: 'title description date time location image category maxAttendees registeredUsers',
      options: { sort: { date: 1 } } // Sort by date ascending
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('✅ Found', user.registeredEvents?.length || 0, 'events for user');

    // Return the events
    res.status(200).json({
      success: true,
      count: user.registeredEvents?.length || 0,
      events: user.registeredEvents || [],
      data: user.registeredEvents || []
    });
  } catch (error) {
    console.error('❌ Error fetching user events:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user events',
      error: error.message
    });
  }
});

// @desc    Get user profile
// @route   GET /api/users/:userId
// @access  Private
router.get('/:userId', protect, async (req, res) => {
  try {
    const { userId } = req.params;

    // Check authorization
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this resource'
      });
    }

    const user = await User.findById(userId).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        _id: user._id,
        fullName: user.fullName,
        name: user.fullName,
        email: user.email,
        course: user.course,
        year: user.year,
        role: user.role,
        profileImage: user.profileImage,
        isActive: user.isActive,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('❌ Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message
    });
  }
});

module.exports = router;