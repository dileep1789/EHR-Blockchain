// Admin Routes - Login, approve/reject hospitals
const express = require('express');
const router = express.Router();
const { verifyToken, verifyAdmin } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

// Public route
router.post('/login', adminController.login);

// Protected routes (require admin authentication)
router.get('/profile', verifyToken, verifyAdmin, adminController.getProfile);
router.get('/dashboard', verifyToken, verifyAdmin, adminController.getDashboard);

// Hospital management
router.get('/hospitals', verifyToken, verifyAdmin, adminController.getAllInstitutes);
router.get('/hospitals/pending', verifyToken, verifyAdmin, adminController.getPendingInstitutes);
router.get('/hospitals/:hospital_id/issuer-status', verifyToken, verifyAdmin, adminController.getIssuerStatus);
router.post('/hospitals/:hospital_id/approve', verifyToken, verifyAdmin, adminController.approveInstitute);
router.post('/hospitals/:hospital_id/reject', verifyToken, verifyAdmin, adminController.rejectInstitute);
router.post('/hospitals/:hospital_id/revoke', verifyToken, verifyAdmin, adminController.revokeInstitute);

// Statistics
router.get('/statistics', verifyToken, verifyAdmin, adminController.getStatistics);

// Blockchain status
router.get('/blockchain/status', verifyToken, verifyAdmin, adminController.getBlockchainStatus);

module.exports = router;
