const express = require('express');
const router = express.Router();
const {
  getBlogs,
  getBlog,
  getAllBlogs,
  createBlog,
  updateBlog,
  togglePublish,
  deleteBlog
} = require('../controllers/blogController');

const { protect, authorize } = require('../middleware/auth');



// IMPORTANT: Admin routes with specific paths must come BEFORE generic /:id routes
// to prevent 'admin' from being treated as an ID parameter

// @route   GET /api/blogs/admin/all
// @desc    Get all blogs including unpublished (Admin only)
// @access  Private/Admin
router.get('/admin/all', protect, authorize('admin'), getAllBlogs);

// @route   GET /api/blogs
// @desc    Get all published blogs (with optional tag and featured filters)
// @access  Public
router.get('/', getBlogs);

// @route   POST /api/blogs
// @desc    Create new blog
// @access  Private/Admin
router.post('/', protect, authorize('admin'), createBlog);

// @route   GET /api/blogs/:id
// @desc    Get single blog by ID (increments view count)
// @access  Public
router.get('/:id', getBlog);

// @route   PUT /api/blogs/:id
// @desc    Update blog
// @access  Private/Admin
router.put('/:id', protect, authorize('admin'), updateBlog);

// @route   PUT /api/blogs/:id/publish
// @desc    Toggle blog publish status
// @access  Private/Admin
router.put('/:id/publish', protect, authorize('admin'), togglePublish);

// @route   DELETE /api/blogs/:id
// @desc    Delete blog
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), deleteBlog);

module.exports = router;