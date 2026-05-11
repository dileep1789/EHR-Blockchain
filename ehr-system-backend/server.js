// Record Verification System - Main Server
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');

const app = express();

// =========================================
// MIDDLEWARE
// =========================================
const envFrontendOrigin = (process.env.FRONTEND_URL || '').trim();
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  ...(envFrontendOrigin ? [envFrontendOrigin] : [])
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser clients (curl, Postman, server-to-server)
    if (!origin) {
      return callback(null, true);
    }

    // In development, allow all
    if (process.env.NODE_ENV !== 'production' || allowedOrigins.length === 0) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(helmet()); // Add security headers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import rate limiters
const { authLimiter, apiLimiter, uploadLimiter, publicLimiter, strictLimiter } = require('./config/rateLimiter');

// Import auth middleware
const { verifyToken } = require('./middleware/auth');
const fs = require('fs');

// Public: logos (no auth required)
app.use('/uploads/hospitals/logos', express.static('public/uploads/hospitals/logos'));

// Private: documents (requires authentication)
app.use('/uploads/hospitals/documents', verifyToken, express.static('public/uploads/hospitals/documents'));

// Public: patient profile photos and CVs
app.use('/uploads/patients', express.static('public/uploads/patients'));

// Protected API endpoint for documents (requires authentication)
app.get('/api/files/:filename', verifyToken, (req, res) => {
  const filename = req.params.filename;
  const filepath = path.join(__dirname, 'public', 'uploads', 'hospitals', 'documents', filename);
  
  // Prevent directory traversal attacks
  const realpath = path.resolve(filepath);
  const allowedDir = path.resolve(path.join(__dirname, 'public', 'uploads', 'hospitals', 'documents'));
  
  if (!realpath.startsWith(allowedDir)) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  if (!fs.existsSync(filepath)) {
    return res.status(404).json({ error: 'File not found' });
  }
  
  // Set proper content type for PDFs
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'inline; filename=' + path.basename(filepath));
  res.sendFile(filepath);
});

// =========================================
// DATABASE CONNECTION (MongoDB Atlas)
// =========================================
require('./config/database'); // Connects mongoose to MongoDB Atlas

// Pre-load all models so they register with Mongoose
require('./models/Patient');
require('./models/Hospital');
require('./models/Admin');
require('./models/HealthRecord');

// =========================================
// API ROUTES
// =========================================
const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patient');
const hospitalRoutes = require('./routes/hospital');
const adminRoutes = require('./routes/admin');
const metamaskRoutes = require('./routes/metamask-routes');
const paymentRoutes = require('./routes/payment');
const verifyRoutes = require('./routes/verify');
const contactRoutes = require('./routes/contact');

// Apply rate limiting to routes
app.use('/api/auth', authLimiter, authRoutes); // Strict rate limit for auth
app.use('/api/patient', apiLimiter, patientRoutes);
app.use('/api/hospital', apiLimiter, hospitalRoutes);
app.use('/api/admin', apiLimiter, adminRoutes);
app.use('/api/metamask', apiLimiter, metamaskRoutes);
app.use('/api/payment', apiLimiter, paymentRoutes);
app.use('/api/verify', publicLimiter, verifyRoutes); // Public endpoint with reasonable limit
app.use('/api/contact', strictLimiter, contactRoutes); // Very strict for contact form

// =========================================
// HEALTH CHECK
// =========================================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    database: 'Connected',
    blockchain: process.env.CONTRACT_ADDRESS
  });
});

// =========================================
// ERROR HANDLING
// =========================================
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// =========================================
// START SERVER
// =========================================
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log('\n🎓 Record Verification System - Backend API');
  console.log('=====================================');
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`✅ Contract: ${process.env.CONTRACT_ADDRESS}`);
  console.log('\n📱 API Endpoints:');
  console.log(`   Auth: http://localhost:${PORT}/api/auth/*`);
  console.log(`   Patient: http://localhost:${PORT}/api/patient/*`);
  console.log(`   Hospital: http://localhost:${PORT}/api/hospital/*`);
  console.log(`   Admin: http://localhost:${PORT}/api/admin/*`);
  console.log(`   Verify: http://localhost:${PORT}/api/verify/*`);
  console.log(`   Contact: http://localhost:${PORT}/api/contact/*`);
  console.log(`   Health Check: http://localhost:${PORT}/api/health`);
  console.log('=====================================\n');
});
