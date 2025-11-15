const mongoose = require('mongoose');

const BlogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide blog title'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  content: {
    type: String,
    required: [true, 'Please provide blog content']
  },
  excerpt: {
    type: String,
    maxlength: [500, 'Excerpt cannot be more than 500 characters']
  },
  category: {
    type: String,
    enum: ['tutorial', 'article', 'news', 'guide'],
    default: 'article'
  },
  imageUrl: {
    type: String,
    default: 'https://via.placeholder.com/800x400?text=Blog+Image'  // CHANGED: Added default
  },
  author: {
    type: String,
    default: 'BITSA Team'
  },
  authorRole: {
    type: String,
    default: 'Editor'
  },
  readTime: {
    type: String,
    default: '5 min read'
  },
  featured: {
    type: Boolean,
    default: false
  },
  published: {
    type: Boolean,
    default: true
  },
  views: {
    type: Number,
    default: 0
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false  // CHANGED: Made optional
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Blog', BlogSchema);