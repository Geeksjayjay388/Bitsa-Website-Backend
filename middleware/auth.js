const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  let token;

  console.log('🔐 Protect middleware called');
  console.log('Authorization header:', req.headers.authorization);

  // Check for token in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
    console.log('✅ Token found in Bearer header');
  }
  // Check for token in cookies
  else if (req.cookies.token) {
    token = req.cookies.token;
    console.log('✅ Token found in cookies');
  }

  // Make sure token exists
  if (!token) {
    console.log('❌ No token found');
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route - No token provided'
    });
  }

  try {
    console.log('🔍 Verifying token...');
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Token verified. User ID:', decoded.id);

    // Find user
    req.user = await User.findById(decoded.id).select('-password');
    
    if (!req.user) {
      console.log('❌ User not found for token');
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('✅ User authenticated:', {
      id: req.user._id,
      email: req.user.email,
      role: req.user.role
    });

    next();
  } catch (error) {
    console.error('❌ Token verification error:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route - Invalid token',
      error: error.message
    });
  }
};

// Middleware to check for admin role
exports.authorize = (...roles) => {
  return (req, res, next) => {
    console.log('🔐 Authorize middleware - Checking role:', req.user?.role);
    console.log('Required roles:', roles);
    
    if (!roles.includes(req.user.role)) {
      console.log('❌ User role not authorized');
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`
      });
    }
    
    console.log('✅ User authorized');
    next();
  };
};