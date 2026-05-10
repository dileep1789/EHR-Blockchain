import React, { useState, useEffect } from 'react'
import AdminHeader from '../../components/AdminHeader'
import { adminAPI } from '../../services/api'

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

export default function Hospitals() {
  const [hospitals, setHospitals] = useState([])
  const [issuerStatus, setIssuerStatus] = useState({})
  const [balances, setBalances] = useState({})
  const [actionLoading, setActionLoading] = useState({})
  const [copiedField, setCopiedField] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadHospitals()
  }, [])

  const loadHospitals = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await adminAPI.getHospitals()
      // Extract the array from response.data (could be nested in a property)
      let data = response.data
      if (!Array.isArray(data)) {
        // Try common property names
        data = data.hospitals || data.hospitals || data.data || data.results || []
      }
      setHospitals(data)
      // Check on-chain issuer status for each hospital
      data.forEach(hospital => {
        if (hospital.wallet_address) {
          checkIssuerStatus(hospital.hospital_id)
        }
      })
      fetchBalances(data)
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to load hospitals')
    } finally {
      setLoading(false)
    }
  }

  const checkIssuerStatus = async (instituteId) => {
    try {
      const response = await adminAPI.getIssuerStatus(instituteId)
      setIssuerStatus(prev => ({
        ...prev,
        [instituteId]: response.data.isIssuer ? 'Issuer' : 'Not Issuer'
      }))
    } catch (err) {
      setIssuerStatus(prev => ({
        ...prev,
        [instituteId]: 'Error'
      }))
    }
  }

  const handleRevoke = async (hospital) => {
    const instituteId = hospital.hospital_id
    if (!instituteId) return
    const confirmed = window.confirm(`Revoke issuer access for "${hospital.hospital_name || 'this hospital'}"?`)
    if (!confirmed) return

    try {
      setActionLoading(prev => ({ ...prev, [instituteId]: true }))
      await adminAPI.revokeHospital(instituteId, { reason: 'Revoked by admin' })
      setHospitals(prev => prev.map(item => (
        item.hospital_id === instituteId
          ? { ...item, verification_status: 'rejected' }
          : item
      )))
      setIssuerStatus(prev => ({ ...prev, [instituteId]: 'Not Issuer' }))
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to revoke hospital')
    } finally {
      setActionLoading(prev => ({ ...prev, [instituteId]: false }))
      setActionLoading(prev => ({ ...prev, [hospitalId]: false }))
    }
  }

  const handleApprove = async (hospital) => {
    const instituteId = hospital.hospital_id
    if (!instituteId) return
    const confirmed = window.confirm(`Re-approve "${hospital.hospital_name || 'this hospital'}"?`)
    if (!confirmed) return

    try {
      setActionLoading(prev => ({ ...prev, [instituteId]: true }))
      await adminAPI.approveHospital(instituteId, { notes: 'Re-approved by admin' })
      setHospitals(prev => prev.map(item => (
        item.hospital_id === instituteId
          ? { ...item, verification_status: 'approved' }
          : item
      )))
      await checkIssuerStatus(instituteId)
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to approve hospital')
    } finally {
      setActionLoading(prev => ({ ...prev, [instituteId]: false }))
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

  const copyToClipboard = async (value, key) => {
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
      setCopiedField(key)
      setTimeout(() => setCopiedField(''), 1200)
    } catch (err) {
      // no-op: clipboard may be blocked by browser permissions
    }
  }

  const resolveFileUrl = (path) => {
    if (!path) return null
    if (path.startsWith('http://') || path.startsWith('https://')) return path
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'
    const fileBaseUrl = apiBaseUrl.replace(/\/api\/?$/, '')
    return `${fileBaseUrl}${path}`
  }

  const fetchBalances = async (data) => {
    const withWallets = data.filter(item => item.wallet_address)
    if (withWallets.length === 0) return

    const requests = await Promise.all(withWallets.map(async (hospital) => {
      try {
        const response = await adminAPI.getBalance(hospital.wallet_address)
        const balancePol = response.data?.data?.balancePol ?? response.data?.balancePol ?? null
        return [hospital.hospital_id, balancePol]
      } catch (err) {
        return [hospital.hospital_id, 'Error']
      }
    }))

    setBalances(prev => {
      const next = { ...prev }
      requests.forEach(([id, value]) => {
        next[id] = value
      })
      return next
    })
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <AdminHeader title="Manage Hospitals" subtitle="Loading..." showLogout={false} />
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6d34d6] mx-auto"></div>
            <p className="mt-4 text-gray-600">Fetching hospitals...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <AdminHeader title="Manage Hospitals" subtitle="Error loading data" showLogout={false} />
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700 mt-6">
          <p className="font-bold text-lg">Error Loading Hospitals</p>
          <p className="text-sm mt-2">{error}</p>
          <button onClick={loadHospitals} className="mt-4 bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 font-semibold">
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <AdminHeader
        title="Manage Hospitals"
        subtitle="View all registered hospitals and manage their issuer status"
        showLogout={false}
      />

      <div className="mt-6 bg-white rounded-2xl shadow-[0_10px_22px_rgba(0,0,0,0.08)] px-6 py-5 overflow-x-auto transition-transform duration-200 hover:scale-[1.01]">
        {hospitals.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No hospitals found</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm table-auto">
            <thead className="text-gray-600">
              <tr className="border-b border-gray-300">
                <th className="px-4 py-3 font-semibold">Hospital Name</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Logo</th>
                <th className="px-4 py-3 font-semibold">Wallet Address</th>
                <th className="px-4 py-3 font-semibold">Balance (POL)</th>
                <th className="px-4 py-3 font-semibold">On-chain Issuer</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Registered</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {hospitals.map((hospital) => (
                <tr key={hospital.hospital_id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-4 font-medium text-gray-900">{hospital.hospital_name || hospital.institute_name || '-'}</td>
                  <td className="px-4 py-4 text-gray-600">
                    {hospital.email ? (
                      <button
                        type="button"
                        onClick={() => copyToClipboard(hospital.email, `email-${hospital.hospital_id}`)}
                        className="inline-flex items-center gap-1 text-left hover:text-[#6d34d6] cursor-pointer break-all"
                        title="Click to copy email"
                      >
                        <span>{copiedField === `email-${hospital.hospital_id}` ? 'Copied' : hospital.email}</span>
                        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                      </button>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-4">
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
                  <td className="px-4 py-4 font-mono text-xs text-gray-600">
                    {hospital.wallet_address ? (
                      <button
                        type="button"
                        onClick={() => copyToClipboard(hospital.wallet_address, `wallet-${hospital.hospital_id}`)}
                        className="inline-flex items-center gap-1 text-left hover:text-[#6d34d6] cursor-pointer"
                        title={hospital.wallet_address}
                      >
                        <span>{copiedField === `wallet-${hospital.hospital_id}`
                          ? 'Copied'
                          : truncateAddress(hospital.wallet_address)}</span>
                        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                      </button>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-4 text-gray-600">
                    {balances[hospital.hospital_id] === undefined
                      ? 'Loading...'
                      : balances[hospital.hospital_id] === 'Error'
                        ? 'Error'
                        : String(balances[hospital.hospital_id])}
                  </td>
                  <td className="px-4 py-4 text-gray-600">
                    {issuerStatus[hospital.hospital_id] || 'Loading...'}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      hospital.verification_status === 'approved' 
                        ? 'bg-green-100 text-green-700' 
                        : hospital.verification_status === 'pending'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {hospital.verification_status?.charAt(0).toUpperCase() + hospital.verification_status?.slice(1) || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-gray-600">{formatDate(hospital.created_at)}</td>
                  <td className="px-4 py-4">
                    {hospital.verification_status === 'approved' ? (
                      <button
                        onClick={() => handleRevoke(hospital)}
                        disabled={actionLoading[hospital.hospital_id]}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-red-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 6L6 18" />
                          <path d="M6 6l12 12" />
                        </svg>
                        {actionLoading[hospital.hospital_id] ? 'Revoking...' : 'Revoke'}
                      </button>
                    ) : hospital.verification_status === 'rejected' ? (
                      <button
                        onClick={() => handleApprove(hospital)}
                        disabled={actionLoading[hospital.hospital_id]}
                        className="bg-green-500 text-white px-4 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-green-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 6l-11 11-5-5" />
                        </svg>
                        {actionLoading[hospital.hospital_id] ? 'Approving...' : 'Re-Approve'}
                      </button>
                    ) : (
                      <span className="text-gray-400 text-sm">N/A</span>
                    )}
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
