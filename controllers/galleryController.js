const Gallery = require('../models/Gallery');
const cloudinary = require('../config/cloudinary');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all gallery images
// @route   GET /api/gallery
// @access  Public
exports.getGalleryImages = async (req, res, next) => {
  try {
    const { category } = req.query;
    
    let query = {};
    if (category) query.category = category;

    const images = await Gallery.find(query)
      .populate('uploadedBy', 'fullName email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: images.length,
      data: images
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single gallery image
// @route   GET /api/gallery/:id
// @access  Public
exports.getGalleryImage = async (req, res, next) => {
  try {
    const image = await Gallery.findById(req.params.id)
      .populate('uploadedBy', 'fullName email');

    if (!image) {
      return next(new ErrorResponse('Image not found', 404));
    }

    res.status(200).json({
      success: true,
      data: image
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload gallery image
// @route   POST /api/gallery
// @access  Private (Admin only)
exports.uploadImage = async (req, res, next) => {
  try {
    if (!req.files || !req.files.image) {
      return next(new ErrorResponse('Please upload an image', 400));
    }

    const file = req.files.image;

    // Upload to cloudinary
    const result = await cloudinary.uploader.upload(file.tempFilePath, {
      folder: 'bitsa/gallery',
      use_filename: true
    });

    const image = await Gallery.create({
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      image: {
        url: result.secure_url,
        publicId: result.public_id
      },
      uploadedBy: req.user.id
    });

    res.status(201).json({
      success: true,
      data: image
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update gallery image
// @route   PUT /api/gallery/:id
// @access  Private (Admin only)
exports.updateImage = async (req, res, next) => {
  try {
    let image = await Gallery.findById(req.params.id);

    if (!image) {
      return next(new ErrorResponse('Image not found', 404));
    }

    // Handle image update if new file uploaded
    if (req.files && req.files.image) {
      // Delete old image
      await cloudinary.uploader.destroy(image.image.publicId);

      const file = req.files.image;
      const result = await cloudinary.uploader.upload(file.tempFilePath, {
        folder: 'bitsa/gallery',
        use_filename: true
      });

      req.body.image = {
        url: result.secure_url,
        publicId: result.public_id
      };
    }

    image = await Gallery.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: image
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete gallery image
// @route   DELETE /api/gallery/:id
// @access  Private (Admin only)
exports.deleteImage = async (req, res, next) => {
  try {
    const image = await Gallery.findById(req.params.id);

    if (!image) {
      return next(new ErrorResponse('Image not found', 404));
    }

    // Delete from cloudinary
    await cloudinary.uploader.destroy(image.image.publicId);

    await image.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
      message: 'Image deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};