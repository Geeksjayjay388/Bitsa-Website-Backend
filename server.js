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

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(mongoSanitize());
app.use(xss());

// Rate limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100, // limit each IP to 100 requests per windowMs
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
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max file size
  abortOnLimit: true,
  createParentPath: true
}));

// CORS
const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Mount routers
app.use('/api/auth', require('./routes/auth'));
app.use('/api/events', require('./routes/events'));
app.use('/api/blogs', require('./routes/blogs'));
app.use('/api/gallery', require('./routes/gallery'));
app.use('/api/feedback', require('./routes/feedback'));
app.use('/api/admin', require('./routes/admin'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    success: true,
    message: 'BITSA API is running smoothly',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
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
║  Port:        🔌 ${PORT.toString().padEnd(32)}║
║  Database:    ✅ Connected                         ║
║  API URL:     🌐 http://localhost:${PORT.toString().padEnd(19)}║
║                                                    ║
║  Health:      /api/health                          ║
║  Auth:        /api/auth                            ║
║  Events:      /api/events                          ║
║  Blogs:       /api/blogs                           ║
║  Gallery:     /api/gallery                         ║
║  Feedback:    /api/feedback                        ║
║  Admin:       /api/admin                           ║
║                                                    ║
╚════════════════════════════════════════════════════╝
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log('❌ Unhandled Rejection:', err.message);
  // Close server & exit process
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