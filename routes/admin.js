const express = require('express');
const User = require('../models/User');
const Event = require('../models/Event');
const Blog = require('../models/Blog');
const Gallery = require('../models/Gallery');
const Feedback = require('../models/Feedback');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All admin routes require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

// @desc    Get dashboard statistics
// @route   GET /api/admin/stats
// @access  Private (Admin)
router.get('/stats', async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalEvents = await Event.countDocuments();
    const upcomingEvents = await Event.countDocuments({ status: 'upcoming' });
    const totalBlogs = await Blog.countDocuments();
    const publishedBlogs = await Blog.countDocuments({ published: true });
    const totalGalleryImages = await Gallery.countDocuments();
    const pendingFeedback = await Feedback.countDocuments({ status: 'pending' });
    
    // Get recent registrations
    const recentEvents = await Event.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title registrations');
    
    const totalRegistrations = recentEvents.reduce(
      (acc, event) => acc + event.registrations.length, 
      0
    );

    res.status(200).json({
      success: true,
      data: {
        users: totalUsers,
        events: {
          total: totalEvents,
          upcoming: upcomingEvents
        },
        blogs: {
          total: totalBlogs,
          published: publishedBlogs
        },
        gallery: totalGalleryImages,
        feedback: {
          pending: pendingFeedback
        },
        registrations: totalRegistrations
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin)
router.get('/users', async (req, res, next) => {
  try {
    const users = await User.find({ role: 'user' })
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get single user
// @route   GET /api/admin/users/:id
// @access  Private (Admin)
router.get('/users/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's registered events
    const registeredEvents = await Event.find({
      'registrations.user': req.params.id
    });

    res.status(200).json({
      success: true,
      data: {
        user,
        registeredEvents: registeredEvents.length,
        events: registeredEvents
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Toggle user active status
// @route   PUT /api/admin/users/:id/toggle-active
// @access  Private (Admin)
router.put('/users/:id/toggle-active', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({
      success: true,
      data: user,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin)
router.delete('/users/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Remove user from all event registrations
    await Event.updateMany(
      { 'registrations.user': req.params.id },
      { $pull: { registrations: { user: req.params.id } } }
    );

    await user.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;