import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dispatches } from '../api';
import {
  Package,
  ArrowLeft,
  QrCode,
  Download,
  Send,
  CheckCircle,
} from 'lucide-react';

interface DispatchDetail {
  id: string;
  dispatch_code: string;
  hospital_id: string;
  status: string;
  created_at: string;
  items?: any[];
}

interface DispatchManifest {
  dispatch_code: string;
  hospital_id: string;
  status: string;
  items: Array<{
    bottle_barcode: string;
    scanned_out_at?: string;
    scanned_in_at?: string;
  }>;
}

export const DispatchDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [dispatch, setDispatch] = useState<DispatchDetail | null>(null);
  const [manifest, setManifest] = useState<DispatchManifest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');

  useEffect(() => {
    if (id) {
      loadDispatch();
      loadManifest();
    }
  }, [id]);

  const loadDispatch = async () => {
    try {
      const res = await dispatches.get(id!);
      setDispatch(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load dispatch');
    }
  };

  const loadManifest = async () => {
    try {
      const res = await dispatches.getManifest(id!);
      setManifest(res.data);
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  const handleScanItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    try {
      await dispatches.scan(id!, {
        barcode: barcodeInput,
        user_id: 'admin',
        scan_type: dispatch?.status === 'Created' ? 'out' : 'in',
      });
      setBarcodeInput('');
      loadDispatch();
      loadManifest();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Scan failed');
    }
  };

  const handleExportPDF = async () => {
    try {
      const response = await dispatches.exportPDF(id!);
      const blob = response.data as Blob;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dispatch-${dispatch?.dispatch_code}.pdf`;
      a.click();
    } catch (err) {
      alert('Failed to export PDF');
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-600">Loading dispatch...</div>;
  }

  if (!dispatch) {
    return <div className="p-8 text-center text-red-600">Dispatch not found</div>;
  }

  return (
    <div>
      <button
        onClick={() => navigate('/dispatch')}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6"
      >
        <ArrowLeft size={18} />
        Back to Dispatches
      </button>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <div>
              <p className="text-sm text-gray-600">Dispatch Code</p>
              <p className="text-2xl font-bold text-gray-900">{dispatch.dispatch_code}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <p className="text-lg font-semibold text-blue-600">{dispatch.status}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Created</p>
              <p className="text-sm text-gray-900">
                {new Date(dispatch.created_at).toLocaleDateString()}
              </p>
            </div>

            <div className="pt-4 border-t space-y-2">
              <button
                onClick={handleExportPDF}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Download size={18} />
                Export PDF
              </button>
              {dispatch.status === 'Created' && (
                <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                  <Send size={18} />
                  Send to Hospital
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Barcode Scanner */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <QrCode size={20} />
              Scan Items
            </h2>
            <form onSubmit={handleScanItem}>
              <input
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="Scan barcode or enter manually..."
                autoFocus
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-2">
                {dispatch.status === 'Created'
                  ? 'Scanning items out for shipment'
                  : 'Scanning items received at hospital'}
              </p>
            </form>
          </div>

          {/* Items List */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Package size={20} />
              Dispatch Items ({manifest?.items.length || 0})
            </h2>

            {manifest?.items && manifest.items.length > 0 ? (
              <div className="space-y-2">
                {manifest.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{item.bottle_barcode}</p>
                      <div className="flex gap-4 text-xs text-gray-600 mt-1">
                        {item.scanned_out_at && (
                          <span className="flex items-center gap-1">
                            <CheckCircle size={14} className="text-green-600" />
                            Out: {new Date(item.scanned_out_at).toLocaleTimeString()}
                          </span>
                        )}
                        {item.scanned_in_at && (
                          <span className="flex items-center gap-1">
                            <CheckCircle size={14} className="text-blue-600" />
                            In: {new Date(item.scanned_in_at).toLocaleTimeString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-center py-8">No items in this dispatch</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
