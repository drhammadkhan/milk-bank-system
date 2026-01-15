import React, { useState, useEffect } from 'react';
import { dispatches } from '../api';
import { Plus, FileDown } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Dispatch {
  id: string;
  dispatch_code: string;
  hospital_id: string;
  status: string;
  created_at: string;
  item_count?: number;
}

export const DispatchList: React.FC = () => {
  const [dispatchList, setDispatchList] = useState<Dispatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDispatches();
  }, []);

  const loadDispatches = async () => {
    try {
      setLoading(true);
      const res = await dispatches.list();
      setDispatchList(res.data || []);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load dispatches');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Delivered':
        return 'bg-green-100 text-green-800';
      case 'InTransit':
        return 'bg-blue-100 text-blue-800';
      case 'Received':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleExportPDF = async (id: string, code: string) => {
    try {
      const response = await dispatches.exportPDF(id);
      const blob = response.data as Blob;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dispatch-${code}.pdf`;
      a.click();
    } catch (err) {
      alert('Failed to export PDF');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Dispatches</h1>
        <Link
          to="/dispatch/new"
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
        >
          <Plus size={20} />
          New Dispatch
        </Link>
      </div>

      {error && (
        <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-lg mb-6 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-600">Loading dispatches...</div>
        ) : dispatchList.length === 0 ? (
          <div className="p-8 text-center text-gray-600">No dispatches found</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Code</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Created</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {dispatchList.map((dispatch, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    <Link to={`/dispatch/${dispatch.id}`} className="text-blue-600 hover:underline">
                      {dispatch.dispatch_code}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(dispatch.status)}`}>
                      {dispatch.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(dispatch.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm flex gap-2">
                    <Link to={`/dispatch/${dispatch.id}`} className="text-blue-600 hover:text-blue-800 font-medium">
                      View
                    </Link>
                    <button
                      onClick={() => handleExportPDF(dispatch.id, dispatch.dispatch_code)}
                      className="text-gray-600 hover:text-gray-800"
                      title="Export PDF"
                    >
                      <FileDown size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
