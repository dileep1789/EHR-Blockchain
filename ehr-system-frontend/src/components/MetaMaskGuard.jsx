import React from 'react';
import { AlertCircle } from 'lucide-react';
import { useMetaMaskContext } from '../context/MetaMaskContext';

/**
 * MetaMaskGuard Component
 * Shows a blocking overlay if MetaMask is not connected
 * Allows the layout (header, sidebar) to remain visible so users can connect
 */
const MetaMaskGuard = ({ children, pageTitle = 'This Page' }) => {
  const { connected: metamaskConnected, loading } = useMetaMaskContext();

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-300 border-t-purple-600 mx-auto"></div>
          <p className="text-gray-600 font-medium">Checking MetaMask connection...</p>
        </div>
      </div>
    );
  }

  // Show blocking overlay if not connected
  if (!metamaskConnected) {
    return (
      <div className="relative flex items-center justify-center min-h-screen bg-black/30 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg text-center space-y-6 z-50">
          <div className="flex justify-center">
            <div className="bg-orange-100 p-4 rounded-full">
              <AlertCircle className="text-orange-600" size={48} />
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{pageTitle} Requires MetaMask</h2>
            <p className="text-gray-600">
              Connect your MetaMask wallet using the button in the header to access this page.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left text-sm text-blue-800 space-y-2">
            <h3 className="font-semibold text-blue-900">✓ Quick Steps:</h3>
            <ol className="list-decimal list-inside space-y-1">
              <li>Look at the <strong>top right corner</strong> of your screen</li>
              <li>Click the <span className="font-mono bg-white px-2 py-1 rounded text-xs">Connect MetaMask</span> button</li>
              <li>Approve the connection in the MetaMask popup</li>
              <li>Ensure you're on <strong>Local Hardhat Network</strong> (Chain ID: 31337)</li>
              <li>Page loads automatically ✓</li>
            </ol>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-left">
            <p className="text-sm text-orange-800">
              <strong>Don't have MetaMask?</strong> Install the browser extension from{' '}
              <a
                href="https://metamask.io"
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-600 underline font-medium hover:text-orange-700"
              >
                metamask.io
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // If connected, show the children
  return children;
};

export default MetaMaskGuard;
