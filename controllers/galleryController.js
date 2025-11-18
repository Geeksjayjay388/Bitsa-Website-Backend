const Gallery = require('../models/Gallery');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');
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
    console.log('=== UPLOAD REQUEST ===');
    console.log('Files:', req.files);
    console.log('Body:', req.body);
    console.log('User:', req.user);

    // Validate file upload
    if (!req.files || !req.files.image) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image'
      });
    }

    // Validate required fields
    if (!req.body.title || !req.body.description || !req.body.category) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, description, and category'
      });
    }

    const file = req.files.image;
    console.log('File details:', {
      name: file.name,
      size: file.size,
      mimetype: file.mimetype,
      tempFilePath: file.tempFilePath
    });

    // Upload to Cloudinary using helper function
    console.log('Uploading to Cloudinary...');
    const uploadResult = await uploadToCloudinary(file, 'bitsa/gallery');
    console.log('Cloudinary upload success:', uploadResult);

    // Create gallery entry
    const image = await Gallery.create({
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      image: {
        url: uploadResult.url,
        publicId: uploadResult.publicId
      },
      uploadedBy: req.user.id
    });

    console.log('Gallery document created:', image);

    res.status(201).json({
      success: true,
      data: image,
      message: 'Image uploaded successfully'
    });
  } catch (error) {
    console.error('=== UPLOAD ERROR ===');
    console.error('Error:', error);
    console.error('Stack:', error.stack);
    
    res.status(500).json({
      success: false,
      message: error.message || 'Error uploading image',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
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
      // Delete old image from Cloudinary
      await deleteFromCloudinary(image.image.publicId);

      const file = req.files.image;
      const uploadResult = await uploadToCloudinary(file, 'bitsa/gallery');

      req.body.image = {
        url: uploadResult.url,
        publicId: uploadResult.publicId
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

    // Delete from Cloudinary
    await deleteFromCloudinary(image.image.publicId);

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

// @desc    Test Cloudinary configuration
// @route   GET /api/gallery/test-config
// @access  Private (Admin only)
exports.testCloudinary = async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Cloudinary configuration check',
      config: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME || 'MISSING',
        apiKey: process.env.CLOUDINARY_API_KEY || 'MISSING',
        apiSecret: process.env.CLOUDINARY_API_SECRET ? 'SET (hidden)' : 'MISSING',
        apiSecretLength: process.env.CLOUDINARY_API_SECRET?.length || 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
