import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import logoImage from '../../assets/images/logo.webp'
import { contactAPI } from '../../services/api'

export default function ContactUs() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError('')
    setSuccessMessage('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')

    // Validation
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      setError('All fields are required')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address')
      return
    }

    if (formData.message.length < 10) {
      setError('Message must be at least 10 characters long')
      return
    }

    try {
      setLoading(true)
      await contactAPI.sendContactMessage(formData)
      
      setSuccessMessage('Thank you for contacting us! Your message has been sent to our admin and a copy has been sent to your email. We will respond soon.')
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
      })
      
      setTimeout(() => {
        navigate('/')
      }, 3000)
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to send message. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 bg-certi-repeat flex flex-col">
      <Navbar />

      <div className="flex-1 flex items-center justify-center py-10 px-4">
        <div className="w-full max-w-2xl">
          <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-primary p-8 md:p-12">
              <div className="flex items-center gap-4 mb-6">
                <img src={logoImage} alt="ChainMed" className="h-10 md:h-12 w-auto" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Contact Us</h1>
              <p className="text-white/90 text-sm md:text-base">
                We'd love to hear from you. Send us a message and we'll respond as soon as possible.
              </p>
            </div>

            {/* Form */}
            <div className="p-8 md:p-12">
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
                  {error}
                </div>
              )}

              {successMessage && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-6 text-sm">
                  {successMessage}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    autoComplete="name"
                    placeholder="Your name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    placeholder="your.email@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Subject *
                  </label>
                  <input
                    type="text"
                    name="subject"
                    autoComplete="off"
                    placeholder="What is this about?"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    name="message"
                    autoComplete="off"
                    placeholder="Please tell us what's on your mind..."
                    value={formData.message}
                    onChange={handleChange}
                    rows="6"
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Minimum 10 characters
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-primary text-white rounded-lg px-6 py-3 font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending...' : 'Send Message'}
                </button>
              </form>

              <p className="text-center text-xs text-gray-500 mt-6">
                Your message will be sent to our admin team and a copy will be sent to your email address. We'll get back to you as soon as possible. Thank you for reaching out!
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}


