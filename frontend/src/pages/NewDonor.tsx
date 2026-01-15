import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { donors } from '../api';
import { AlertCircle } from 'lucide-react';

export const NewDonor: React.FC = () => {
  const [donorCode, setDonorCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!donorCode.trim()) {
      setError('Donor code is required');
      return;
    }

    try {
      setLoading(true);
      await donors.create({ donor_code: donorCode });
      navigate('/donors');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create donor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Register New Donor</h1>

      {error && (
        <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-lg mb-6 text-red-700 text-sm">
          <AlertCircle size={20} className="flex-shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Donor Code</label>
          <input
            type="text"
            value={donorCode}
            onChange={(e) => setDonorCode(e.target.value)}
            placeholder="e.g., MX-001"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition font-medium"
        >
          {loading ? 'Creating...' : 'Register Donor'}
        </button>
      </form>
    </div>
  );
};
