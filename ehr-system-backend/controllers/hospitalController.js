// Hospital Controller - MongoDB version
const Hospital = require('../models/Hospital');
const HealthRecord = require('../models/HealthRecord');
const Patient = require('../models/Patient');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const blockchain = require('../utils/blockchain');
const { ethers } = require('ethers');
const { sendEmail } = require('../utils/mailer');
const {
  createVerificationToken,
  hashToken,
  buildVerificationUrl,
  buildVerificationEmail,
  renderVerificationPage
} = require('../utils/emailVerification');

function isValidEthAddress(address) {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

const isEmailVerificationRequired = () => process.env.REQUIRE_EMAIL_VERIFICATION !== 'false';

const sendInstituteVerificationEmail = async ({ name, email, token }) => {
  const verifyUrl = buildVerificationUrl('/api/hospital/verify-email', token);
  const { subject, html, text } = buildVerificationEmail({ name, verifyUrl, roleLabel: 'hospital' });
  await sendEmail({ to: email, subject, html, text });
};

const getFrontendBaseUrl = () => {
  const frontend = process.env.FRONTEND_URL;
  return frontend ? frontend.replace(/\/$/, '') : '';
};

const getPublicVerifyUrl = (recordId) => {
  const frontendBase = getFrontendBaseUrl();
  if (frontendBase) return `${frontendBase}/verify?recordId=${encodeURIComponent(recordId)}`;
  const backend = process.env.APP_URL || `http://localhost:${process.env.PORT || 3001}`;
  return `${backend.replace(/\/$/, '')}/api/verify/record/${encodeURIComponent(recordId)}`;
};

const sendRecordIssuedEmail = async ({ to, patientName, recordId, diagnosis, hospitalName, issuedDate }) => {
  const appName = process.env.APP_NAME || 'ChainMed';
  const verifyUrl = getPublicVerifyUrl(recordId);
  const subject = `${appName} - Your health record has been issued`;
  const html = `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
    <div style="background:linear-gradient(135deg,#6d28d9,#8b5cf6);padding:24px;color:#fff;border-radius:12px 12px 0 0;">
      <h1 style="margin:0;">${appName}</h1>
      <p style="margin:4px 0 0;opacity:0.9;">Health Record Issued</p>
    </div>
    <div style="background:#fff;padding:24px;border:1px solid #e5e7eb;">
      <p>Hi ${patientName || 'Patient'},</p>
      <p>A new health record has been issued for you by <strong>${hospitalName}</strong>.</p>
      <table style="width:100%;font-size:14px;margin:16px 0;">
        <tr><td style="color:#6b7280;padding:6px 0;">Record ID</td><td style="font-weight:600;">${recordId}</td></tr>
        <tr><td style="color:#6b7280;padding:6px 0;">Diagnosis</td><td style="font-weight:600;">${diagnosis}</td></tr>
        <tr><td style="color:#6b7280;padding:6px 0;">Provider</td><td style="font-weight:600;">${hospitalName}</td></tr>
        <tr><td style="color:#6b7280;padding:6px 0;">Date</td><td style="font-weight:600;">${issuedDate}</td></tr>
      </table>
      <a href="${verifyUrl}" style="background:#7c3aed;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">
        Verify Record
      </a>
    </div>
  </div>`;
  const text = `Hi ${patientName},\nRecord ID: ${recordId}\nDiagnosis: ${diagnosis}\nProvider: ${hospitalName}\nDate: ${issuedDate}\nVerify: ${verifyUrl}`;
  await sendEmail({ to, subject, html, text });
};

// Register hospital
exports.registerInstitute = async (req, res) => {
  try {
    const { hospital_name, email, password, wallet_address } = req.body;
    const logoFile = req.files?.logo?.[0];
    const docFile = req.files?.verification_doc?.[0];
    const logo_url = logoFile ? `/uploads/hospitals/logos/${logoFile.filename}` : null;
    const verification_doc_url = docFile ? `/uploads/hospitals/documents/${docFile.filename}` : null;

    if (!hospital_name || !email || !password || !wallet_address) {
      return res.status(400).json({ error: 'All fields required' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    if (!isValidEthAddress(wallet_address)) {
      return res.status(400).json({ error: 'Invalid wallet address format' });
    }
    if (!verification_doc_url) {
      return res.status(400).json({ error: 'Verification document is required for approval' });
    }

    if (await Hospital.emailExists(email)) return res.status(409).json({ error: 'Email already registered' });
    if (await Hospital.walletExists(wallet_address)) return res.status(409).json({ error: 'Wallet already registered' });

    const password_hash = await bcrypt.hash(password, 10);
    const hospital = await Hospital.create(hospital_name, wallet_address, email, password_hash, logo_url, verification_doc_url);

    if (isEmailVerificationRequired()) {
      const { token, tokenHash, expiresAt } = createVerificationToken();
      await Hospital.setEmailVerification(hospital.hospital_id, tokenHash, expiresAt);
      let emailSent = true;
      try {
        await sendInstituteVerificationEmail({ name: hospital_name, email, token });
      } catch (err) {
        console.error('Verification email error:', err.message);
        emailSent = false;
      }
      return res.status(201).json({
        message: emailSent
          ? 'Hospital registered. Verification email sent. Awaiting admin approval.'
          : 'Hospital registered. Email failed. Awaiting admin approval.',
        verification_required: true,
        email_sent: emailSent,
        hospital: { hospital_id: hospital.hospital_id, hospital_name, email }
      });
    }

    const token = jwt.sign({ hospital_id: hospital.hospital_id, email, role: 'hospital' }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({
      message: 'Hospital registered. Awaiting admin approval.',
      token,
      hospital: { hospital_id: hospital.hospital_id, hospital_name, email }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Login hospital
exports.loginInstitute = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const hospital = await Hospital.findByEmail(email);
    if (!hospital) return res.status(401).json({ error: 'Invalid credentials' });

    if (isEmailVerificationRequired() && !hospital.email_verified) {
      return res.status(403).json({ error: 'Email not verified.', verification_required: true });
    }

    if (hospital.verification_status !== 'approved') {
      return res.status(403).json({ error: `Hospital not approved. Status: ${hospital.verification_status}` });
    }

    const passwordValid = await bcrypt.compare(password, hospital.password_hash);
    if (!passwordValid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ hospital_id: hospital.hospital_id, email: hospital.email, role: 'hospital' }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({
      message: 'Login successful',
      token,
      hospital: { hospital_id: hospital.hospital_id, hospital_name: hospital.hospital_name, email: hospital.email }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Verify hospital email
exports.verifyInstituteEmail = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).send(renderVerificationPage({ success: false, message: 'Missing verification token.' }));

    const tokenHash = hashToken(token);
    const hospital = await Hospital.findByVerificationToken(tokenHash);

    if (!hospital) return res.status(400).send(renderVerificationPage({ success: false, message: 'Invalid or expired verification link.' }));
    if (hospital.email_verified) return res.send(renderVerificationPage({ success: true, message: 'Email already verified.' }));
    if (hospital.email_verification_expires && new Date(hospital.email_verification_expires) < new Date()) {
      return res.status(400).send(renderVerificationPage({ success: false, message: 'Verification link expired.' }));
    }

    await Hospital.markEmailVerified(hospital.hospital_id);
    return res.send(renderVerificationPage({ success: true, message: 'Email verified successfully. You can log in now.' }));
  } catch (error) {
    console.error('Verify email error:', error);
    return res.status(500).send(renderVerificationPage({ success: false, message: 'Server error.' }));
  }
};

// Resend hospital verification
exports.resendInstituteVerification = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const hospital = await Hospital.findByEmail(email);
    if (!hospital) return res.status(404).json({ error: 'Hospital not found' });
    if (hospital.email_verified) return res.status(400).json({ error: 'Email already verified' });

    const { token, tokenHash, expiresAt } = createVerificationToken();
    await Hospital.setEmailVerification(hospital.hospital_id, tokenHash, expiresAt);
    await sendInstituteVerificationEmail({ name: hospital.hospital_name, email: hospital.email, token });
    return res.json({ success: true, message: 'Verification email sent.' });
  } catch (error) {
    console.error('Resend verification error:', error);
    return res.status(500).json({ error: 'Server error.' });
  }
};

// Get hospital profile
exports.getProfile = async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.user.hospital_id);
    if (!hospital) return res.status(404).json({ error: 'Hospital not found' });
    res.json({ hospital });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get hospital dashboard
exports.getDashboard = async (req, res) => {
  try {
    const dashboard = await Hospital.getDashboard(req.user.hospital_id);
    res.json(dashboard);
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Search patients
exports.searchPatients = async (req, res) => {
  try {
    const rawQuery = (req.query.query || '').trim();
    const limit = Math.min(parseInt(req.query.limit) || 10, 25);

    if (rawQuery.length < 3) return res.json({ success: true, patients: [] });

    const mongoose = require('mongoose');
    const PatientModel = mongoose.model('Patient');
    const regex = new RegExp(rawQuery, 'i');
    const patients = await PatientModel.find(
      { $or: [{ patient_id: regex }, { full_name: regex }, { email: regex }] },
      'patient_id full_name email'
    ).limit(limit).lean();

    res.json({ success: true, patients });
  } catch (error) {
    console.error('Patient search error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Issue single record (no MetaMask)
exports.issueCertificate = async (req, res) => {
  try {
    const { patient_id, diagnosis, status } = req.body;
    if (!patient_id || !diagnosis || !status) return res.status(400).json({ error: 'patient_id, diagnosis, status are required' });

    const patient = await Patient.findById(patient_id);
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    const hospital = await Hospital.findById(req.user.hospital_id);
    if (!hospital) return res.status(404).json({ error: 'Hospital not found' });

    const record_id = 'REC' + Date.now() + uuidv4().substring(0, 8);
    const record_date = new Date().toISOString().split('T')[0];

    const blockchainResult = await blockchain.issueCertificate(record_id, patient.full_name, diagnosis, record_date, hospital.hospital_name);

    if (!blockchainResult.success) {
      return res.status(500).json({ error: 'Failed to issue record on blockchain', details: blockchainResult.error });
    }

    await HealthRecord.create({
      record_id,
      patient_id: patient_id,
      hospital_id: req.user.hospital_id,
      hospital_name: hospital.hospital_name,
      patient_name: patient.full_name,
      diagnosis: diagnosis,
      medical_status: status,
      record_date,
      blockchain_tx_hash: blockchainResult.transactionHash,
      blockchain_verified: true
    });

    if (patient.email) {
      sendRecordIssuedEmail({ to: patient.email, patientName: patient.full_name, recordId: record_id, diagnosis: diagnosis, hospitalName: hospital.hospital_name, issuedDate: record_date }).catch(console.error);
    }

    res.status(201).json({ message: 'Record issued successfully!', record: { record_id, patient_id: patient_id, diagnosis: diagnosis, status: status, record_date, blockchain: blockchainResult } });
  } catch (error) {
    console.error('Issue record error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Prepare MetaMask signature payload
exports.getCertificateSignaturePayload = async (req, res) => {
  try {
    const { patient_id, diagnosis, status } = req.body;
    if (!patient_id || !diagnosis || !status) return res.status(400).json({ error: 'patient_id, diagnosis, status are required' });

    const patient = await Patient.findById(patient_id);
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    const hospital = await Hospital.findById(req.user.hospital_id);
    if (!hospital) return res.status(404).json({ error: 'Hospital not found' });
    if (!hospital.wallet_address) return res.status(400).json({ error: 'Hospital wallet not configured' });

    const record_id = 'REC' + Date.now() + uuidv4().substring(0, 8);
    const record_date = new Date().toISOString().split('T')[0];

    const certData = { recordId: record_id, patientName: patient.full_name, diagnosis: diagnosis, recordDate: record_date, providerName: hospital.hospital_name };
    const { messageHash } = await blockchain.computeRecordHash(certData, hospital.wallet_address);

    res.json({ success: true, record_id, record_date, signer_address: hospital.wallet_address, message_hash: messageHash, certData });
  } catch (error) {
    console.error('Signature payload error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Issue record with MetaMask signature
exports.issueCertificateWithSignature = async (req, res) => {
  try {
    const { record_id, patient_id, diagnosis, status, record_date, signature, signer_address, message_hash } = req.body;
    if (!record_id || !patient_id || !diagnosis || !status || !record_date || !signature || !signer_address || !message_hash) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const patient = await Patient.findById(patient_id);
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    const hospital = await Hospital.findById(req.user.hospital_id);
    if (!hospital || !hospital.wallet_address) return res.status(404).json({ error: 'Hospital or wallet not found' });

    if (hospital.wallet_address.toLowerCase() !== signer_address.toLowerCase()) {
      return res.status(400).json({ error: 'Signer address does not match hospital wallet' });
    }

    const certData = { recordId: record_id, patientName: patient.full_name, diagnosis: diagnosis, recordDate: record_date, providerName: hospital.hospital_name };
    const { messageHash: contractHash } = await blockchain.computeRecordHash(certData, hospital.wallet_address);
    if (contractHash.toLowerCase() !== message_hash.toLowerCase()) {
      return res.status(400).json({ error: 'Message hash mismatch. Please re-sign.' });
    }

    const txResult = await blockchain.issueWithMetaMaskSignature(certData, message_hash, signature, signer_address);

    await HealthRecord.create({
      record_id,
      patient_id: patient_id,
      hospital_id: req.user.hospital_id,
      hospital_name: hospital.hospital_name,
      patient_name: patient.full_name,
      diagnosis: diagnosis,
      medical_status: status,
      record_date,
      blockchain_tx_hash: txResult.txHash,
      blockchain_verified: true
    });

    if (patient.email) {
      sendRecordIssuedEmail({ to: patient.email, patientName: patient.full_name, recordId: record_id, diagnosis: diagnosis, hospitalName: hospital.hospital_name, issuedDate: record_date }).catch(console.error);
    }

    res.status(201).json({ message: 'Record issued successfully (MetaMask-signed)', record: { record_id, patient_id: patient_id, diagnosis: diagnosis, status: status, record_date, blockchain: txResult } });
  } catch (error) {
    console.error('Issue record (signature) error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get all hospital records
exports.getCertificates = async (req, res) => {
  try {
    const records = await HealthRecord.find({ hospital_id: req.user.hospital_id }).sort({ record_date: -1 }).lean();
    res.json({ success: true, records });
  } catch (error) {
    console.error('Get records error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Bulk generate authorization hash
exports.getBulkAuthorizationMessage = async (req, res) => {
  try {
    const { certificate_count } = req.body;
    const count = Number(certificate_count || 0);
    if (!count || count < 1) return res.status(400).json({ error: 'certificate_count must be >= 1' });

    const hospital = await Hospital.findById(req.user.hospital_id);
    if (!hospital?.wallet_address) return res.status(400).json({ error: 'Hospital wallet not configured' });

    const batchId = Date.now();
    const expiry = Math.floor(Date.now() / 1000) + 3600;
    const authHash = ethers.utils.solidityKeccak256(
      ['string', 'address', 'uint256', 'uint256', 'uint256'],
      ['BULK_AUTH', hospital.wallet_address, batchId, count, expiry]
    );

    res.json({ success: true, auth_hash: authHash, batch_id: batchId, record_count: count, expiry });
  } catch (error) {
    console.error('Bulk auth message error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// Bulk issue signed records
exports.bulkIssueWithSingleSignature = async (req, res) => {
  try {
    const { records, auth_hash, auth_signature, signer_address, batch_id, certificate_count, expiry } = req.body;

    if (!Array.isArray(records) || records.length === 0) return res.status(400).json({ error: 'records array required' });
    if (!auth_hash || !auth_signature || !signer_address || batch_id === undefined || certificate_count === undefined || expiry === undefined) {
      return res.status(400).json({ error: 'Missing required bulk auth fields' });
    }

    const hospital = await Hospital.findById(req.user.hospital_id);
    if (!hospital?.wallet_address) return res.status(400).json({ error: 'Hospital wallet not configured' });
    if (hospital.wallet_address.toLowerCase() !== signer_address.toLowerCase()) {
      return res.status(400).json({ error: 'Signer address does not match hospital wallet' });
    }

    const results = [];
    for (const rec of records) {
      try {
        const patient = await Patient.findById(rec.patient_id);
        if (!patient) { results.push({ patient_id: rec.patient_id, success: false, error: 'Patient not found' }); continue; }

        const record_id = 'REC' + Date.now() + uuidv4().substring(0, 8);
        const record_date = new Date().toISOString().split('T')[0];

        const certData = { recordId: record_id, patientName: patient.full_name, diagnosis: rec.diagnosis, recordDate: record_date, providerName: hospital.hospital_name };
        const txResult = await blockchain.bulkIssueWithSingleAuth(certData, auth_hash, auth_signature, signer_address, batch_id, certificate_count, expiry);

        await HealthRecord.create({
          record_id, patient_id: rec.patient_id, hospital_id: req.user.hospital_id,
          hospital_name: hospital.hospital_name, patient_name: patient.full_name,
          diagnosis: rec.diagnosis, medical_status: rec.medical_status, record_date,
          blockchain_tx_hash: txResult.txHash, blockchain_verified: true
        });

        results.push({ patient_id: rec.patient_id, record_id, success: true, txHash: txResult.txHash });
      } catch (err) {
        results.push({ student_id: rec.student_id, success: false, error: err.message });
      }
    }

    res.status(201).json({ message: 'Bulk issue complete', results });
  } catch (error) {
    console.error('Bulk issue error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Bulk issue (simple, no MetaMask)
exports.bulkIssueCertificates = async (req, res) => {
  try {
    const { records } = req.body;
    if (!Array.isArray(records) || records.length === 0) return res.status(400).json({ error: 'records array required' });

    const hospital = await Hospital.findById(req.user.hospital_id);
    if (!hospital) return res.status(404).json({ error: 'Hospital not found' });

    const results = [];
    for (const rec of records) {
      try {
        const patient = await Patient.findById(rec.patient_id);
        if (!patient) { results.push({ patient_id: rec.patient_id, success: false, error: 'Patient not found' }); continue; }

        const record_id = 'REC' + Date.now() + uuidv4().substring(0, 8);
        const record_date = new Date().toISOString().split('T')[0];

        const blockchainResult = await blockchain.issueCertificate(record_id, patient.full_name, rec.diagnosis, record_date, hospital.hospital_name);

        await HealthRecord.create({
          record_id, patient_id: rec.patient_id, hospital_id: req.user.hospital_id,
          hospital_name: hospital.hospital_name, patient_name: patient.full_name,
          diagnosis: rec.diagnosis, medical_status: rec.medical_status, record_date,
          blockchain_tx_hash: blockchainResult.transactionHash, blockchain_verified: !!blockchainResult.success
        });

        results.push({ patient_id: rec.patient_id, record_id, success: true, txHash: blockchainResult.transactionHash });
      } catch (err) {
        results.push({ student_id: rec.student_id, success: false, error: err.message });
      }
    }

    res.status(201).json({ message: 'Bulk issue complete', results });
  } catch (error) {
    console.error('Bulk issue error:', error);
    res.status(500).json({ error: error.message });
  }
};
