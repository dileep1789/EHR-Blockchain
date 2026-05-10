import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import patientImage from '../../assets/images/patientSignup.webp'
import hospitalImage from '../../assets/images/hospitalSignup.webp'
import logoImage from '../../assets/images/logo.webp'
import { authAPI, setPatientToken, setHospitalToken } from '../../services/api'

export default function Signup() {
  const navigate = useNavigate()
  const location = useLocation()
  const [userType, setUserType] = useState('patient') // 'patient' or 'hospital'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [birthdateInputType, setBirthdateInputType] = useState('text')
  const [pendingVerification, setPendingVerification] = useState(null)
  const [resendLoading, setResendLoading] = useState(false)
  
  const [patientForm, setPatientForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    gender: '',
    birthdate: ''
  })

  const [hospitalForm, setHospitalForm] = useState({
    hospitalName: '',
    email: '',
    walletAddress: '',
    password: '',
    confirmPassword: '',
    address: '',
    logo: null,
    verificationDoc: null
  })

  useEffect(() => {
    const role = new URLSearchParams(location.search).get('role')
    if (role === 'hospital') {
      setUserType('hospital')
      setError('')
      setPendingVerification(null)
    }
  }, [location.search])

  const handlePatientChange = (e) => {
    const { name, value } = e.target
    setPatientForm(prev => ({ ...prev, [name]: value }))
    setError('')
    setPendingVerification(null)
  }

  const handleHospitalChange = (e) => {
    const { name, value, files } = e.target
    if (name === 'logo') {
      setHospitalForm(prev => ({ ...prev, logo: files[0] }))
    } else if (name === 'verificationDoc') {
      setHospitalForm(prev => ({ ...prev, verificationDoc: files[0] }))
    } else {
      setHospitalForm(prev => ({ ...prev, [name]: value }))
    }
    setError('')
    setPendingVerification(null)
  }

  const handleResendVerification = async (role) => {
    setError('')
    setResendLoading(true)

    try {
      const email = role === 'patient' ? patientForm.email : hospitalForm.email
      if (!email) {
        setError('Please enter your email above')
        return
      }

      if (role === 'patient') {
        await authAPI.resendPatientVerification(email)
      } else {
        await authAPI.resendHospitalVerification(email)
      }

      setError('Verification email sent. Please check your inbox.')
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to resend verification email')
    } finally {
      setResendLoading(false)
    }
  }

  const handlePatientSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')

    // Validation
    if (!patientForm.firstName || !patientForm.lastName || !patientForm.email || !patientForm.password || !patientForm.gender || !patientForm.birthdate) {
      setError('All fields are required')
      return
    }

    if (patientForm.password !== patientForm.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (patientForm.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    try {
      setLoading(true)
      const response = await authAPI.registerPatient({
        full_name: `${patientForm.firstName} ${patientForm.lastName}`,
        email: patientForm.email,
        password: patientForm.password,
        gender: patientForm.gender,
        birthdate: patientForm.birthdate,
      })

      if (response.data?.verification_required) {
        setPendingVerification('patient')
        setError('Registration successful! Please check your email to verify your account.')
        return
      }

      setSuccessMessage('Registration successful! Please login.')
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const handleHospitalSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')

    // Validation
    if (!hospitalForm.hospitalName || !hospitalForm.email || !hospitalForm.password || !hospitalForm.address || !hospitalForm.walletAddress) {
      setError('All fields are required including Wallet Address')
      return
    }

    if (hospitalForm.password !== hospitalForm.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (hospitalForm.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    try {
      setLoading(true)
      const formData = new FormData()
      formData.append('hospital_name', hospitalForm.hospitalName)
      formData.append('email', hospitalForm.email)
      formData.append('password', hospitalForm.password)
      formData.append('address', hospitalForm.address)
      formData.append('wallet_address', hospitalForm.walletAddress)
      
      if (hospitalForm.logo) {
        formData.append('logo', hospitalForm.logo)
      }
      if (hospitalForm.verificationDoc) {
        formData.append('verification_doc', hospitalForm.verificationDoc)
      }

      const response = await authAPI.registerHospital(formData)

      if (response.data?.verification_required) {
        setPendingVerification('hospital')
        setError('Registration submitted! Please check your email to verify.')
        return
      }

      setSuccessMessage('Registration submitted successfully! Please wait for admin approval.')
      setTimeout(() => navigate('/login?role=hospital'), 3000)
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar placeholder */}
      <nav className="bg-slate-950 px-3 md:px-4 py-3">
        <div className="max-w-312 mx-auto flex justify-between items-center gap-3">
          <a href="/" className="inline-flex items-center">
            <span className="text-xl font-bold text-white tracking-tight">EHR<span className="text-emerald-400">Chain</span></span>
          </a>
          <div className="flex items-center gap-4 md:gap-8">
            <a
              href="/login"
              className="inline-flex items-center justify-center text-white border border-white/70 rounded-lg px-2 md:px-3 py-1 md:py-1.5 text-sm md:text-base font-semibold hover:bg-white hover:text-gray-900 transition-colors"
            >
              LOGIN
            </a>
            <button
              type="button"
              onClick={() => navigate('/verify')}
              className="inline-flex items-center justify-center bg-emerald-400 text-slate-950 rounded-lg px-2 md:px-3 py-1 md:py-1.5 text-sm md:text-base font-semibold border border-emerald-400 hover:bg-transparent hover:text-emerald-400 transition-colors"
            >
              VERIFY
            </button>
          </div>
        </div>
      </nav>

      <div className="min-h-screen flex items-start justify-center pt-10 pb-8 px-4">
        <div className="w-full max-w-6xl">
          {/* Role Toggle */}
          <div className="flex justify-center mb-8">
            <div className="flex gap-4 bg-gray-200 rounded-lg p-1.5">
              <button
                onClick={() => {
                  setUserType('patient')
                  setError('')
                  setSuccessMessage('')
                  setPendingVerification(null)
                }}
                className={`px-6 py-2.5 rounded font-semibold transition-all ${
                  userType === 'patient'
                    ? 'bg-gradient-primary text-white shadow-md'
                    : 'bg-transparent text-gray-700 hover:text-gray-900'
                }`}
              >
                Patient
              </button>
              <button
                onClick={() => {
                  setUserType('hospital')
                  setError('')
                  setSuccessMessage('')
                  setPendingVerification(null)
                }}
                className={`px-6 py-2.5 rounded font-semibold transition-all ${
                  userType === 'hospital'
                    ? 'bg-gradient-primary text-white shadow-md'
                    : 'bg-transparent text-gray-700 hover:text-gray-900'
                }`}
              >
                Hospital
              </button>
            </div>
          </div>

          {/* Patient Signup Form */}
          {userType === 'patient' && (
            <div className="flex flex-col lg:flex-row-reverse items-stretch gap-0 bg-white rounded-3xl shadow-lg overflow-hidden">
              {/* Right Side - Image */}
              <div className="flex flex-1">
                <div className="bg-purple-100 p-8 w-full flex items-center justify-center h-full">
                  <div className="text-left ml-8">
                    <h2 className="text-5xl font-bold text-black mb-2">
                      ehr<span className="text-emerald-600">chain</span>
                    </h2>
                    <p className="text-2xl text-gray-700 font-semibold mb-6">New Patient?</p>
                    <p className="text-gray-600 text-sm mb-8">Join now and manage your health records securely.</p>
                    <img
                      src={patientImage}
                      alt="Patient"
                      className="w-full h-auto"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                </div>
              </div>

              {/* Left Side - Form */}
              <div className="flex-1">
                <form onSubmit={handlePatientSubmit} className="p-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">Patient Registration</h2>

                  {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                      {error}
                    </div>
                  )}

                  {successMessage && (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">
                      {successMessage}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <input
                      type="text"
                      name="firstName"
                      placeholder="First Name"
                      value={patientForm.firstName}
                      onChange={handlePatientChange}
                      required
                      className="col-span-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500"
                    />
                    <input
                      type="text"
                      name="lastName"
                      placeholder="Last Name"
                      value={patientForm.lastName}
                      onChange={handlePatientChange}
                      required
                      className="col-span-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500"
                    />
                  </div>


                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={patientForm.email}
                    onChange={handlePatientChange}
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm mb-4 focus:outline-none focus:border-purple-500"
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <select
                      name="gender"
                      value={patientForm.gender}
                      onChange={handlePatientChange}
                      required
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>

                    <input
                      type={birthdateInputType}
                      name="birthdate"
                      placeholder="Date of Birth"
                      value={patientForm.birthdate}
                      onFocus={() => setBirthdateInputType('date')}
                      onBlur={(e) => {
                        if (!e.target.value) {
                          setBirthdateInputType('text')
                        }
                      }}
                      onChange={handlePatientChange}
                      required
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="Password (min 8 characters)"
                    value={patientForm.password}
                    onChange={handlePatientChange}
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm mb-4 focus:outline-none focus:border-purple-500"
                  />

                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    placeholder="Confirm Password"
                    value={patientForm.confirmPassword}
                    onChange={handlePatientChange}
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm mb-6 focus:outline-none focus:border-purple-500"
                  />

                  <label className="flex items-center gap-2 text-sm text-gray-600 mb-6">
                    <input
                      type="checkbox"
                      checked={showPassword}
                      onChange={(e) => setShowPassword(e.target.checked)}
                      className="h-4 w-4"
                    />
                    Show password
                  </label>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-primary text-white rounded-lg px-6 py-3 font-semibold hover:opacity-90 transition-opacity mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Registering...' : 'Register'}
                  </button>

                  {pendingVerification === 'patient' && (
                    <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg mb-4 text-sm">
                      <p className="font-semibold mb-2">Verify your email to continue.</p>
                      <button
                        type="button"
                        onClick={() => handleResendVerification('patient')}
                        disabled={resendLoading}
                        className="inline-flex items-center justify-center bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {resendLoading ? 'Sending...' : 'Resend verification email'}
                      </button>
                    </div>
                  )}

                  <div className="text-center text-sm">
                    <span className="text-gray-600">Already have an account? </span>
                    <a href="/login" className="text-purple-600 hover:underline font-semibold">
                      Log In
                    </a>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Hospital Signup Form */}
          {userType === 'hospital' && (
            <div className="flex flex-col lg:flex-row-reverse items-stretch gap-0 bg-white rounded-3xl shadow-lg overflow-hidden">
              {/* Right Side - Image */}
              <div className="flex flex-1">
                <div className="bg-purple-100 p-8 w-full flex items-center justify-center h-full">
                  <div className="text-left ml-8">
                    <h2 className="text-5xl font-bold text-black mb-2">
                      ehr<span className="text-emerald-600">chain</span>
                    </h2>
                    <p className="text-2xl text-gray-700 font-semibold mb-2">Provider Partner?</p>
                    <p className="text-gray-600 text-sm mb-8">Join our network of healthcare providers and issue verifiable records.</p>
                    <img
                      src={hospitalImage}
                      alt="Hospital"
                      className="w-full h-auto"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                </div>
              </div>

              {/* Left Side - Form */}
              <div className="flex-1">
                <form onSubmit={handleHospitalSubmit} className="p-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">Hospital Registration</h2>

                  {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                      {error}
                    </div>
                  )}

                  {successMessage && (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">
                      {successMessage}
                    </div>
                  )}

                  <input
                    type="text"
                    name="hospitalName"
                    placeholder="Hospital/Clinic Name"
                    value={hospitalForm.hospitalName}
                    onChange={handleHospitalChange}
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm mb-4 focus:outline-none focus:border-purple-500"
                  />

                  <input
                    type="email"
                    name="email"
                    placeholder="Official Email Address"
                    value={hospitalForm.email}
                    onChange={handleHospitalChange}
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm mb-4 focus:outline-none focus:border-purple-500"
                  />

                  <textarea
                    name="address"
                    placeholder="Complete Hospital Address"
                    value={hospitalForm.address}
                    onChange={handleHospitalChange}
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm mb-4 focus:outline-none focus:border-purple-500 h-24"
                  ></textarea>

                  <input
                    type="text"
                    name="walletAddress"
                    placeholder="Blockchain Wallet Address (0x...)"
                    value={hospitalForm.walletAddress}
                    onChange={handleHospitalChange}
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm mb-4 focus:outline-none focus:border-purple-500"
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1 ml-1 uppercase">Hospital Logo</label>
                      <input
                        type="file"
                        name="logo"
                        accept="image/*"
                        onChange={handleHospitalChange}
                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1 ml-1 uppercase">Verification Doc (PDF/Img)</label>
                      <input
                        type="file"
                        name="verificationDoc"
                        accept=".pdf,image/*"
                        onChange={handleHospitalChange}
                        required
                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      placeholder="Password"
                      value={hospitalForm.password}
                      onChange={handleHospitalChange}
                      required
                      className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500"
                    />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      placeholder="Confirm Password"
                      value={hospitalForm.confirmPassword}
                      onChange={handleHospitalChange}
                      required
                      className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <label className="flex items-center gap-2 text-sm text-gray-600 mb-6">
                    <input
                      type="checkbox"
                      checked={showPassword}
                      onChange={(e) => setShowPassword(e.target.checked)}
                      className="h-4 w-4"
                    />
                    Show password
                  </label>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-primary text-white rounded-lg px-6 py-3 font-semibold hover:opacity-90 transition-opacity mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Submitting...' : 'Register Hospital'}
                  </button>

                  {pendingVerification === 'hospital' && (
                    <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg mb-4 text-sm">
                      <p className="font-semibold mb-2">Verify hospital email to continue.</p>
                      <button
                        type="button"
                        onClick={() => handleResendVerification('hospital')}
                        disabled={resendLoading}
                        className="inline-flex items-center justify-center bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {resendLoading ? 'Sending...' : 'Resend verification email'}
                      </button>
                    </div>
                  )}

                  <div className="text-center text-sm">
                    <span className="text-gray-600">Already registered? </span>
                    <a href="/login?role=hospital" className="text-purple-600 hover:underline font-semibold">
                      Log In
                    </a>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
