import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { hospitalAPI, paymentAPI } from "../../services/api";

const HospitalDashboard = () => {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hospital, setInstitute] = useState({
    name: '',
    logo: ''
  });
  const [stats, setStats] = useState([
    { label: "Total Records", value: "0" },
    { label: "Verification Status", value: "Loading..." },
    { label: "Wallet Balance", value: "0.00" },
  ]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch profile for verification status and wallet address
      const profileResponse = await hospitalAPI.getProfile();
      const profile = profileResponse.data.hospital;
      
      // Construct full logo URL (backend returns relative path like /uploads/...)
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
      const serverUrl = baseUrl.replace('/api', ''); // Remove /api to get base server URL
      const logoUrl = profile?.logo_url ? `${serverUrl}${profile.logo_url}` : '';
      
      // Fetch dashboard stats
      const dashboardResponse = await hospitalAPI.getDashboard();
      const dashboardData = dashboardResponse.data || {};
      const totalCerts =
        dashboardData.totalCertificatesIssued ??
        dashboardData.totalCertificates ??
        dashboardData.total_certificates ??
        dashboardData.data?.totalCertificatesIssued ??
        dashboardData.data?.totalCertificates ??
        0;
      
      // Fetch wallet balance
      let walletBalance = "0.00";
      if (profile?.wallet_address) {
        try {
          const balanceResponse = await paymentAPI.getBalance(profile.wallet_address);
          walletBalance = parseFloat(balanceResponse.data?.data?.balancePol || '0').toFixed(4);
        } catch (err) {
          console.error('Failed to load balance:', err);
        }
      }

      setInstitute({
        name: profile?.hospital_name || profile?.institute_name || 'Hospital',
        logo: logoUrl
      });

      setStats([
          { label: "Total Records", value: totalCerts.toString() },
        { label: "Verification Status", value: (profile?.verification_status || "Unknown").toUpperCase() },
        { label: "Wallet Balance", value: walletBalance },
      ]);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  return (
    /* Added pb-12 (mobile) and md:pb-20 (desktop) to push the layout footer down */
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12 md:pb-20">
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          <p className="font-semibold">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}
      
      {/* 1. Main Dashboard Header Banner */}
      <div className="bg-white rounded-2xl border border-gray-300 px-6 py-8 md:py-10 flex items-center gap-5 shadow-sm min-h-[120px]">
        <div className="bg-[#E9D5FF] p-3 rounded-xl flex items-center justify-center shrink-0">
          <span className="text-3xl" role="img" aria-label="dashboard-icon">📄🔍</span>
        </div>
        <div className="flex flex-col justify-center">
          <h2 className="text-2xl font-bold text-gray-800 leading-tight">Provider Dashboard</h2>
          <p className="text-sm md:text-base text-gray-400 font-medium mt-1">
            Manage your clinic's digital health record issuance on the blockchain
          </p>
        </div>
      </div>

      {/* 2. Welcome Message Banner */}
      <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm">
        {loading ? (
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="flex-1">
              <div className="h-6 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            {hospital.logo && (
              <img 
                src={hospital.logo} 
                alt={`${hospital.name} logo`}
                className="w-16 h-16 object-contain rounded-lg"
              />
            )}
            <div>
              <h3 className="text-lg font-bold text-gray-800">{hospital.name}</h3>
              <p className="text-sm text-gray-400 font-medium">Welcome to the Blockchain EHR Portal</p>
              <p className="text-sm text-gray-400 font-medium">Issue and manage blockchain-verified records for your patients</p>
            </div>
          </div>
        )}
      </div>

      {/* 3. Metric Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white p-4 md:p-5 rounded-2xl shadow-md text-center border border-gray-50 flex flex-col items-center justify-center min-h-[120px]"
          >
            <h4 className="text-[#374151] font-bold mb-1 text-xs md:text-sm opacity-70">{stat.label}</h4>
            <p className="text-2xl md:text-3xl font-extrabold text-[#8B5CF6] tracking-tight">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* 4. Quick Actions Section */}
      <div className="bg-white rounded-2xl p-4 md:p-5 shadow-sm border border-gray-50">
        <h3 className="text-base font-bold text-gray-800 mb-3 px-1">Quick Actions</h3>
        <hr className="mb-4 border-gray-100" />
        <div className="flex flex-col md:flex-row gap-3">
          <button 
            onClick={() => navigate('/hospital/issue')}
            className="bg-[#8B5CF6] text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-[#7C3AED] transition-all shadow-sm active:scale-95">
            Issue Single Record
          </button>
          <button 
            onClick={() => navigate('/hospital/bulk-issue')}
            className="border-2 border-[#8B5CF6] text-[#8B5CF6] px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-purple-50 transition-all active:scale-95">
            Bulk Upload CSV
          </button>
          <button 
            onClick={() => navigate('/hospital/history')}
            className="bg-[#9366E4] text-white px-8 py-2.5 rounded-lg text-sm font-bold hover:bg-[#7C3AED] transition-all shadow-sm active:scale-95">
            View History
          </button>
        </div>
      </div>

    </div>
  );
};

export default HospitalDashboard;