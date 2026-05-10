// Patient Model - Mongoose Schema for MongoDB
const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  patient_id: { type: String, required: true, unique: true },
  full_name:  { type: String, required: true },
  email:      { type: String, required: true, unique: true, lowercase: true },
  password_hash: { type: String, required: true },
  gender:     { type: String },
  birthdate:  { type: String },
  is_portfolio_public: { type: Boolean, default: false },
  profile_photo_url: { type: String, default: null },
  medical_history_url: { type: String, default: null },
  blood_group: { type: String, default: null },
  email_verified: { type: Boolean, default: false },
  email_verification_token: { type: String, default: null },
  email_verification_expires: { type: Date, default: null },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const PatientModel = mongoose.models.Patient || mongoose.model('Patient', patientSchema);

const Patient = {
  async create(patientData) {
    const patientId = `PAT${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    const patient = new PatientModel({ patient_id: patientId, ...patientData });
    await patient.save();
    return { patientId, userId: patientId, ...patientData };
  },

  async findByEmail(email) {
    return PatientModel.findOne({ email: email.toLowerCase() }).lean();
  },

  async findById(patientId) {
    return PatientModel.findOne({ patient_id: patientId },
      'patient_id full_name email gender birthdate is_portfolio_public profile_photo_url medical_history_url blood_group email_verified created_at'
    ).lean();
  },

  async getRecords(patientId) {
    const HealthRecord = mongoose.model('HealthRecord');
    return HealthRecord.find({ patient_id: patientId })
      .sort({ record_date: -1 })
      .lean();
  },

  async emailExists(email) {
    const count = await PatientModel.countDocuments({ email: email.toLowerCase() });
    return count > 0;
  },

  async setEmailVerification(patientId, tokenHash, expiresAt) {
    await PatientModel.updateOne(
      { patient_id: patientId },
      { email_verification_token: tokenHash, email_verification_expires: expiresAt, email_verified: false }
    );
  },

  async findByVerificationToken(tokenHash) {
    return PatientModel.findOne({ email_verification_token: tokenHash },
      'patient_id email full_name email_verified email_verification_expires'
    ).lean();
  },

  async markEmailVerified(patientId) {
    await PatientModel.updateOne(
      { patient_id: patientId },
      { email_verified: true, email_verification_token: null, email_verification_expires: null }
    );
  },

  async updateProfile(patientId, data) {
    return PatientModel.findOneAndUpdate(
      { patient_id: patientId },
      { $set: data },
      { new: true }
    ).lean();
  },
  
  // getCertificates is an alias for getRecords used by patientController
  async getCertificates(patientId) {
    const HealthRecord = mongoose.model('HealthRecord');
    return HealthRecord.find({ patient_id: patientId })
      .sort({ record_date: -1 })
      .lean();
  },
};

module.exports = Patient;
