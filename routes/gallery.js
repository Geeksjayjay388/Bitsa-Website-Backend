const express = require('express');
const router = express.Router();
const {
  getGalleryImages,
  getGalleryImage,
  uploadImage,
  updateImage,
  deleteImage
} = require('../controllers/galleryController');

const { protect, authorize } = require('../middleware/auth');



// Public routes
router.get('/', getGalleryImages);
router.get('/:id', getGalleryImage);

// Admin only routes
router.post('/', protect, authorize('admin'), uploadImage);
router.put('/:id', protect, authorize('admin'), updateImage);
router.delete('/:id', protect, authorize('admin'), deleteImage);

module.exports = router;