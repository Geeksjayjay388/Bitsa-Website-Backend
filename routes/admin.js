const express = require('express');
const User = require('../models/User');
const Event = require('../models/Event');
const Blog = require('../models/Blog');
const Gallery = require('../models/Gallery');
const Feedback = require('../models/Feedback');
const { protect, authorize } = require('../middleware/auth');
const cloudinary = require('../config/cloudinary');

const router = express.Router();

// All admin routes require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

// @desc    Get dashboard statistics
// @route   GET /api/admin/dashboard/stats   <--- FIXED THIS
// @access  Private (Admin)
router.get('/dashboard/stats', async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalEvents = await Event.countDocuments();
    const totalBlogs = await Blog.countDocuments();
    const pendingFeedback = await Feedback.countDocuments({ status: 'pending' });

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalEvents,
        totalBlogs,
        pendingFeedback
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get all users with registered events
// @route   GET /api/admin/users
// @access  Private (Admin)
router.get('/users', async (req, res, next) => {
  try {
    const users = await User.find()
      .select('-password')
      .populate('registeredEvents', 'title date venue') // ADD THIS LINE
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

// @desc    Get all feedback
// @route   GET /api/admin/feedback
// @access  Private (Admin)
router.get('/feedback', async (req, res, next) => {
  try {
    const feedback = await Feedback.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: feedback.length,
      data: feedback
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Delete feedback
// @route   DELETE /api/admin/feedback/:id
// @access  Private (Admin)
router.delete('/feedback/:id', async (req, res, next) => {
  try {
    const feedback = await Feedback.findById(req.params.id);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    await feedback.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
      message: 'Feedback deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Create event
// @route   POST /api/admin/events
// @access  Private (Admin)
router.post('/events', async (req, res, next) => {
  try {
    const event = await Event.create(req.body);

    res.status(201).json({
      success: true,
      data: event
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update event
// @route   PUT /api/admin/events/:id
// @access  Private (Admin)
router.put('/events/:id', async (req, res, next) => {
  try {
    let event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    event = await Event.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: event
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Delete event
// @route   DELETE /api/admin/events/:id
// @access  Private (Admin)
router.delete('/events/:id', async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    await event.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
      message: 'Event deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Create blog
// @route   POST /api/admin/blogs
// @access  Private (Admin)
router.post('/blogs', async (req, res, next) => {
  try {
    const blog = await Blog.create(req.body);

    res.status(201).json({
      success: true,
      data: blog
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update blog
// @route   PUT /api/admin/blogs/:id
// @access  Private (Admin)
router.put('/blogs/:id', async (req, res, next) => {
  try {
    let blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    blog = await Blog.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: blog
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Delete blog
// @route   DELETE /api/admin/blogs/:id
// @access  Private (Admin)
router.delete('/blogs/:id', async (req, res, next) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    await blog.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
      message: 'Blog deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Upload to gallery
// @route   POST /api/admin/gallery
// @access  Private (Admin)
router.post('/gallery', async (req, res, next) => {
  try {
    if (!req.files || !req.files.image) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image'
      });
    }

    const file = req.files.image;

    // Upload to cloudinary
    const result = await cloudinary.uploader.upload(file.tempFilePath, {
      folder: 'bitsa/gallery',
      use_filename: true
    });

    const gallery = await Gallery.create({
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      image: {
        url: result.secure_url,
        publicId: result.public_id
      }
    });

    res.status(201).json({
      success: true,
      data: gallery
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Delete from gallery
// @route   DELETE /api/admin/gallery/:id
// @access  Private (Admin)
router.delete('/gallery/:id', async (req, res, next) => {
  try {
    const gallery = await Gallery.findById(req.params.id);

    if (!gallery) {
      return res.status(404).json({
        success: false,
        message: 'Gallery item not found'
      });
    }

    // Delete from cloudinary if exists
    if (gallery.image && gallery.image.publicId) {
      await cloudinary.uploader.destroy(gallery.image.publicId);
    }

    await gallery.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
      message: 'Gallery item deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;