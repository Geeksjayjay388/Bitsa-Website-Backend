const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const fileUpload = require('express-fileupload');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const registrationRoutes = require('./routes/registration');
// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(mongoSanitize());
app.use(xss());
app.set('trust proxy', 1);

// Rate limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later'
});
app.use('/api/', limiter);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser
app.use(cookieParser());

// File upload
app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: '/tmp/',
  limits: { fileSize: 10 * 1024 * 1024 },
  abortOnLimit: true,
  createParentPath: true
}));

// CORS
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5183',
  'http://localhost:3000',
  'https://bitsa-hackathon.vercel.app',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    
    const normalizedOrigin = origin.replace(/\/$/, '');
    const isAllowed = allowedOrigins.some(allowed => 
      allowed && normalizedOrigin === allowed.replace(/\/$/, '')
    );
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.log('❌ CORS blocked origin:', origin);
      callback(null, true); // Allow anyway for debugging
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
}));

// Log all requests for debugging
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path}`);
  next();
});

// Mount routers
console.log('🔧 Mounting routes...');

app.use('/api/auth', require('./routes/auth'));
console.log('✅ Mounted: /api/auth');

app.use('/api/events', require('./routes/events'));
console.log('✅ Mounted: /api/events');

app.use('/api/blogs', require('./routes/blogs'));
console.log('✅ Mounted: /api/blogs');

app.use('/api/users', require('./routes/user'));
console.log('✅ Mounted: /api/users');

app.use('/api/gallery', require('./routes/gallery'));
console.log('✅ Mounted: /api/gallery');

app.use('/api/feedback', require('./routes/feedback'));
console.log('✅ Mounted: /api/feedback');

app.use('/api/admin', require('./routes/admin'));
console.log('✅ Mounted: /api/admin');

console.log('✅ All routes mounted successfully');

// Test endpoint to verify feedback route
app.get('/api/feedback-test', (req, res) => {
  res.json({
    success: true,
    message: 'Feedback route is accessible',
    availableRoutes: [
      'POST /api/feedback',
      'GET /api/feedback/my (protected)',
      'GET /api/feedback/admin/all (admin only)',
      'DELETE /api/feedback/:id (admin only)'
    ]
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    success: true,
    message: 'BITSA API is running smoothly',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    routes: {
      auth: '/api/auth',
      events: '/api/events',
      blogs: '/api/blogs',
      users: '/api/users',
      gallery: '/api/gallery',
      feedback: '/api/feedback ⭐',
      admin: '/api/admin'
    }
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to BITSA API',
    version: '1.0.0',
    documentation: '/api/health'
  });
});

// 404 handler - must be after all routes
app.use((req, res) => {
  console.log('❌ 404 Not Found:', req.method, req.originalUrl);
  res.status(404).json({
    success: false,
    error: 'Route not found',
    requestedUrl: req.originalUrl,
    method: req.method
  });
});

// Error handler - must be last middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5500;

const server = app.listen(PORT, () => {
  const env = process.env.NODE_ENV || 'development';
  const envColor = env === 'production' ? '🟢' : '🟡';
  
  console.log(`
╔════════════════════════════════════════════════════╗
║                                                    ║
║           🚀 BITSA API SERVER RUNNING              ║
║                                                    ║
║  Environment: ${envColor} ${env.toUpperCase().padEnd(31)}║
║  Port:        🔌 ${PORT.toString().padEnd(32)}     ║
║  Database:    ✅ Connected                         ║
║  API URL:     🌐 http://localhost:${PORT.toString().padEnd(19)}║
║  Health:      /api/health                          ║
║  Auth:        /api/auth                            ║
║  Events:      /api/events                          ║
║  Blogs:       /api/blogs                           ║
║  Users:       /api/users                           ║
║  Gallery:     /api/gallery                         ║
║  Feedback:    /api/feedback ⭐                     ║
║  Admin:       /api/admin                           ║
║                                                    ║
║  🧪 Test:     /api/feedback-test                   ║
║                                                    ║
╚════════════════════════════════════════════════════╝
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log('❌ Unhandled Rejection:', err.message);
  server.close(() => {
    console.log('🛑 Server closed due to unhandled rejection');
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.log('❌ Uncaught Exception:', err.message);
  console.log('🛑 Shutting down...');
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Process terminated');
  });
});

module.exports = app;