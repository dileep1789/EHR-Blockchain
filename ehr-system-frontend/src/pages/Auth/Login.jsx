import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import patientImage from '../../assets/images/patientLogin.webp'
import hospitalImage from '../../assets/images/hospitalLogin.webp'
import logoImage from '../../assets/images/logo.webp'
import { authAPI, setPatientToken, setHospitalToken } from '../../services/api'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const [userType, setUserType] = useState('patient')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [verificationRole, setVerificationRole] = useState(null)
  const [resendLoading, setResendLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  useEffect(() => {
    const role = new URLSearchParams(location.search).get('role')
    if (role === 'hospital') {
      setUserType('hospital')
      setError('')
      setVerificationRole(null)
    }
  }, [location.search])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError('')
    setVerificationRole(null)
  }

  const handleResendVerification = async (role) => {
    setError('')
    setResendLoading(true)

    try {
      if (!formData.email) {
        setError('Please enter your email first')
        return
      }

      if (role === 'patient') {
        await authAPI.resendPatientVerification(formData.email)
      } else {
        await authAPI.resendHospitalVerification(formData.email)
      }

      setError('Verification email sent. Please check your inbox.')
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to resend verification email')
    } finally {
      setResendLoading(false)
    }
  }

  const handlePatientLogin = async (e) => {
    e.preventDefault()
    setError('')

    if (!formData.email || !formData.password) {
      setError('Please fill in all fields')
      return
    }

    try {
      setLoading(true)
      const response = await authAPI.loginPatient({
        email: formData.email,
        password: formData.password,
      })

      localStorage.removeItem('adminToken');
      localStorage.removeItem('hospitalToken');
      setPatientToken(response.data.token)
      navigate('/patient/dashboard')
    } catch (err) {
      if (err.response?.data?.verification_required) {
        setVerificationRole('patient')
        setError('Email not verified. Please check your inbox.')
        return
      }
      setError(err.response?.data?.error || err.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleHospitalLogin = async (e) => {
    e.preventDefault()
    setError('')

    if (!formData.email || !formData.password) {
      setError('Please fill in all fields')
      return
    }

    try {
      setLoading(true)
      const response = await authAPI.loginHospital({
        email: formData.email,
        password: formData.password,
      })

      localStorage.removeItem('adminToken');
      localStorage.removeItem('patientToken');
      setHospitalToken(response.data.token)
      navigate('/hospital/dashboard')
    } catch (err) {
      if (err.response?.data?.verification_required) {
        setVerificationRole('hospital')
        setError('Email not verified. Please check your inbox.')
        return
      }
      setError(err.response?.data?.error || err.response?.data?.message || 'Login failed')
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
              href="/signup"
              className="inline-flex items-center justify-center text-white border border-white/70 rounded-lg px-2 md:px-3 py-1 md:py-1.5 text-sm md:text-base font-semibold hover:bg-white hover:text-gray-900 transition-colors"
            >
              SIGNUP
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
                  setVerificationRole(null)
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
                  setVerificationRole(null)
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

          {/* Patient Login Form */}
          {userType === 'patient' && (
            <div className="flex flex-col lg:flex-row-reverse items-stretch gap-0 bg-white lg:rounded-3xl lg:shadow-lg overflow-hidden border lg:border-0 border-gray-300 lg:border-none">
              {/* Right Side - Form */}
              <div className="flex-1">
                <form onSubmit={handlePatientLogin} className="p-7">
                  {/* Image inside form - Mobile only */}
                  <div className="lg:hidden flex items-center justify-center mb-4">
                    <img
                      src={patientImage}
                      alt="Patient"
                      className="w-full h-auto max-w-xs"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>

                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Patient Login</h2>
                  <p className="text-gray-600 text-sm mb-5">Enter your account details to access records</p>

                  {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                      {error}
                    </div>
                  )}

                  {verificationRole === 'patient' && (
                    <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg mb-4 text-sm">
                      <p className="font-semibold mb-2">Didn't get the verification email?</p>
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

                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm mb-3 focus:outline-none focus:border-purple-500"
                  />

                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm mb-4 focus:outline-none focus:border-purple-500"
                  />

                  <label className="flex items-center gap-2 text-sm text-gray-600 mb-4">
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
                    className="w-full bg-gradient-primary text-white rounded-lg px-6 py-3 font-semibold hover:opacity-90 transition-opacity mb-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Logging in...' : 'Log In'}
                  </button>

                  <div className="text-center text-sm mb-4">
                    <span className="text-gray-600">Don't have an account? </span>
                    <a href="/signup" className="text-purple-600 hover:underline font-semibold">
                      Sign Up
                    </a>
                  </div>
                </form>
              </div>

              {/* Left Side - Image - Desktop only */}
              <div className="hidden lg:flex flex-1">
                <div className="bg-purple-100 p-7 w-full flex items-center justify-center h-full">
                  <div className="text-left ml-8">
                    <h2 className="text-5xl font-bold text-black mb-2">
                      ehr<span className="text-emerald-600">chain</span>
                    </h2>
                    <p className="text-2xl text-gray-700 font-semibold mb-4">Welcome Back!</p>
                    <p className="text-gray-600 text-sm mb-6">Login to access your patient chart and verified history</p>
                    <img
                      src={patientImage}
                      alt="Patient"
                      className="w-full h-auto max-h-72"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Provider Login Form */}
          {userType === 'hospital' && (
            <div className="flex flex-col lg:flex-row-reverse items-stretch gap-0 bg-white lg:rounded-3xl lg:shadow-lg overflow-hidden border lg:border-0 border-gray-300 lg:border-none">
              {/* Right Side - Image - Desktop only */}
              <div className="hidden lg:flex flex-1">
                <div className="bg-purple-100 p-8 w-full flex items-center justify-center h-full">
                  <div className="text-left ml-8">
                    <h2 className="text-5xl font-bold text-black mb-2">
                      ehr<span className="text-emerald-600">chain</span>
                    </h2>
                    <p className="text-2xl text-gray-700 font-semibold mb-2">Welcome to Hospital Portal</p>
                    <p className="text-gray-600 text-sm mb-8">Login to manage patient records and clinical attestations</p>
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
                <form onSubmit={handleHospitalLogin} className="p-8">
                  {/* Image inside form - Mobile only */}
                  <div className="lg:hidden flex items-center justify-center mb-6">
                    <img
                      src={hospitalImage}
                      alt="Hospital"
                      className="w-full h-auto max-w-xs"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>

                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Hospital Login</h2>
                  <p className="text-gray-600 text-sm mb-6">Enter your account details to manage records</p>

                  {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                      {error}
                    </div>
                  )}

                  {verificationRole === 'hospital' && (
                    <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg mb-4 text-sm">
                      <p className="font-semibold mb-2">Didn't get the verification email?</p>
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

                  <input
                    type="text"
                    name="email"
                    placeholder="Username or Email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm mb-4 focus:outline-none focus:border-purple-500"
                  />

                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
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
                    {loading ? 'Logging in...' : 'Log In'}
                  </button>

                  <div className="text-center text-sm mb-6">
                    <span className="text-gray-600">Don't have an account? </span>
                    <a href="/signup?role=hospital" className="text-purple-600 hover:underline font-semibold">
                      Sign Up
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
