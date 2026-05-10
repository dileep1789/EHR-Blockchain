const express = require('express');
const router = express.Router();
const verifyController = require('../controllers/verifyController');

// Public verification endpoints (no auth)
router.get('/record/:recordId', verifyController.verifyByRecordId);
router.get('/patient/:patientId', verifyController.verifyByUserId);

module.exports = router;
