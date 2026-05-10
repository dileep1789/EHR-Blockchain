// Contact Controller - Handle contact form submissions
const { sendEmail } = require('../utils/mailer');
const { 
  buildContactAdminEmail, 
  buildContactUserCopyEmail 
} = require('../utils/contactEmail');

// Input validation and sanitization
const validateContactInput = (data) => {
  const errors = [];
  
  // Name validation
  if (!data.name || typeof data.name !== 'string') {
    errors.push('Name is required');
  } else if (data.name.trim().length < 2) {
    errors.push('Name must be at least 2 characters');
  } else if (data.name.trim().length > 100) {
    errors.push('Name must not exceed 100 characters');
  }
  
  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!data.email || typeof data.email !== 'string') {
    errors.push('Email is required');
  } else if (!emailRegex.test(data.email.trim())) {
    errors.push('Invalid email format');
  } else if (data.email.trim().length > 255) {
    errors.push('Email must not exceed 255 characters');
  }
  
  // Subject validation
  if (!data.subject || typeof data.subject !== 'string') {
    errors.push('Subject is required');
  } else if (data.subject.trim().length < 3) {
    errors.push('Subject must be at least 3 characters');
  } else if (data.subject.trim().length > 200) {
    errors.push('Subject must not exceed 200 characters');
  }
  
  // Message validation
  if (!data.message || typeof data.message !== 'string') {
    errors.push('Message is required');
  } else if (data.message.trim().length < 10) {
    errors.push('Message must be at least 10 characters');
  } else if (data.message.trim().length > 5000) {
    errors.push('Message must not exceed 5000 characters');
  }
  
  return errors;
};

// Sanitize input to prevent XSS
const sanitizeInput = (data) => {
  return {
    name: data.name.trim().replace(/[<>]/g, ''),
    email: data.email.trim().toLowerCase(),
    subject: data.subject.trim().replace(/[<>]/g, ''),
    message: data.message.trim()
  };
};

// Send contact message
exports.sendContactMessage = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    
    // Validate input
    const validationErrors = validateContactInput({ name, email, subject, message });
    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        error: validationErrors[0],
        errors: validationErrors 
      });
    }
    
    // Sanitize input
    const sanitizedData = sanitizeInput({ name, email, subject, message });
    
    // Get admin email from environment
    const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
    if (!adminEmail) {
      console.error('ADMIN_EMAIL not configured');
      return res.status(500).json({ 
        error: 'Email service not configured. Please try again later.' 
      });
    }
    
    // Build emails
    const adminEmailContent = buildContactAdminEmail(sanitizedData);
    const userCopyContent = buildContactUserCopyEmail(sanitizedData);
    
    // Send email to admin
    try {
      await sendEmail({
        to: adminEmail,
        subject: adminEmailContent.subject,
        html: adminEmailContent.html,
        text: adminEmailContent.text
      });
    } catch (emailError) {
      console.error('Failed to send email to admin:', emailError);
      return res.status(500).json({ 
        error: 'Failed to send message. Please try again later.' 
      });
    }
    
    // Send copy to user
    try {
      await sendEmail({
        to: sanitizedData.email,
        subject: userCopyContent.subject,
        html: userCopyContent.html,
        text: userCopyContent.text
      });
    } catch (emailError) {
      console.error('Failed to send copy to user:', emailError);
      // Don't fail the request if user copy fails
      // Admin email was sent successfully
    }
    
    // Log contact message (for audit trail)
    console.log(`Contact message received from ${sanitizedData.name} (${sanitizedData.email}): ${sanitizedData.subject}`);
    
    res.json({ 
      success: true,
      message: 'Your message has been sent successfully. We will get back to you soon.' 
    });
    
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ 
      error: 'An error occurred while processing your request. Please try again later.' 
    });
  }
};

// Health check for contact service
exports.healthCheck = async (req, res) => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
    const smtpConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
    
    res.json({
      status: 'OK',
      emailService: smtpConfigured ? 'configured' : 'not configured',
      adminEmail: adminEmail ? 'configured' : 'not configured'
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ 
      status: 'ERROR',
      error: error.message 
    });
  }
};

module.exports = exports;
