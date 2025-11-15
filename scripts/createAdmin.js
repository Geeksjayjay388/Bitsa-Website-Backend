const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars from parent directory
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import User model
const User = require('../models/User');

const createAdmin = async () => {
  try {
    // Connect to database
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Database connected');

    // Admin details - password will be hashed by the model
    const adminData = {
      fullName: 'BITSA Admin',
      email: 'admin@bitsa.com',
      password: 'admin123',
      course: 'IS',
      year: 4,
      role: 'admin',
      isActive: true
    };

    // Check if admin exists
    const existingAdmin = await User.findOne({ email: adminData.email });
    
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists');
      console.log('📧 Email:', existingAdmin.email);
      console.log('🔑 Password: admin123 (if unchanged)');
      console.log('🔄 Deleting old admin and creating new one...');
      
      // Delete old admin
      await User.deleteOne({ email: adminData.email });
      console.log('✅ Old admin deleted');
    }

    // Create admin (password will be auto-hashed by model pre-save hook)
    const newAdmin = await User.create(adminData);
    
    console.log('\n✅ Admin user created successfully!');
    console.log('═══════════════════════════════════════');
    console.log('📧 Email:    admin@bitsa.com');
    console.log('🔑 Password: admin123');
    console.log('👤 Role:     admin');
    console.log('═══════════════════════════════════════');
    console.log('⚠️  IMPORTANT: Please change the password after first login!');
    console.log('\n🔗 Login at: http://localhost:5183/admin/login\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

createAdmin();