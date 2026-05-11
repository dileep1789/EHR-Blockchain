import React, { useState } from 'react';
import { Wallet, CheckCircle, XCircle, AlertCircle, ExternalLink } from 'lucide-react';

const MetaMaskBadge = ({ connected, address, balance, loading, error, connect }) => {
  const [showDetails, setShowDetails] = useState(false);

  const shortenAddress = (addr) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  const getExplorerUrl = (addr, type = 'address') => {
    if (!address) return null;
    // Determine explorer URL based on network
    if (typeof window.MetaMask !== 'undefined') {
      const instance = new window.MetaMask();
      if (instance.chainId === 31337) {
        return null; // No public explorer for local network
      } else if (instance.chainId === 80002) {
        return `https://amoy.polygonscan.com/${type}/${addr}`;
      } else if (instance.chainId === 137) {
        return `https://polygonscan.com/${type}/${addr}`;
      }
    }
    return null; // No explorer for unknown networks
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 bg-yellow-500/10 text-yellow-600 px-3 py-2 rounded-lg border border-yellow-500/20">
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-yellow-600 border-t-transparent"></div>
        <span className="text-sm font-medium">Connecting...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 bg-red-500/10 text-red-600 px-3 py-2 rounded-lg border border-red-500/20">
        <XCircle size={16} />
        <span className="text-sm font-medium">MetaMask Error</span>
      </div>
    );
  }

  if (!connected) {
    return (
      <button
        onClick={connect}
        className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 py-2 rounded-lg transition-all shadow-md hover:shadow-lg font-medium"
      >
        <Wallet size={18} />
        <span className="hidden sm:inline">Connect MetaMask</span>
        <span className="sm:hidden">Connect</span>
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="flex items-center gap-2 bg-green-500/10 text-green-700 px-3 py-2 rounded-lg border border-green-500/30 hover:bg-green-500/20 transition-all"
      >
        <CheckCircle size={16} className="text-green-600" />
        <span className="font-mono text-sm hidden md:inline">{shortenAddress(address)}</span>
        <span className="text-xs font-medium text-green-600 hidden lg:inline">
          {balance} {typeof window.MetaMask !== 'undefined' && new window.MetaMask().chainId === 31337 ? 'ETH' : 'POL'}
        </span>
      </button>

      {/* Dropdown Details */}
      {showDetails && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDetails(false)}
          />
          
          {/* Details Card */}
          <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Wallet size={18} className="text-green-600" />
                MetaMask Connected
              </h3>
              <CheckCircle size={18} className="text-green-600" />
            </div>

            <div className="space-y-3">
              {/* Network */}
              <div className="bg-purple-50 rounded p-2">
                <p className="text-xs text-gray-500 mb-1">Network</p>
                <p className="font-medium text-purple-700 flex items-center gap-1">
                  <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>
                  {address && typeof window.MetaMask !== 'undefined' && new window.MetaMask().getNetworkName ? new window.MetaMask().getNetworkName() : 'Connected Network'}
                </p>
              </div>

              {/* Address */}
              <div className="bg-gray-50 rounded p-2">
                <p className="text-xs text-gray-500 mb-1">Wallet Address</p>
                <p className="font-mono text-sm text-gray-800 break-all">{address}</p>
              </div>

              {/* Balance */}
              <div className="bg-green-50 rounded p-2">
                <p className="text-xs text-gray-500 mb-1">Balance</p>
                <p className="font-bold text-green-700 text-lg">{balance} {address && typeof window.MetaMask !== 'undefined' && new window.MetaMask().chainId === 31337 ? 'ETH' : 'POL'}</p>
              </div>

              {/* View on Explorer */}
              {getExplorerUrl(address) ? (
                <a
                  href={getExplorerUrl(address)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors"
                >
                  <ExternalLink size={16} />
                  View on Block Explorer
                </a>
              ) : (
                <div className="flex items-center justify-center gap-2 w-full bg-gray-400 text-white py-2 px-3 rounded-lg text-sm font-medium opacity-60 cursor-not-allowed">
                  <ExternalLink size={16} />
                  Local Network (No Explorer)
                </div>
              )}

              {/* Info */}
              <div className="flex items-start gap-2 bg-blue-50 rounded p-2 text-xs text-blue-700">
                <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                <p>This wallet is used to sign records for blockchain submission.</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MetaMaskBadge;
