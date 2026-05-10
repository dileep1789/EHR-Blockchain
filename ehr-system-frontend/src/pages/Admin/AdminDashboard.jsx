import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminHeader from '../../components/AdminHeader'
import { adminAPI } from '../../services/api'

function StatCard({ title, value, accent }) {
  return (
    <div className="bg-white rounded-2xl px-6 py-5 shadow-[0_6px_16px_rgba(0,0,0,0.08)] text-center transition-transform duration-200 hover:scale-[1.02]">
      <div className="text-sm text-gray-500 font-semibold">{title}</div>
      <div className={`text-3xl font-extrabold mt-2 ${accent}`}>{value || '0'}</div>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await adminAPI.getDashboard()
      setStats(response.data.statistics)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <AdminHeader title="Admin Dashboard" subtitle="Loading..." />
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6d34d6]"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <AdminHeader title="Admin Dashboard" subtitle="Error loading data" />
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 mt-6">
          <p className="font-semibold">Error</p>
          <p className="text-sm">{error}</p>
          <button onClick={loadDashboard} className="mt-3 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <AdminHeader
        title="Admin Dashboard"
        subtitle="Manage Hospitals, approve registrations, and monitor system statistics"
      />

      <section className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        <StatCard title="Total Patients" value={stats?.totalPatients} accent="text-[#6d34d6]" />
        <StatCard title="Total Hospitals" value={stats?.totalHospitals} accent="text-[#6d34d6]" />
        <StatCard title="Pending Approval" value={stats?.pendingInstitutes} accent="text-amber-500" />
        <StatCard title="Approved" value={stats?.approvedHospitals} accent="text-[#6d34d6]" />
        <StatCard title="Total EHRs" value={stats?.totalRecords} accent="text-[#6d34d6]" />
      </section>

      <section className="mt-10 bg-white rounded-2xl shadow-[0_10px_22px_rgba(0,0,0,0.08)] px-8 py-6 transition-transform duration-200 hover:scale-[1.01]">
        <h3 className="text-lg sm:text-xl font-bold text-gray-900">Quick Actions</h3>
        <div className="h-px bg-gray-300 mt-3 mb-6" />
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => navigate('/admin/approvals')}
            className="w-full sm:w-auto bg-amber-500 text-white font-semibold px-6 py-3 rounded-xl shadow-sm flex items-center justify-center gap-2"
          >
            <span className="inline-flex">
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 3h12" />
                <path d="M6 21h12" />
                <path d="M8 5c0 4 8 4 8 8s-8 4-8 8" />
                <path d="M16 5c0 4-8 4-8 8s8 4 8 8" />
              </svg>
            </span>
            Review Pending Approvals
          </button>
          <button
            onClick={() => navigate('/admin/hospitals')}
            className="w-full sm:w-auto border border-gray-300 text-[#6d34d6] font-semibold px-6 py-3 rounded-xl flex items-center justify-center gap-2"
          >
            <span className="inline-flex">
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 10h18" />
                <path d="M5 10v8" />
                <path d="M9 10v8" />
                <path d="M15 10v8" />
                <path d="M19 10v8" />
                <path d="M2 20h20" />
                <path d="M12 3l9 5H3l9-5z" />
              </svg>
            </span>
            Manage Hospitals
          </button>
        </div>
      </section>
    </div>
  )
}
