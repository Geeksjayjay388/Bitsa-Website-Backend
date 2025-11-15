const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide event title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please provide event description'],
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  date: {
    type: String,
    required: [true, 'Please provide event date']
  },
  time: {
    type: String,
    required: [true, 'Please provide event time']
  },
  location: {
    type: String,
    required: [true, 'Please provide event location']
  },
  image: {
    url: {
      type: String,
      required: [true, 'Please provide event image']
    },
    publicId: String
  },
  category: {
    type: String,
    enum: {
      values: ['Competition', 'Workshop', 'Networking', 'Seminar'],
      message: 'Category must be Competition, Workshop, Networking, or Seminar'
    },
    required: [true, 'Please select event category']
  },
  registrations: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    registeredAt: {
      type: Date,
      default: Date.now
    }
  }],
  maxParticipants: {
    type: Number,
    default: null
  },
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for faster queries
EventSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Event', EventSchema);