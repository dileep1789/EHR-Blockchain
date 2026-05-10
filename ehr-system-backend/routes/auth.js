// Authentication Routes
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyPatient } = require('../middleware/auth');

// Patient routes
router.post('/patient/register', authController.registerStudent);
router.post('/patient/login', authController.loginStudent);
router.get('/patient/verify-email', authController.verifyStudentEmail);
router.post('/patient/resend-verification', authController.resendStudentVerification);
router.get('/patient/profile', verifyPatient, authController.getProfile);

module.exports = router;
