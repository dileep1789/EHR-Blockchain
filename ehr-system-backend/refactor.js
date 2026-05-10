const fs = require('fs');
const path = require('path');

const filesToRefactor = [
  'controllers/patientController.js',
  'controllers/hospitalController.js',
  'routes/patient.js',
  'routes/hospital.js',
  'server.js',
  'controllers/authController.js',
  'routes/auth.js',
  'controllers/adminController.js',
  'routes/admin.js'
];

const replacements = [
  { regex: /\bStudent\b/g, replace: 'Patient' },
  { regex: /\bstudent\b/g, replace: 'patient' },
  { regex: /\bstudents\b/g, replace: 'patients' },
  { regex: /\bInstitute\b/g, replace: 'Hospital' },
  { regex: /\binstitute\b/g, replace: 'hospital' },
  { regex: /\binstitutes\b/g, replace: 'hospitals' },
  { regex: /\bCertificate\b/g, replace: 'Record' },
  { regex: /\bcertificate\b/g, replace: 'record' },
  { regex: /\bcertificates\b/g, replace: 'records' },
  { regex: /\bcertId\b/g, replace: 'recordId' },
  { regex: /\bcertificate_id\b/g, replace: 'record_id' },
  { regex: /\buser_id\b/g, replace: 'patient_id' },
  { regex: /\buserId\b/g, replace: 'patientId' },
  { regex: /\binstitute_id\b/g, replace: 'hospital_id' },
  { regex: /\binstitute_name\b/g, replace: 'hospital_name' },
  { regex: /\bcourse\b/g, replace: 'diagnosis' },
  { regex: /\bissued_date\b/g, replace: 'record_date' },
  { regex: /\bcourseName\b/g, replace: 'diagnosis' },
  { regex: /\bissueDate\b/g, replace: 'recordDate' },
  { regex: /\bissuerName\b/g, replace: 'providerName' },
  { regex: /\bissuer_name\b/g, replace: 'provider_name' },
  { regex: /\bissuer_wallet\b/g, replace: 'provider_wallet' },
  { regex: /\bcareer_paths\b/g, replace: 'health_analysis' },
  { regex: /\bcareer insights\b/g, replace: 'health insights' },
  { regex: /\bCareer insights\b/g, replace: 'Health insights' },
  { regex: /\bcareer_suggestions\b/g, replace: 'treatment_suggestions' },
  { regex: /\bskills_identified\b/g, replace: 'risk_factors' },
  { regex: /\brecommended_courses\b/g, replace: 'recommended_actions' },
  { regex: /\bUniversity\b/g, replace: 'Hospital' },
  { regex: /\buniversity\b/g, replace: 'hospital' },
  { regex: /\buniversities\b/g, replace: 'hospitals' },
  { regex: /\bcareerMatches\b/g, replace: 'treatmentMatches' },
  { regex: /\btopSkills\b/g, replace: 'riskFactors' },
  { regex: /\bnextSteps\b/g, replace: 'recommendedActions' }
];

for (const relPath of filesToRefactor) {
  const fullPath = path.join(__dirname, relPath);
  if (!fs.existsSync(fullPath)) {
    console.log(`Skipping ${fullPath}, does not exist.`);
    continue;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  
  for (const { regex, replace } of replacements) {
    content = content.replace(regex, replace);
  }
  
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`Refactored ${fullPath}`);
}
