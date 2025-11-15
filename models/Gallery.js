const mongoose = require('mongoose');

const GallerySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide image title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please provide image description'],
    maxlength: [200, 'Description cannot be more than 200 characters']
  },
  image: {
    url: {
      type: String,
      required: [true, 'Please provide image URL']
    },
    publicId: {
      type: String,
      required: true
    }
  },
  category: {
    type: String,
    enum: {
      values: ['Hackathons', 'Workshops', 'Events', 'Team'],
      message: 'Category must be Hackathons, Workshops, Events, or Team'
    },
    required: [true, 'Please select a category']
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for faster queries
GallerySchema.index({ category: 1, createdAt: -1 });

module.exports = mongoose.model('Gallery', GallerySchema);