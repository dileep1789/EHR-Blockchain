// Contact Routes - Handle contact form submissions with rate limiting
const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');

// In-memory rate limiting (consider using Redis in production)
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds
const MAX_REQUESTS_PER_WINDOW = 5; // Maximum 5 contact messages per hour per IP
const CLEANUP_INTERVAL = 5 * 60 * 1000; // Clean up old entries every 5 minutes

// Clean up expired rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (now - data.windowStart > RATE_LIMIT_WINDOW) {
      rateLimitStore.delete(key);
    }
  }
}, CLEANUP_INTERVAL);

// Rate limiting middleware
const rateLimiter = (req, res, next) => {
  // Get client identifier (IP address)
  const clientId = req.headers['x-forwarded-for'] || 
                   req.connection.remoteAddress || 
                   req.socket.remoteAddress ||
                   req.ip;
  
  const now = Date.now();
  const clientData = rateLimitStore.get(clientId);
  
  if (!clientData) {
    // First request from this client
    rateLimitStore.set(clientId, {
      count: 1,
      windowStart: now
    });
    return next();
  }
  
  // Check if we're still within the same time window
  const timeSinceWindowStart = now - clientData.windowStart;
  
  if (timeSinceWindowStart > RATE_LIMIT_WINDOW) {
    // Time window has passed, reset the counter
    rateLimitStore.set(clientId, {
      count: 1,
      windowStart: now
    });
    return next();
  }
  
  // Still within the time window
  if (clientData.count >= MAX_REQUESTS_PER_WINDOW) {
    const timeRemaining = RATE_LIMIT_WINDOW - timeSinceWindowStart;
    const minutesRemaining = Math.ceil(timeRemaining / (60 * 1000));
    
    return res.status(429).json({
      error: `Too many requests. Please try again in ${minutesRemaining} minute${minutesRemaining !== 1 ? 's' : ''}.`,
      retryAfter: Math.ceil(timeRemaining / 1000) // seconds
    });
  }
  
  // Increment the counter
  clientData.count += 1;
  rateLimitStore.set(clientId, clientData);
  
  // Add rate limit headers
  res.setHeader('X-RateLimit-Limit', MAX_REQUESTS_PER_WINDOW);
  res.setHeader('X-RateLimit-Remaining', MAX_REQUESTS_PER_WINDOW - clientData.count);
  res.setHeader('X-RateLimit-Reset', new Date(clientData.windowStart + RATE_LIMIT_WINDOW).toISOString());
  
  next();
};

// CORS validation middleware for contact form
const validateOrigin = (req, res, next) => {
  // In development, allow all origins
  if (process.env.NODE_ENV !== 'production') {
    return next();
  }
  
  // In production, validate origin if FRONTEND_URL is set
  const allowedOrigins = process.env.FRONTEND_URL ? 
    process.env.FRONTEND_URL.split(',').map(url => url.trim()) : 
    [];
  
  if (allowedOrigins.length === 0) {
    // No restriction if FRONTEND_URL is not set
    return next();
  }
  
  const origin = req.headers.origin || req.headers.referer;
  
  if (!origin || !allowedOrigins.some(allowed => origin.startsWith(allowed))) {
    return res.status(403).json({ 
      error: 'Access denied from this origin' 
    });
  }
  
  next();
};

// Public routes (no authentication required)
router.post('/send-message', validateOrigin, rateLimiter, contactController.sendContactMessage);
router.get('/health', contactController.healthCheck);

module.exports = router;
