// Authentication Controller - MongoDB version
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Patient = require('../models/Patient');
const { sendEmail } = require('../utils/mailer');
const {
  createVerificationToken,
  hashToken,
  buildVerificationUrl,
  buildVerificationEmail,
  renderVerificationPage
} = require('../utils/emailVerification');

// Load models so they register with mongoose
require('../models/HealthRecord');
require('../models/Hospital');
require('../models/Admin');

const generateToken = (userId, role) => {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const isEmailVerificationRequired = () => process.env.REQUIRE_EMAIL_VERIFICATION !== 'false';

const sendPatientVerificationEmail = async ({ name, email, token }) => {
  const verifyUrl = buildVerificationUrl('/api/auth/patient/verify-email', token);
  const { subject, html, text } = buildVerificationEmail({ name, verifyUrl, roleLabel: 'patient' });
  await sendEmail({ to: email, subject, html, text });
};

// Patient Registration
exports.registerStudent = async (req, res) => {
  try {
    const { full_name, email, password, gender, birthdate } = req.body;

    if (!full_name || !email || !password || !gender || !birthdate) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const emailExists = await Patient.emailExists(email);
    if (emailExists) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const patient = await Patient.create({ full_name, email, password_hash, gender, birthdate });

    const requiresVerification = isEmailVerificationRequired();
    if (requiresVerification) {
      const { token, tokenHash, expiresAt } = createVerificationToken();
      await Patient.setEmailVerification(patient.patientId, tokenHash, expiresAt);

      let emailSent = true;
      try {
        await sendPatientVerificationEmail({ name: full_name, email, token });
      } catch (err) {
        console.error('Verification email error:', err.message);
        emailSent = false;
      }

      return res.status(201).json({
        success: true,
        message: emailSent
          ? 'Registration successful. Verification email sent.'
          : 'Registration successful. Verification email failed to send.',
        verification_required: true,
        email_sent: emailSent,
        userId: patient.patientId,
        patient: { userId: patient.patientId, full_name, email, gender, birthdate }
      });
    }

    const token = generateToken(patient.patientId, 'patient');
    return res.status(201).json({
      success: true,
      message: 'Patient registered successfully',
      userId: patient.patientId,
      token,
      patient: { userId: patient.patientId, full_name, email, gender, birthdate }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
};

// Patient Login
exports.loginStudent = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const patient = await Patient.findByEmail(email);
    if (!patient) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValidPassword = await bcrypt.compare(password, patient.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (isEmailVerificationRequired() && !patient.email_verified) {
      return res.status(403).json({
        error: 'Email not verified. Please check your inbox.',
        verification_required: true
      });
    }

    const token = generateToken(patient.patient_id, 'patient');
    res.json({
      success: true,
      message: 'Login successful',
      token,
      patient: {
        userId: patient.patient_id,
        full_name: patient.full_name,
        email: patient.email,
        gender: patient.gender,
        birthdate: patient.birthdate
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
};

// Get current patient profile
exports.getProfile = async (req, res) => {
  try {
    const patient = await Patient.findById(req.user.userId);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    res.json({ success: true, patient });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Verify patient email
exports.verifyStudentEmail = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).send(renderVerificationPage({ success: false, message: 'Missing verification token.' }));
    }

    const tokenHash = hashToken(token);
    const patient = await Patient.findByVerificationToken(tokenHash);

    if (!patient) {
      return res.status(400).send(renderVerificationPage({ success: false, message: 'Invalid or expired verification link.' }));
    }

    if (patient.email_verified) {
      return res.send(renderVerificationPage({ success: true, message: 'Email already verified.' }));
    }

    if (patient.email_verification_expires && new Date(patient.email_verification_expires) < new Date()) {
      return res.status(400).send(renderVerificationPage({ success: false, message: 'Verification link expired. Please request a new link.' }));
    }

    await Patient.markEmailVerified(patient.patient_id);
    return res.send(renderVerificationPage({ success: true, message: 'Email verified successfully. You can log in now.' }));
  } catch (error) {
    console.error('Verify email error:', error);
    return res.status(500).send(renderVerificationPage({ success: false, message: 'Server error while verifying email.' }));
  }
};

// Resend patient verification email
exports.resendStudentVerification = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const patient = await Patient.findByEmail(email);
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    if (patient.email_verified) return res.status(400).json({ error: 'Email already verified' });

    const { token, tokenHash, expiresAt } = createVerificationToken();
    await Patient.setEmailVerification(patient.patient_id, tokenHash, expiresAt);
    await sendPatientVerificationEmail({ name: patient.full_name, email: patient.email, token });

    return res.json({ success: true, message: 'Verification email sent.' });
  } catch (error) {
    console.error('Resend verification error:', error);
    return res.status(500).json({ error: 'Server error while sending verification email' });
  }
};
