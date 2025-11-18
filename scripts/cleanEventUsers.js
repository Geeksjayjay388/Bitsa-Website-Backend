// scripts/cleanEventUsers.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');
const Event = require('../models/Event');

// Load .env explicitly from backend root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Check MONGO_URI
if (!process.env.MONGODB_URI) {
  console.error('❌ MONGO_URI not found in environment variables');
  process.exit(1);
}

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Connected for script');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err);
    process.exit(1);
  }
};

// Clean events
const cleanEventUsers = async () => {
  try {
    const events = await Event.find().populate('registeredUsers', 'fullName email');

    for (const event of events) {
      console.log(`\n🔹 Event: ${event.title}`);

      // Filter out invalid users (null after populate)
      const validUsers = event.registeredUsers.filter(user => user);

      // Replace event.registeredUsers with valid users
      event.registeredUsers = validUsers.map(user => user._id);

      // Save updated event
      await event.save();

      // Display cleaned users
      validUsers.forEach(user => {
        const name = user.fullName || 'Unknown Name';
        const email = user.email || 'No Email';
        console.log(`  ✅ ${name} - ${email}`);
      });
    }

    console.log('\n✅ Finished cleaning events');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error cleaning events:', err);
    process.exit(1);
  }
};

// Run script
connectDB().then(cleanEventUsers);
