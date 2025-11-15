const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide your name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  subject: {
    type: String,
    required: [true, 'Please provide subject'],
    trim: true
  },
  message: {
    type: String,
    required: [true, 'Please provide message'],
    maxlength: [1000, 'Message cannot be more than 1000 characters']
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'read', 'replied'],
    default: 'pending'
  },
  adminNotes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Index for faster queries
FeedbackSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Feedback', FeedbackSchema);