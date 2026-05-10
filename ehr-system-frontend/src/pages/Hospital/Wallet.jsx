import React, { useEffect, useState } from "react";
import { Copy, CheckCircle2 } from "lucide-react";
import { hospitalAPI, paymentAPI } from "../../services/api";
import { useMetaMaskContext } from "../../context/MetaMaskContext";
import MetaMaskGuard from "../../components/MetaMaskGuard";

const WalletPage = () => {
  const [walletData, setWalletData] = useState({
    balance: '0.00',
    gasSpent: '0.00',
    walletAddress: '-',
    estimatedGasCost: '0.009000',
    totalRecords: 0,
    totalGasSpentEstimate: '0.0000'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [copied, setCopied] = useState(false);
  const [depositing, setDepositing] = useState(false);
  
  // MetaMask integration from global context
  const { 
    connected: metamaskConnected, 
    address: metamaskAddress, 
    balance: metamaskBalance,
    contractBalance,
    deposit: depositToContract,
    connect: connectMetaMask,
    loading: metamaskLoading,
    error: metamaskError
  } = useMetaMaskContext();

  const displayBalance = metamaskConnected && contractBalance ? contractBalance : walletData.balance;

  useEffect(() => {
    // Only load wallet data if MetaMask is connected
    if (metamaskConnected) {
      loadWalletData();
    } else {
      setLoading(false);
    }
  }, [metamaskConnected]);

  const loadWalletData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Safety check: only proceed if MetaMask is connected
      if (!metamaskConnected) {
        setLoading(false);
        return;
      }
      
      // Step 1: Get profile to get wallet address
      const profileResponse = await hospitalAPI.getProfile();
      const profile = profileResponse.data;

      const walletAddr = profile?.hospital?.wallet_address || 
                        profile?.hospital?.walletAddress || 
                        profile?.wallet_address || '-';
      
      if (walletAddr === '-') {
        setError('No wallet address assigned to your institution');
        setLoading(false);
        return;
      }

      // Step 2: Get dashboard stats for total records
      let totalRecordsCount = 0;
      try {
        const dashboardResponse = await hospitalAPI.getDashboard();
        const dashboardData = dashboardResponse.data || {};
        totalRecordsCount =
          dashboardData.totalRecordsIssued ??
          dashboardData.totalRecords ??
          dashboardData.total_records ??
          dashboardData.totalCertificatesIssued ??
          dashboardData.totalCertificates ??
          0;
      } catch {
        totalRecordsCount = 0;
      }

      // Step 3: Get balance from payment/balance endpoint using wallet address
      let estimatedGasCost = '0.009000'

      try {
        const gasResponse = await paymentAPI.getGasCost()
        const gasPol = gasResponse.data?.data?.pol
        if (gasPol) {
          estimatedGasCost = parseFloat(gasPol).toFixed(6)
        }
      } catch {
        estimatedGasCost = '0.009000'
      }

      const totalGasSpentEstimate = (
        parseFloat(estimatedGasCost || '0') * Number(totalRecordsCount || 0)
      ).toFixed(4);

      try {
        const balanceResponse = await paymentAPI.getBalance(walletAddr);
        const balancePayload = balanceResponse.data?.data || balanceResponse.data || {};
        const balancePolRaw =
          balancePayload.balancePol ??
          balancePayload.balance_pol ??
          balancePayload.balance ??
          '0.00';
        const gasSpentPolRaw =
          balancePayload.gasSpentPol ??
          balancePayload.gas_spent_pol ??
          balancePayload.gasSpent ??
          balancePayload.gas_spent ??
          null;
        const gasSpentWeiRaw =
          balancePayload.gasSpentWei ??
          balancePayload.gas_spent_wei ??
          null;

        const balancePol = parseFloat(balancePolRaw || '0.00').toFixed(4);
        let gasSpentPol = '0.0000';
        if (gasSpentPolRaw !== null && gasSpentPolRaw !== undefined) {
          gasSpentPol = parseFloat(gasSpentPolRaw || '0').toFixed(4);
        } else if (gasSpentWeiRaw !== null && gasSpentWeiRaw !== undefined) {
          gasSpentPol = (parseFloat(gasSpentWeiRaw || '0') / 1e18).toFixed(4);
        }

        setWalletData({
          balance: balancePol,
          gasSpent: gasSpentPol,
          walletAddress: walletAddr,
          estimatedGasCost,
          totalRecords: Number(totalRecordsCount || 0),
          totalGasSpentEstimate
        });
      } catch (balanceErr) {
        // Fallback: show wallet address but unable to load balance
        setWalletData(prev => ({
          ...prev,
          walletAddress: walletAddr,
          balance: '0.00',
          gasSpent: '0.00',
          estimatedGasCost,
          totalRecords: Number(totalRecordsCount || 0),
          totalGasSpentEstimate
        }));
        setError('Unable to load balance information. Please try again later.');
      }
    } catch (err) {
      setError(err.message || 'Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAddress = () => {
    if (walletData.walletAddress !== '-') {
      navigator.clipboard.writeText(walletData.walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDeposit = async (e) => {
    e.preventDefault();
    
    if (!depositAmount || isNaN(depositAmount) || parseFloat(depositAmount) <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid amount' });
      return;
    }

    // Check if MetaMask is connected
    if (!metamaskConnected) {
      setMessage({ 
        type: 'error', 
        text: 'Please connect MetaMask first to deposit POL' 
      });
      return;
    }

    setMessage({ type: '', text: '' });
    setDepositing(true);
    
    try {
      // Call MetaMask deposit function
      const result = await depositToContract(depositAmount);
      
      setMessage({ 
        type: 'success', 
        text: `Successfully deposited ${depositAmount} POL! TX: ${result.hash.substring(0, 10)}...${result.hash.substring(result.hash.length - 8)}` 
      });
      
      setDepositAmount('');
      
      // Reload wallet data after deposit
      setTimeout(() => {
        loadWalletData();
      }, 2000);
      
    } catch (err) {
      setMessage({ 
        type: 'error', 
        text: `Deposit failed: ${err.message}` 
      });
    } finally {
      setDepositing(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading wallet information...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <MetaMaskGuard pageTitle="Wallet & Balance">
      <div className="max-w-5xl mx-auto space-y-5 animate-in fade-in duration-500 pb-10">
      {/* 1. Header Banner - Increased Height & Padding */}
      <div className="bg-white rounded-2xl border border-gray-300 px-6 py-8 md:py-10 flex items-center gap-5 shadow-sm min-h-[120px]">
        <div className="text-3xl bg-orange-50 p-3 rounded-xl flex items-center justify-center shrink-0">
          <span className="material-icons text-orange-600" style={{fontSize: '2rem'}}>account_balance_wallet</span>
        </div>
        <div className="flex flex-col justify-center">
          <h2 className="text-2xl font-bold text-gray-800 leading-tight">
            Wallet & Balance Management
          </h2>
          <p className="text-sm md:text-base text-gray-400 font-medium mt-1">
            View your prepaid balance and manage record issuance funds
          </p>
        </div>
      </div>

      {/* Error Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          <p className="font-semibold">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {metamaskError && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-orange-700">
          <p className="font-semibold">MetaMask Error</p>
          <p className="text-sm">{metamaskError}</p>
        </div>
      )}

      {/* 2. Current Balance Gradient Card - Slimmer & Smaller Font */}
      <div className="bg-gradient-to-r from-[#9366E4] to-[#7C3AED] rounded-2xl p-5 md:p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col items-center md:items-start">
          <p className="text-[10px] md:text-xs font-bold opacity-80 uppercase tracking-wider mb-1">
            Current Balance
          </p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              {displayBalance}
            </h3>
            <span className="text-[10px] md:text-xs font-bold opacity-70 uppercase">
              POL
            </span>
          </div>
        </div>
        <div className="absolute -right-5 -bottom-5 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
      </div>

      {/* 3. Wallet Address Section - Compact */}
      <div className="bg-[#DBEAFE]/40 rounded-xl p-4 border border-[#BFDBFE]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-col">
            <h4 className="text-[10px] uppercase font-bold text-[#1E42AF] mb-1">
              Wallet Address
            </h4>
            <p className="text-xs font-mono text-gray-600 break-all bg-white/40 p-2 rounded">
              {walletData.walletAddress}
            </p>
          </div>
          <button
            onClick={handleCopyAddress}
            className="bg-[#8B5CF6] text-white text-[10px] font-bold px-4 py-2 rounded-lg hover:bg-[#7C3AED] flex items-center gap-2 w-max h-max"
          >
            <Copy size={12} /> {copied ? "Copied" : "Copy Address"}
          </button>
        </div>
      </div>

      {/* 4. Balance Breakdown Cards - Reduced Height */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-sm font-bold text-gray-800 mb-4 px-1">
          Balance Breakdown
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-xl border-l-4 border-blue-400 shadow-sm border border-gray-50 flex flex-col justify-center min-h-[90px]">
            <p className="text-[11px] font-bold text-gray-500 mb-1">
              Prepaid Balance
            </p>
            <p className="text-2xl font-extrabold text-black">{displayBalance}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border-l-4 border-blue-400 shadow-sm border border-gray-50 flex flex-col justify-center min-h-[90px]">
            <p className="text-[11px] font-bold text-gray-500 mb-1">
              Total GAS spent (estimate)
            </p>
            <p className="text-2xl font-extrabold text-black">{walletData.totalGasSpentEstimate}</p>
            <p className="text-[10px] text-gray-500 font-semibold mt-1">
              {walletData.totalRecords} records × {walletData.estimatedGasCost} POL
            </p>
          </div>
        </div>
      </div>

      {/* 5. Top-Up Section - Compact */}
      <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100 space-y-4">
        <h3 className="text-base font-bold text-gray-800">
          Top-Up Your Balance
        </h3>

        <div className="bg-[#DBEAFE] border-l-4 border-[#3B82F6] p-4 rounded-r-lg">
          <p className="text-[#1E42AF] text-[11px] leading-tight font-medium">
            Connect MetaMask and deposit POL. Gas fees are deducted per
            issuance.
          </p>
        </div>

        <div className={`${metamaskConnected ? 'bg-[#DCFCE7] border-[#BBF7D0]' : 'bg-orange-50 border-orange-200'} border p-2.5 rounded-lg flex items-center justify-between gap-2`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 size={14} className={metamaskConnected ? "text-green-600" : "text-orange-600"} />
            <p className={`${metamaskConnected ? 'text-[#15803D]' : 'text-orange-700'} font-bold text-[11px]`}>
              MetaMask Status :{" "}
              <span className="font-medium text-gray-600 ml-1">
                {metamaskConnected ? "Connected" : "Not Connected"}
              </span>
            </p>
          </div>
          {!metamaskConnected && (
            <button
              onClick={connectMetaMask}
              disabled={metamaskLoading}
              className="bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all disabled:opacity-60"
            >
              {metamaskLoading ? "Connecting..." : "Connect"}
            </button>
          )}
        </div>

        {metamaskConnected && (
          <div className="bg-purple-50 border border-purple-200 p-3 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-purple-700 font-bold text-[10px] uppercase tracking-wide mb-1">
                  MetaMask Wallet Balance
                </p>
                <p className="text-2xl font-extrabold text-purple-900">
                  {metamaskBalance || '0.00'} <span className="text-sm font-bold text-purple-600">POL</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-purple-600 font-medium">Connected Address</p>
                <p className="text-[10px] font-mono text-purple-800">
                  {metamaskAddress ? `${metamaskAddress.slice(0, 6)}...${metamaskAddress.slice(-4)}` : '-'}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-gray-700">
            Amount (POL)
          </label>
          <input
            type="text"
            placeholder="0.00"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            className="w-full p-2.5 rounded-lg border-2 border-gray-100 focus:border-[#9366E4] outline-none text-sm font-medium"
          />
        </div>

        <button
          onClick={handleDeposit}
          disabled={depositing}
          className="w-full bg-[#A78BFA] hover:bg-[#8B5CF6] text-white font-bold py-3 rounded-lg text-sm shadow-md active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {depositing ? "Depositing..." : "Deposit POL"}
        </button>

        {message.text && (
          <div
            className={`text-xs font-semibold ${
              message.type === "success" ? "text-green-600" : "text-red-600"
            }`}
          >
            {message.text}
          </div>
        )}
      </div>

      {/* 6. Cost Estimation - Original Blue Style with Reduced Height */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-50">
        <h3 className="text-center text-lg font-bold text-gray-800 mb-4">
          HealthRecord Cost Estimation
        </h3>
        <hr className="mb-5 border-gray-100" />

        {/* The container below keeps your original blue theme but is now much slimmer */}
        <div className="bg-[#DBEAFE] border-l-4 border-[#3B82F6] px-6 py-4 rounded-r-xl max-w-2xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <p className="text-[#1E42AF] font-bold text-sm">Average GAS cost</p>
            <p className="text-[10px] text-[#1E42AF] opacity-70 font-medium hidden md:block">
              Based on current network congestion
            </p>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-black">{walletData.estimatedGasCost}</span>
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
              POL per record
            </span>
          </div>
        </div>
      </div>
    </div>
    </MetaMaskGuard>
  );
};

export default WalletPage;
