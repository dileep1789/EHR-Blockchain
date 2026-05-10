import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import logoImage from '../assets/images/logo.webp'
import { clearAllTokens } from '../services/api'

export default function PatientHeader() {
  const navigate = useNavigate()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    clearAllTokens()
    navigate('/login')
  }

  return (
    <header className="bg-gradient-primary text-white">
      <div className="max-w-[1248px] mx-auto flex items-center justify-between gap-3 px-3 md:px-4 py-3">
        {/* Logo/Brand */}
        <div className="flex items-center">
          <Link to="/" className="inline-flex items-center">
            <span className="text-xl font-bold text-white tracking-tight">EHR<span className="text-emerald-400">Chain</span></span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            to="/patient/history"
            className="text-white no-underline font-medium hover:opacity-90 transition-opacity"
          >
            MY HISTORY
          </Link>
          <button
            onClick={handleLogout}
            className="bg-white text-purple-600 font-semibold px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            LOG OUT
          </button>
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
          aria-label="Toggle menu"
        >
          <span className="material-icons">{isMobileMenuOpen ? 'close' : 'menu'}</span>
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-purple-700 border-t border-white/10">
          <nav className="flex flex-col py-2">
            <Link
              to="/patient/history"
              className="text-white no-underline font-medium hover:bg-white/10 transition-colors px-4 py-3"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              MY HISTORY
            </Link>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false)
                handleLogout()
              }}
              className="text-white font-semibold hover:bg-white/10 transition-colors px-4 py-3 text-left"
            >
              LOG OUT
            </button>
          </nav>
        </div>
      )}
    </header>
  )
}
