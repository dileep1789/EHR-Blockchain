import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import '../styles/record.css'

const formatDate = (value) => {
  if (!value) {
    return ''
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return String(value)
  }

  return parsed.toLocaleDateString()
}

export default function RecordTemplate({ record }) {
  const [logoError, setLogoError] = useState(false)

  if (!record) {
    return null
  }

  const {
    recordId,
    patientName,
    diagnosis,
    hospitalName: instituteName,
    recordDate,
    medicalStatus: grade,
    hospitalLogoUrl: instituteLogoUrl
  } = record

  const safeRecordId = recordId || 'N/A'
  const verifyUrl = `${window.location.origin}/verify?recordId=${encodeURIComponent(safeRecordId)}`

  return (
    <div className="record-root">
      <div className="record-verified-badge">BLOCKCHAIN SECURED</div>
      
      <div className="record-top">
        <div className="record-box">
          {instituteLogoUrl && !logoError ? (
            <img
              src={instituteLogoUrl}
              alt={hospitalName || 'Hospital logo'}
              className="w-24 h-24 object-contain"
              crossOrigin="anonymous"
              onError={() => setLogoError(true)}
            />
          ) : (
            <span className="record-placeholder">Hospital Logo</span>
          )}
        </div>
        <div className="record-box">
          <QRCodeSVG value={verifyUrl} size={100} />
        </div>
      </div>

      <h1 className="record-title">MEDICAL CERTIFICATE</h1>

      <div className="record-body">
        <p className="record-subtitle">This document certifies the medical assessment for</p>
        <p className="record-name">{patientName || 'PATIENT NAME'}</p>
        <p className="record-description">
          who has undergone clinical evaluation, diagnostic testing, and 
          medical observation for the clinical condition of
        </p>
        <p className="record-diagnosis">{diagnosis || 'DIAGNOSIS'}</p>
        <p className="record-subtitle">at</p>
        <p className="record-hospital">{hospitalName || 'HEALTHCARE PROVIDER'}</p>
        <p className="record-grade">{medicalStatus ? `MEDICAL STATUS: ${medicalStatus}` : 'STATUS'}</p>
      </div>

      <div className="record-footer">
        <div className="record-security-seal">
           <img src="/record/seal.png" alt="" className="w-24 h-24 object-contain opacity-40" />
        </div>
        <div className="record-footer-center">
          <b>RECORD ID: {safeRecordId}</b>
          <small>ISSUE DATE: {formatDate(recordDate) || 'N/A'}</small>
          <small className="record-footer-link">{verifyUrl}</small>
        </div>
        <div className="record-logo-box">
          <img src="/logo.svg" alt="EHRChain" className="w-32 h-16 object-contain opacity-60" />
        </div>
      </div>
    </div>
  )
}
