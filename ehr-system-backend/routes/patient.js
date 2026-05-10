// Patient Routes
const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const { verifyPatient } = require('../middleware/auth');
const upload = require('../middleware/upload');

// All routes require patient authentication
router.get('/dashboard', verifyPatient, patientController.getDashboard);
router.get('/records', verifyPatient, patientController.getCertificates);
router.get('/records/:certificateId', verifyPatient, patientController.getCertificateDetails);
router.get('/records/:certificateId/verify', verifyPatient, patientController.verifyCertificateOnBlockchain);
router.post('/career-insights', verifyPatient, patientController.getCareerInsights);
router.patch('/portfolio/visibility', verifyPatient, patientController.updatePortfolioVisibility);
router.patch(
	'/profile',
	verifyPatient,
	upload.fields([
		{ name: 'profile_photo', maxCount: 1 },
		{ name: 'cv', maxCount: 1 }
	]),
	patientController.updateProfile
);

module.exports = router;
