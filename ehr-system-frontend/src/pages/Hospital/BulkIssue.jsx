import React, { useRef, useState, useEffect } from "react";
import { UploadCloud } from "lucide-react";
import { hospitalAPI } from "../../services/api";
import { useMetaMaskContext } from "../../context/MetaMaskContext";
import MetaMaskGuard from "../../components/MetaMaskGuard";

const BulkUpload = () => {
  const fileInputRef = useRef(null);
  const resetTimeoutRef = useRef(null);
  const [csvData, setCsvData] = useState([]);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [preview, setPreview] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // MetaMask integration from global context
  const { 
    connected: metamaskConnected, 
    address: metamaskAddress
  } = useMetaMaskContext();

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
      }
    };
  }, []);

  const parseCSV = (text) => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const patientIdIdx = headers.indexOf('patient_id');
    const diagnosisIdx = headers.indexOf('diagnosis');
    const statusIdx = headers.indexOf('status');

    if (patientIdIdx === -1 || diagnosisIdx === -1 || statusIdx === -1) {
      return [];
    }

    const data = [];
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',');
      if (parts.length > statusIdx && parts[patientIdIdx]?.trim()) {
        data.push({
          patient_id: parts[patientIdIdx].trim(),
          diagnosis: parts[diagnosisIdx].trim(),
          status: parts[statusIdx].trim(),
        });
      }
    }
    return data;
  };

  const handleFileSelect = (file) => {
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setMessage({ type: 'error', text: 'Please upload a CSV file' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const data = parseCSV(text);

      if (data.length === 0) {
        setMessage({ 
          type: 'error', 
          text: 'Invalid CSV format. Required columns: patient_id, diagnosis, status' 
        });
        return;
      }

      if (data.length > 500) {
        setMessage({ 
          type: 'error', 
          text: 'Maximum 500 records per upload. Please split your file.' 
        });
        return;
      }

      setCsvData(data);
      setFileName(file.name);
      setPreview(data.slice(0, 5));
      setMessage({ type: 'success', text: `${file.name} ready! (${data.length} records)` });
    };
    reader.readAsText(file);
  };

  const handleDragDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = (e) => {
    handleFileSelect(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (csvData.length === 0) {
      setMessage({ type: 'error', text: 'No CSV file selected' });
      return;
    }

    // Check MetaMask connection
    if (!metamaskConnected) {
      setMessage({ type: 'error', text: 'Please connect MetaMask from the header first to sign records for blockchain' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });
    setUploadProgress(0);

    try {
      // Step 1: Prepare records for authorization
      setCurrentStep('Preparing records for blockchain...');
      setUploadProgress(10);

      setUploadProgress(30);

      // Step 2: Get authorization message from backend
      setCurrentStep('Getting authorization message...');
      const authPayload = {
        certificate_count: csvData.length,
        records: csvData.map(c => ({
          patient_id: c.patient_id,
          diagnosis: c.diagnosis,
          status: c.status
        }))
      };
      
      console.log('Sending bulk auth request:', authPayload);
      console.log('Number of records:', authPayload.records.length);
      console.log('HealthRecord count field:', authPayload.certificate_count);
      
      const authResponse = await hospitalAPI.getBulkAuthMessage(authPayload);
      
      console.log('Auth response:', authResponse);
      console.log('Auth response data:', authResponse.data);

      const messageHash = authResponse.data?.auth_hash || authResponse.data?.message_hash;
      const batchId = authResponse.data?.batch_id;
      const certificateCount = authResponse.data?.certificate_count;
      const expiry = authResponse.data?.expiry;
      
      if (!messageHash) {
        console.error('Missing auth_hash in response:', authResponse.data);
        throw new Error('Failed to get authorization hash from backend. Response: ' + JSON.stringify(authResponse.data));
      }
      
      console.log('Using auth hash:', messageHash);
      console.log('Batch ID:', batchId);
      console.log('HealthRecord count:', certificateCount);
      console.log('Expiry:', expiry);

      setUploadProgress(50);

      // Step 3: Request MetaMask signature
      setCurrentStep('Waiting for MetaMask signature...');
      setMessage({ type: 'info', text: 'Please sign the message in MetaMask to authorize bulk issuance' });
      
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [messageHash, metamaskAddress]
      });

      setUploadProgress(60);
      setMessage({ type: '', text: '' });

      // Step 4: Submit to backend for blockchain issuance and database save
      setCurrentStep('Issuing records on blockchain...');

      const blockchainPayload = {
        auth_hash: messageHash,
        auth_signature: signature,
        signer_address: metamaskAddress,
        batch_id: batchId,
        certificate_count: certificateCount,
        expiry: expiry,
        records: csvData.map(record => ({
          patient_id: record.patient_id,
          diagnosis: record.diagnosis,
          medical_status: record.status
        }))
      };
      
      console.log('Blockchain submission payload:', blockchainPayload);

      const blockchainResponse = await hospitalAPI.bulkIssueSigned(blockchainPayload);

      console.log('Blockchain response:', blockchainResponse);
      console.log('Blockchain response data:', blockchainResponse.data);
      console.log('Success count:', blockchainResponse.data?.successCount);
      console.log('Failure count:', blockchainResponse.data?.failureCount);

      // Check if blockchain submission had an error
      if (blockchainResponse.data?.error) {
        throw new Error('Blockchain submission error: ' + blockchainResponse.data.error);
      }
      
      if (!blockchainResponse.data?.success && blockchainResponse.data?.success !== undefined) {
        throw new Error('Blockchain submission failed: ' + (blockchainResponse.data?.message || 'Unknown error'));
      }

      setUploadProgress(100);
      setCurrentStep('Complete!');

      const results = blockchainResponse.data?.results || [];
      const successCount = blockchainResponse.data?.successCount ?? blockchainResponse.data?.success_count ?? results.filter(result => result.success).length;
      const failureCount = blockchainResponse.data?.failureCount ?? blockchainResponse.data?.failure_count ?? results.filter(result => !result.success).length;
      
      console.log('Final success count:', successCount);
      console.log('Final failure count:', failureCount);
      
      setMessage({ 
        type: 'success', 
        text: `Successfully issued ${successCount} records on blockchain!` + 
              (failureCount > 0 ? ` (${failureCount} failed)` : '')
      });

      // Reset form after 5 seconds
      resetTimeoutRef.current = setTimeout(() => {
        setCsvData([]);
        setFileName('');
        setPreview([]);
        setUploadProgress(0);
        setCurrentStep('');
        setMessage({ type: '', text: '' });
        if (fileInputRef.current) fileInputRef.current.value = '';
      }, 5000);
      
    } catch (err) {
      console.error('Bulk upload error:', err);
      console.error('Error response data:', err.response?.data);
      console.error('Error status:', err.response?.status);
      let errorMsg = 'Failed to upload records';
      
      if (err.code === 4001) {
        errorMsg = 'MetaMask signature rejected by user';
      } else if (err.response?.data?.error) {
        errorMsg = err.response.data.error;
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err.message) {
        errorMsg = err.message;
      }
      
      setMessage({ type: 'error', text: errorMsg });
      setUploadProgress(0);
      setCurrentStep('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MetaMaskGuard pageTitle="Bulk HealthRecord Upload">
      <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="bg-white rounded-2xl border border-gray-300 px-6 py-8 md:py-10 flex items-start gap-4 shadow-sm min-h-[120px]">
        <div className="text-3xl text-blue-500 shrink-0">
          <UploadCloud size={32} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            Bulk Upload Records
          </h2>
          <p className="text-sm md:text-base text-gray-400 font-medium">
            Upload multiple records at once using a CSV file
          </p>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-[2rem] p-6 md:p-16 shadow-2xl border border-gray-50 min-h-[400px] flex flex-col items-center justify-center">
        <div className="w-full max-w-3xl space-y-8">
          {/* CSV Format Requirements Box */}
          <div className="bg-[#E1EFFE] border-l-4 border-[#3B82F6] p-5 md:p-6 rounded-r-xl">
            <h4 className="text-[#1E42AF] font-bold text-base mb-2">
              CSV Format Requirements
            </h4>
            <p className="text-[#1E42AF] text-sm leading-relaxed">
              Your CSV file must include these columns:{" "}
              <span className="font-bold text-black">
                Patient_ID, Diagnosis, Status
              </span>
              .
              <br />
              <span className="opacity-80">
                Example: PAT123456, Hypertension, Stable.
              </span>
              <br />
              <span className="opacity-80">
                Maximum 500 records per upload.
              </span>
            </p>
          </div>

          {/* Upload Dropzone */}
          {csvData.length === 0 && (
          <div
            className="relative group"
            onDrop={handleDragDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <input
              type="file"
              accept=".csv"
              ref={fileInputRef}
              onChange={handleInputChange}
              className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
            />
            <div className="border-2 border-dashed border-[#3B82F6] rounded-2xl p-10 md:p-14 flex flex-col items-center justify-center gap-3 bg-white hover:bg-blue-50 transition-colors pointer-events-none">
              <div className="flex items-center gap-3">
                <span className="material-icons text-blue-600" style={{fontSize: '2rem'}}>folder_open</span>
                <span className="text-[#3B82F6] font-bold text-lg md:text-xl underline">
                  Click to upload CSV or drag & drop
                </span>
              </div>
              <p className="text-gray-400 text-sm font-medium">
                Maximum 500 records per upload
              </p>
            </div>
          </div>
          )}

          {/* Success/Error/Info Messages */}
          {message.text && (
            <div className={`${
              message.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 
              message.type === 'info' ? 'bg-blue-50 border-blue-200 text-blue-700' :
              'bg-red-50 border-red-200 text-red-700'
            } border rounded-lg p-4`}>
              <p className="font-semibold text-sm">{message.text}</p>
            </div>
          )}

          {/* Preview Table */}
          {preview.length > 0 && !loading && uploadProgress === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4">
                <h3 className="text-white font-bold text-lg">
                  Preview - First 5 Records
                </h3>
                <p className="text-purple-100 text-sm">
                  Total records to upload: <span className="font-bold">{csvData.length}</span>
                </p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">#</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Patient ID</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Diagnosis</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Medical Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {preview.map((row, index) => (
                      <tr key={index} className="hover:bg-purple-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{index + 1}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{row.patient_id}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{row.diagnosis}</td>
                        <td className="px-6 py-4 text-sm font-bold text-purple-600">{row.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-gray-50 px-6 py-4 flex justify-between items-center">
                <p className="text-sm text-gray-600">
                  {csvData.length > 5 ? `Showing 5 of ${csvData.length} records` : `All ${csvData.length} records shown`}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
                      setCsvData([]);
                      setFileName('');
                      setPreview([]);
                      setCurrentStep('');
                      setMessage({ type: '', text: '' });
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-100 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={loading || !metamaskConnected}
                    className="px-6 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg text-sm font-bold hover:from-purple-600 hover:to-purple-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {!metamaskConnected ? <><span className="material-icons text-sm" style={{verticalAlign: 'middle'}}>lock</span> Connect MetaMask First</> : <><span className="material-icons text-sm" style={{verticalAlign: 'middle'}}>rocket_launch</span> Issue {csvData.length} Records on Blockchain</>}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {loading && (
            <div className="bg-white rounded-xl border border-purple-200 p-6">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Processing Bulk Upload</h3>
                  {currentStep && (
                    <p className="text-sm text-purple-600 font-medium mt-1">{currentStep}</p>
                  )}
                </div>
                <span className="text-2xl font-extrabold text-purple-600">{Math.round(uploadProgress)}%</span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-purple-600 h-4 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              
              <div className="mt-4 space-y-2 text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <span className={`material-icons text-sm ${uploadProgress >= 20 ? 'text-green-600' : 'text-gray-400'}`}>check</span>
                  <span>Sync clinical records with database</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`material-icons text-sm ${uploadProgress >= 50 ? 'text-green-600' : 'text-gray-400'}`}>check</span>
                  <span>Get authorization message</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`material-icons text-sm ${uploadProgress >= 60 ? 'text-green-600' : 'text-gray-400'}`}>check</span>
                  <span>Sign with MetaMask</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`material-icons text-sm ${uploadProgress >= 100 ? 'text-green-600' : 'text-gray-400'}`}>check</span>
                  <span>Issue records on blockchain</span>
                </div>
              </div>
            </div>
          )}

          {/* Success State */}
          {uploadProgress === 100 && !loading && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-300 p-8 text-center">
              <div className="mb-4"><span className="material-icons text-green-600" style={{fontSize: '4.5rem'}}>check_circle</span></div>
              <h3 className="text-2xl font-bold text-green-700 mb-2">Upload Complete!</h3>
              <p className="text-green-600 text-lg mb-6">
                All records have been successfully issued on the blockchain
              </p>
              <button
                onClick={() => {
                  if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
                  setCsvData([]);
                  setFileName('');
                  setPreview([]);
                  setUploadProgress(0);
                  setCurrentStep('');
                  setMessage({ type: '', text: '' });
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition-all shadow-md"
              >
                Upload Another File
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
    </MetaMaskGuard>
  );
};

export default BulkUpload;
