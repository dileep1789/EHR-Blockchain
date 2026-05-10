import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function AdminHeader({ title, subtitle, showLogout = true }) {
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    navigate('/admin/login')
  }
  return (
    <header className="bg-white rounded-2xl shadow-[0_10px_22px_rgba(0,0,0,0.08)] px-5 sm:px-8 py-4 sm:py-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-gray-800">{title}</h1>
            <p className="text-xs sm:text-sm text-gray-500">{subtitle}</p>
          </div>
        </div>

        {showLogout && (
          <div>
            <button onClick={handleLogout} className="bg-purple-600 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm hover:bg-purple-700 transition-colors">Log Out</button>
          </div>
        )}
    </header>
  )
}
