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
    required: [true, 'Please provide event description']
  },
  date: {
    type: Date,
    required: [true, 'Please provide event date']
  },
  time: {
    type: String,
    default: 'TBA'
  },
  venue: {
    type: String,
    default: 'TBA'  // CHANGED: Made optional with default
  },
  capacity: {
    type: Number,
    required: [true, 'Please provide event capacity'],
    min: [1, 'Capacity must be at least 1']
  },
  imageUrl: {
    type: String,
    default: 'https://via.placeholder.com/800x400?text=Event+Image'  // CHANGED: Added default
  },
  category: {
    type: String,
    enum: ['Competition', 'Workshop', 'Networking', 'Seminar'],
    default: 'Workshop'
  },
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed'],
    default: 'upcoming'
  },
  registeredUsers: [{
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

module.exports = mongoose.model('Event', EventSchema);