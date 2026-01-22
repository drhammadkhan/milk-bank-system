import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { batches } from '../api';
import {
  CheckCircle,
  Clock,
  Play,
  Zap,
  ArrowLeft,
  AlertCircle,
  Printer,
  Download,
  ChevronDown,
} from 'lucide-react';

interface BatchDetail {
  id: string;
  batch_code: string;
  status: string;
  created_at: string;
  donation_ids?: string[];
  pasteurisation_records?: any[];
  samples?: any[];
  hospital_number?: string;
  donor_name?: string;
  donor_hospital_number?: string;
  batch_date?: string;
  total_volume_ml?: number;
  number_of_bottles?: number;
}

export const BatchDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [batch, setBatch] = useState<BatchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [printing, setPrinting] = useState(false);
  const [directPrinting, setDirectPrinting] = useState(false);
  const [showPrintOptions, setShowPrintOptions] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'pre-pasteurisation-micro' | 'pasteurisation' | 'microbiology'>('overview');
  const [sample1Result, setSample1Result] = useState('');
  const [sample2Result, setSample2Result] = useState('');
  const [sample1Details, setSample1Details] = useState('');
  const [sample2Details, setSample2Details] = useState('');
  const [prePasteurisationDate, setPrePasteurisationDate] = useState('');
  const [prePasteurisationComments, setPrePasteurisationComments] = useState('');
  const [savingPrePasteurisation, setSavingPrePasteurisation] = useState(false);
  const [prePasteurisationSaved, setPrePasteurisationSaved] = useState(false);
  const [pasteurisationData, setPasteurisationData] = useState({
    operatorId: '',
    deviceId: '',
    startTime: '',
    endTime: '',
    temperature: '',
    duration: '',
    notes: '',
    completionNotes: ''
  });
  const [pasteurisationStarted, setPasteurisationStarted] = useState(false);
  const [pasteurisationRecordId, setPasteurisationRecordId] = useState<string | null>(null);
  const [postSample1Result, setPostSample1Result] = useState('');
  const [postSample2Result, setPostSample2Result] = useState('');
  const [postSample1Details, setPostSample1Details] = useState('');
  const [postSample2Details, setPostSample2Details] = useState('');
  const [postPasteurisationDate, setPostPasteurisationDate] = useState('');
  const [postPasteurisationComments, setPostPasteurisationComments] = useState('');
  const [savingPostPasteurisation, setSavingPostPasteurisation] = useState(false);
  const [postPasteurisationSaved, setPostPasteurisationSaved] = useState(false);

  useEffect(() => {
    if (id) loadBatch();
  }, [id]);

  // Load pasteurisation data from localStorage
  useEffect(() => {
    if (id) {
      const savedData = localStorage.getItem(`pasteurisation-${id}`);
      const savedStarted = localStorage.getItem(`pasteurisation-started-${id}`);
      
      if (savedData) {
        try {
          setPasteurisationData(JSON.parse(savedData));
        } catch (e) {
          console.error('Failed to parse saved pasteurisation data:', e);
        }
      }
      
      if (savedStarted) {
        setPasteurisationStarted(savedStarted === 'true');
      }
    }
  }, [id]);

  // Save pasteurisation data to localStorage whenever it changes
  useEffect(() => {
    if (id && (pasteurisationData.operatorId || pasteurisationData.deviceId || pasteurisationData.startTime || pasteurisationData.temperature || pasteurisationData.notes || pasteurisationData.endTime || pasteurisationData.duration)) {
      localStorage.setItem(`pasteurisation-${id}`, JSON.stringify(pasteurisationData));
    }
  }, [pasteurisationData, id]);

  // Save pasteurisation started state to localStorage whenever it changes
  useEffect(() => {
    if (id) {
      localStorage.setItem(`pasteurisation-started-${id}`, pasteurisationStarted.toString());
    }
  }, [pasteurisationStarted, id]);

  const loadBatch = async () => {
    try {
      setLoading(true);
      const res = await batches.get(id!);
      setBatch(res.data);
    } catch (err: any) {
      console.error('Error loading batch:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadLabels = async () => {
    try {
      setPrinting(true);
      const res = await batches.getLabelsZpl(id!);
      
      // Create blob from response data
      const blob = new Blob([res.data], { type: 'text/plain' });
      
      // Create download link and trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${batch?.batch_code}_labels.zpl`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      alert(`ZPL file downloaded! Send to your Zebra ZD410 printer.`);
    } catch (err: any) {
      alert('Failed to generate labels: ' + (err.response?.data?.detail || err.message));
    } finally {
      setPrinting(false);
      setShowPrintOptions(false);
    }
  };

  const handleDirectPrint = async () => {
    try {
      setDirectPrinting(true);
      await batches.print(id!);
      alert(`Labels sent to printer successfully!`);
    } catch (err: any) {
      alert('Print failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setDirectPrinting(false);
      setShowPrintOptions(false);
    }
  };

  const handleSavePrePasteurisationResults = async () => {
    if (!sample1Result || !sample2Result) {
      alert('Please select results for both samples');
      return;
    }

    try {
      setSavingPrePasteurisation(true);
      
      // Note: Using samples API from frontend/src/api.ts
      const sample1Payload = { sample_code: `${batch?.batch_code}-PRE-1` };
      const sample1Response = await batches.createSample(id!, sample1Payload);

      await batches.postSampleResult(sample1Response.data.sample_id, {
        test_type: 'culture',
        organism: sample1Result === 'positive-culture' ? sample1Details : null,
        threshold_flag: sample1Result === 'positive-culture',
        notes: sample1Details || undefined,
        posted_by: 'system'
      });

      const sample2Payload = { sample_code: `${batch?.batch_code}-PRE-2` };
      const sample2Response = await batches.createSample(id!, sample2Payload);

      await batches.postSampleResult(sample2Response.data.sample_id, {
        test_type: 'culture',
        organism: sample2Result === 'positive-culture' ? sample2Details : null,
        threshold_flag: sample2Result === 'positive-culture',
        notes: sample2Details || undefined,
        posted_by: 'system'
      });

      await loadBatch();
      setPrePasteurisationSaved(true);
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to save results');
    } finally {
      setSavingPrePasteurisation(false);
    }
  };

  const handleClearPrePasteurisationForm = () => {
    setSample1Result('');
    setSample2Result('');
    setSample1Details('');
    setSample2Details('');
    setPrePasteurisationDate('');
    setPrePasteurisationComments('');
    setPrePasteurisationSaved(false);
  };

  const handleEditPrePasteurisationResults = () => {
    setPrePasteurisationSaved(false);
  };

  const handleSavePostPasteurisationResults = async () => {
    if (!id || !postPasteurisationDate || !postSample1Result || !postSample2Result) {
      alert('Please fill in all required fields');
      return;
    }

    setSavingPostPasteurisation(true);
    try {
      // Create two post-pasteurisation samples
      const sample1 = await batches.createSample(id, {
        sample_type: 'post-pasteurisation',
        user_id: 'system',
        sample_code: `${batch?.batch_code}-POST-1`
      });

      const sample2 = await batches.createSample(id, {
        sample_type: 'post-pasteurisation',
        user_id: 'system',
        sample_code: `${batch?.batch_code}-POST-2`
      });

      // Post results for sample 1
      await batches.postSampleResult(sample1.data.sample_id, {
        test_type: 'culture',
        organism: postSample1Result === 'positive-culture' ? postSample1Details : null,
        threshold_flag: postSample1Result === 'positive-culture',
        notes: postSample1Details || undefined,
        posted_by: 'system'
      });

      // Post results for sample 2
      await batches.postSampleResult(sample2.data.sample_id, {
        test_type: 'culture',
        organism: postSample2Result === 'positive-culture' ? postSample2Details : null,
        threshold_flag: postSample2Result === 'positive-culture',
        notes: postSample2Details || undefined,
        posted_by: 'system'
      });

      // Process results and auto-update batch status (Released or TestingFailed)
      await batches.processPostPasteurisation(id);

      await loadBatch();
      setPostPasteurisationSaved(true);
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to save results');
    } finally {
      setSavingPostPasteurisation(false);
    }
  };

  const handleClearPostPasteurisationForm = () => {
    setPostSample1Result('');
    setPostSample2Result('');
    setPostSample1Details('');
    setPostSample2Details('');
    setPostPasteurisationDate('');
    setPostPasteurisationComments('');
    setPostPasteurisationSaved(false);
  };

  const handleEditPostPasteurisationResults = () => {
    setPostPasteurisationSaved(false);
  };

  const handleStartPasteurisation = async () => {
    if (!id || !pasteurisationData.operatorId || !pasteurisationData.deviceId) {
      alert('Operator ID and Device ID are required');
      return;
    }

    try {
      const response = await batches.startPasteurisation(id, {
        operator_id: pasteurisationData.operatorId,
        device_id: pasteurisationData.deviceId
      });
      
      setPasteurisationRecordId(response.data.record_id);
      await loadBatch();
      setPasteurisationStarted(true);
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to start pasteurisation');
    }
  };

  const handleCompletePasteurisation = async () => {
    if (!id || !pasteurisationData.operatorId || !pasteurisationRecordId) {
      alert('Operator ID is required and pasteurisation must be started first');
      return;
    }

    try {
      await batches.completePasteurisation(id, {
        operator_id: pasteurisationData.operatorId,
        record_id: pasteurisationRecordId,
        result_notes: pasteurisationData.completionNotes || undefined
      });
      
      await loadBatch();
      setPasteurisationStarted(true);
      // Clear localStorage after successful completion
      localStorage.removeItem(`pasteurisation-${id}`);
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to complete pasteurisation');
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-600">Loading batch...</div>;
  }

  if (!batch) {
    return <div className="p-8 text-center text-red-600">Batch not found</div>;
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pasteurised':
        return <CheckCircle className="text-green-600" size={20} />;
      case 'Pasteurising':
        return <Clock className="text-blue-600 animate-spin" size={20} />;
      case 'MicroTestPending':
        return <AlertCircle className="text-yellow-600" size={20} />;
      case 'Released':
        return <CheckCircle className="text-purple-600" size={20} />;
      default:
        return <Clock className="text-gray-600" size={20} />;
    }
  };

  return (
    <div>
      <button
        onClick={() => navigate('/batches')}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6"
      >
        <ArrowLeft size={18} />
        Back to Batches
      </button>

      <div className="mb-6">
        <h1 className="text-4xl font-bold text-gray-900">Batch Processing</h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              {getStatusIcon(batch.status)}
              <h2 className="text-3xl font-bold text-gray-900">{batch.batch_code}</h2>
            </div>
            <p className="text-gray-600">
              Created {new Date(batch.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setShowPrintOptions(!showPrintOptions)}
                disabled={printing || directPrinting}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
              >
                <Printer size={18} />
                {(printing || directPrinting) ? 'Processing...' : 'Print Labels'}
                <ChevronDown size={16} />
              </button>
              
              {/* Print Options Dropdown */}
              {showPrintOptions && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  <button
                    onClick={handleDirectPrint}
                    disabled={directPrinting}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 disabled:opacity-50"
                  >
                    <Printer size={18} className="text-green-600" />
                    <div>
                      <div className="font-medium">Direct Print</div>
                      <div className="text-sm text-gray-600">Send to configured printer</div>
                    </div>
                  </button>
                  <button
                    onClick={handleDownloadLabels}
                    disabled={printing}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 disabled:opacity-50 border-t"
                  >
                    <Download size={18} className="text-blue-600" />
                    <div>
                      <div className="font-medium">Download ZPL</div>
                      <div className="text-sm text-gray-600">Save file to send later</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
            <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full font-medium">
              {batch.status}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b mb-6">
          {(['overview', 'pre-pasteurisation-micro', 'pasteurisation', 'microbiology'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 font-medium transition ${
                activeTab === tab
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab === 'pre-pasteurisation-micro' 
                ? 'Pre-pasteurisation Microbiology'
                : tab === 'microbiology'
                ? 'Post-pasteurisation Microbiology'
                : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Batch Code</label>
                <p className="text-lg font-mono text-gray-900">{batch.batch_code}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Status</label>
                <p className="text-lg text-gray-900">{batch.status}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Created At</label>
                <p className="text-lg text-gray-900">
                  {new Date(batch.created_at).toLocaleString()}
                </p>
              </div>
              {batch.batch_date && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Batch Date</label>
                  <p className="text-lg text-gray-900">
                    {new Date(batch.batch_date).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
            <div className="space-y-4">
              {(batch.hospital_number || batch.donor_hospital_number) && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Hospital Number</label>
                  <p className="text-lg text-gray-900">{batch.hospital_number || batch.donor_hospital_number}</p>
                </div>
              )}
              {batch.donor_name && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Donor Name</label>
                  <p className="text-lg text-gray-900">{batch.donor_name}</p>
                </div>
              )}
              {batch.total_volume_ml !== undefined && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Total Volume</label>
                  <p className="text-lg text-gray-900">{batch.total_volume_ml} ml</p>
                </div>
              )}
              {batch.number_of_bottles && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Number of Bottles</label>
                  <p className="text-lg text-gray-900">{batch.number_of_bottles}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pre-pasteurisation Microbiology Tab */}
        {activeTab === 'pre-pasteurisation-micro' && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">Pre-pasteurisation Microbiology Testing</h3>
              <p className="text-sm text-blue-800 mb-4">
                Record microbiology test results before pasteurisation to assess the initial quality of the milk batch.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date Taken
                </label>
                <input
                  type="date"
                  value={prePasteurisationDate}
                  onChange={(e) => setPrePasteurisationDate(e.target.value)}
                  disabled={prePasteurisationSaved}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Result for Sample 1
                </label>
                <select 
                  value={sample1Result}
                  onChange={(e) => setSample1Result(e.target.value)}
                  disabled={prePasteurisationSaved}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Select result</option>
                  <option value="negative-culture">Negative Culture</option>
                  <option value="positive-culture">Positive Culture</option>
                </select>
                {sample1Result === 'positive-culture' && (
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sample 1 Results Detail
                    </label>
                    <textarea
                      value={sample1Details}
                      onChange={(e) => setSample1Details(e.target.value)}
                      rows={2}
                      disabled={prePasteurisationSaved}
                      placeholder="Enter details of positive culture results"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Result for Sample 2
                </label>
                <select 
                  value={sample2Result}
                  onChange={(e) => setSample2Result(e.target.value)}
                  disabled={prePasteurisationSaved}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Select result</option>
                  <option value="negative-culture">Negative Culture</option>
                  <option value="positive-culture">Positive Culture</option>
                </select>
                {sample2Result === 'positive-culture' && (
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sample 2 Results Detail
                    </label>
                    <textarea
                      value={sample2Details}
                      onChange={(e) => setSample2Details(e.target.value)}
                      rows={2}
                      disabled={prePasteurisationSaved}
                      placeholder="Enter details of positive culture results"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comments
                </label>
                <textarea
                  value={prePasteurisationComments}
                  onChange={(e) => setPrePasteurisationComments(e.target.value)}
                  rows={4}
                  disabled={prePasteurisationSaved}
                  placeholder="Enter any comments or observations"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div className="flex gap-4">
              {prePasteurisationSaved ? (
                <>
                  <button 
                    disabled
                    className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium cursor-not-allowed flex items-center gap-2">
                    <CheckCircle size={16} />
                    Saved
                  </button>
                  <button 
                    onClick={handleEditPrePasteurisationResults}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium">
                    Edit
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={handleSavePrePasteurisationResults}
                    disabled={savingPrePasteurisation}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:bg-gray-400 disabled:cursor-not-allowed">
                    {savingPrePasteurisation ? 'Saving...' : 'Save Results'}
                  </button>
                  <button 
                    onClick={handleClearPrePasteurisationForm}
                    disabled={savingPrePasteurisation}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium disabled:opacity-50">
                    Clear Form
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Pasteurisation Tab */}
        {activeTab === 'pasteurisation' && (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-green-900 mb-3">Pasteurisation Process</h3>
              <p className="text-sm text-green-800">
                Record and monitor the pasteurisation process for this batch. Ensure all parameters are within acceptable ranges.
              </p>
            </div>

            {batch.status === 'Created' && !pasteurisationStarted ? (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Start Pasteurisation</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Operator ID
                    </label>
                    <input
                      type="text"
                      value={pasteurisationData.operatorId}
                      onChange={(e) => setPasteurisationData({...pasteurisationData, operatorId: e.target.value})}
                      placeholder="Enter operator ID"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Device/Equipment ID
                    </label>
                    <input
                      type="text"
                      value={pasteurisationData.deviceId}
                      onChange={(e) => setPasteurisationData({...pasteurisationData, deviceId: e.target.value})}
                      placeholder="Enter device ID"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Time
                    </label>
                    <input
                      type="datetime-local"
                      value={pasteurisationData.startTime}
                      onChange={(e) => setPasteurisationData({...pasteurisationData, startTime: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Target Temperature (°C)
                    </label>
                    <input
                      type="number"
                      value={pasteurisationData.temperature}
                      onChange={(e) => setPasteurisationData({...pasteurisationData, temperature: e.target.value})}
                      placeholder="e.g., 62.5"
                      step="0.1"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pre-pasteurisation Notes
                  </label>
                  <textarea
                    rows={3}
                    value={pasteurisationData.notes}
                    onChange={(e) => setPasteurisationData({...pasteurisationData, notes: e.target.value})}
                    placeholder="Enter any pre-pasteurisation observations or notes"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <button 
                  onClick={handleStartPasteurisation}
                  className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                >
                  <Play size={18} />
                  Start Pasteurisation
                </button>
              </div>
            ) : (batch.status === 'Created' && pasteurisationStarted) || batch.status === 'Pasteurising' ? (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <Clock className="text-blue-600" size={24} />
                    <div>
                      <p className="text-blue-900 font-medium">Complete Pasteurisation Process</p>
                      <p className="text-blue-700 text-sm">Record the completion details and confirm the pasteurisation process is finished.</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Confirm Pasteurisation Complete</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Time
                      </label>
                      <input
                        type="datetime-local"
                        value={pasteurisationData.endTime}
                        onChange={(e) => setPasteurisationData({...pasteurisationData, endTime: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Total Duration (minutes)
                      </label>
                      <input
                        type="number"
                        value={pasteurisationData.duration}
                        onChange={(e) => setPasteurisationData({...pasteurisationData, duration: e.target.value})}
                        placeholder="e.g., 30"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Completion Notes
                    </label>
                    <textarea
                      value={pasteurisationData.completionNotes}
                      onChange={(e) => setPasteurisationData({...pasteurisationData, completionNotes: e.target.value})}
                      rows={3}
                      placeholder="Record final temperature readings, observations, or any issues encountered"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <button 
                    onClick={handleCompletePasteurisation}
                    className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium">
                    <CheckCircle size={18} />
                    Confirm Pasteurisation Complete
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="text-green-600" size={24} />
                    <div>
                      <p className="text-green-900 font-medium">Pasteurisation Complete</p>
                      <p className="text-green-700 text-sm">Batch has been successfully pasteurised and is ready for post-pasteurisation testing.</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Pasteurisation Record</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Operator:</span>
                      <p className="text-gray-900">OP001</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Device:</span>
                      <p className="text-gray-900">PAST-001</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Temperature:</span>
                      <p className="text-gray-900">62.5°C</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Duration:</span>
                      <p className="text-gray-900">30 minutes</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Start Time:</span>
                      <p className="text-gray-900">14:00 19/01/2026</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">End Time:</span>
                      <p className="text-gray-900">14:30 19/01/2026</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Post-pasteurisation Microbiology Tab */}
        {activeTab === 'microbiology' && (
          <div className="space-y-6">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-purple-900 mb-3">Post-pasteurisation Microbiology Testing</h3>
              <p className="text-sm text-purple-800 mb-4">
                Record microbiology test results after pasteurisation to verify the effectiveness of the pasteurisation process.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date Taken
                </label>
                <input
                  type="date"
                  value={postPasteurisationDate}
                  onChange={(e) => setPostPasteurisationDate(e.target.value)}
                  disabled={postPasteurisationSaved}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Result for Sample 1
                </label>
                <select 
                  value={postSample1Result}
                  onChange={(e) => setPostSample1Result(e.target.value)}
                  disabled={postPasteurisationSaved}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Select result</option>
                  <option value="negative-culture">Negative Culture</option>
                  <option value="positive-culture">Positive Culture</option>
                </select>
                {postSample1Result === 'positive-culture' && (
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sample 1 Results Detail
                    </label>
                    <textarea
                      value={postSample1Details}
                      onChange={(e) => setPostSample1Details(e.target.value)}
                      rows={2}
                      disabled={postPasteurisationSaved}
                      placeholder="Enter details of positive culture results"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Result for Sample 2
                </label>
                <select 
                  value={postSample2Result}
                  onChange={(e) => setPostSample2Result(e.target.value)}
                  disabled={postPasteurisationSaved}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Select result</option>
                  <option value="negative-culture">Negative Culture</option>
                  <option value="positive-culture">Positive Culture</option>
                </select>
                {postSample2Result === 'positive-culture' && (
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sample 2 Results Detail
                    </label>
                    <textarea
                      value={postSample2Details}
                      onChange={(e) => setPostSample2Details(e.target.value)}
                      rows={2}
                      disabled={postPasteurisationSaved}
                      placeholder="Enter details of positive culture results"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comments
                </label>
                <textarea
                  value={postPasteurisationComments}
                  onChange={(e) => setPostPasteurisationComments(e.target.value)}
                  rows={4}
                  disabled={postPasteurisationSaved}
                  placeholder="Enter any comments or observations"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div className="flex gap-4">
              {postPasteurisationSaved ? (
                <>
                  <button 
                    disabled
                    className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium cursor-not-allowed flex items-center gap-2">
                    <CheckCircle size={16} />
                    Saved
                  </button>
                  <button 
                    onClick={handleEditPostPasteurisationResults}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium">
                    Edit
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={handleSavePostPasteurisationResults}
                    disabled={savingPostPasteurisation}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:bg-gray-400 disabled:cursor-not-allowed">
                    {savingPostPasteurisation ? 'Saving...' : 'Save Results'}
                  </button>
                  <button 
                    onClick={handleClearPostPasteurisationForm}
                    disabled={savingPostPasteurisation}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium disabled:opacity-50">
                    Clear Form
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
