import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Award, Upload, History, Wallet, Landmark, LogOut } from 'lucide-react';

const Sidebar = ({ closeMenu }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear hospital token
    localStorage.removeItem('hospitalToken');
    
    // Close mobile menu if open
    if (closeMenu) closeMenu();
    
    // Redirect to login
    navigate('/login');
  };
  const menuItems = [
    { name: 'Overview', path: '/hospital/dashboard', icon: <LayoutDashboard size={18} /> },
    { name: 'Issue HealthRecord', path: '/hospital/issue', icon: <Award size={18} /> },
    { name: 'Bulk Upload', path: '/hospital/bulk-issue', icon: <Upload size={18} /> },
    
    { name: 'History', path: '/hospital/history', icon: <History size={18} /> },
    { name: 'Wallet & Balance', path: '/hospital/wallet', icon: <Wallet size={18} /> },
  ];

  return (
    <div className="flex flex-col h-full p-4 text-white">
      {/* Branding */}
      <div className="flex items-center gap-2 mb-10 px-2">
        <Landmark className="opacity-80" />
        <h1 className="text-2xl font-bold">EHR<span className="text-emerald-400">Chain</span></h1>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-3">
        {menuItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            onClick={closeMenu}
            className={({ isActive }) => `
              w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium
              ${isActive 
                ? 'bg-white/30 shadow-inner font-bold border-l-4 border-white' 
                : 'hover:bg-white/10 opacity-80 hover:opacity-100'}
            `}
          >
            {item.icon}
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* Logout Footer */}
      <button 
        onClick={handleLogout}
        className="w-full bg-white/10 hover:bg-white/20 py-3 rounded-lg flex justify-center items-center gap-2 font-bold mb-4 border border-white/20 transition-colors"
      >
        <LogOut size={18} />
        Logout
      </button>
    </div>
  );
};

export default Sidebar;