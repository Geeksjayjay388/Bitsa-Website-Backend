const express = require('express');
const router = express.Router();
const {
  getGalleryImages,
  getGalleryImage,
  uploadImage,
  updateImage,
  deleteImage,
  testCloudinary  // ADD THIS
} = require('../controllers/galleryController');

const { protect, authorize } = require('../middleware/auth');

// Test route - IMPORTANT: Put this BEFORE the /:id route
router.get('/test-config', protect, authorize('admin'), testCloudinary);

// Public routes
router.get('/', getGalleryImages);
router.get('/:id', getGalleryImage);

// Admin only routes
router.post('/', protect, authorize('admin'), uploadImage);
router.put('/:id', protect, authorize('admin'), updateImage);
router.delete('/:id', protect, authorize('admin'), deleteImage);

module.exports = router;