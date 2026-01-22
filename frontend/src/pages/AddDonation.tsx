import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { donors, donations } from '../api';
import { AlertCircle, CheckCircle, Package, ArrowLeft } from 'lucide-react';

export const AddDonation: React.FC = () => {
  const { donorId } = useParams<{ donorId: string }>();
  const navigate = useNavigate();
  const [donor, setDonor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const today = new Date().toISOString().split('T')[0];
  const [formData, setFormData] = useState({
    donation_date: today,
    number_of_bottles: 1,
    notes: ''
  });

  useEffect(() => {
    const loadDonor = async () => {
      try {
        setLoading(true);
        const res = await donors.get(donorId!);
        setDonor(res.data);
      } catch (err: any) {
        setError(err?.response?.data?.detail || 'Failed to load donor');
      } finally {
        setLoading(false);
      }
    };
    if (donorId) loadDonor();
  }, [donorId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.donation_date || formData.number_of_bottles < 1) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await donations.create({
        donor_id: donorId!,
        donation_date: formData.donation_date,
        number_of_bottles: formData.number_of_bottles,
        notes: formData.notes || undefined,
      });
      setSuccess(true);
      setTimeout(() => navigate(`/donors/${donorId}`), 1500);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to add donation');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading donor information...</div>
      </div>
    );
  }

  if (error && !donor) {
    return (
      <div className="max-w-2xl mx-auto mt-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          <AlertCircle size={20} className="inline mr-2" />
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto mt-6">
      <button
        onClick={() => navigate('/donors')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
      >
        <ArrowLeft size={20} />
        Back to Donors
      </button>

      <div className="flex items-center gap-3 mb-6">
        <Package className="text-blue-600" size={32} />
        <h1 className="text-3xl font-bold text-gray-900">Record New Donation</h1>
      </div>

      {/* Donor Information Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-3">Donor Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-sm text-blue-700 font-medium">Name:</span>
            <p className="text-base text-blue-900 font-semibold">
              {donor?.first_name && donor?.last_name
                ? `${donor.first_name} ${donor.last_name}`
                : 'N/A'}
            </p>
          </div>
          <div>
            <span className="text-sm text-blue-700 font-medium">Hospital Number:</span>
            <p className="text-base text-blue-900 font-semibold">
              {donor?.hospital_number || 'N/A'}
            </p>
          </div>
          <div>
            <span className="text-sm text-blue-700 font-medium">Status:</span>
            <p className="text-base text-blue-900 font-semibold">
              {donor?.status || 'N/A'}
            </p>
          </div>
          <div>
            <span className="text-sm text-blue-700 font-medium">Donor ID:</span>
            <p className="text-xs text-blue-800 font-mono">
              {donor?.id || 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700 flex gap-2">
          <AlertCircle size={20} className="flex-shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex gap-2">
          <CheckCircle size={20} className="text-green-600 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-green-900">Donation recorded successfully!</h3>
            <p className="text-sm text-green-700">Redirecting to donor page...</p>
          </div>
        </div>
      )}

      {/* Donation Form */}
      <div className="bg-white rounded-lg shadow p-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Donation Details</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Donation Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.donation_date}
              onChange={(e) => setFormData({ ...formData, donation_date: e.target.value })}
              required
              disabled={submitting || success}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Bottles <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={formData.number_of_bottles}
              onChange={(e) => setFormData({ ...formData, number_of_bottles: parseInt(e.target.value) || 1 })}
              required
              disabled={submitting || success}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
              disabled={submitting || success}
              placeholder="Any additional notes about this donation..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            />
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={submitting || success}
              className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
            >
              {submitting ? 'Recording...' : 'Record Donation'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/donors')}
              disabled={submitting}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
