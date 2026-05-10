import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// Create axios instance
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const isAdminPath = window.location.pathname.startsWith('/admin');
    
    let token = null;
    if (isAdminPath) {
      token = localStorage.getItem('adminToken');
    } else if (window.location.pathname.startsWith('/hospital') || window.location.pathname.startsWith('/provider')) {
      token = localStorage.getItem('hospitalToken');
    } else {
      token = localStorage.getItem('patientToken');
    }
    
    // Safety fallback: if the specific token is missing, try any available token
    if (!token) {
      token = localStorage.getItem('adminToken') || 
              localStorage.getItem('hospitalToken') || 
              localStorage.getItem('patientToken');
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear expired token
      localStorage.removeItem('patientToken');
      localStorage.removeItem('hospitalToken');
      localStorage.removeItem('adminToken');
      if (window.location.pathname.startsWith('/admin')) {
        window.location.href = '/admin/login';
      } else {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ==================== AUTH APIs ====================

export const authAPI = {
  // Patient Auth
  registerPatient: (data) => 
    api.post('/auth/patient/register', data),
  
  loginPatient: (data) => 
    api.post('/auth/patient/login', data),
  
  getPatientProfile: () => 
    api.get('/auth/patient/profile'),

  resendPatientVerification: (email) =>
    api.post('/auth/patient/resend-verification', { email }),

  resendHospitalVerification: (email) =>
    api.post('/hospital/resend-verification', { email }),

  // Hospital Auth
  registerHospital: (formData) => 
    api.post('/hospital/register', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  
  loginHospital: (data) => 
    api.post('/hospital/login', data),
  
  getHospitalProfile: () => 
    api.get('/hospital/profile'),

  // Admin Auth
  loginAdmin: (data) => 
    api.post('/admin/login', data),
  
  getAdminProfile: () => 
    api.get('/admin/profile'),
};

// ==================== STUDENT APIs ====================

export const patientAPI = {
  getDashboard: () => 
    api.get('/patient/dashboard'),
  
  getCertificates: () => 
    api.get('/patient/records'),
  
  getCertificateDetails: (recordId) => 
    api.get(`/patient/records/${recordId}`),
  
  verifyCertificate: (recordId) => 
    api.get(`/patient/records/${recordId}/verify`),
  
  getCareerInsights: (regenerate = false) => 
    api.post('/patient/career-insights', { regenerate }),
  
  updatePortfolioVisibility: (isPublic) => 
    api.patch('/patient/portfolio/visibility', { isPublic }),

  updateProfile: (formData) => 
    api.patch('/patient/profile', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
};

// ==================== UNIVERSITY APIs ====================

export const hospitalAPI = {
  getProfile: () => 
    api.get('/hospital/profile'),
  
  getDashboard: () => 
    api.get('/hospital/dashboard'),
  
  issueCertificate: (data) => 
    api.post('/hospital/record/issue', data),

  getSignPayload: (data) =>
    api.post('/hospital/record/sign-payload', data),

  issueSignedCertificate: (data) =>
    api.post('/hospital/record/issue-signed', data),
  
  bulkAddRecords: (data) => 
    api.post('/hospital/records/bulk', data),

  getBulkAuthMessage: (data) =>
    api.post('/hospital/record/bulk-auth', data),

  bulkIssueSigned: (data) =>
    api.post('/hospital/record/bulk-issue-signed', data),
  
  getCertificates: () => 
    api.get('/hospital/records'),

  searchPatients: (query, limit = 10) =>
    api.get(`/hospital/patients/search?query=${encodeURIComponent(query)}&limit=${limit}`),
};

// ==================== ADMIN APIs ====================

export const adminAPI = {
  getProfile: () => 
    api.get('/admin/profile'),
  
  getDashboard: () => 
    api.get('/admin/dashboard'),
  
  getHospitals: () => 
    api.get('/admin/hospitals'),
  
  getPendingHospitals: () => 
    api.get('/admin/hospitals/pending'),
  
  approveHospital: (instituteId, data) => 
    api.post(`/admin/hospitals/${instituteId}/approve`, data),
  
  rejectHospital: (instituteId, data) => 
    api.post(`/admin/hospitals/${instituteId}/reject`, data),

  revokeHospital: (instituteId, data) =>
    api.post(`/admin/hospitals/${instituteId}/revoke`, data),
  
  getIssuerStatus: (instituteId) => 
    api.get(`/admin/hospitals/${instituteId}/issuer-status`),
  
  getStatistics: () => 
    api.get('/admin/statistics'),

  getBlockchainStatus: () =>
    api.get('/admin/blockchain/status'),

  getBalance: (address) =>
    api.get(`/payment/balance?address=${address}`),
};

// ==================== VERIFY APIs (Public) ====================

export const verifyAPI = {
  verifyCertificate: (recordId) => 
    api.get(`/verify/record/${recordId}`),
  
  getUserCertificates: (patientId) => 
    api.get(`/verify/user/${patientId}`),
};

// ==================== CONTACT APIs ====================

export const contactAPI = {
  sendContactMessage: (data) =>
    api.post('/contact/send-message', data),
};

// ==================== PAYMENT APIs ====================

export const paymentAPI = {
  getGasCost: () =>
    api.get('/payment/gas-cost'),

  getBalance: (address) =>
    api.get(`/payment/balance?address=${address}`),

  issueWithMetamask: (data) =>
    api.post('/payment/issue-with-metamask', data),

  bulkIssue: (data) =>
    api.post('/payment/bulk-issue', data),
};

// ==================== METAMASK APIs ====================

export const metamaskAPI = {
  getStatus: () =>
    api.get('/metamask/status'),
};

// ==================== CERTIFICATE APIs (MetaMask) ====================

export const recordAPI = {
  issueWithMetamask: (data) =>
    api.post('/records/issue-with-metamask', data),
};

// ==================== UTILITY FUNCTIONS ====================

export const setPatientToken = (token) => {
  localStorage.setItem('patientToken', token);
};

export const setHospitalToken = (token) => {
  localStorage.setItem('hospitalToken', token);
};

export const setAdminToken = (token) => {
  localStorage.setItem('adminToken', token);
};

export const clearAllTokens = () => {
  localStorage.removeItem('patientToken');
  localStorage.removeItem('hospitalToken');
  localStorage.removeItem('adminToken');
};

export const getPatientToken = () => localStorage.getItem('patientToken');
export const getHospitalToken = () => localStorage.getItem('hospitalToken');
export const getAdminToken = () => localStorage.getItem('adminToken');

export default api;
