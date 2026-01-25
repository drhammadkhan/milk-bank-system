import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { batches, donations, donors } from '../api';
import { AlertCircle, CheckCircle, Package } from 'lucide-react';

export const NewBatch: React.FC = () => {
  const [batchCode, setBatchCode] = useState('');
  const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
  const [batchDate, setBatchDate] = useState(today);
  const [hospitalNumber, setHospitalNumber] = useState('');
  const [numberOfBottles, setNumberOfBottles] = useState('');
  const [bottleVolumes, setBottleVolumes] = useState<string[]>([]);
  const [donationIds, setDonationIds] = useState('');
  const [donorName, setDonorName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Prefill donation IDs from URL query params: donation_ids (comma-separated)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const prefill = params.get('donation_ids');
    if (prefill && !donationIds) {
      setDonationIds(prefill);
      // Suggest a default batch code if empty
      if (!batchCode) {
        const today = new Date();
        const y = today.getFullYear();
        const m = String(today.getMonth() + 1).padStart(2, '0');
        const d = String(today.getDate()).padStart(2, '0');
        const baseCode = `BATCH-${y}${m}${d}`;
        
        // Fetch next available batch code from API
        batches.getNextCode(baseCode)
          .then(res => {
            if (res.data && res.data.batch_code) {
              setBatchCode(res.data.batch_code);
            } else {
              setBatchCode(baseCode);
            }
          })
          .catch(() => setBatchCode(baseCode));
      }
      
      // Fetch donation details to get hospital number and donor name
      const fetchDonationDetails = async () => {
        try {
          const res = await donations.getById(prefill);
          const donation = res.data;
          if (donation && donation.donor_id) {
            const donorRes = await donors.get(donation.donor_id);
            const donor = donorRes.data;
            if (donor) {
              if (donor.hospital_number && !hospitalNumber) {
                setHospitalNumber(donor.hospital_number);
              }
              // Set donor name from first_name and last_name
              const fullName = [donor.first_name, donor.last_name].filter(Boolean).join(' ');
              if (fullName && !donorName) {
                setDonorName(fullName);
              }
            }
          }
        } catch (err) {
          console.error('Failed to fetch donation details:', err);
        }
      };
      fetchDonationDetails();
    }
  }, [location.search, donationIds, batchCode, hospitalNumber]);

  // Debounced effect to fetch donor details when donation IDs change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (donationIds && !location.search.includes('donation_ids')) {
        fetchDonorDetailsFromIds(donationIds);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [donationIds, location.search]);

  // Function to fetch donor details when donation IDs are entered manually
  const fetchDonorDetailsFromIds = async (donationIdString: string) => {
    const donationIdArray = donationIdString
      .split(',')
      .map(id => id.trim())
      .filter(id => id.length > 0);
    
    if (donationIdArray.length > 0) {
      try {
        // Fetch details for the first donation ID to get donor info
        const res = await donations.getById(donationIdArray[0]);
        const donation = res.data;
        if (donation && donation.donor_id) {
          const donorRes = await donors.get(donation.donor_id);
          const donor = donorRes.data;
          if (donor) {
            if (donor.hospital_number && !hospitalNumber) {
              setHospitalNumber(donor.hospital_number);
            }
            // Set donor name from first_name and last_name
            const fullName = [donor.first_name, donor.last_name].filter(Boolean).join(' ');
            if (fullName) {
              setDonorName(fullName);
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch donation details:', err);
        // Clear donor name if fetch fails
        setDonorName('');
      }
    } else {
      // Clear donor name if no donation IDs
      setDonorName('');
    }
  };

  // Update bottle volumes array when number of bottles changes
  useEffect(() => {
    const num = parseInt(numberOfBottles);
    if (!isNaN(num) && num > 0) {
      // If current array is shorter, add more bottles with default 50ml
      // If longer, trim the array
      const newVolumes = Array(num).fill('').map((_, i) => 
        bottleVolumes[i] || '50'
      );
      setBottleVolumes(newVolumes);
    } else {
      setBottleVolumes([]);
    }
  }, [numberOfBottles]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!batchCode.trim()) {
      setError('Batch code is required');
      return;
    }

    // Parse donation IDs from comma-separated string
    const donationIdArray = donationIds
      .split(',')
      .map(id => id.trim())
      .filter(id => id.length > 0);

    if (donationIdArray.length === 0) {
      setError('At least one donation ID is required');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess(false);

      const batchData: any = {
        donation_ids: donationIdArray,
        batch_code: batchCode,
        user_id: 'system',
      };

      if (batchDate) {
        batchData.batch_date = batchDate;
      }

      if (hospitalNumber.trim()) {
        batchData.hospital_number = hospitalNumber;
      }

      if (numberOfBottles && !isNaN(Number(numberOfBottles))) {
        batchData.number_of_bottles = parseInt(numberOfBottles);
        // Send bottle volumes as array of floats
        batchData.bottle_volumes = bottleVolumes.map(v => parseFloat(v) || 50);
      }

      const response = await batches.create(batchData);
      
      // Update the batch code in the form to show the actual created code
      // (backend may have added a sequence number if there was a duplicate)
      if (response.data && response.data.batch_code) {
        setBatchCode(response.data.batch_code);
      }

      setSuccess(true);
      setTimeout(() => navigate('/batches'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create batch');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-6">
      <div className="flex items-center gap-3 mb-6">
        <Package className="text-green-600" size={32} />
        <h1 className="text-3xl font-bold text-gray-900">Create New Batch</h1>
      </div>

      {error && (
        <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-lg mb-6 text-red-700 text-sm">
          <AlertCircle size={20} className="flex-shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border-2 border-green-200 rounded-lg mb-6 p-6">
          <div className="flex gap-4">
            <CheckCircle size={24} className="text-green-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-bold text-green-900 mb-1">
                Batch Created Successfully!
              </h3>
              <p className="text-sm text-green-700 mb-2">
                Batch Code: <span className="font-semibold">{batchCode}</span>
              </p>
              <p className="text-sm text-green-700">
                Redirecting to batches list in 2 seconds...
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-8">
        {success && (
          <div className="bg-green-50 border-2 border-green-200 rounded-lg mb-6 p-4">
            <div className="flex gap-3">
              <CheckCircle size={20} className="text-green-600 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-base font-bold text-green-900">
                  Batch Created: {batchCode}
                </h3>
                <p className="text-sm text-green-700">
                  Redirecting to batches list...
                </p>
              </div>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Batch Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={batchCode}
              onChange={(e) => setBatchCode(e.target.value)}
              placeholder="e.g., BATCH-2024-001"
              required
              disabled={success}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            <p className="mt-1 text-sm text-gray-500">
              Enter a unique identifier for this batch
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Batch Date
            </label>
            <input
              type="date"
              value={batchDate}
              onChange={(e) => setBatchDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <p className="mt-1 text-sm text-gray-500">
              Date when the batch was created or processed
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hospital Number
            </label>
            <input
              type="text"
              value={hospitalNumber}
              onChange={(e) => setHospitalNumber(e.target.value)}
              placeholder="Will auto-populate from donation ID"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50"
              readOnly
            />
            <p className="mt-1 text-sm text-gray-500">
              Automatically populated from donation details
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Donor Name
            </label>
            <input
              type="text"
              value={donorName}
              onChange={(e) => setDonorName(e.target.value)}
              placeholder="Will auto-populate from donation ID"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50"
              readOnly
            />
            <p className="mt-1 text-sm text-gray-500">
              Automatically populated from donation details
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Bottles
            </label>
            <input
              type="number"
              value={numberOfBottles}
              onChange={(e) => setNumberOfBottles(e.target.value)}
              placeholder="e.g., 10"
              min="1"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <p className="mt-1 text-sm text-gray-500">
              Total number of bottles in this batch
            </p>
          </div>

          {bottleVolumes.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bottle Volumes (mL)
              </label>
              <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3">
                {bottleVolumes.map((volume, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 w-20">Bottle {index + 1}:</span>
                    <input
                      type="number"
                      value={volume}
                      onChange={(e) => {
                        const newVolumes = [...bottleVolumes];
                        newVolumes[index] = e.target.value;
                        setBottleVolumes(newVolumes);
                      }}
                      placeholder="50"
                      min="1"
                      step="0.1"
                      className="flex-1 px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                    />
                    <span className="text-sm text-gray-500">mL</span>
                  </div>
                ))}
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Specify volume for each bottle (default: 50 mL)
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Donation IDs <span className="text-red-500">*</span>
            </label>
            <textarea
              value={donationIds}
              onChange={(e) => setDonationIds(e.target.value)}
              placeholder="Enter donation IDs separated by commas&#10;e.g., abc-123, def-456, ghi-789"
              rows={4}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono text-sm"
            />
            <p className="mt-1 text-sm text-gray-500">
              Enter the donation IDs to include in this batch, separated by commas
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">ℹ️ Note</h3>
            <p className="text-sm text-blue-800">
              All donations in a batch will be pasteurized together. Make sure the donations are ready for processing.
            </p>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Creating Batch...' : 'Create Batch'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/batches')}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
