import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Card from '../../components/Card'
import PatientHeader from '../../components/PatientHeader'
import { patientAPI, verifyAPI } from '../../services/api'
import RecordPdfRenderer from '../../components/RecordPdfRenderer'
import { generateRecordPdfBlob } from '../../utils/recordPdf'

export default function PatientHistory() {
  const { patientId } = useParams() // For public record view
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isOwnPortfolio, setIsOwnPortfolio] = useState(false)
  const [showAllCertificates, setShowAllCertificates] = useState(false)
  const [careerInsightsExpanded, setCareerInsightsExpanded] = useState(false)
  const [institutionsExpanded, setInstitutionsExpanded] = useState(false)
  
  const [patientData, setPatientData] = useState({
    name: '',
    patientId: '',
    email: '',
    totalRecords: 0,
    blockchainVerified: 0,
    hospitals: 0,
    activeCertificates: 0,
    profilePhotoUrl: null,
    cvUrl: null,
    githubUrl: null
  })

  const [records, setRecords] = useState([])
  const [hospitals, setHospitals] = useState([])
  const [careInsights, setCareInsights] = useState(null)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const [pdfCertificate, setPdfCertificate] = useState(null)
  const templateRef = useRef(null)

  useEffect(() => {
    loadPortfolioData()
  }, [patientId])

  const loadPortfolioData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Check if viewing own record or public record
      const patientToken = localStorage.getItem('patientToken')
      const isPublic = !!patientId

      if (isPublic) {
        // Load public record data
        try {
          const response = await verifyAPI.getUserCertificates(patientId)
          const { patient, records: certs, careerInsights: insights } = response.data
        
        setPatientData({
          name: patient.fullName || patient.full_name,
          patientId: patient.patientId || patient.patient_id,
          email: patient.email,
          totalRecords: certs.length,
          blockchainVerified: certs.filter(c => c.blockchain_tx_hash).length,
          hospitals: new Set(certs.map(c => c.hospital_id)).size,
          activeRecords: certs.filter(c => !c.expiry_date || new Date(c.expiry_date) > new Date()).length,
          profilePhotoUrl: patient.profilePhotoUrl || patient.profile_photo_url,
          cvUrl: patient.cvUrl || patient.cv_url,
          githubUrl: patient.githubUrl || patient.github_url
        })
        
        setRecords(certs)
        
        // Set care insights if available from backend
        if (insights) {
          setCareInsights(insights)
        }
        
        // Calculate institutions
        const instMap = {}
        certs.forEach(cert => {
          if (!instMap[cert.hospital_id]) {
            instMap[cert.hospital_id] = {
              name: cert.institute_name,
              certificateCount: 0,
              logo_url: cert.logo_url
            }
          }
          instMap[cert.hospital_id].certificateCount++
        })
        setHospitals(Object.values(instMap))
        
        setIsOwnPortfolio(false)
        } catch (err) {
          if (err.response?.status === 403) {
            setError('This record is private and cannot be viewed publicly')
          } else {
            setError(err.response?.data?.error || 'Failed to load record')
          }
          setLoading(false)
          return
        }
      } else if (patientToken) {
        // Load authenticated patient's full record
        const dashboardResponse = await patientAPI.getDashboard()
        const { patient, records: certs, statistics, institutions: insts } = dashboardResponse.data
        
        setPatientData({
          name: patient.full_name,
          patientId: patient.patientId,
          email: patient.email,
          totalRecords: statistics.totalCertificates,
          blockchainVerified: statistics.blockchainVerifiedCount,
          hospitals: statistics.institutionsCount,
          activeRecords: statistics.activeCertificatesCount,
          profilePhotoUrl: patient.profile_photo_url,
          cvUrl: patient.cv_url,
          githubUrl: patient.github_url
        })
        
        setRecords(certs)
        setHospitals(insts)
        setIsOwnPortfolio(true)
        
        // Load care insights
        try {
          const insightsResponse = await patientAPI.getCareerInsights(false)
          setCareInsights(insightsResponse.data.insights)
        } catch (err) {
          console.log('Care insights not available:', err.message)
        }
      } else {
        navigate('/login')
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to load record')
    } finally {
      setLoading(false)
    }
  }

  const regenerateCareerInsights = async () => {
    try {
      setLoading(true)
      const response = await patientAPI.getCareerInsights(true)
      setCareerInsights(response.data.insights)
    } catch (err) {
      setError('Failed to regenerate care insights')
    } finally {
      setLoading(false)
    }
  }

  const copyPortfolioLink = () => {
    const link = `${window.location.origin}/public-record/${patientData.patientId}`
    navigator.clipboard.writeText(link)
    alert('Record link copied to clipboard!')
  }

  // Get displayed records based on mobile view
  const getDisplayedCertificates = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768 && !showAllCertificates) {
      return records.slice(0, 2)
    }
    return records
  }

  const buildCertificateData = (cert) => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'
    const serverUrl = baseUrl.replace(/\/api\/?$/, '')
    const rawLogoUrl = cert.logo_url || null
    const logoUrl = rawLogoUrl
      ? rawLogoUrl.startsWith('http')
        ? rawLogoUrl
        : `${serverUrl}${rawLogoUrl}`
      : null

    return {
      recordId: cert.record_id,
      patientName: patientData.name || cert.patient_name || cert.full_name,
      diagnosis: cert.certificate_title || cert.diagnosis || cert.course_name,
      instituteName: cert.institute_name,
      recordDate: cert.record_date,
      grade: cert.grade,
      instituteLogoUrl: logoUrl
    }
  }

  const openCertificatePdf = async (cert) => {
    setPdfCertificate(buildCertificateData(cert))

    const waitForTemplate = async () => {
      for (let i = 0; i < 10; i += 1) {
        if (templateRef.current) {
          return true
        }
        await new Promise((resolve) => requestAnimationFrame(resolve))
      }
      return false
    }

    setIsGeneratingPdf(true)
    try {
      const ready = await waitForTemplate()
      if (!ready) {
        return
      }

      const blob = await generateRecordPdfBlob(templateRef.current)
      if (!blob) {
        return
      }

      const url = URL.createObjectURL(blob)
      window.open(url, '_self')
      window.setTimeout(() => URL.revokeObjectURL(url), 30000)
    } catch (error) {
      console.error('Failed to generate record PDF:', error)
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {!patientId && <PatientHeader />}
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 font-medium">Loading record history...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        {!patientId && <PatientHeader />}
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-700 font-semibold">Error Loading Record History</p>
            <p className="text-red-600 text-sm mt-2">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Navigation - only show if authenticated */}
        {!patientId && <PatientHeader />}

        <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-3xl p-6 md:p-12 text-center mb-8 shadow-xl">
          <div className="flex justify-center mb-4 md:mb-6">
            <div className="w-24 h-24 md:w-32 md:h-32 bg-white rounded-full flex items-center justify-center text-4xl md:text-6xl shadow-lg overflow-hidden">
              {patientData.profilePhotoUrl ? (
                <img 
                  src={`${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:3001'}${patientData.profilePhotoUrl}`}
                  alt={patientData.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{patientData.name.charAt(0).toUpperCase()}</span>
              )}
            </div>
          </div>
          <h1 className="text-2xl md:text-4xl font-bold text-white mb-2">{patientData.name}</h1>
          <p className="text-base md:text-xl text-purple-100 mb-2 md:mb-4">Verified Health History</p>
          <p className="text-xs md:text-sm text-purple-200">Patient ID: {patientData.patientId}</p>
          
          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center gap-2 md:gap-3 mt-4 md:mt-6">
            {isOwnPortfolio && (
              <>
                <button 
                  onClick={() => navigate('/patient/dashboard')}
                  className="bg-white text-purple-600 px-4 md:px-6 py-2 md:py-3 rounded-lg text-sm md:text-base font-bold hover:bg-purple-50 transition-all shadow-md inline-flex items-center gap-2"
                >
                  <span className="material-icons text-sm md:text-base">dashboard</span>
                  <span className="hidden md:inline">Dashboard</span>
                </button>
                <button 
                  onClick={copyPortfolioLink}
                  className="bg-white text-purple-600 px-4 md:px-6 py-2 md:py-3 rounded-lg text-sm md:text-base font-bold hover:bg-purple-50 transition-all shadow-md inline-flex items-center gap-2"
                >
                  <span className="material-icons text-sm md:text-base">link</span>
                  <span className="hidden md:inline">Share My Record</span>
                </button>
              </>
            )}
            
            {patientData.githubUrl && (
              <a
                href={patientData.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gray-800 text-white px-4 md:px-6 py-2 md:py-3 rounded-lg text-sm md:text-base font-bold hover:bg-gray-900 transition-all shadow-md inline-flex items-center gap-2"
              >
                <span className="material-icons text-sm md:text-base">water_drop</span>
                <span className="hidden md:inline">Blood Group Info</span>
              </a>
            )}
            
            {patientData.cvUrl && (
              <a
                href={`${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:3001'}${patientData.cvUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-600 text-white px-4 md:px-6 py-2 md:py-3 rounded-lg text-sm md:text-base font-bold hover:bg-blue-700 transition-all shadow-md inline-flex items-center gap-2"
              >
                <span className="material-icons text-sm md:text-base">history_edu</span>
                <span className="hidden md:inline">Medical History</span>
              </a>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
          <Card className="bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl md:rounded-2xl p-4 md:p-6 text-center border-2 border-purple-300">
            <div className="mb-1 md:mb-2"><span className="material-icons text-purple-600" style={{fontSize: '1.5rem'}}>image</span></div>
            <div className="text-xl md:text-3xl font-bold text-purple-800 mb-1">{patientData.totalRecords}</div>
            <div className="text-xs md:text-sm font-semibold text-purple-700">Total Records</div>
          </Card>

          <Card className="bg-gradient-to-br from-green-100 to-green-200 rounded-xl md:rounded-2xl p-4 md:p-6 text-center border-2 border-green-300">
            <div className="mb-1 md:mb-2"><span className="material-icons text-green-600" style={{fontSize: '1.5rem'}}>check_circle</span></div>
            <div className="text-xl md:text-3xl font-bold text-green-800 mb-1">{patientData.blockchainVerified}</div>
            <div className="text-xs md:text-sm font-semibold text-green-700">Verified</div>
          </Card>

          <Card className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl md:rounded-2xl p-4 md:p-6 text-center border-2 border-blue-300">
            <div className="mb-1 md:mb-2"><span className="material-icons text-blue-600" style={{fontSize: '1.5rem'}}>account_balance</span></div>
            <div className="text-xl md:text-3xl font-bold text-blue-800 mb-1">{patientData.hospitals}</div>
            <div className="text-xs md:text-sm font-semibold text-blue-700">Hospitals</div>
          </Card>

          <Card className="bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl md:rounded-2xl p-4 md:p-6 text-center border-2 border-orange-300">
            <div className="mb-1 md:mb-2"><span className="material-icons text-orange-600" style={{fontSize: '1.5rem'}}>bolt</span></div>
            <div className="text-xl md:text-3xl font-bold text-orange-800 mb-1">{patientData.activeRecords}</div>
            <div className="text-xs md:text-sm font-semibold text-orange-700">Active</div>
          </Card>
        </div>

        {/* Records Section */}
        <div className="mb-12">
          <h2 className="text-xl md:text-2xl font-bold text-purple-600 mb-4 md:mb-6 flex items-center gap-2">
            <span className="material-icons">menu_book</span> Records
          </h2>
          {records.length === 0 ? (
            <Card className="bg-gray-100 rounded-2xl p-8 md:p-12 text-center">
              <p className="text-gray-500 text-base md:text-lg">No records yet</p>
            </Card>
          ) : (
            <>
            <div className="space-y-3 md:space-y-4">
              {getDisplayedCertificates().map((cert) => {
                const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'
                const serverUrl = baseUrl.replace('/api', '')
                const logoUrl = cert.logo_url ? `${serverUrl}${cert.logo_url}` : null
                
                return (
                <Card key={cert.record_id} className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 shadow-md hover:shadow-lg transition-shadow border border-gray-200">
                  <div className="flex justify-between items-start mb-3 md:mb-4">
                    <div className="flex-1">
                      <h3 className="text-base md:text-lg font-bold text-gray-800">{cert.diagnosis || cert.course_name}</h3>
                      <p className="text-xs md:text-sm text-gray-600">{cert.institute_name}</p>
                    </div>
                    {logoUrl && (
                      <img
                        src={logoUrl}
                        alt={cert.institute_name}
                        className="w-12 h-12 md:w-16 md:h-16 object-contain rounded-lg border border-gray-200 ml-2 md:ml-4"
                      />
                    )}
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 md:gap-2 mb-3 md:mb-4">
                    <span className="bg-purple-100 text-purple-700 text-xs font-semibold px-3 py-1.5 rounded-md flex items-center gap-1">
                      <span className="material-icons" style={{fontSize: '14px'}}>event</span> {new Date(cert.record_date).toLocaleDateString()}
                    </span>
                    {cert.status && (
                      <span className="bg-yellow-100 text-yellow-700 text-xs font-semibold px-3 py-1.5 rounded-md flex items-center gap-1">
                        <span className="material-icons" style={{fontSize: '14px'}}>star</span> Status: {cert.status}
                      </span>
                    )}
                    {cert.blockchain_tx_hash && (
                      <span className="bg-green-100 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-md flex items-center gap-1">
                        <span className="material-icons" style={{fontSize: '14px'}}>check_circle</span> Blockchain Verified
                      </span>
                    )}
                    {cert.expiry_date && (
                      <span className="bg-orange-100 text-orange-700 text-xs font-semibold px-3 py-1.5 rounded-md flex items-center gap-1">
                        <span className="material-icons" style={{fontSize: '14px'}}>calendar_today</span> Next Review {new Date(cert.expiry_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {/* Blockchain Transaction Hash */}
                  {cert.blockchain_tx_hash && (
                    <div className="mb-3 md:mb-4 bg-gray-50 rounded-lg p-2 md:p-3 border border-gray-200">
                      <p className="text-xs text-gray-600 font-semibold mb-1">Blockchain Transaction:</p>
                      <a 
                        href={`https://amoy.polygonscan.com/tx/${cert.blockchain_tx_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-800 font-mono break-all underline flex items-center gap-1"
                      >
                        <span className="material-icons" style={{fontSize: '14px'}}>link</span> {cert.blockchain_tx_hash}
                      </a>
                    </div>
                  )}

                  {/* Action Button */}
                  <div className="flex">
                    <button
                      onClick={() => openCertificatePdf(cert)}
                      disabled={isGeneratingPdf}
                      className="bg-purple-600 text-white text-xs md:text-sm font-semibold px-3 md:px-4 py-2 rounded-lg flex items-center gap-1 md:gap-2 hover:bg-purple-700 transition-colors disabled:opacity-60"
                    >
                      <span className="material-icons text-sm">description</span>
                      <span className="hidden sm:inline">View HealthRecord</span>
                      <span className="sm:hidden">View</span>
                    </button>
                  </div>
                </Card>
              )})}
            </div>
            {/* Show More Button - Mobile Only */}
            {records.length > 2 && (
              <div className="md:hidden mt-4 text-center">
                <button
                  onClick={() => setShowAllCertificates(!showAllCertificates)}
                  className="bg-purple-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-purple-700 transition-colors inline-flex items-center gap-2"
                >
                  <span className="material-icons text-sm">{showAllCertificates ? 'expand_less' : 'expand_more'}</span>
                  {showAllCertificates ? 'Show Less' : `Show All (${records.length})`}
                </button>
              </div>
            )}
            </>
          )}
        </div>

        {/* Institutions Grid */}
        {institutions.length > 0 && (
          <div className="mb-12">
            {/* Desktop View */}
            <div className="hidden md:block">
              <h2 className="text-2xl font-bold text-purple-600 mb-6 flex items-center gap-2">
                <span className="material-icons">account_balance</span> Hospitals & Clinics
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {institutions.map((inst, index) => {
                const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'
                const serverUrl = baseUrl.replace('/api', '')
                const logoUrl = inst.logo_url ? `${serverUrl}${inst.logo_url}` : null
                
                return (
                <Card key={index} className="bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl p-8 text-center text-white shadow-lg hover:shadow-xl transition-shadow">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt={inst.name || inst.institute_name}
                      className="w-20 h-20 object-contain rounded-lg mx-auto mb-4 bg-white p-2"
                    />
                  ) : (
                    <div className="mb-4"><span className="material-icons text-purple-600" style={{fontSize: '3rem'}}>local_hospital</span></div>
                  )}
                  <h3 className="text-xl font-bold mb-2">{inst.name || inst.institute_name}</h3>
                  <p className="text-white/90">{inst.certificateCount} Records</p>
                </Card>
              )})}
            </div>
          </div>

            {/* Mobile Accordion View */}
            <div className="md:hidden">
              <button
                onClick={() => setInstitutionsExpanded(!institutionsExpanded)}
                className="w-full bg-white border-2 border-purple-300 rounded-xl p-4 mb-3 flex items-center justify-between hover:bg-purple-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="material-icons text-purple-600">account_balance</span>
                  <h2 className="text-lg font-bold text-purple-600">Hospitals ({institutions.length})</h2>
                </div>
                <span className="material-icons text-purple-600">{institutionsExpanded ? 'expand_less' : 'expand_more'}</span>
              </button>
              {institutionsExpanded && (
                <div className="space-y-3 mb-6">
                  {institutions.map((inst, index) => {
                    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'
                    const serverUrl = baseUrl.replace('/api', '')
                    const logoUrl = inst.logo_url ? `${serverUrl}${inst.logo_url}` : null
                    
                    return (
                      <Card key={index} className="bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl p-6 flex items-center gap-4 text-white shadow-md">
                        {logoUrl ? (
                          <img
                            src={logoUrl}
                            alt={inst.name || inst.institute_name}
                            className="w-16 h-16 object-contain rounded-lg bg-white p-2 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="material-icons text-purple-600" style={{fontSize: '2rem'}}>local_hospital</span>
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="text-base font-bold mb-1">{inst.name || inst.institute_name}</h3>
                          <p className="text-sm text-white/90">{inst.certificateCount} Records</p>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Care Insights Section - Desktop View */}
        {careInsights && (
          <Card className="hidden md:block bg-white border-2 border-purple-300 rounded-3xl p-8 mb-12 shadow-lg">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-bold text-purple-600 flex items-center gap-2">
                <span className="material-icons">smart_toy</span> AI Care Insights
              </h3>
              {isOwnPortfolio && (
                <button
                  onClick={regenerateCareerInsights}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-purple-700 transition-all flex items-center gap-2"
                >
                  <span className="material-icons text-sm">refresh</span> Regenerate
                </button>
              )}
            </div>

            {/* Summary */}
            {careInsights.summary && (
              <div className="mb-8">
                <h4 className="text-xl font-bold text-gray-800 mb-4 text-center">Health Summary</h4>
                <p className="text-gray-700 text-center leading-relaxed">
                  {careInsights.summary}
                </p>
              </div>
            )}

            {/* Risk Factors */}
            {careInsights.riskFactors && careInsights.riskFactors.length > 0 && (
              <div className="mb-8">
                <h4 className="text-xl font-bold text-gray-800 mb-6 text-center">Identified Risk Factors</h4>
                <div className="flex flex-wrap justify-center gap-3">
                  {careInsights.riskFactors.map((risk, index) => (
                    <div key={index} className="bg-red-100 text-red-700 rounded-lg px-6 py-3 text-center font-medium">
                      {risk}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Treatment Matches */}
            {careInsights.treatmentMatches && careInsights.treatmentMatches.length > 0 && (
              <div className="mb-8">
                <h4 className="text-xl font-bold text-gray-800 mb-6 text-center">Treatment Recommendations</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {careInsights.treatmentMatches.map((treatment, index) => (
                    <Card key={index} className="border-l-4 border-purple-500 bg-purple-50 p-6 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="font-bold text-gray-800">{treatment.title}</h5>
                        <span className="bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                          {treatment.matchPercentage}% Relevance
                        </span>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Recommended Actions */}
            {careInsights.recommendedActions && careInsights.recommendedActions.length > 0 && (
              <div>
                <h4 className="text-xl font-bold text-gray-800 mb-6 text-center">Recommended Actions</h4>
                <div className="space-y-4">
                  {careInsights.recommendedActions.map((action, index) => (
                    <Card key={index} className="border-l-4 border-green-500 bg-green-50 p-6 rounded-lg">
                      <div className="flex items-start gap-3">
                        <span className="material-icons text-2xl">{action.completed ? 'check_circle' : 'push_pin'}</span>
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 font-semibold mb-1">{action.step}</p>
                          <h5 className="font-bold text-gray-800 mb-2">{action.title}</h5>
                          <p className="text-sm text-gray-700">{action.description}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            
            {careInsights.generatedAt && (
              <p className="text-xs text-gray-500 text-center mt-6">
                Generated on {new Date(careInsights.generatedAt).toLocaleString()}
              </p>
            )}
          </Card>
        )}

        {/* Care Insights Section - Mobile Accordion View */}
        {careInsights && (
          <div className="md:hidden mb-12">
            <button
              onClick={() => setCareerInsightsExpanded(!careerInsightsExpanded)}
              className="w-full bg-white border-2 border-purple-300 rounded-xl p-4 mb-3 flex items-center justify-between hover:bg-purple-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="material-icons text-purple-600">smart_toy</span>
                <h2 className="text-lg font-bold text-purple-600">Care Insights</h2>
              </div>
              <span className="material-icons text-purple-600">{careerInsightsExpanded ? 'expand_less' : 'expand_more'}</span>
            </button>
            {careerInsightsExpanded && (
              <Card className="bg-white border-2 border-purple-300 rounded-xl p-4 shadow-lg">
                {isOwnPortfolio && (
                  <button
                    onClick={regenerateCareerInsights}
                    className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-purple-700 transition-all mb-4 flex items-center justify-center gap-2"
                  >
                    <span className="material-icons text-sm">refresh</span> Regenerate
                  </button>
                )}

                {/* Summary */}
                {careInsights.summary && (
                  <div className="mb-6">
                    <h4 className="text-base font-bold text-gray-800 mb-2 text-center">Health Summary</h4>
                    <p className="text-sm text-gray-700 text-center leading-relaxed">
                      {careInsights.summary}
                    </p>
                  </div>
                )}

                {/* Risk Factors */}
                {careInsights.riskFactors && careInsights.riskFactors.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-base font-bold text-gray-800 mb-3 text-center">Risk Factors</h4>
                    <div className="flex flex-wrap justify-center gap-2">
                      {careInsights.riskFactors.map((risk, index) => (
                        <div key={index} className="bg-red-100 text-red-700 rounded-lg px-4 py-2 text-xs font-medium">
                          {risk}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Treatment Matches */}
                {careInsights.treatmentMatches && careInsights.treatmentMatches.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-base font-bold text-gray-800 mb-3 text-center">Recommendations</h4>
                    <div className="space-y-2">
                      {careInsights.treatmentMatches.map((treatment, index) => (
                        <Card key={index} className="border-l-4 border-purple-500 bg-purple-50 p-4 rounded-lg">
                          <div className="flex justify-between items-start">
                            <h5 className="text-sm font-bold text-gray-800">{treatment.title}</h5>
                            <span className="bg-purple-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                              {treatment.matchPercentage}%
                            </span>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Next Steps */}
                {careInsights.recommendedActions && careInsights.recommendedActions.length > 0 && (
                  <div>
                    <h4 className="text-base font-bold text-gray-800 mb-3 text-center">Recommended Actions</h4>
                    <div className="space-y-3">
                      {careInsights.recommendedActions.map((action, index) => (
                        <Card key={index} className="border-l-4 border-green-500 bg-green-50 p-3 rounded-lg">
                          <div className="flex items-start gap-2">
                            <span className="material-icons text-lg">{action.completed ? 'check_circle' : 'push_pin'}</span>
                            <div className="flex-1">
                              <p className="text-xs text-gray-500 font-semibold mb-0.5">{action.step}</p>
                              <h5 className="text-sm font-bold text-gray-800 mb-1">{action.title}</h5>
                              <p className="text-xs text-gray-700">{action.description}</p>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
                
                {careInsights.generatedAt && (
                  <p className="text-xs text-gray-500 text-center mt-4">
                    Generated on {new Date(careInsights.generatedAt).toLocaleString()}
                  </p>
                )}
              </Card>
            )}
          </div>
        )}

        {/* Generate Care Insights Button (for authenticated users without insights) */}
        {isOwnPortfolio && !careInsights && records.length > 0 && (
          <Card className="bg-gradient-to-r from-purple-100 to-blue-100 border-2 border-purple-300 rounded-2xl md:rounded-3xl p-6 md:p-12 text-center mb-12">
            <div className="mb-4"><span className="material-icons text-purple-600" style={{fontSize: '3.5rem'}}>smart_toy</span></div>
            <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-3 md:mb-4">Get AI Care Insights</h3>
            <p className="text-sm md:text-base text-gray-700 mb-4 md:mb-6 max-w-2xl mx-auto">
              Let our AI analyze your health records and provide personalized wellness recommendations, 
              risk factor analysis, and next steps for your health journey.
            </p>
            <button
              onClick={regenerateCareerInsights}
              className="bg-purple-600 text-white px-6 md:px-8 py-3 md:py-4 rounded-lg text-base md:text-lg font-bold hover:bg-purple-700 transition-all shadow-md"
            >
              Generate Care Insights
            </button>
          </Card>
        )}
        </div>
      </div>
      <RecordPdfRenderer record={pdfCertificate} templateRef={templateRef} />
    </>
  )
}
