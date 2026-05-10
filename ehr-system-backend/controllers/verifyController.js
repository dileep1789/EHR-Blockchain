// Verify Controller - Public record verification (MongoDB version)
const HealthRecord = require('../models/HealthRecord');
const blockchain = require('../utils/blockchain');

// Public: verify by record ID
exports.verifyByRecordId = async (req, res) => {
  try {
    const { recordId } = req.params;
    if (!recordId) return res.status(400).json({ error: 'Record ID is required' });

    const record = await HealthRecord.findOne({ record_id: recordId }).lean();
    if (!record) return res.status(404).json({ verified: false, error: 'Record not found in database' });

    let blockchainVerified = false;
    let blockchainData = null;

    if (record.blockchain_tx_hash) {
      try {
        const result = await blockchain.verifyRecord(recordId);
        blockchainVerified = result.exists;
        blockchainData = result;
      } catch (err) {
        console.error('Blockchain verify error:', err.message);
      }
    }

    res.json({
      verified: blockchainVerified,
      record: {
        record_id: record.record_id,
        patient_name: record.patient_name,
        diagnosis: record.diagnosis,
        grade: record.grade,
        record_date: record.record_date,
        hospital_name: record.hospital_name,
        blockchain_tx_hash: record.blockchain_tx_hash,
      },
      blockchain: blockchainData,
    });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({ error: 'Server error during verification' });
  }
};

// Public: get all records for a patient
exports.verifyByUserId = async (req, res) => {
  try {
    const { patientId } = req.params;
    if (!patientId) return res.status(400).json({ error: 'Patient ID is required' });

    const records = await HealthRecord.find({ patient_id: patientId }).sort({ record_date: -1 }).lean();

    if (!records.length) {
      return res.status(404).json({ error: 'No records found for this patient' });
    }

    res.json({ success: true, records });
  } catch (error) {
    console.error('Patient records error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
