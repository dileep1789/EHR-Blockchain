// Hospital Routes - Registration, login, record issuance
const express = require('express');
const router = express.Router();
const { verifyToken, verifyHospital } = require('../middleware/auth');
const upload = require('../middleware/upload');
const hospitalController = require('../controllers/hospitalController');

// Public routes
router.post(
	'/register',
	upload.fields([
		{ name: 'logo', maxCount: 1 },
		{ name: 'verification_doc', maxCount: 1 }
	]),
	hospitalController.registerInstitute
);
router.post('/login', hospitalController.loginInstitute);
router.get('/verify-email', hospitalController.verifyInstituteEmail);
router.post('/resend-verification', hospitalController.resendInstituteVerification);

// Protected routes (require hospital authentication)
router.get('/profile', verifyToken, verifyHospital, hospitalController.getProfile);
router.get('/dashboard', verifyToken, verifyHospital, hospitalController.getDashboard);
router.get('/patients/search', verifyToken, verifyHospital, hospitalController.searchStudents);

// Record routes
router.post('/record/issue', verifyToken, verifyHospital, hospitalController.issueCertificate);
router.post('/record/sign-payload', verifyToken, verifyHospital, hospitalController.getCertificateSignaturePayload);
router.post('/record/issue-signed', verifyToken, verifyHospital, hospitalController.issueCertificateWithSignature);
router.post('/record/bulk-auth', verifyToken, verifyHospital, hospitalController.getBulkAuthorizationMessage);
router.post('/record/bulk-issue-signed', verifyToken, verifyHospital, hospitalController.bulkIssueWithSingleSignature);
router.get('/records', verifyToken, verifyHospital, hospitalController.getCertificates);
router.post('/records/bulk', verifyToken, verifyHospital, hospitalController.bulkIssueCertificates);

module.exports = router;
