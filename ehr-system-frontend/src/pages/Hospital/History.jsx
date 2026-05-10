import React, { useState, useEffect } from "react";
import { hospitalAPI } from "../../services/api";

const HistoryPage = () => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [historyData, setHistoryData] = useState([]);
  useEffect(() => {
    loadCertificates();
  }, []);

  const loadCertificates = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await hospitalAPI.getCertificates();
      const records = response.data.records || [];
      
      // Transform API data to component format
      const baseUrl = window.location.origin;
      const formattedData = records.map(cert => {
        const patientId = cert.patient_id || cert.student_id;
        const patientName = cert.patient_name || cert.student_name || cert.full_name || 'Patient';
        const txHash = cert.blockchain_tx_hash || '';
        const hasTx = txHash && txHash !== 'Pending';
        return {
          recordId: cert.record_id,
          patientId,
          patientName,
          diagnosis: cert.diagnosis || cert.course_name,
          status: cert.status || cert.grade,
          date: new Date(cert.record_date).toLocaleDateString(),
          tx: txHash || 'Pending',
          txUrl: '', // Disabled for local development
          historyUrl: patientId ? `${baseUrl}/patient/history?patientId=${patientId}` : '',
          verifyUrl: cert.record_id
            ? `${baseUrl}/verify?recordId=${cert.record_id}&download=1`
            : ''
        };
      });
      
      setHistoryData(formattedData);
    } catch (err) {
      setError(err.message || 'Failed to load records');
    } finally {
      setLoading(false);
    }
  };

  const openVerifyDownload = (url) => {
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-gray-300 px-6 py-8 md:py-10 flex items-start gap-4 shadow-sm min-h-[120px]">
        <div className="text-2xl bg-[#E9D5FF] p-2 rounded-lg shrink-0">
          <span role="img" aria-label="history-icon">
            📊
          </span>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">
            Issued HealthRecord History
          </h2>
          <p className="text-sm text-gray-400 font-medium font-sans">
            View all records issued by your institution
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          <p className="font-semibold">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {loading && (
        <div className="bg-white rounded-lg p-8 text-center text-gray-500">
          <p>Loading records...</p>
        </div>
      )}

      {!loading && historyData.length === 0 && !error && (
        <div className="bg-white rounded-lg p-8 text-center text-gray-500">
          <p className="text-lg font-semibold">No records issued yet</p>
          <p className="text-sm mt-2">Start by issuing your first record!</p>
        </div>
      )}

      {/* Main Container */}
      {!loading && historyData.length > 0 && (
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-50 overflow-hidden">
        {/* DESKTOP VIEW */}
        <div className="hidden md:block overflow-x-auto p-10">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-gray-800 font-bold text-sm border-b border-purple-100">
                <th className="pb-4 px-2">HealthRecord ID</th>
                <th className="pb-4 px-2">Patient</th>
                <th className="pb-4 px-2">Diagnosis</th>
                <th className="pb-4 px-2">Medical Status</th>
                <th className="pb-4 px-2">Issued Date</th>
                <th className="pb-4 px-2">Blockchain TX</th>
                <th className="pb-4 px-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {historyData.map((item, index) => (
                <tr
                  key={index}
                  className="text-sm text-gray-700 hover:bg-purple-50/50 transition-colors"
                >
                  <td className="py-6 px-2 font-bold text-black">
                    {item.recordId}
                  </td>
                  <td className="py-6 px-2">
                    <div className="font-semibold text-gray-900">{item.patientName}</div>
                    <div className="text-xs text-gray-500">
                      {item.historyUrl ? (
                        <a href={item.historyUrl} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">
                          {item.patientId}
                        </a>
                      ) : (
                        item.patientId
                      )}
                    </div>
                  </td>
                  <td className="py-6 px-2">{item.diagnosis}</td>
                  <td className="py-6 px-2 font-bold">{item.status}</td>
                  <td className="py-6 px-2">{item.date}</td>
                  <td className="py-6 px-2 font-mono text-xs text-gray-400 truncate max-w-30">
                    {item.txUrl ? (
                      <a href={item.txUrl} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">
                        {item.tx}
                      </a>
                    ) : (
                      item.tx
                    )}
                  </td>
                  <td className="py-6 px-2">
                    <button
                      onClick={() => openVerifyDownload(item.verifyUrl)}
                      disabled={!item.verifyUrl}
                      className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-2 rounded-full transition-colors disabled:opacity-60"
                    >
                      View HealthRecord
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* MOBILE VIEW (Stacked Cards with TX Included) */}
        <div className="md:hidden divide-y divide-gray-100">
          {historyData.map((item, index) => (
            <div key={index} className="p-6 space-y-4">
              {/* Top Row: Cert ID and Grade */}
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                    HealthRecord ID
                  </span>
                  <span className="text-sm font-bold text-black">
                    {item.recordId}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                    Status
                  </span>
                  <span className="text-sm font-bold text-purple-600">
                    {item.status}
                  </span>
                </div>
              </div>

              {/* Middle Row: Patient */}
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                  Patient
                </span>
                <p className="text-sm font-semibold text-gray-800">{item.patientName}</p>
                <p className="text-xs text-gray-500 break-all">
                  {item.historyUrl ? (
                    <a href={item.historyUrl} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">
                      {item.patientId}
                    </a>
                  ) : (
                    item.patientId
                  )}
                </p>
              </div>

              {/* Course and Date */}
              <div className="flex justify-between">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                    Diagnosis
                  </span>
                  <p className="text-sm text-gray-700">{item.diagnosis}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                    Date
                  </span>
                  <p className="text-sm text-gray-500">{item.date}</p>
                </div>
              </div>

              {/* Bottom Row: Blockchain TX + Links */}
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 space-y-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter block mb-1">
                  Blockchain Transaction
                </span>
                <p className="text-[10px] font-mono text-gray-500 break-all leading-tight">
                  {item.txUrl ? (
                    <a href={item.txUrl} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">
                      {item.tx}
                    </a>
                  ) : (
                    item.tx
                  )}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => openVerifyDownload(item.verifyUrl)}
                    disabled={!item.verifyUrl}
                    className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold px-4 py-2 rounded-full transition-colors disabled:opacity-60"
                  >
                    View HealthRecord
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      )}
    </div>
  );
};

export default HistoryPage;
