const Feedback = require('../models/Feedback');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Submit feedback
// @route   POST /api/feedback
// @access  Public
exports.submitFeedback = async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body;

    const feedbackData = {
      name,
      email,
      subject,
      message
    };

    // If user is logged in, associate feedback with user
    if (req.user) {
      feedbackData.user = req.user.id;
    }

    const feedback = await Feedback.create(feedbackData);

    res.status(201).json({
      success: true,
      data: feedback,
      message: 'Feedback submitted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all feedback
// @route   GET /api/feedback
// @access  Private (Admin only)
exports.getAllFeedback = async (req, res, next) => {
  try {
    const { status } = req.query;
    
    let query = {};
    if (status) query.status = status;

    const feedback = await Feedback.find(query)
      .populate('user', 'fullName email course year')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: feedback.length,
      data: feedback
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single feedback
// @route   GET /api/feedback/:id
// @access  Private (Admin only)
exports.getFeedback = async (req, res, next) => {
  try {
    const feedback = await Feedback.findById(req.params.id)
      .populate('user', 'fullName email course year');

    if (!feedback) {
      return next(new ErrorResponse('Feedback not found', 404));
    }

    res.status(200).json({
      success: true,
      data: feedback
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update feedback status
// @route   PUT /api/feedback/:id/status
// @access  Private (Admin only)
exports.updateFeedbackStatus = async (req, res, next) => {
  try {
    const { status, adminNotes } = req.body;

    const feedback = await Feedback.findById(req.params.id);

    if (!feedback) {
      return next(new ErrorResponse('Feedback not found', 404));
    }

    feedback.status = status || feedback.status;
    feedback.adminNotes = adminNotes || feedback.adminNotes;

    await feedback.save();

    res.status(200).json({
      success: true,
      data: feedback
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete feedback
// @route   DELETE /api/feedback/:id
// @access  Private (Admin only)
exports.deleteFeedback = async (req, res, next) => {
  try {
    const feedback = await Feedback.findById(req.params.id);

    if (!feedback) {
      return next(new ErrorResponse('Feedback not found', 404));
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
};