// Hospital Model - Mongoose Schema for MongoDB
const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema({
  hospital_id: { type: String, required: true, unique: true },
  hospital_name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password_hash: { type: String, required: true },
  wallet_address: { type: String, required: true, unique: true },
  logo_url: { type: String, default: null },
  verification_doc_url: { type: String, default: null },
  verification_status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  email_verified: { type: Boolean, default: false },
  email_verification_token: { type: String, default: null },
  email_verification_expires: { type: Date, default: null },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const HospitalModel = mongoose.models.Hospital || mongoose.model('Hospital', hospitalSchema);

class Hospital {
  static async create(name, walletAddress, email, password_hash, logo_url, verification_doc_url) {
    const hospital_id = 'HOSP' + Date.now() + Math.random().toString(36).substr(2, 8).toUpperCase();
    const hospital = new HospitalModel({
      hospital_id,
      hospital_name: name,
      wallet_address: walletAddress,
      email: email.toLowerCase(),
      password_hash,
      logo_url,
      verification_doc_url,
    });
    await hospital.save();
    return hospital.toObject();
  }

  static async findByEmail(email) {
    return HospitalModel.findOne({ email: email.toLowerCase() }).lean();
  }

  static async findById(hospital_id) {
    return HospitalModel.findOne({ hospital_id }).lean();
  }

  static async walletExists(wallet_address) {
    const count = await HospitalModel.countDocuments({ wallet_address });
    return count > 0;
  }

  static async emailExists(email) {
    const count = await HospitalModel.countDocuments({ email: email.toLowerCase() });
    return count > 0;
  }

  static async setEmailVerification(hospital_id, tokenHash, expiresAt) {
    await HospitalModel.updateOne(
      { hospital_id },
      { email_verification_token: tokenHash, email_verification_expires: expiresAt, email_verified: false }
    );
  }

  static async findByVerificationToken(tokenHash) {
    return HospitalModel.findOne({ email_verification_token: tokenHash },
      'hospital_id email hospital_name email_verified email_verification_expires'
    ).lean();
  }

  static async markEmailVerified(hospital_id) {
    await HospitalModel.updateOne(
      { hospital_id },
      { email_verified: true, email_verification_token: null, email_verification_expires: null }
    );
  }

  static async getDashboard(hospital_id) {
    const HealthRecord = mongoose.model('HealthRecord');
    const hospital = await HospitalModel.findOne({ hospital_id }).lean();
    const totalRecords = await HealthRecord.countDocuments({ hospital_id });
    const recentRecords = await HealthRecord.find({ hospital_id })
      .sort({ record_date: -1 })
      .limit(5)
      .lean();
    return {
      hospital,
      statistics: { totalRecords },
      recentRecords,
    };
  }

  static async getAll() {
    return HospitalModel.find({}, 'hospital_id hospital_name email wallet_address logo_url verification_doc_url verification_status created_at').sort({ created_at: -1 }).lean();
  }

  static async getPending() {
    return HospitalModel.find({ verification_status: 'pending' },
      'hospital_id hospital_name email wallet_address logo_url verification_doc_url created_at'
    ).sort({ created_at: -1 }).lean();
  }

  static async approve(hospital_id) {
    await HospitalModel.updateOne({ hospital_id }, { verification_status: 'approved' });
    return true;
  }

  static async reject(hospital_id) {
    await HospitalModel.updateOne({ hospital_id }, { verification_status: 'rejected' });
    return true;
  }
}

module.exports = Hospital;
