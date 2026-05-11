process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret'
process.env.REQUIRE_EMAIL_VERIFICATION = 'false'

jest.mock('../models/Patient', () => ({
  create: jest.fn(),
  emailExists: jest.fn(),
  findByEmail: jest.fn(),
  findById: jest.fn(),
  findByVerificationToken: jest.fn(),
  setEmailVerification: jest.fn(),
  markEmailVerified: jest.fn()
}))

jest.mock('../utils/mailer', () => ({
  sendEmail: jest.fn()
}))

jest.mock('../utils/emailVerification', () => ({
  createVerificationToken: jest.fn(() => ({
    token: 'test-token',
    tokenHash: 'hashed-token',
    expiresAt: new Date('2030-01-01T00:00:00.000Z')
  })),
  hashToken: jest.fn((token) => `hashed-${token}`),
  buildVerificationUrl: jest.fn((_path, token) => `http://localhost/verify?token=${token}`),
  buildVerificationEmail: jest.fn(() => ({
    subject: 'Verify Email',
    html: '<p>Verify</p>',
    text: 'Verify'
  })),
  renderVerificationPage: jest.fn(({ message }) => `<html><body>${message}</body></html>`)
}))

const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const Patient = require('../models/Patient')
const authController = require('../controllers/authController')

const createResponse = () => {
  const res = {}
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  res.send = jest.fn().mockReturnValue(res)
  return res
}

describe('authController', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('registerPatient', () => {
    it('creates a patient and returns a JWT when email verification is disabled', async () => {
      Patient.emailExists.mockResolvedValue(false)
      Patient.create.mockResolvedValue({
        patientId: 'PAT123456',
        userId: 'PAT123456',
        full_name: 'John Doe',
        email: 'john@example.com',
        gender: 'Male',
        birthdate: '1990-01-01'
      })

      const req = {
        body: {
          full_name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
          gender: 'Male',
          birthdate: '1990-01-01'
        }
      }
      const res = createResponse()

      await authController.registerPatient(req, res)

      expect(Patient.emailExists).toHaveBeenCalledWith('john@example.com')
      expect(Patient.create).toHaveBeenCalledWith(expect.objectContaining({
        full_name: 'John Doe',
        email: 'john@example.com',
        gender: 'Male',
        birthdate: '1990-01-01'
      }))
      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        token: expect.any(String),
        message: 'Patient registered successfully'
      }))

      const responseBody = res.json.mock.calls[0][0]
      const decoded = jwt.verify(responseBody.token, process.env.JWT_SECRET)
      expect(decoded.role).toBe('patient')
      expect(decoded.userId).toBe('PAT123456')
    })

    it('rejects duplicate emails', async () => {
      Patient.emailExists.mockResolvedValue(true)

      const req = {
        body: {
          full_name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
          gender: 'Male',
          birthdate: '1990-01-01'
        }
      }
      const res = createResponse()

      await authController.registerPatient(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ error: 'Email already registered' })
      expect(Patient.create).not.toHaveBeenCalled()
    })

    it('rejects weak passwords', async () => {
      const req = {
        body: {
          full_name: 'John Doe',
          email: 'john@example.com',
          password: 'short',
          gender: 'Male',
          birthdate: '1990-01-01'
        }
      }
      const res = createResponse()

      await authController.registerPatient(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ error: 'Password must be at least 8 characters' })
    })
  })

  describe('loginPatient', () => {
    it('returns a JWT when credentials are valid', async () => {
      const passwordHash = await bcrypt.hash('password123', 10)
      Patient.findByEmail.mockResolvedValue({
        patient_id: 'PAT123456',
        full_name: 'John Doe',
        email: 'john@example.com',
        gender: 'Male',
        birthdate: '1990-01-01',
        email_verified: true,
        password_hash: passwordHash
      })

      const req = {
        body: {
          email: 'john@example.com',
          password: 'password123'
        }
      }
      const res = createResponse()

      await authController.loginPatient(req, res)

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Login successful',
        token: expect.any(String)
      }))

      const responseBody = res.json.mock.calls[0][0]
      const decoded = jwt.verify(responseBody.token, process.env.JWT_SECRET)
      expect(decoded.role).toBe('patient')
      expect(decoded.userId).toBe('PAT123456')
    })

    it('rejects invalid password', async () => {
      const passwordHash = await bcrypt.hash('password123', 10)
      Patient.findByEmail.mockResolvedValue({
        patient_id: 'PAT123456',
        full_name: 'John Doe',
        email: 'john@example.com',
        gender: 'Male',
        birthdate: '1990-01-01',
        email_verified: true,
        password_hash: passwordHash
      })

      const req = {
        body: {
          email: 'john@example.com',
          password: 'wrong-password'
        }
      }
      const res = createResponse()

      await authController.loginPatient(req, res)

      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid email or password' })
    })

    it('rejects missing credentials', async () => {
      const req = { body: {} }
      const res = createResponse()

      await authController.loginPatient(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ error: 'Email and password are required' })
    })
  })
})
