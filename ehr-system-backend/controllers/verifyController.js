// Verify Controller - Public record verification (MongoDB version)
const HealthRecord = require('../models/HealthRecord');
const Hospital = require('../models/Hospital');
const Patient = require('../models/Patient');
const blockchain = require('../utils/blockchain');

// Public: verify by record ID
exports.verifyByRecordId = async (req, res) => {
  try {
    const { recordId } = req.params;
    if (!recordId) return res.status(400).json({ error: 'Record ID is required' });

    const record = await HealthRecord.findOne({ record_id: recordId }).lean();
    if (!record) return res.status(404).json({ verified: false, error: 'Record not found in database' });

    const hospital = record.hospital_id
      ? await Hospital.findById(record.hospital_id)
      : null;

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
        // Record & Patient ID
        record_id: record.record_id,
        patient_id: record.patient_id,
        
        // Patient Information
        patient_name: record.patient_name,
        patient_age: record.patient_age,
        patient_gender: record.patient_gender,
        blood_group: record.blood_group,
        patient_phone: record.patient_phone,
        patient_address: record.patient_address,
        insurance_no: record.insurance_no,
        
        // Hospital/Facility
        hospital_name: record.hospital_name,
        logo_url: hospital?.logo_url || null,
        
        // Visit Information
        visit_date: record.visit_date || record.record_date,
        visit_type: record.visit_type,
        department: record.department,
        physician: record.physician,
        chief_complaint: record.chief_complaint,
        
        // Clinical Observations
        temperature: record.temperature,
        blood_pressure: record.blood_pressure,
        heart_rate: record.heart_rate,
        respiratory_rate: record.respiratory_rate,
        oxygen_saturation: record.oxygen_saturation,
        weight: record.weight,
        height: record.height,
        bmi: record.bmi,
        
        // Diagnosis & Status
        diagnosis: record.diagnosis,
        medical_status: record.medical_status,
        treatment_plan: record.treatment_plan,
        
        // Record Date & Blockchain
        record_date: record.record_date,
        blockchain_tx_hash: record.blockchain_tx_hash,
        blockchain_verified: record.blockchain_verified,
      },
      onchain: blockchainData,
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

    const patient = await Patient.findById(patientId);
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    if (!patient.is_portfolio_public) {
      return res.status(403).json({ error: 'This record is private and cannot be viewed publicly' });
    }

    const records = await HealthRecord.find({ patient_id: patientId }).sort({ record_date: -1 }).lean();

    if (!records.length) {
      return res.status(404).json({ error: 'No records found for this patient' });
    }

    res.json({
      success: true,
      patient,
      records,
    });
  } catch (error) {
    console.error('Patient records error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
