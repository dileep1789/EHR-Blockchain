const fs = require('fs');
const path = require('path');

const replacements = [
  // Filename related updates
  { regex: /StudentHeader/g, replace: 'PatientHeader' },
  { regex: /InstituteSideBar/g, replace: 'HospitalSideBar' },
  { regex: /CertificatePdfRenderer/g, replace: 'RecordPdfRenderer' },
  { regex: /CertificateTemplate/g, replace: 'RecordTemplate' },
  { regex: /StudentDashboard/g, replace: 'PatientDashboard' },
  { regex: /StudentPortfolio/g, replace: 'PatientHistory' },
  { regex: /InstituteDashboard/g, replace: 'HospitalDashboard' },
  { regex: /IssueCertificate/g, replace: 'AddRecord' },
  
  // API and Model Fields
  { regex: /\/api\/student/g, replace: '/api/patient' },
  { regex: /\/api\/university/g, replace: '/api/hospital' },
  { regex: /\/api\/certificates/g, replace: '/api/records' },
  
  // Data Structure
  { regex: /\bStudent\b/g, replace: 'Patient' },
  { regex: /\bstudent\b/g, replace: 'patient' },
  { regex: /\bstudents\b/g, replace: 'patients' },
  { regex: /\bInstitute\b/g, replace: 'Hospital' },
  { regex: /\binstitute\b/g, replace: 'hospital' },
  { regex: /\binstitutes\b/g, replace: 'hospitals' },
  { regex: /\bUniversity\b/g, replace: 'Hospital' },
  { regex: /\buniversity\b/g, replace: 'hospital' },
  { regex: /\buniversities\b/g, replace: 'hospitals' },
  
  { regex: /\bCertificate\b/g, replace: 'HealthRecord' },
  { regex: /\bcertificate\b/g, replace: 'record' },
  { regex: /\bcertificates\b/g, replace: 'records' },
  { regex: /\bCertificates\b/g, replace: 'Records' },
  
  { regex: /\bcertId\b/g, replace: 'recordId' },
  { regex: /\bcertificate_id\b/g, replace: 'record_id' },
  { regex: /\bcertificateId\b/g, replace: 'recordId' },
  { regex: /\buser_id\b/g, replace: 'patient_id' },
  { regex: /\buserId\b/g, replace: 'patientId' },
  { regex: /\binstitute_id\b/g, replace: 'hospital_id' },
  
  // Custom Fields
  { regex: /\bcourseName\b/g, replace: 'diagnosis' },
  { regex: /\bcourse\b/g, replace: 'diagnosis' },
  { regex: /\bstudentName\b/g, replace: 'patientName' },
  { regex: /\bissuerName\b/g, replace: 'providerName' },
  { regex: /\bissueDate\b/g, replace: 'recordDate' },
  { regex: /\bissued_date\b/g, replace: 'record_date' },
  
  // Gemini AI fields
  { regex: /\bcareerMatches\b/g, replace: 'treatmentMatches' },
  { regex: /\btopSkills\b/g, replace: 'riskFactors' },
  { regex: /\bnextSteps\b/g, replace: 'recommendedActions' }
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let originalContent = content;
      
      for (const { regex, replace } of replacements) {
        content = content.replace(regex, replace);
      }
      
      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Refactored ${fullPath}`);
      }
    }
  }
}

processDirectory(path.join(__dirname, 'src'));
