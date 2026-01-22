import { useState, useEffect } from 'react';
import { batches, donations } from '../api';
import { Plus, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Batch {
  id: string;
  batch_code: string;
  status: string;
  created_at: string;
  batch_date?: string;
  hospital_number?: string;
  number_of_bottles?: number;
  donation_count?: number;
}

export const BatchList: React.FC = () => {
  const [batchList, setBatchList] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [recentDonations, setRecentDonations] = useState<Array<{ id: string; donation_id?: string; donation_date?: string }>>([]);

  useEffect(() => {
    loadBatches();
    loadRecentDonations();
  }, []);

  const loadBatches = async () => {
    try {
      setLoading(true);
      const res = await batches.list();
      setBatchList(res.data || []);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load batches');
    } finally {
      setLoading(false);
    }
  };

  const loadRecentDonations = async () => {
    try {
      const [donationsRes, batchesRes] = await Promise.all([
        donations.list(),
        batches.list()
      ]);
      
      const items: any[] = donationsRes.data || [];
      const batchList: any[] = batchesRes.data || [];
      
      // Collect all donation IDs that are already in batches
      const usedDonationIds = new Set<string>();
      batchList.forEach(batch => {
        if (batch.donation_ids && Array.isArray(batch.donation_ids)) {
          batch.donation_ids.forEach((id: string) => usedDonationIds.add(id));
        }
      });
      
      // Filter out donations that are already used in batches
      const availableDonations = items.filter(d => 
        !usedDonationIds.has(d.donation_id) && !usedDonationIds.has(d.id)
      );
      
      // Take last 10 by donation_date desc if available
      const sorted = availableDonations
        .slice()
        .sort((a, b) => new Date(b.donation_date).getTime() - new Date(a.donation_date).getTime())
        .slice(0, 10)
        .map(d => ({ id: d.id, donation_id: d.donation_id, donation_date: d.donation_date }));
      setRecentDonations(sorted);
    } catch (e) {
      // Non-blocking; ignore errors here
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pasteurised':
        return 'bg-green-100 text-green-800';
      case 'Pasteurising':
        return 'bg-blue-100 text-blue-800';
      case 'MicroTestPending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Released':
        return 'bg-purple-100 text-purple-800';
      case 'Quarantined':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      {recentDonations.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h2 className="text-sm font-semibold text-blue-900 mb-2">Recent Donation IDs</h2>
          <div className="flex flex-wrap gap-2">
            {recentDonations.map((d) => (
              <Link
                key={d.id}
                to={`/batches/new?donation_ids=${encodeURIComponent(d.donation_id ?? '')}`}
                className="px-2 py-1 bg-white border border-blue-200 rounded-md text-blue-700 hover:bg-blue-100 font-mono text-xs"
                title={d.donation_date ? new Date(d.donation_date).toLocaleDateString() : ''}
              >
                {d.donation_id || d.id}
              </Link>
            ))}
          </div>
        </div>
      )}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Batches</h1>
        <Link
          to="/batches/new"
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          <Plus size={20} />
          New Batch
        </Link>
      </div>

      {error && (
        <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-lg mb-6 text-red-700 text-sm">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-600">Loading batches...</div>
        ) : batchList.length === 0 ? (
          <div className="p-8 text-center text-gray-600">No batches found</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Code</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Batch Date</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Hospital #</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Bottles</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Created</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {batchList.map((batch, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    <Link to={`/batches/${batch.id}`} className="text-blue-600 hover:underline">
                      {batch.batch_code}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {batch.batch_date ? new Date(batch.batch_date).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {batch.hospital_number || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {batch.number_of_bottles ?? '-'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(batch.status)}`}>
                      {batch.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(batch.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <Link to={`/batches/${batch.id}`} className="text-blue-600 hover:text-blue-800 font-medium">
                      View
                    </Link>
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
