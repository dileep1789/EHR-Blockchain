// Patient Controller - Dashboard and record operations (MongoDB version)
const Patient = require('../models/Patient');
const HealthRecord = require('../models/HealthRecord');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Get patient dashboard data
exports.getDashboard = async (req, res) => {
  try {
    const patientId = req.user.userId;

    const patient = await Patient.findById(patientId);
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    const records = await HealthRecord.find({ patient_id: patientId }).sort({ record_date: -1 }).lean();

    const blockchainVerifiedCount = records.filter(r => r.blockchain_tx_hash).length;

    // Get unique hospitals
    const institutionsMap = new Map();
    records.forEach(r => {
      if (!institutionsMap.has(r.hospital_id)) {
        institutionsMap.set(r.hospital_id, {
          hospital_id: r.hospital_id,
          hospital_name: r.hospital_name,
          certificateCount: 0
        });
      }
      institutionsMap.get(r.hospital_id).certificateCount++;
    });

    res.json({
      success: true,
      patient: {
        patientId: patient.patient_id,
        full_name: patient.full_name,
        email: patient.email,
        gender: patient.gender,
        birthdate: patient.birthdate,
        isPortfolioPublic: patient.is_portfolio_public,
        profile_photo_url: patient.profile_photo_url,
        cv_url: patient.cv_url || patient.medical_history_url,
        blood_group: patient.blood_group,
        github_url: patient.github_url || patient.blood_group
      },
      records,
      statistics: {
        totalCertificates: records.length,
        blockchainVerifiedCount,
        institutionsCount: institutionsMap.size,
        activeCertificatesCount: records.length
      },
      institutions: Array.from(institutionsMap.values())
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get all patient records
exports.getCertificates = async (req, res) => {
  try {
    const patientId = req.user.userId;
    const records = await HealthRecord.find({ patient_id: patientId }).sort({ record_date: -1 }).lean();
    res.json({ success: true, records });
  } catch (error) {
    console.error('Get records error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get single record details
exports.getCertificateDetails = async (req, res) => {
  try {
    const patientId = req.user.userId;
    const { certificateId } = req.params;

    const record = await HealthRecord.findOne({ record_id: certificateId, patient_id: patientId }).lean();
    if (!record) return res.status(404).json({ error: 'Record not found' });

    res.json({ success: true, record });
  } catch (error) {
    console.error('Get record detail error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Verify record on blockchain
exports.verifyCertificateOnBlockchain = async (req, res) => {
  try {
    const { certificateId } = req.params;
    const record = await HealthRecord.findOne({ record_id: certificateId }).lean();
    if (!record) return res.status(404).json({ error: 'Record not found' });

    res.json({
      success: true,
      verified: !!record.blockchain_tx_hash,
      blockchain_tx_hash: record.blockchain_tx_hash,
      record
    });
  } catch (error) {
    console.error('Blockchain verify error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get AI-powered health insights using Gemini
exports.getCareerInsights = async (req, res) => {
  try {
    const patientId = req.user.userId;
    const patient = await Patient.findById(patientId);
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    const records = await HealthRecord.find({ patient_id: patientId }).lean();
    if (!records.length) {
      return res.json({ success: true, insights: null, message: 'No health records found' });
    }

    const diagnosisList = records.map(r => r.diagnosis).join(', ');
    const prompt = `You are a helpful medical AI assistant. Based on the following diagnoses from a patient's health history: "${diagnosisList}", provide:
1. A brief health summary
2. Key health risk factors
3. Recommended preventive actions
4. Suggested lifestyle improvements

Return in JSON format:
{
  "healthSummary": "...",
  "riskFactors": ["..."],
  "recommendedActions": ["..."],
  "lifestyleImprovements": ["..."]
}`;

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const insights = jsonMatch ? JSON.parse(jsonMatch[0]) : { healthSummary: text };

    res.json({ success: true, insights });
  } catch (error) {
    console.error('Health insights error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update portfolio visibility
exports.updatePortfolioVisibility = async (req, res) => {
  try {
    const patientId = req.user.userId;
    const { isPublic } = req.body;
    await Patient.updateProfile(patientId, { is_portfolio_public: isPublic });
    res.json({ success: true, message: `Portfolio is now ${isPublic ? 'public' : 'private'}` });
  } catch (error) {
    console.error('Visibility update error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update patient profile
exports.updateProfile = async (req, res) => {
  try {
    const patientId = req.user.userId;
    const updates = {};

    if (req.body.full_name) updates.full_name = req.body.full_name;
    if (req.body.email) updates.email = req.body.email;
    if (req.body.gender) updates.gender = req.body.gender;
    if (req.body.birthdate) updates.birthdate = req.body.birthdate;
    if (req.body.blood_group || req.body.github_url) {
      updates.blood_group = req.body.blood_group || req.body.github_url;
      updates.github_url = req.body.blood_group || req.body.github_url;
    }
    if (req.files?.profile_photo?.[0]) {
      updates.profile_photo_url = `/uploads/patients/photos/${req.files.profile_photo[0].filename}`;
    }
    if (req.files?.cv?.[0]) {
      updates.cv_url = `/uploads/patients/cvs/${req.files.cv[0].filename}`;
      updates.medical_history_url = updates.cv_url;
    }

    const updated = await Patient.updateProfile(patientId, updates);
    res.json({ success: true, patient: updated });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
