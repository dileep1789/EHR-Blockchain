// HealthRecord Model - Mongoose Schema for MongoDB
const mongoose = require('mongoose');

const healthRecordSchema = new mongoose.Schema({
  // Record & Patient Identification
  record_id:        { type: String, required: true, unique: true },
  patient_id:       { type: String, required: true, index: true },
  hospital_id:      { type: String, required: true, index: true },
  hospital_name:    { type: String },
  patient_name:     { type: String },
  
  // Patient Information
  patient_age:      { type: String },
  patient_gender:   { type: String },
  blood_group:      { type: String },
  patient_phone:    { type: String },
  patient_address:  { type: String },
  insurance_no:     { type: String },
  
  // Visit Information
  visit_date:       { type: String },
  visit_type:       { type: String, default: 'Outpatient' },
  department:       { type: String, default: 'General' },
  physician:        { type: String },
  chief_complaint:  { type: String },
  
  // Clinical Observations
  temperature:      { type: String },
  blood_pressure:   { type: String },
  heart_rate:       { type: String },
  respiratory_rate: { type: String },
  oxygen_saturation: { type: String },
  weight:           { type: String },
  height:           { type: String },
  bmi:              { type: String },
  
  // Diagnosis & Status
  diagnosis:        { type: String, required: true },
  medical_status:   { type: String },
  treatment_plan:   { type: String },
  
  // Record Details
  record_date:      { type: String },
  blockchain_tx_hash: { type: String, default: null },
  blockchain_verified: { type: Boolean, default: false },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.models.HealthRecord || mongoose.model('HealthRecord', healthRecordSchema);
