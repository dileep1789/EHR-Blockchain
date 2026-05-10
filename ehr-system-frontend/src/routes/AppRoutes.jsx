import { Routes, Route, Navigate } from 'react-router-dom'
import Homepage from '../pages/Home/Homepage'
import Login from '../pages/Auth/Login'
import Signup from '../pages/Auth/Signup'
import VerifyPage from '../pages/Verify/VerifyPage'
import PrivacyPolicy from '../pages/Legal/PrivacyPolicy'
import ContactUs from '../pages/Legal/ContactUs'
import PatientLayout from '../layouts/PatientLayout'
import HospitalLayout from '../layouts/HospitalLayout'
import AdminLayout from '../layouts/AdminLayout'
import PatientDashboard from '../pages/Patient/PatientDashboard'
import PatientHistory from '../pages/Patient/PatientHistory'
import HospitalDashboard from '../pages/Hospital/HospitalDashboard'
import AddRecord from '../pages/Hospital/AddRecord'
import BulkIssue from '../pages/Hospital/BulkIssue'
import History from '../pages/Hospital/History'
import Wallet from '../pages/Hospital/Wallet'
import AdminDashboard from '../pages/Admin/AdminDashboard'
import AdminApprovals from '../pages/Admin/AdminApprovals'
import AdminInstitutes from '../pages/Admin/AdminInstitutes'
import AdminLogin from '../pages/Admin/AdminLogin'
import { ProtectedPatientRoute, ProtectedHospitalRoute, ProtectedAdminRoute } from './ProtectedRoutes'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Homepage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/verify" element={<VerifyPage />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/contact" element={<ContactUs />} />
      <Route path="/admin/login" element={<AdminLogin />} />

      <Route path="/patient" element={<ProtectedPatientRoute><PatientLayout /></ProtectedPatientRoute>}>
        <Route path="dashboard" element={<PatientDashboard />} />
        <Route path="history" element={<PatientHistory />} />
      </Route>
      
      {/* Public Record Route */}
      <Route path="/public-record/:patientId" element={<PatientHistory />} />

      <Route path="/hospital" element={<ProtectedHospitalRoute><HospitalLayout /></ProtectedHospitalRoute>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<HospitalDashboard />} />
        <Route path="issue" element={<AddRecord />} />
        <Route path="bulk-issue" element={<BulkIssue />} />
        <Route path="history" element={<History />} />
        <Route path="wallet" element={<Wallet />} />
      </Route>

      <Route path="/provider" element={<ProtectedHospitalRoute><HospitalLayout /></ProtectedHospitalRoute>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<HospitalDashboard />} />
        <Route path="issue" element={<AddRecord />} />
        <Route path="bulk-issue" element={<BulkIssue />} />
        <Route path="history" element={<History />} />
        <Route path="wallet" element={<Wallet />} />
      </Route>

      <Route path="/admin" element={<ProtectedAdminRoute><AdminLayout /></ProtectedAdminRoute>}>
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="approvals" element={<AdminApprovals />} />
        <Route path="hospitals" element={<AdminInstitutes />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
