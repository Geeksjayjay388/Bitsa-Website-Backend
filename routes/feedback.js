const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');
const { protect } = require('../middleware/auth');

// Add logging middleware to debug all requests to this router
router.use((req, res, next) => {
  console.log('🔍 Feedback Route Hit:', {
    method: req.method,
    path: req.path,
    fullUrl: req.originalUrl,
    hasAuth: !!req.headers.authorization
  });
  next();
});

// ==============================================
// PUBLIC ROUTES (NO AUTHENTICATION REQUIRED)
// ==============================================

// @desc    Submit feedback
// @route   POST /api/feedback
// @access  Public
router.post('/', async (req, res, next) => {
  try {
    console.log('📝 Feedback POST received:', req.body);

    const { name, email, subject, message } = req.body;

    // Validation
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and message'
      });
    }

    const feedback = await Feedback.create({
      name,
      email,
      subject: subject || 'No Subject',
      message
    });

    console.log('✅ Feedback saved successfully:', feedback._id);

    res.status(201).json({
      success: true,
      data: feedback,
      message: 'Feedback submitted successfully'
    });
  } catch (error) {
    console.error('❌ Feedback submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit feedback',
      error: error.message
    });
  }
});

// ==============================================
// PROTECTED ROUTES (AUTHENTICATION REQUIRED)
// ==============================================

// @desc    Get my feedback
// @route   GET /api/feedback/my
// @access  Private
router.get('/my', protect, async (req, res, next) => {
  try {
    console.log('📬 Getting user feedback for:', req.user.email);
    const feedback = await Feedback.find({ email: req.user.email }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: feedback.length,
      data: feedback
    });
  } catch (error) {
    console.error('❌ Error in /my route:', error);
    next(error);
  }
});

// ==============================================
// ADMIN ONLY ROUTES
// ==============================================

// @desc    Get all feedback (Admin only)
// @route   GET /api/feedback/admin/all
// @access  Private/Admin
router.get('/admin/all', protect, async (req, res, next) => {
  try {
    console.log('🔍 ADMIN ROUTE HIT - /admin/all');
    console.log('User:', req.user?.email);
    console.log('Role:', req.user?.role);
    console.log('Full user object:', JSON.stringify(req.user, null, 2));

    // Check if user exists
    if (!req.user) {
      console.log('❌ No user found in request');
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    // Check if user is admin
    if (req.user.role !== 'admin') {
      console.log('❌ User is not admin. Role:', req.user.role);
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this route. Admin access required.'
      });
    }

    console.log('✅ Admin verified. Fetching all feedback...');
    const feedback = await Feedback.find({}).sort({ createdAt: -1 });

    console.log('✅ Found', feedback.length, 'feedback items');

    res.status(200).json({
      success: true,
      count: feedback.length,
      data: feedback
    });
  } catch (error) {
    console.error('❌ Error fetching feedback:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching feedback',
      error: error.message
    });
  }
});

// @desc    Update feedback status (Admin only)
// @route   PUT /api/feedback/:id/status
// @access  Private/Admin
router.put('/:id/status', protect, async (req, res, next) => {
  try {
    console.log('📝 Updating feedback status:', req.params.id);

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    const { status, adminNotes } = req.body;

    const feedback = await Feedback.findById(req.params.id);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    if (status) feedback.status = status;
    if (adminNotes !== undefined) feedback.adminNotes = adminNotes;

    await feedback.save();

    console.log('✅ Feedback status updated');

    res.status(200).json({
      success: true,
      data: feedback
    });
  } catch (error) {
    console.error('❌ Error updating feedback:', error);
    next(error);
  }
});

// @desc    Delete feedback (Admin only)
// @route   DELETE /api/feedback/:id
// @access  Private/Admin
router.delete('/:id', protect, async (req, res, next) => {
  try {
    console.log('🗑️ Admin deleting feedback:', req.params.id);

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    const feedback = await Feedback.findById(req.params.id);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    await feedback.deleteOne();

    console.log('✅ Feedback deleted successfully');

    res.status(200).json({
      success: true,
      message: 'Feedback deleted successfully',
      data: {}
    });
  } catch (error) {
    console.error('❌ Error deleting feedback:', error);
    next(error);
  }
});

// Test route to verify the router is working
router.get('/test', (req, res) => {
  console.log('✅ Test route hit successfully');
  res.json({
    success: true,
    message: 'Feedback router is working!',
    timestamp: new Date().toISOString()
  });
});

console.log('✅ Feedback routes module loaded');

module.exports = router;