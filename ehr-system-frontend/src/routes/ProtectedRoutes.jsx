import { Navigate } from 'react-router-dom'
import { getPatientToken, getHospitalToken, getAdminToken } from '../services/api'
import { useMetaMaskContext } from '../context/MetaMaskContext'
import { AlertCircle } from 'lucide-react'

/**
 * ProtectedRoute component for Patient routes
 * Redirects to /login if patient is not authenticated
 */
export function ProtectedPatientRoute({ children }) {
  const patientToken = getPatientToken()
  
  if (!patientToken) {
    return <Navigate to="/login" replace />
  }
  
  return children
}

/**
 * ProtectedRoute component for Hospital routes
 * Redirects to /login if hospital is not authenticated
 */
export function ProtectedHospitalRoute({ children }) {
  const instituteToken = getHospitalToken()
  
  if (!instituteToken) {
    return <Navigate to="/login" replace />
  }
  
  return children
}

/**
 * ProtectedRoute component for Admin routes
 * Redirects to /admin/login if admin is not authenticated
 */
export function ProtectedAdminRoute({ children }) {
  const adminToken = getAdminToken()
  
  if (!adminToken) {
    return <Navigate to="/admin/login" replace />
  }
  
  return children
}

/**
 * ProtectedMetaMaskRoute component
 * Shows a blocking UI if MetaMask is not connected
 * Used for pages that require blockchain interaction (Issue, Bulk Issue, Wallet)
 */
export function ProtectedMetaMaskRoute({ children }) {
  const { connected: metamaskConnected, address, loading } = useMetaMaskContext()

  console.log('ProtectedMetaMaskRoute:', { metamaskConnected, address, loading });

  // Show loading state while checking connection
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-purple-100">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-300 border-t-purple-600 mx-auto"></div>
          <p className="text-gray-600 font-medium">Checking MetaMask connection...</p>
        </div>
      </div>
    )
  }

  // Show blocking UI if MetaMask is not connected
  if (!metamaskConnected) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-purple-50 to-purple-100 z-50 p-4 w-full h-screen">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg text-center space-y-6">
          <div className="flex justify-center">
            <div className="bg-orange-100 p-4 rounded-full">
              <AlertCircle className="text-orange-600" size={48} />
            </div>
          </div>
          
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">MetaMask Required</h2>
            <p className="text-gray-600 mb-4">
              This page requires MetaMask to be connected to interact with the blockchain. Connect your wallet using the button in the header.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left text-sm text-blue-800 space-y-2">
            <h3 className="font-semibold text-blue-900">✓ Steps to Connect:</h3>
            <ol className="list-decimal list-inside space-y-1">
              <li>Look at the <strong>top right</strong> of your screen (or top of mobile menu)</li>
              <li>Click the <span className="font-mono bg-white px-2 py-1 rounded mx-1">Connect MetaMask</span> button</li>
              <li>Approve the connection in the MetaMask popup</li>
              <li>Make sure you're on <strong>Polygon Amoy Testnet</strong></li>
              <li>This page will load automatically</li>
            </ol>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-left space-y-2">
            <h3 className="font-semibold text-orange-900 flex items-center gap-2">
              <AlertCircle size={18} />
              No MetaMask?
            </h3>
            <p className="text-sm text-orange-800">
              Install the MetaMask browser extension from <a href="https://metamask.io" target="_blank" rel="noopener noreferrer" className="text-orange-600 underline font-medium">metamask.io</a>
            </p>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-3 px-6 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg"
          >
            <span className="material-icons text-base" style={{verticalAlign: 'middle'}}>refresh</span> Refresh Page
          </button>
        </div>
      </div>
    )
  }

  // If MetaMask is connected, show the children
  return children
}
