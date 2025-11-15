const mongoose = require('mongoose');

const BlogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide blog title'],
    trim: true,
    maxlength: [150, 'Title cannot be more than 150 characters']
  },
  excerpt: {
    type: String,
    required: [true, 'Please provide blog excerpt'],
    maxlength: [300, 'Excerpt cannot be more than 300 characters']
  },
  content: {
    type: String,
    required: [true, 'Please provide blog content']
  },
  author: {
    name: {
      type: String,
      required: true
    },
    role: {
      type: String,
      required: true
    }
  },
  image: {
    url: {
      type: String,
      required: [true, 'Please provide blog image']
    },
    publicId: String
  },
  tag: {
    type: String,
    enum: {
      values: ['Tech Trends', 'Tutorials', 'Career Advice', 'Community'],
      message: 'Tag must be Tech Trends, Tutorials, Career Advice, or Community'
    },
    required: [true, 'Please select a tag']
  },
  featured: {
    type: Boolean,
    default: false
  },
  published: {
    type: Boolean,
    default: false
  },
  views: {
    type: Number,
    default: 0
  },
  readTime: {
    type: String,
    default: '5 min read'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  publishedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for faster queries
BlogSchema.index({ published: 1, publishedAt: -1 });
BlogSchema.index({ tag: 1 });

module.exports = mongoose.model('Blog', BlogSchema);