import React, { useState, useEffect } from 'react'
import AdminHeader from '../../components/AdminHeader'
import { adminAPI, getAdminToken } from '../../services/api'

function ImagePlaceholder() {
  return (
    <div className="w-9 h-9 rounded-md border border-gray-400 flex items-center justify-center">
      <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8" cy="8" r="1.5" />
        <path d="M21 16l-5-5-4 4-2-2-5 5" />
      </svg>
    </div>
  )
}

export default function Pending() {
  const [hospitals, setHospitals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionLoading, setActionLoading] = useState({})
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    loadPendingHospitals()
  }, [])

  const loadPendingHospitals = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await adminAPI.getPendingHospitals()
      // Extract the array from response.data (could be nested in a property)
      let data = response.data
      if (!Array.isArray(data)) {
        // Try common property names
        data = data.hospitals || data.hospitals || data.data || data.results || []
      }
      setHospitals(data)
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to load pending hospitals')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (instituteId) => {
    try {
      setActionLoading(prev => ({ ...prev, [instituteId]: 'approve' }))
      await adminAPI.approveHospital(instituteId, { notes: 'Approved by admin' })
      setSuccessMessage('Hospital approved successfully!')
      setHospitals(hospitals.filter(i => i.hospital_id !== instituteId))
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to approve hospital')
    } finally {
      setActionLoading(prev => ({ ...prev, [instituteId]: null }))
    }
  }

  const handleReject = async (instituteId) => {
    try {
      setActionLoading(prev => ({ ...prev, [instituteId]: 'reject' }))
      await adminAPI.rejectHospital(instituteId, { reason: 'Rejected by admin' })
      setSuccessMessage('Hospital rejected successfully!')
      setHospitals(hospitals.filter(i => i.hospital_id !== instituteId))
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reject hospital')
    } finally {
      setActionLoading(prev => ({ ...prev, [instituteId]: null }))
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-US')
  }

  const truncateAddress = (address) => {
    if (!address) return '-'
    return address.substring(0, 10) + '...' + address.substring(address.length - 8)
  }

  const resolveFileUrl = (path) => {
    if (!path) return null
    if (path.startsWith('http://') || path.startsWith('https://')) return path
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'
    const fileBaseUrl = apiBaseUrl.replace(/\/api\/?$/, '')
    return `${fileBaseUrl}${path}`
  }

  const handleViewDoc = async (fileUrl) => {
    if (!fileUrl) return
    try {
      setError(null)
      const token = getAdminToken()
      const isSameOrigin = new URL(fileUrl, window.location.href).origin === window.location.origin
      if (!token || !isSameOrigin) {
        window.open(fileUrl, '_blank', 'noopener,noreferrer')
        return
      }
      const response = await fetch(fileUrl, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        throw new Error('Failed to load document')
      }

      const blob = await response.blob()
      const objectUrl = window.URL.createObjectURL(blob)
      window.open(objectUrl, '_blank', 'noopener,noreferrer')
      setTimeout(() => window.URL.revokeObjectURL(objectUrl), 1000)
    } catch (err) {
      window.open(fileUrl, '_blank', 'noopener,noreferrer')
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <AdminHeader title="Pending Approvals" subtitle="Loading..." showLogout={false} />
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6d34d6] mx-auto"></div>
            <p className="mt-4 text-gray-600">Fetching pending hospitals...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <AdminHeader title="Pending Approvals" subtitle="Error loading data" showLogout={false} />
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700 mt-6">
          <p className="font-bold text-lg">Error Loading Pending Hospitals</p>
          <p className="text-sm mt-2">{error}</p>
          <button onClick={loadPendingHospitals} className="mt-4 bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 font-semibold">
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <AdminHeader
        title="Pending Approvals"
        subtitle="Review and approve or reject hospital registration requests"
        showLogout={false}
      />

      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700 mt-6">
          <p className="font-semibold"><span className="material-icons text-sm text-green-600" style={{verticalAlign: 'middle'}}>check</span> {successMessage}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 mt-6">
          <p className="font-semibold">Error</p>
          <p className="text-sm">{error}</p>
          <button onClick={loadPendingHospitals} className="mt-3 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
            Retry
          </button>
        </div>
      )}

      <div className="mt-6 bg-white rounded-2xl shadow-[0_10px_22px_rgba(0,0,0,0.08)] px-6 py-5 overflow-x-auto transition-transform duration-200 hover:scale-[1.01]">
        {hospitals.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No pending hospitals for approval</p>
          </div>
        ) : (
          <table className="min-w-[1050px] w-full text-left text-sm">
            <thead className="text-gray-600">
              <tr className="border-b border-gray-300">
                <th className="py-3 font-semibold">Hospital Name</th>
                <th className="py-3 font-semibold">Email</th>
                <th className="py-3 font-semibold">Wallet Address</th>
                <th className="py-3 font-semibold">Logo</th>
                <th className="py-3 font-semibold">Verification Doc</th>
                <th className="py-3 font-semibold">Registered</th>
                <th className="py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {hospitals.map((hospital) => (
                <tr key={hospital.hospital_id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="py-4 font-medium text-gray-900">{hospital.hospital_name || hospital.institute_name || '-'}</td>
                  <td className="py-4 text-gray-600">{hospital.email || '-'}</td>
                  <td className="py-4 font-mono text-xs text-gray-600" title={hospital.wallet_address}>
                    {truncateAddress(hospital.wallet_address)}
                  </td>
                  <td className="py-4">
                    {hospital.logo_url ? (
                      <img
                        src={resolveFileUrl(hospital.logo_url)}
                        alt={`${hospital.institute_name || 'Hospital'} logo`}
                        className="w-9 h-9 rounded-md object-cover border border-gray-200"
                      />
                    ) : (
                      <ImagePlaceholder />
                    )}
                  </td>
                  <td className="py-4">
                    {resolveFileUrl(hospital.verification_doc_url || hospital.verification_doc) ? (
                      <button
                        type="button"
                        onClick={() => handleViewDoc(resolveFileUrl(hospital.verification_doc_url || hospital.verification_doc))}
                        className="text-blue-600 underline hover:text-blue-800"
                      >
                        View Doc
                      </button>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="py-4 text-gray-600">{formatDate(hospital.created_at)}</td>
                  <td className="py-4 space-y-2">
                    <button
                      onClick={() => handleApprove(hospital.hospital_id)}
                      disabled={!!actionLoading[hospital.hospital_id]}
                      className="w-full bg-green-500 text-white px-4 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-600 transition"
                    >
                      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6l-11 11-5-5" />
                      </svg>
                      {actionLoading[hospital.hospital_id] === 'approve' ? 'Approving...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => handleReject(hospital.hospital_id)}
                      disabled={!!actionLoading[hospital.hospital_id]}
                      className="w-full bg-red-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-700 transition"
                    >
                      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6L6 18" />
                        <path d="M6 6l12 12" />
                      </svg>
                      {actionLoading[hospital.hospital_id] === 'reject' ? 'Rejecting...' : 'Reject'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

