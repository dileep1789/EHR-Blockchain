// HealthRecord Model - Mongoose Schema for MongoDB
const mongoose = require('mongoose');

const healthRecordSchema = new mongoose.Schema({
  record_id:        { type: String, required: true, unique: true },
  patient_id:       { type: String, required: true, index: true },
  hospital_id:      { type: String, required: true, index: true },
  hospital_name:    { type: String },
  patient_name:     { type: String },
  diagnosis:        { type: String, required: true },
  medical_status:   { type: String },
  record_date:      { type: String },
  blockchain_tx_hash: { type: String, default: null },
  blockchain_verified: { type: Boolean, default: false },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.models.HealthRecord || mongoose.model('HealthRecord', healthRecordSchema);
