import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import verifyImage from '../../assets/images/verifyImage.webp'
import { verifyAPI } from '../../services/api'
import RecordPdfRenderer from '../../components/RecordPdfRenderer'
import { generateRecordPdfBlob } from '../../utils/recordPdf'

export default function VerifyPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [recordId, setCertificateId] = useState('')
  const [verificationResult, setVerificationResult] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const [pdfCertificate, setPdfCertificate] = useState(null)
  const [downloadRequested, setDownloadRequested] = useState(false)
  const templateRef = useRef(null)

  const verifyCertificateId = async (id) => {
    if (!id || !id.trim()) {
      alert('Please enter a record ID')
      return
    }

    setIsLoading(true)

    try {
      const response = await verifyAPI.verifyCertificate(id.trim())
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'
      const serverUrl = baseUrl.replace(/\/api\/?$/, '')
      const rawLogoUrl = response.data?.record?.logo_url
      const logoUrl = rawLogoUrl
        ? rawLogoUrl.startsWith('http')
          ? rawLogoUrl
          : `${serverUrl}${rawLogoUrl}`
        : null

      if (response.data?.record) {
        setVerificationResult({
          valid: true,
          recordId: response.data.record.record_id,
          patientId: response.data.record.patient_id,
          patientName: response.data.record.patient_name || response.data.record.fullName,
          patientAge: response.data.record.patient_age,
          patientGender: response.data.record.patient_gender,
          bloodGroup: response.data.record.blood_group,
          patientPhone: response.data.record.patient_phone,
          patientAddress: response.data.record.patient_address,
          insuranceNo: response.data.record.insurance_no,
          diagnosis: response.data.record.diagnosis || response.data.record.course_name || response.data.record.certificate_title,
          instituteName: response.data.record.hospital_name || response.data.record.institute_name,
          recordDate: response.data.record.record_date || response.data.record.recordDate,
          medicalStatus: response.data.record.medical_status || response.data.record.grade || response.data.record.status,
          visitType: response.data.record.visit_type,
          department: response.data.record.department,
          physician: response.data.record.physician,
          chiefComplaint: response.data.record.chief_complaint,
          temperature: response.data.record.temperature,
          bloodPressure: response.data.record.blood_pressure,
          heartRate: response.data.record.heart_rate,
          respiratoryRate: response.data.record.respiratory_rate,
          oxygenSaturation: response.data.record.oxygen_saturation,
          weight: response.data.record.weight,
          height: response.data.record.height,
          bmi: response.data.record.bmi,
          blockchainTxHash: response.data.record.blockchain_tx_hash,
          blockchainVerified: response.data.onchain?.verified || false,
          hospitalLogoUrl: logoUrl
        })
      } else {
        setVerificationResult({
          valid: false
        })
      }
    } catch (error) {
      console.error('Verification error:', error)
      setVerificationResult({
        valid: false
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerify = async () => {
    await verifyCertificateId(recordId)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleVerify()
    }
  }

  useEffect(() => {
    const canonicalParamId = searchParams.get('recordId')
    const legacyParamId = searchParams.get('certificateld')
    const wantsDownload = searchParams.get('download') === '1'

    if (!canonicalParamId && legacyParamId) {
      const nextParams = new URLSearchParams(searchParams)
      nextParams.delete('certificateld')
      nextParams.set('recordId', legacyParamId)
      navigate({ pathname: '/verify', search: `?${nextParams.toString()}` }, { replace: true })
      return
    }

    if (canonicalParamId) {
      setCertificateId(canonicalParamId)
      setDownloadRequested(wantsDownload)
      verifyCertificateId(canonicalParamId)
    }
  }, [navigate, searchParams])

  useEffect(() => {
    if (downloadRequested && verificationResult?.valid) {
      setPdfCertificate({
        recordId: verificationResult.recordId,
        patientName: verificationResult.patientName,
        diagnosis: verificationResult.diagnosis,
        hospitalName: verificationResult.instituteName,
        recordDate: verificationResult.recordDate,
        medicalStatus: verificationResult.medicalStatus,
        hospitalLogoUrl: verificationResult.hospitalLogoUrl
      })
      setIsGeneratingPdf(true)
      setDownloadRequested(false)
    }
  }, [downloadRequested, verificationResult])

  const handleDownloadPdf = () => {
    console.log('Download button clicked')
    console.log('verificationResult:', verificationResult)
    
    if (!verificationResult?.valid) {
      console.error('Record not valid, cannot download')
      alert('Record must be valid to download. Please verify a record first.')
      return
    }

    console.log('Setting PDF certificate and triggering generation...')
    
    // Set up the PDF certificate with all data including logo
    const pdfData = {
      recordId: verificationResult.recordId,
      patientName: verificationResult.patientName,
      patientAge: verificationResult.patientAge,
      patientGender: verificationResult.patientGender,
      bloodGroup: verificationResult.bloodGroup,
      patientPhone: verificationResult.patientPhone,
      patientAddress: verificationResult.patientAddress,
      patientId: verificationResult.patientId,
      insuranceNo: verificationResult.insuranceNo,
      diagnosis: verificationResult.diagnosis,
      hospitalName: verificationResult.instituteName,
      recordDate: verificationResult.recordDate,
      medicalStatus: verificationResult.medicalStatus,
      hospitalLogoUrl: verificationResult.hospitalLogoUrl,
      visitDate: verificationResult.recordDate,
      visitType: verificationResult.visitType,
      department: verificationResult.department,
      physician: verificationResult.physician,
      chiefComplaint: verificationResult.chiefComplaint,
      temperature: verificationResult.temperature,
      bloodPressure: verificationResult.bloodPressure,
      heartRate: verificationResult.heartRate,
      respiratoryRate: verificationResult.respiratoryRate,
      oxygenSaturation: verificationResult.oxygenSaturation,
      weight: verificationResult.weight,
      height: verificationResult.height,
      bmi: verificationResult.bmi
    }
    
    console.log('PDF data prepared:', pdfData)
    setPdfCertificate(pdfData)
    setIsGeneratingPdf(true)
  }

  useEffect(() => {
    if (!pdfCertificate || !isGeneratingPdf) {
      console.log('PDF generation effect: Waiting for pdfCertificate or isGeneratingPdf')
      return
    }

    console.log('PDF generation effect started')
    let isCancelled = false

    const waitForTemplate = async () => {
      console.log('Waiting for template ref...')
      // Wait up to 3 seconds for template to be available and rendered
      for (let i = 0; i < 300; i += 1) {
        if (templateRef.current) {
          console.log('Template ref found at iteration', i)
          // Give React time to render the content
          await new Promise((resolve) => setTimeout(resolve, 50))
          return true
        }
        await new Promise((resolve) => requestAnimationFrame(resolve))
      }
      console.warn('Template not found after timeout (300 iterations)')
      return false
    }

    const generatePdf = async () => {
      try {
        console.log('Starting PDF generation...')
        const ready = await waitForTemplate()
        if (!ready || isCancelled) {
          console.error('Template not ready or generation cancelled')
          alert('Failed to load record template. Please try again.')
          return
        }

        console.log('Template ready, calling generateRecordPdfBlob...')
        const templateElement = templateRef.current
        console.log('Template element:', templateElement)
        console.log('Template element HTML:', templateElement?.innerHTML?.substring(0, 200))
        
        const blob = await generateRecordPdfBlob(templateElement)
        if (!blob || isCancelled) {
          console.error('PDF blob generation failed or cancelled')
          alert('Failed to generate PDF. Please try again.')
          return
        }

        console.log('PDF blob created successfully:', blob.size, 'bytes')
        if (!isCancelled) {
          console.log('Triggering download...')
          try {
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `HealthRecord_${pdfCertificate.recordId}.pdf`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            console.log('Download triggered successfully')
            window.setTimeout(() => {
              URL.revokeObjectURL(url)
              console.log('Object URL revoked')
            }, 30000)
          } catch (downloadError) {
            console.error('Download error:', downloadError)
            alert(`Download failed: ${downloadError.message}`)
          }
        }
      } catch (error) {
        console.error('Failed to generate record PDF:', error)
        alert(`Failed to generate record PDF: ${error.message}`)
      } finally {
        if (!isCancelled) {
          console.log('PDF generation complete, resetting state')
          setIsGeneratingPdf(false)
        }
      }
    }

    generatePdf()

    return () => {
      console.log('PDF generation effect cleanup')
      isCancelled = true
    }
  }, [pdfCertificate, isGeneratingPdf])

  return (
    <>
      <div className="min-h-screen bg-linear-to-br from-purple-100 via-blue-50 to-purple-50">
        <Navbar />
        
        <main className="max-w-300 mx-auto px-4 py-8 md:py-12">
          {/* Main Container */}
          <div className="bg-purple-200/60 rounded-3xl p-6 md:p-12 shadow-lg backdrop-blur-sm">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3">
              Verify HealthRecord
            </h1>
            <p className="text-gray-700 text-base md:text-lg">
              Instantly verify the authenticity of any record using its unique ID.
            </p>
          </div>

          {/* Input Section */}
          <div className="flex flex-col md:flex-row gap-4 justify-center items-center mb-8">
            <input
              type="text"
              placeholder="Enter Your HealthRecord ID"
              value={recordId}
              onChange={(e) => setCertificateId(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full md:w-100 px-6 py-3 rounded-full border-2 border-gray-300 focus:outline-none focus:border-purple-500 text-gray-700 placeholder-gray-400"
            />
            <button
              onClick={handleVerify}
              disabled={isLoading}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-8 py-3 rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed min-w-30"
            >
              {isLoading ? 'Verifying...' : 'Verify'}
            </button>
          </div>

          {/* Result Card */}
          <div className="bg-white rounded-2xl p-8 md:p-12 shadow-md min-h-87.5 flex items-center justify-center">
            {!verificationResult ? (
              <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8 max-w-3xl">
                {/* Illustration */}
                <div className="flex-shrink-0">
                  <img
                    src={verifyImage}
                    alt="Health record verification illustration"
                    className="w-48 h-48 md:w-64 md:h-64 object-contain"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <p className="text-gray-500 text-base md:text-lg text-center md:text-left">
                  Enter a record ID above to view and verify health record details here.
                </p>
              </div>
            ) : (
              <div className="w-full">
                {verificationResult.valid ? (
                  <div className="space-y-6">
                    {/* Success Badge */}
                    <div className="flex items-center justify-center gap-3 mb-6">
                      <div className="bg-green-100 text-green-700 px-6 py-3 rounded-full flex items-center gap-2">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="font-semibold">Record Valid</span>
                      </div>
                    </div>

                      <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">HealthRecord ID</p>
                        <p className="font-semibold text-gray-800 break-all">{verificationResult.recordId}</p>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Patient Name</p>
                        <p className="font-semibold text-gray-800">{verificationResult.patientName}</p>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Diagnosis</p>
                        <p className="font-semibold text-gray-800">{verificationResult.diagnosis}</p>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Hospital</p>
                        <p className="font-semibold text-gray-800">{verificationResult.instituteName}</p>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Issue Date</p>
                        <p className="font-semibold text-gray-800">{new Date(verificationResult.recordDate).toLocaleDateString()}</p>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Medical Status</p>
                        <p className="font-semibold text-gray-800">{verificationResult.medicalStatus}</p>
                      </div>
                    </div>

                    {/* Blockchain Verification Info */}
                    {verificationResult.blockchainTxHash && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                        <p className="text-sm text-gray-600 mb-2 flex items-center gap-1"><span className="material-icons text-green-600" style={{fontSize: '16px'}}>check_circle</span> Blockchain Verified</p>
                        <p className="text-xs text-gray-700 font-mono break-all">{verificationResult.blockchainTxHash}</p>
                        {typeof window.MetaMask !== 'undefined' && new window.MetaMask().getExplorerUrl(verificationResult.blockchainTxHash, 'tx') ? (
                          <a
                            href={new window.MetaMask().getExplorerUrl(verificationResult.blockchainTxHash, 'tx')}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:text-blue-800 mt-2 inline-block underline"
                          >
                            View on Block Explorer →
                          </a>
                        ) : (
                          <p className="text-xs text-gray-600 mt-2">Local Network - TX visible on local chain</p>
                        )}
                      </div>
                    )}

                    {/* Network hint card */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                      <p className="text-sm font-semibold text-blue-900 mb-2">Network Information</p>
                      <div className="text-xs text-blue-900/80 space-y-1">
                        <p><span className="font-semibold">Network:</span> {typeof window.MetaMask !== 'undefined' ? new window.MetaMask().getNetworkName() : 'Connected'}</p>
                        <p><span className="font-semibold">Chain ID:</span> {typeof window.MetaMask !== 'undefined' ? new window.MetaMask().chainId : 'Unknown'}</p>
                        <p><span className="font-semibold">RPC:</span> {typeof window.MetaMask !== 'undefined' && new window.MetaMask().chainId === 31337 ? 'http://127.0.0.1:8545' : 'Connected Network'}</p>
                        {verificationResult.blockchainTxHash ? (
                          <p className="text-blue-800/80 mt-2">✓ Record is verified on the blockchain network.</p>
                        ) : (
                          <p className="text-blue-800/80 mt-2">No on-chain hash available for this record.</p>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap justify-center gap-4 mt-6">
                      <button
                        onClick={handleDownloadPdf}
                        disabled={isGeneratingPdf}
                        className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2 rounded-full transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="material-icons text-base">{isGeneratingPdf ? 'hourglass_empty' : 'download'}</span> {isGeneratingPdf ? 'Generating PDF...' : 'Download PDF'}
                      </button>
                      <button
                        onClick={() => {
                          setCertificateId('')
                          setVerificationResult(null)
                          setPdfCertificate(null)
                        }}
                        className="bg-gray-600 hover:bg-gray-700 text-white font-semibold px-6 py-2 rounded-full transition-colors"
                      >
                        Verify Another
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="bg-red-100 text-red-700 px-6 py-3 rounded-full inline-flex items-center gap-2 mb-4">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <span className="font-semibold">HealthRecord Not Found</span>
                    </div>
                    <p className="text-gray-600 mb-6">
                      The record ID you entered could not be found. Please verify the ID and try again.
                    </p>
                    <button
                      onClick={() => {
                        setCertificateId('')
                        setVerificationResult(null)
                      }}
                      className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-2 rounded-full transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        </main>
      </div>
      <RecordPdfRenderer record={pdfCertificate} templateRef={templateRef} />
    </>
  )
}
