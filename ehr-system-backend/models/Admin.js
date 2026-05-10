// Admin Model - Mongoose Schema for MongoDB
const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  admin_id: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const AdminModel = mongoose.models.Admin || mongoose.model('Admin', adminSchema);

class Admin {
  static async findByUsername(username) {
    return AdminModel.findOne({ username }).lean();
  }

  static async findById(admin_id) {
    return AdminModel.findOne({ admin_id }).lean();
  }

  static async getAll() {
    return AdminModel.find({}).lean();
  }

  static async getPendingInstitutes() {
    const Hospital = mongoose.model('Hospital');
    return Hospital.find({ verification_status: 'pending' },
      'hospital_id hospital_name email wallet_address logo_url verification_doc_url created_at'
    ).sort({ created_at: -1 }).lean();
  }

  static async getAllInstitutes() {
    const Hospital = mongoose.model('Hospital');
    return Hospital.find({},
      'hospital_id hospital_name email wallet_address logo_url verification_doc_url verification_status created_at'
    ).sort({ created_at: -1 }).lean();
  }

  static async getInstituteById(hospital_id) {
    const Hospital = mongoose.model('Hospital');
    return Hospital.findOne({ hospital_id },
      'hospital_id hospital_name wallet_address email verification_status logo_url verification_doc_url'
    ).lean();
  }

  static async approveInstitute(hospital_id) {
    const Hospital = mongoose.model('Hospital');
    await Hospital.updateOne({ hospital_id }, { verification_status: 'approved' });
    return true;
  }

  static async rejectInstitute(hospital_id) {
    const Hospital = mongoose.model('Hospital');
    await Hospital.updateOne({ hospital_id }, { verification_status: 'rejected' });
    return true;
  }

  static async getStatistics() {
    const Patient  = require('./Patient');
    const Hospital = mongoose.model('Hospital');
    const HealthRecord = mongoose.model('HealthRecord');

    const [totalPatients, totalHospitals, approvedHospitals, pendingHospitals, totalRecords] = await Promise.all([
      mongoose.model('Patient').countDocuments(),
      Hospital.countDocuments(),
      Hospital.countDocuments({ verification_status: 'approved' }),
      Hospital.countDocuments({ verification_status: 'pending' }),
      HealthRecord.countDocuments(),
    ]);

    return {
      totalStudents: totalPatients,
      totalPatients,
      totalInstitutes: totalHospitals,
      totalHospitals,
      approvedInstitutes: approvedHospitals,
      approvedHospitals,
      pendingInstitutes: pendingHospitals,
      pendingHospitals,
      totalCertificates: totalRecords,
      totalRecords,
    };
  }
}

module.exports = Admin;
