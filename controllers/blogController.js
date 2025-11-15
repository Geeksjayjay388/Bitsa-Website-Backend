const Blog = require('../models/Blog');
const cloudinary = require('../config/cloudinary');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all published blogs
// @route   GET /api/blogs
// @access  Public
exports.getBlogs = async (req, res, next) => {
  try {
    const { tag, featured } = req.query;
    
    let query = { published: true };
    
    if (tag) query.tag = tag;
    if (featured) query.featured = featured === 'true';

    const blogs = await Blog.find(query)
      .populate('createdBy', 'fullName email')
      .sort({ publishedAt: -1 });

    res.status(200).json({
      success: true,
      count: blogs.length,
      data: blogs
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single blog
// @route   GET /api/blogs/:id
// @access  Public
exports.getBlog = async (req, res, next) => {
  try {
    const blog = await Blog.findById(req.params.id)
      .populate('createdBy', 'fullName email role');

    if (!blog) {
      return next(new ErrorResponse('Blog not found', 404));
    }

    // Only show if published (unless admin)
    if (!blog.published && (!req.user || req.user.role !== 'admin')) {
      return next(new ErrorResponse('Blog not found', 404));
    }

    // Increment views
    blog.views += 1;
    await blog.save();

    res.status(200).json({
      success: true,
      data: blog
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all blogs (including unpublished - admin only)
// @route   GET /api/blogs/admin/all
// @access  Private (Admin)
exports.getAllBlogs = async (req, res, next) => {
  try {
    const blogs = await Blog.find()
      .populate('createdBy', 'fullName email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: blogs.length,
      data: blogs
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create blog
// @route   POST /api/blogs
// @access  Private (Admin only)
exports.createBlog = async (req, res, next) => {
  try {
    // Add createdBy field
    req.body.createdBy = req.user.id;

    // Set author info
    req.body.author = {
      name: req.user.fullName,
      role: req.user.role
    };

    // Handle image upload
    if (req.files && req.files.image) {
      const file = req.files.image;

      const result = await cloudinary.uploader.upload(file.tempFilePath, {
        folder: 'bitsa/blogs',
        use_filename: true
      });

      req.body.image = {
        url: result.secure_url,
        publicId: result.public_id
      };
    }

    const blog = await Blog.create(req.body);

    res.status(201).json({
      success: true,
      data: blog
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update blog
// @route   PUT /api/blogs/:id
// @access  Private (Admin only)
exports.updateBlog = async (req, res, next) => {
  try {
    let blog = await Blog.findById(req.params.id);

    if (!blog) {
      return next(new ErrorResponse('Blog not found', 404));
    }

    // Handle image update
    if (req.files && req.files.image) {
      // Delete old image
      if (blog.image.publicId) {
        await cloudinary.uploader.destroy(blog.image.publicId);
      }

      const file = req.files.image;
      const result = await cloudinary.uploader.upload(file.tempFilePath, {
        folder: 'bitsa/blogs',
        use_filename: true
      });

      req.body.image = {
        url: result.secure_url,
        publicId: result.public_id
      };
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
};

// @desc    Publish/Unpublish blog
// @route   PUT /api/blogs/:id/publish
// @access  Private (Admin only)
exports.togglePublish = async (req, res, next) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return next(new ErrorResponse('Blog not found', 404));
    }

    blog.published = !blog.published;
    
    // Set publishedAt date when publishing
    if (blog.published && !blog.publishedAt) {
      blog.publishedAt = Date.now();
    }

    await blog.save();

    res.status(200).json({
      success: true,
      data: blog,
      message: blog.published ? 'Blog published' : 'Blog unpublished'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete blog
// @route   DELETE /api/blogs/:id
// @access  Private (Admin only)
exports.deleteBlog = async (req, res, next) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return next(new ErrorResponse('Blog not found', 404));
    }

    // Delete image from cloudinary
    if (blog.image.publicId) {
      await cloudinary.uploader.destroy(blog.image.publicId);
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
};