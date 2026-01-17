import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { donors } from '../api';
import { AlertCircle, CheckCircle } from 'lucide-react';

export const NewDonor: React.FC = () => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    phone_number: '',
    email: '',
    address: '',
    postcode: '',
    infectious_diseases: false,
    hepatitis_history: false,
    hepatitis_b_surface_antigen: false,
    hepatitis_b_core_antigen: false,
    hepatitis_c_antibody: false,
    hiv_antibody: false,
    hltv_antibody: false,
    syphilis_test: false,
    medical_history_notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdDonorId, setCreatedDonorId] = useState('');
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      const response = await donors.create(formData as any);
      setCreatedDonorId(response.data.id);
      setTimeout(() => navigate('/donors'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create donor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-6 mb-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Register New Donor</h1>

      {error && (
        <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-lg mb-6 text-red-700 text-sm">
          <AlertCircle size={20} className="flex-shrink-0" />
          {error}
        </div>
      )}

      {createdDonorId && (
        <div className="bg-green-50 border-2 border-green-200 rounded-lg mb-6 p-6">
          <div className="flex gap-4">
            <CheckCircle size={24} className="text-green-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-bold text-green-900 mb-3">Donor Created Successfully!</h3>
              <div className="bg-white rounded-lg p-4 mb-3 border border-green-200">
                <p className="text-sm text-gray-600 mb-1">Unique Donor ID</p>
                <p className="text-2xl font-mono font-bold text-green-700 break-all">{createdDonorId}</p>
              </div>
              <p className="text-sm text-green-700">Redirecting to donors list in 2 seconds...</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-8 space-y-8">
        {/* Personal Information */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Personal Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
              <input
                type="date"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
              <input
                type="tel"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Address</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Postcode</label>
              <input
                type="text"
                name="postcode"
                value={formData.postcode}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Medical History */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Medical History</h2>
          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                name="infectious_diseases"
                checked={formData.infectious_diseases}
                onChange={handleChange}
                className="w-4 h-4 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Infectious Diseases History</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                name="hepatitis_history"
                checked={formData.hepatitis_history}
                onChange={handleChange}
                className="w-4 h-4 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Hepatitis History</span>
            </label>
          </div>
        </div>

        {/* Serological Tests */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Serological Test Results</h2>
          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                name="hiv_antibody"
                checked={formData.hiv_antibody}
                onChange={handleChange}
                className="w-4 h-4 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">HIV Antibody</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                name="hepatitis_b_surface_antigen"
                checked={formData.hepatitis_b_surface_antigen}
                onChange={handleChange}
                className="w-4 h-4 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Hepatitis B Surface Antigen</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                name="hepatitis_b_core_antigen"
                checked={formData.hepatitis_b_core_antigen}
                onChange={handleChange}
                className="w-4 h-4 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Hepatitis B Core Antigen</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                name="hepatitis_c_antibody"
                checked={formData.hepatitis_c_antibody}
                onChange={handleChange}
                className="w-4 h-4 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Hepatitis C Antibody</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                name="hltv_antibody"
                checked={formData.hltv_antibody}
                onChange={handleChange}
                className="w-4 h-4 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">HLTV Antibody</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                name="syphilis_test"
                checked={formData.syphilis_test}
                onChange={handleChange}
                className="w-4 h-4 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Syphilis Test</span>
            </label>
          </div>
        </div>

        {/* Additional Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Medical History Notes</label>
          <textarea
            name="medical_history_notes"
            value={formData.medical_history_notes}
            onChange={handleChange}
            placeholder="Any additional medical history information..."
            rows={4}
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
