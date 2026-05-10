import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/HospitalSideBar';
import Footer from '../components/Footer';
import MetaMaskBadge from '../components/MetaMaskBadge';
import { useMetaMaskContext } from '../context/MetaMaskContext';
import { Menu, X } from 'lucide-react';

const HospitalDashboard = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const {
    connected,
    address,
    balance,
    loading,
    error,
    connect
  } = useMetaMaskContext();

  return (
    <div className="flex min-h-screen bg-[#F3E8FF] font-sans">
      {/* Sidebar - Desktop */}
      <div className="hidden md:block w-64 bg-[#9366E4] fixed h-full z-30">
        <Sidebar />
      </div>

      {/* Mobile Header */}
      <div className="md:hidden w-full fixed top-0 z-50 bg-[#9366E4] px-4 py-3 flex justify-between items-center shadow-md">
        <div className="text-white font-bold text-xl flex items-center gap-1">
          certi<span className="font-extrabold italic">chain</span>
        </div>
        <div className="flex items-center gap-2">
          <MetaMaskBadge
            connected={connected}
            address={address}
            balance={balance}
            loading={loading}
            error={error}
            connect={connect}
          />
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X className="text-white" /> : <Menu className="text-white" />}
          </button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-[#9366E4] pt-16">
          <Sidebar closeMenu={() => setIsMobileMenuOpen(false)} />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:ml-64 min-h-screen">
        {/* Desktop Header */}
        <div className="hidden md:flex items-center justify-end px-8 py-4 bg-white shadow-sm">
          <MetaMaskBadge
            connected={connected}
            address={address}
            balance={balance}
            loading={loading}
            error={error}
            connect={connect}
          />
        </div>

        <main className="flex-1 p-4 md:p-8 mt-14 md:mt-0">
          {/* This component will render Overview.jsx or AddRecord.jsx based on URL */}
          <Outlet /> 
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default HospitalDashboard;