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
} from 'lucide-react';

interface BatchDetail {
  id: string;
  batch_code: string;
  status: string;
  created_at: string;
  donation_ids?: string[];
  pasteurisation_records?: any[];
  samples?: any[];
}

export const BatchDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [batch, setBatch] = useState<BatchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'pasteurisation' | 'microbiology'>('overview');

  useEffect(() => {
    if (id) loadBatch();
  }, [id]);

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

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              {getStatusIcon(batch.status)}
              <h1 className="text-3xl font-bold text-gray-900">{batch.batch_code}</h1>
            </div>
            <p className="text-gray-600">
              Created {new Date(batch.created_at).toLocaleDateString()}
            </p>
          </div>
          <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full font-medium">
            {batch.status}
          </span>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b mb-6">
          {(['overview', 'pasteurisation', 'microbiology'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 font-medium transition ${
                activeTab === tab
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
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
          </div>
        )}

        {/* Pasteurisation Tab */}
        {activeTab === 'pasteurisation' && (
          <div className="space-y-4">
            {batch.status === 'Created' ? (
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                <Play size={18} />
                Start Pasteurisation
              </button>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-700 font-medium">Pasteurisation {batch.status}</p>
              </div>
            )}
          </div>
        )}

        {/* Microbiology Tab */}
        {activeTab === 'microbiology' && (
          <div className="space-y-4">
            {batch.status === 'Pasteurised' ? (
              <button className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition">
                <Zap size={18} />
                Create Micro Sample
              </button>
            ) : batch.status === 'MicroTestPending' ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-700 font-medium">Awaiting test results...</p>
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-700 font-medium">Microbiology testing complete</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
