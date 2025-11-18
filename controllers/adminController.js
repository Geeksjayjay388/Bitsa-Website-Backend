const User = require('../models/User');
const Event = require('../models/Event');
const Blog = require('../models/Blog');
const Feedback = require('../models/Feedback');
const Gallery = require('../models/Gallery');

// Get all users with populated registered events
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .populate('registeredEvents', 'title date venue'); // Populate events with basic info
    
    res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
};

// Dashboard stats
exports.getDashboardStats = async (req, res) => {
  try {
    const [totalUsers, totalEvents, totalBlogs, pendingFeedback] = await Promise.all([
      User.countDocuments(),
      Event.countDocuments(),
      Blog.countDocuments(),
      Feedback.countDocuments({ status: 'pending' })
    ]);

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
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard stats',
      error: error.message
    });
  }
};