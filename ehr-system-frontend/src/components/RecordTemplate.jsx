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
    hospitalName,
    recordDate,
    medicalStatus,
    hospitalLogoUrl,
    patientAge = 'N/A',
    patientGender = 'N/A',
    bloodGroup = 'N/A',
    patientPhone = 'N/A',
    patientAddress = 'N/A',
    patientId = 'N/A',
    insuranceNo = 'N/A',
    visitDate = recordDate,
    visitType = 'Outpatient',
    department = 'General',
    physician = 'Doctor',
    chiefComplaint = 'N/A',
    temperature = 'N/A',
    bloodPressure = 'N/A',
    heartRate = 'N/A',
    respiratoryRate = 'N/A',
    oxygenSaturation = 'N/A',
    weight = 'N/A',
    height = 'N/A',
    bmi = 'N/A'
  } = record

  const safeRecordId = recordId || 'N/A'
  const verifyUrl = `${window.location.origin}/verify?recordId=${encodeURIComponent(safeRecordId)}`

  return (
    <div className="record-root">
      {/* Header with Badge and QR */}
      <div className="record-header">
        <div className="record-badge-top-left">Medical Facility Date</div>
        <div className="record-badge-top-right">
          <div className="record-verified-badge">BLOCKCHAIN SECURED</div>
        </div>
      </div>

      <div className="record-top">
        <div className="record-box">
          {hospitalLogoUrl && !logoError ? (
            <img
              src={hospitalLogoUrl}
              alt={hospitalName || 'Hospital logo'}
              className="w-24 h-24 object-contain"
              onError={() => setLogoError(true)}
            />
          ) : (
            <span className="record-placeholder">
              Medical Facility
              <br />
              Logo
            </span>
          )}
        </div>
        
        <div className="record-center-info">
          <h1 className="record-title">PATIENT HEALTH RECORD</h1>
        </div>

        <div className="record-box">
          <div className="record-qr-container">
            <QRCodeSVG value={verifyUrl} size={100} />
          </div>
        </div>
      </div>

      {/* Record Info Box */}
      <div className="record-info-box">
        <div className="record-info-row">
          <div className="record-info-item">
            <strong>RECORD ID:</strong>
            <span>{safeRecordId}</span>
          </div>
          <div className="record-info-item">
            <strong>ISSUE DATE:</strong>
            <span>{formatDate(recordDate) || 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* Patient Information Section */}
      <div className="record-section">
        <h3 className="record-section-title">👤 PATIENT INFORMATION</h3>
        <div className="record-grid">
          <div className="record-field">
            <label>Patient Name</label>
            <span>{patientName || 'N/A'}</span>
          </div>
          <div className="record-field">
            <label>Date of Birth</label>
            <span>{patientAge}</span>
          </div>
          <div className="record-field">
            <label>Age / Gender</label>
            <span>{patientGender}</span>
          </div>
          <div className="record-field">
            <label>Blood Group</label>
            <span>{bloodGroup}</span>
          </div>
          <div className="record-field">
            <label>Phone</label>
            <span>{patientPhone}</span>
          </div>
          <div className="record-field">
            <label>Address</label>
            <span>{patientAddress}</span>
          </div>
          <div className="record-field">
            <label>Patient ID</label>
            <span>{patientId}</span>
          </div>
          <div className="record-field">
            <label>Insurance No.</label>
            <span>{insuranceNo}</span>
          </div>
        </div>
      </div>

      {/* Visit Summary Section */}
      <div className="record-section">
        <h3 className="record-section-title">🏥 VISIT SUMMARY</h3>
        <div className="record-grid">
          <div className="record-field">
            <label>Visit Date</label>
            <span>{formatDate(visitDate)}</span>
          </div>
          <div className="record-field">
            <label>Visit Type</label>
            <span>{visitType}</span>
          </div>
          <div className="record-field">
            <label>Department</label>
            <span>{department}</span>
          </div>
          <div className="record-field">
            <label>Attending Physician</label>
            <span>{physician}</span>
          </div>
          <div className="record-field">
            <label>Hospital / Facility</label>
            <span>{hospitalName || 'N/A'}</span>
          </div>
        </div>
        {chiefComplaint !== 'N/A' && (
          <div className="record-full-width">
            <label>Chief Complaint</label>
            <span>{chiefComplaint}</span>
          </div>
        )}
      </div>

      {/* Clinical Observation Section */}
      <div className="record-section">
        <h3 className="record-section-title">🔬 CLINICAL OBSERVATION</h3>
        <div className="record-vital-grid">
          <div className="record-vital">
            <label>Temperature</label>
            <span>{temperature}</span>
          </div>
          <div className="record-vital">
            <label>Blood Pressure</label>
            <span>{bloodPressure}</span>
          </div>
          <div className="record-vital">
            <label>Heart Rate</label>
            <span>{heartRate}</span>
          </div>
          <div className="record-vital">
            <label>Respiratory Rate</label>
            <span>{respiratoryRate}</span>
          </div>
          <div className="record-vital">
            <label>Oxygen Saturation</label>
            <span>{oxygenSaturation}</span>
          </div>
          <div className="record-vital">
            <label>Weight</label>
            <span>{weight}</span>
          </div>
          <div className="record-vital">
            <label>Height</label>
            <span>{height}</span>
          </div>
          <div className="record-vital">
            <label>BMI</label>
            <span>{bmi}</span>
          </div>
        </div>
      </div>

      {/* Diagnosis & Plan Section */}
      <div className="record-section">
        <h3 className="record-section-title">📋 DIAGNOSIS & PLAN</h3>
        <div className="record-full-width">
          <label>Clinical Diagnosis</label>
          <span>{diagnosis || 'N/A'}</span>
        </div>
        {medicalStatus && (
          <div className="record-full-width">
            <label>Medical Status</label>
            <span className="record-status-badge">{medicalStatus}</span>
          </div>
        )}
      </div>

      {/* Blockchain Security Note */}
      <div className="record-security-note">
        <strong>🔒 Blockchain Security:</strong>
        <span>This record is secured on blockchain for authenticity and integrity.</span>
      </div>

      {/* Footer */}
      <div className="record-footer">
        <small className="record-footer-link">Verify at: {verifyUrl}</small>
        <small>This is an electronically generated medical record and does not require a physical signature.</small>
      </div>
    </div>
  )
}
