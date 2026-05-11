// Authentication Routes
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyPatient } = require('../middleware/auth');

// Patient routes
router.post('/patient/register', authController.registerPatient);
router.post('/patient/login', authController.loginPatient);
router.get('/patient/verify-email', authController.verifyPatientEmail);
router.post('/patient/resend-verification', authController.resendPatientVerification);
router.get('/patient/profile', verifyPatient, authController.getProfile);

module.exports = router;
