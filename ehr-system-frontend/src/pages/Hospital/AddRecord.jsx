import React, { useEffect, useRef, useState } from "react";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { hospitalAPI } from "../../services/api";
import { useMetaMaskContext } from "../../context/MetaMaskContext";
import MetaMaskGuard from "../../components/MetaMaskGuard";

const DIAGNOSIS_HISTORY_KEY = 'issueRecord.diagnosisHistory';
const STATUS_HISTORY_KEY = 'issueRecord.statusHistory';
const PATIENT_HISTORY_KEY = 'issueRecord.patientHistory';
const LAST_PATIENT_KEY = 'issueRecord.lastPatient';
const MAX_HISTORY_ITEMS = 6;

const AddRecord = () => {
  const [formData, setFormData] = useState({
    patientId: '',
    diagnosis: '',
    status: '',
  });
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [lastIssued, setLastIssued] = useState(null);
  const [patientSuggestions, setPatientSuggestions] = useState([]);
  const [searchingPatients, setSearchingPatients] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentDiagnoses, setRecentDiagnoses] = useState([]);
  const [recentStatuses, setRecentStatuses] = useState([]);
  const [recentPatients, setRecentPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const searchTimeoutRef = useRef(null);
  const previousFormRef = useRef(null);
  const toastTimeoutRef = useRef(null);
  
  // MetaMask integration from global context
  const { 
    connected: metamaskConnected, 
    address: metamaskAddress
  } = useMetaMaskContext();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  useEffect(() => {
    const query = formData.patientId.trim();

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.length < 3) {
      setPatientSuggestions([]);
      setSearchingPatients(false);
      setSearchError('');
      setHighlightedIndex(-1);
      return;
    }

    setSearchingPatients(true);
    setSearchError('');

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await hospitalAPI.searchPatients(query, 8);
        setPatientSuggestions(response.data?.patients || []);
        setHighlightedIndex(-1);
      } catch (err) {
        const errorMsg = err.response?.data?.error || 'Failed to search patients';
        setSearchError(errorMsg);
        setPatientSuggestions([]);
        setHighlightedIndex(-1);
      } finally {
        setSearchingPatients(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [formData.patientId]);

  const handleSelectPatient = (patient) => {
    setFormData(prev => ({
      ...prev,
      patientId: patient.patient_id
    }));
    setSelectedPatient(patient);
    setPatientSuggestions([]);
    setShowSuggestions(false);
    setHighlightedIndex(-1);
    updatePatientHistory(patient);
  };

  useEffect(() => {
    try {
      const storedDiagnoses = JSON.parse(localStorage.getItem(DIAGNOSIS_HISTORY_KEY) || '[]');
      const storedStatuses = JSON.parse(localStorage.getItem(STATUS_HISTORY_KEY) || '[]');
      const storedPatients = JSON.parse(localStorage.getItem(PATIENT_HISTORY_KEY) || '[]');
      const storedLastPatient = JSON.parse(localStorage.getItem(LAST_PATIENT_KEY) || 'null');
      setRecentDiagnoses(Array.isArray(storedDiagnoses) ? storedDiagnoses : []);
      setRecentStatuses(Array.isArray(storedStatuses) ? storedStatuses : []);
      setRecentPatients(Array.isArray(storedPatients) ? storedPatients : []);
      if (storedLastPatient?.patient_id) {
        setSelectedPatient(storedLastPatient);
        const mergedPatients = Array.isArray(storedPatients)
          ? [storedLastPatient, ...storedPatients.filter((item) => item.patient_id !== storedLastPatient.patient_id)]
          : [storedLastPatient];
        setRecentPatients(mergedPatients.slice(0, MAX_HISTORY_ITEMS));
      }
    } catch (error) {
      setRecentDiagnoses([]);
      setRecentStatuses([]);
      setRecentPatients([]);
    }
  }, []);

  const updateHistory = (key, value, setter) => {
    if (!value) return;
    const normalized = value.trim();
    if (!normalized) return;

    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    const filtered = Array.isArray(existing)
      ? existing.filter((item) => item !== normalized)
      : [];
    const next = [normalized, ...filtered].slice(0, MAX_HISTORY_ITEMS);

    localStorage.setItem(key, JSON.stringify(next));
    setter(next);
  };

  const updatePatientHistory = (patient) => {
    if (!patient?.patient_id) return;
    const existing = JSON.parse(localStorage.getItem(PATIENT_HISTORY_KEY) || '[]');
    const filtered = Array.isArray(existing)
      ? existing.filter((item) => item.patient_id !== patient.patient_id)
      : [];
    const next = [
      {
        patient_id: patient.patient_id,
        full_name: patient.full_name,
        email: patient.email
      },
      ...filtered
    ].slice(0, MAX_HISTORY_ITEMS);

    localStorage.setItem(PATIENT_HISTORY_KEY, JSON.stringify(next));
    setRecentPatients(next);
    localStorage.setItem(LAST_PATIENT_KEY, JSON.stringify(next[0]));
  };

  const clearHistory = (key, setter) => {
    localStorage.removeItem(key);
    setter([]);
  };

  const showToast = (type, text, duration = 3000) => {
    setMessage({ type, text });
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = setTimeout(() => {
      setMessage({ type: '', text: '' });
    }, duration);
  };

  const handleCopy = async (value, label) => {
    if (!value || value === '-') return;
    try {
      await navigator.clipboard.writeText(value);
      showToast('info', `${label} copied to clipboard`, 2000);
    } catch (error) {
      showToast('error', 'Failed to copy. Please copy manually.', 3000);
    }
  };

  const handlePatientInputKeyDown = (event) => {
    if (!showSuggestions || patientSuggestions.length === 0) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % patientSuggestions.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightedIndex((prev) => (prev <= 0 ? patientSuggestions.length - 1 : prev - 1));
    } else if (event.key === 'Enter') {
      if (highlightedIndex >= 0) {
        event.preventDefault();
        handleSelectPatient(patientSuggestions[highlightedIndex]);
      }
    } else if (event.key === 'Escape') {
      setShowSuggestions(false);
      setHighlightedIndex(-1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLastIssued(null);
    setActiveStep(0);
    
    // Validation
    if (!formData.patientId.trim() || !formData.diagnosis.trim() || !formData.status.trim()) {
      setMessage({ type: 'error', text: 'All fields are required' });
      return;
    }

    // Check MetaMask connection
    if (!metamaskConnected) {
      setMessage({ type: 'error', text: 'Please connect MetaMask from the header first' });
      return;
    }

    if (!window.ethereum || !metamaskAddress) {
      setMessage({ type: 'error', text: 'MetaMask not available. Please reconnect your wallet.' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });
    setCurrentStep('Validating details...');
    setActiveStep(1);

    previousFormRef.current = { ...formData };
    setFormData({ patientId: '', diagnosis: '', status: '' });
    setPatientSuggestions([]);
    setShowSuggestions(false);

    try {
      setCurrentStep('Preparing signature payload...');
      setActiveStep(2);

      const payloadResponse = await hospitalAPI.getSignPayload({
        patient_id: previousFormRef.current.patientId,
        diagnosis: previousFormRef.current.diagnosis,
        status: previousFormRef.current.status,
      });

      const messageHash = payloadResponse.data?.message_hash || payloadResponse.data?.messageHash;
      const recordId =
        payloadResponse.data?.record_id ||
        payloadResponse.data?.cert_id ||
        payloadResponse.data?.recordId ||
        payloadResponse.data?.certData?.recordId ||
        '-';
      const issuedDate =
        payloadResponse.data?.record_date ||
        payloadResponse.data?.recordDate ||
        payloadResponse.data?.certData?.recordDate ||
        null;

      if (!messageHash || recordId === '-') {
        throw new Error('Failed to prepare record signature payload');
      }

      setCurrentStep('Waiting for MetaMask signature...');
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [messageHash, metamaskAddress]
      });

      setCurrentStep('Submitting signed record...');

      const response = await hospitalAPI.issueSignedCertificate({
        record_id: recordId,
        patient_id: previousFormRef.current.patientId,
        diagnosis: previousFormRef.current.diagnosis,
        status: previousFormRef.current.status,
        record_date: issuedDate,
        signature,
        signer_address: metamaskAddress,
        message_hash: messageHash
      });

      const txHash = response.data?.record?.blockchain_tx_hash || response.data?.blockchain_tx_hash || response.data?.record?.blockchain?.transactionHash || '-';

      setCurrentStep('Finalizing...');
      setActiveStep(3);
      setLastIssued({ recordId, txHash });
      showToast('success', 'HealthRecord issued successfully!', 3000);
      setCurrentStep('');
      setActiveStep(0);

      updateHistory(DIAGNOSIS_HISTORY_KEY, previousFormRef.current.diagnosis, setRecentDiagnoses);
      updateHistory(STATUS_HISTORY_KEY, previousFormRef.current.status, setRecentStatuses);
      updatePatientHistory(selectedPatient);
      
    } catch (err) {
      console.error('HealthRecord issuance error:', err);
      const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to issue record';
      showToast('error', errorMsg, 4000);
      setCurrentStep('');
      setActiveStep(0);
      if (previousFormRef.current) {
        setFormData(previousFormRef.current);
      }
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { id: 1, label: 'Validate' },
    { id: 2, label: 'Submit' },
    { id: 3, label: 'Finalize' }
  ];

  return (
    <MetaMaskGuard pageTitle="Issue HealthRecord">
      <div className="max-w-4xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      {message.text && (
        <div
          className={`fixed z-50 right-6 top-6 max-w-sm rounded-xl px-4 py-3 text-sm font-semibold shadow-lg ${
            message.type === "success" ? "bg-green-600 text-white" :
            message.type === "info" ? "bg-blue-600 text-white" :
            "bg-red-600 text-white"
          }`}
        >
          {message.text}
        </div>
      )}
      {/* 1. Header Banner */}
      <div className="bg-white rounded-2xl border border-gray-300 px-6 py-8 md:py-10 flex items-center gap-5 shadow-sm min-h-[120px]">
        <div className="text-3xl bg-[#E9D5FF] p-3 rounded-xl flex items-center justify-center shrink-0">
          <span className="material-icons text-purple-600" style={{fontSize: '2rem'}}>confirmation_number</span>
        </div>
        <div className="flex flex-col justify-center">
          <h2 className="text-2xl font-bold text-gray-800 leading-tight">
            Issue HealthRecord
          </h2>
          <p className="text-sm md:text-base text-gray-400 font-medium mt-1">
            Issue a blockchain verified record for a patient
          </p>
        </div>
      </div>

      {/* 2. Main Form Card */}
      <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-2xl border border-gray-50">
        <form
          className="space-y-5 max-w-2xl mx-auto"
          onSubmit={handleSubmit}
        >
          {/* Progress indicator */}
          {loading && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4 space-y-3">
              <p className="text-sm text-purple-700 font-medium text-center">
                {currentStep || 'Processing...'}
              </p>
              <div className="grid grid-cols-3 gap-2">
                {steps.map((step, index) => {
                  const isDone = activeStep > index + 1;
                  const isActive = activeStep === index + 1;
                  const Icon = isDone ? CheckCircle2 : isActive ? Loader2 : Circle;

                  return (
                    <div key={step.id} className="flex flex-col items-center gap-2">
                      <Icon className={`${isActive ? 'animate-spin text-purple-600' : isDone ? 'text-green-600' : 'text-purple-300'}`} size={20} />
                      <span className={`text-[11px] font-semibold ${isActive ? 'text-purple-700' : isDone ? 'text-green-700' : 'text-purple-400'}`}>
                        {step.label}
                      </span>
                      <div className={`h-1.5 w-full rounded-full ${activeStep > index ? 'bg-purple-500' : 'bg-purple-200'}`} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {/* Patient ID */}
          <div className="space-y-1.5">
            <label className="block text-gray-800 font-bold text-base">
              Patient ID
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name, email, or ID"
                name="patientId"
                value={formData.patientId}
                onChange={handleChange}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                onKeyDown={handlePatientInputKeyDown}
                className="w-full p-2.5 rounded-lg border-2 border-gray-200 focus:border-[#9366E4] outline-none transition-all placeholder:text-gray-300 font-medium text-sm"
              />
              {showSuggestions && (searchingPatients || patientSuggestions.length > 0 || searchError) && (
                <div className="absolute z-20 mt-2 w-full rounded-xl border border-gray-200 bg-white shadow-lg">
                  {searchingPatients && (
                    <div className="px-4 py-3 text-sm text-gray-500">
                      Searching patients...
                    </div>
                  )}
                  {!searchingPatients && searchError && (
                    <div className="px-4 py-3 text-sm text-red-600">
                      {searchError}
                    </div>
                  )}
                  {!searchingPatients && !searchError && patientSuggestions.length === 0 && (
                    <div className="px-4 py-3 text-sm text-gray-500">
                      No patients found
                    </div>
                  )}
                  {!searchingPatients && !searchError && patientSuggestions.length > 0 && (
                    <ul className="max-h-64 overflow-y-auto py-1">
                      {patientSuggestions.map((patient) => (
                        <li key={patient.patient_id}>
                          <button
                            type="button"
                            onMouseDown={() => handleSelectPatient(patient)}
                            className={`w-full text-left px-4 py-2.5 transition-colors ${
                              highlightedIndex >= 0 && patientSuggestions[highlightedIndex]?.patient_id === patient.patient_id
                                ? 'bg-purple-50'
                                : 'hover:bg-purple-50'
                            }`}
                          >
                            <div className="text-sm font-semibold text-gray-800">
                              {patient.full_name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {patient.patient_id} · {patient.email}
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
            <p className="text-gray-400 text-[11px] font-medium">
              Type at least 3 characters to search
            </p>
            {selectedPatient && (
              <button
                type="button"
                onClick={() => handleSelectPatient(selectedPatient)}
                className="mt-2 inline-flex items-center gap-2 rounded-full border border-purple-200 bg-white px-3 py-1 text-xs font-semibold text-purple-700 hover:bg-purple-50"
              >
                Last selected: {selectedPatient.full_name}
              </button>
            )}
            {recentPatients.length > 0 && (
              <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-gray-600">Recent patients</p>
                  <button
                    type="button"
                    onClick={() => clearHistory(PATIENT_HISTORY_KEY, setRecentPatients)}
                    className="text-[11px] font-semibold text-gray-500 hover:text-gray-700"
                  >
                    Clear
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentPatients.map((patient) => (
                    <button
                      key={patient.patient_id}
                      type="button"
                      onClick={() => handleSelectPatient(patient)}
                      className="rounded-full border border-purple-200 bg-white px-3 py-1 text-xs font-semibold text-purple-700 hover:bg-purple-50"
                    >
                      {patient.full_name} · {patient.patient_id}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Diagnosis */}
          <div className="space-y-1.5">
            <label className="block text-gray-800 font-bold text-base">
              Diagnosis / Clinical Finding
            </label>
            <input
              type="text"
              placeholder="e.g. Hypertension, Seasonal Flu"
              name="diagnosis"
              value={formData.diagnosis}
              onChange={handleChange}
              className="w-full p-2.5 rounded-lg border-2 border-gray-200 focus:border-[#9366E4] outline-none transition-all placeholder:text-gray-300 font-medium text-sm"
            />
            {recentDiagnoses.length > 0 && (
              <div className="pt-1">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-gray-500">Recent diagnoses</p>
                  <button
                    type="button"
                    onClick={() => clearHistory(DIAGNOSIS_HISTORY_KEY, setRecentDiagnoses)}
                    className="text-[11px] font-semibold text-gray-500 hover:text-gray-700"
                  >
                    Clear
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                {recentDiagnoses.map((diag) => (
                  <button
                    key={diag}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, diagnosis: diag }))}
                    className="rounded-full border border-purple-200 px-3 py-1 text-xs font-semibold text-purple-700 hover:bg-purple-50"
                  >
                    {diag}
                  </button>
                ))}
                </div>
              </div>
            )}
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <label className="block text-gray-800 font-bold text-base">
              Medical Status / Note
            </label>
            <input
              type="text"
              placeholder="e.g. Stable, Recovered, Under Treatment"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full p-2.5 rounded-lg border-2 border-gray-200 focus:border-[#9366E4] outline-none transition-all placeholder:text-gray-300 font-medium text-sm"
            />
            {recentStatuses.length > 0 && (
              <div className="pt-1">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-gray-500">Recent statuses</p>
                  <button
                    type="button"
                    onClick={() => clearHistory(STATUS_HISTORY_KEY, setRecentStatuses)}
                    className="text-[11px] font-semibold text-gray-500 hover:text-gray-700"
                  >
                    Clear
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                {recentStatuses.map((stat) => (
                  <button
                    key={stat}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, status: stat }))}
                    className="rounded-full border border-purple-200 px-3 py-1 text-xs font-semibold text-purple-700 hover:bg-purple-50"
                  >
                    {stat}
                  </button>
                ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#A78BFA] hover:bg-[#8B5CF6] text-white font-extrabold py-3 rounded-xl transition-all shadow-md text-base active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Issuing HealthRecord..." : <><span className="material-icons text-base" style={{verticalAlign: 'middle'}}>rocket_launch</span> Issue HealthRecord</>}
            </button>
          </div>
          {lastIssued && (
            <div className="rounded-xl border border-purple-100 bg-purple-50/40 p-4 text-sm">
              <p className="font-semibold text-purple-700">Issued record details</p>
              <div className="mt-3 space-y-2 text-xs font-semibold text-gray-700">
                <div className="flex flex-wrap items-center gap-2">
                  <span>HealthRecord ID:</span>
                  <span className="font-mono text-gray-900">{lastIssued.recordId}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(lastIssued.recordId, 'HealthRecord ID')}
                    className="text-purple-600 hover:text-purple-700"
                  >
                    Copy
                  </button>
                </div>
                {lastIssued.txHash && lastIssued.txHash !== '-' && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span>TX Hash:</span>
                    <span className="font-mono text-gray-900 truncate max-w-[200px]">{lastIssued.txHash}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(lastIssued.txHash, 'TX hash')}
                      className="text-purple-600 hover:text-purple-700"
                    >
                      Copy
                    </button>
                  </div>
                )}
                <a
                  href={`/verify?recordId=${encodeURIComponent(lastIssued.recordId)}`}
                  className="inline-flex items-center gap-2 text-purple-700 hover:text-purple-900"
                  target="_blank"
                  rel="noreferrer"
                >
                  Open verify page
                </a>
              </div>
            </div>
          )}

          <div className="mt-8 px-6">
            <p className="text-base md:text-lg text-gray-500 text-center leading-relaxed font-medium">
              <span className="font-bold text-gray-700">Note :</span> The
              record will be stored on the blockchain. Make sure all
              information is accurate before submitting. The patient will be
              able to view and share this record once issued.
            </p>
          </div>
        </form>
      </div>
    </div>
    </MetaMaskGuard>
  );
};

export default AddRecord;
