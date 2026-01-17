import React, { useState, useEffect } from 'react';
import { donors } from '../api';
import { CheckCircle, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Donor {
  id: string;
  donor_code?: string;
  status: string;
  created_at: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  email?: string;
  date_of_birth?: string;
}

export const DonorList: React.FC = () => {
  const [donorList, setDonorList] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDonors();
  }, []);

  const loadDonors = async () => {
    try {
      setLoading(true);
      const res = await donors.list();
      setDonorList(res.data || []);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load donors');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'bg-green-100 text-green-800';
      case 'Active':
        return 'bg-blue-100 text-blue-800';
      case 'Screening':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Donors</h1>
        <Link
          to="/donors/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus size={20} />
          New Donor
        </Link>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-600">Loading donors...</div>
        ) : donorList.length === 0 ? (
          <div className="p-8 text-center text-gray-600">No donors found</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Donor ID</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Contact</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Registered</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {donorList.map((donor, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm">
                    <Link
                      to={`/donors/${donor.id}`}
                      className="text-blue-600 hover:text-blue-800 font-mono text-xs"
                      title="Click to view/edit donor"
                    >
                      {donor.id}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {donor.first_name && donor.last_name
                      ? `${donor.first_name} ${donor.last_name}`
                      : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {donor.phone_number || donor.email || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(donor.status)}`}>
                      {donor.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(donor.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex gap-2">
                      <Link
                        to={`/donors/${donor.id}/edit`}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Edit
                      </Link>
                      {donor.status !== 'Approved' && (
                        <Link
                          to={`/donors/${donor.id}/approve`}
                          className="text-green-600 hover:text-green-800 font-medium"
                        >
                          Approve
                        </Link>
                      )}
                      {donor.status === 'Approved' && (
                        <CheckCircle size={20} className="text-green-600" />
                      )}
                    </div>
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
