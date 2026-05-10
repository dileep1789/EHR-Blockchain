import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, setAdminToken } from '../../services/api';

const AdminLogin = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
    if (error) setError('');
  }, [error]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    if (!formData.username.trim() || !formData.password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await authAPI.loginAdmin({
        username: formData.username,
        password: formData.password,
      });

      if (response.data?.token) {
        // Clear conflicting tokens
        localStorage.removeItem('patientToken');
        localStorage.removeItem('hospitalToken');
        
        setAdminToken(response.data.token);
        if (onLoginSuccess) {
          onLoginSuccess();
        }
        
        // Navigate to admin dashboard
        navigate('/admin/dashboard');
      } else {
        throw new Error(response.data?.message || 'Login failed');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [formData, error, navigate]);

  const handleBackToHome = useCallback(() => {
    window.location.href = '/';
  }, []);

  return (
    <div className="min-h-screen bg-[#eadbff] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.15)] overflow-hidden">
        <div className="bg-gradient-to-b from-[#9b6ad8] to-[#8b5de3] text-white px-6 py-6 text-center">
          <div className="mx-auto w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-7 h-7 text-amber-300" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="10" width="16" height="10" rx="2" />
              <path d="M8 10V7a4 4 0 018 0v3" />
            </svg>
          </div>
          <h1 className="mt-3 text-2xl font-bold">Admin Log In</h1>
          <p className="text-sm text-white/90 mt-1">Certi chain System Administration</p>
        </div>

        <form onSubmit={handleSubmit} className="px-8 py-8 space-y-5">
          <div>
            <input
              type="text"
              name="username"
              placeholder="User Name"
              value={formData.username}
              onChange={handleInputChange}
              disabled={loading}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8b5de3] focus:border-transparent"
              autoComplete="username"
              required
            />
          </div>

          <div>
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleInputChange}
              disabled={loading}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8b5de3] focus:border-transparent"
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#6d34d6] text-white font-semibold py-3 rounded-xl shadow-sm transition-colors hover:bg-[#5d2ec1] disabled:opacity-70"
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <div className="px-8 pb-8">
          <button
            onClick={handleBackToHome}
            className="w-full text-sm text-gray-600 flex items-center justify-center gap-2 hover:text-gray-800"
            type="button"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
