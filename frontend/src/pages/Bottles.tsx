import React, { useState, useEffect } from 'react';
import { bottles } from '../api';
import { Droplets, Clock, User, Snowflake, CheckCircle, Trash2, XCircle } from 'lucide-react';

interface Bottle {
  id: string;
  barcode: string;
  batch_id: string;
  batch_code?: string;
  hospital_number?: string;
  volume_ml: number;
  status: string;
  admin_status?: string;
  patient_id?: string;
  allocated_to?: string;
  allocated_at?: string;
  defrost_started_at?: string;
  administered_at?: string;
  administered_by?: string;
  pasteurisation_date?: string;
}

export const BottleList: React.FC = () => {
  const [bottleList, setBottleList] = useState<Bottle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionBottleId, setActionBottleId] = useState<string | null>(null);
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [selectedBottle, setSelectedBottle] = useState<Bottle | null>(null);
  const [patientId, setPatientId] = useState('');
  const [allocatedBy, setAllocatedBy] = useState('system');
  const [discardReason, setDiscardReason] = useState('');

  useEffect(() => {
    loadBottles();
  }, []);

  const loadBottles = async () => {
    try {
      setLoading(true);
      const res = await bottles.list();
      setBottleList(res.data || []);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load bottles');
    } finally {
      setLoading(false);
    }
  };

  const handleAllocate = async () => {
    if (!selectedBottle || !patientId) return;
    
    try {
      setActionBottleId(selectedBottle.id);
      await bottles.allocate(selectedBottle.id, { patient_id: patientId, allocated_by: allocatedBy });
      await loadBottles();
      setShowAllocateModal(false);
      setPatientId('');
      setAllocatedBy('system');
      setSelectedBottle(null);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to allocate bottle');
    } finally {
      setActionBottleId(null);
    }
  };

  const handleDefrost = async (bottle: Bottle) => {
    if (!confirm(`Start defrosting bottle ${bottle.barcode}?`)) return;
    
    try {
      setActionBottleId(bottle.id);
      await bottles.defrost(bottle.id);
      await loadBottles();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to start defrosting');
    } finally {
      setActionBottleId(null);
    }
  };

  const handleAdminister = async (bottle: Bottle) => {
    const administeredBy = prompt('Enter your name/ID:');
    if (!administeredBy) return;
    
    if (!confirm(`Mark bottle ${bottle.barcode} as administered?`)) return;
    
    try {
      setActionBottleId(bottle.id);
      await bottles.administer(bottle.id, { administered_by: administeredBy });
      await loadBottles();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to mark as administered');
    } finally {
      setActionBottleId(null);
    }
  };

  const handleDiscard = async () => {
    if (!selectedBottle || !discardReason) return;
    
    try {
      setActionBottleId(selectedBottle.id);
      await bottles.discard(selectedBottle.id, { reason: discardReason });
      await loadBottles();
      setShowDiscardModal(false);
      setDiscardReason('');
      setSelectedBottle(null);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to discard bottle');
    } finally {
      setActionBottleId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available':
        return 'bg-green-100 text-green-800';
      case 'Allocated':
        return 'bg-blue-100 text-blue-800';
      case 'Defrosting':
        return 'bg-yellow-100 text-yellow-800';
      case 'Administered':
        return 'bg-purple-100 text-purple-800';
      case 'Discarded':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-6">Bottles</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-3 lg:px-4 py-2 lg:py-3 rounded mb-4 text-sm lg:text-base">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center text-sm lg:text-base text-gray-600 py-8">Loading bottles...</div>
      ) : bottleList.length === 0 ? (
        <div className="text-center text-sm lg:text-base text-gray-600 py-8">
          No released bottles available
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bottle ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Batch ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Donor Hospital #
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Volume (mL)
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pasteurisation Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bottleList.map((bottle) => (
                  <tr key={bottle.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {bottle.barcode}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {bottle.batch_code || bottle.batch_id.substring(0, 8)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {bottle.hospital_number || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(bottle.status)}`}>
                        {bottle.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {bottle.volume_ml.toFixed(1)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {bottle.pasteurisation_date 
                        ? new Date(bottle.pasteurisation_date).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      {bottle.status === 'Available' && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedBottle(bottle);
                              setShowAllocateModal(true);
                            }}
                            disabled={actionBottleId === bottle.id}
                            className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                          >
                            Allocate
                          </button>
                          <button
                            onClick={() => {
                              setSelectedBottle(bottle);
                              setShowDiscardModal(true);
                            }}
                            disabled={actionBottleId === bottle.id}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          >
                            Discard
                          </button>
                        </>
                      )}

                      {bottle.status === 'Allocated' && (
                        <button
                          onClick={() => handleDefrost(bottle)}
                          disabled={actionBottleId === bottle.id}
                          className="text-yellow-600 hover:text-yellow-900 disabled:opacity-50"
                        >
                          Defrost
                        </button>
                      )}

                      {bottle.status === 'Defrosting' && (
                        <button
                          onClick={() => handleAdminister(bottle)}
                          disabled={actionBottleId === bottle.id}
                          className="text-purple-600 hover:text-purple-900 disabled:opacity-50"
                        >
                          Administer
                        </button>
                      )}

                      {(bottle.status === 'Administered' || bottle.status === 'Discarded') && (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Allocate Modal */}
      {showAllocateModal && selectedBottle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 lg:p-6 max-w-md w-full">
            <h2 className="text-lg lg:text-xl font-bold text-gray-900 mb-4">
              Allocate Bottle
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Bottle: <span className="font-mono font-semibold">{selectedBottle.barcode}</span>
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Patient ID *
                </label>
                <input
                  type="text"
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  placeholder="Enter patient ID"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Allocated By
                </label>
                <input
                  type="text"
                  value={allocatedBy}
                  onChange={(e) => setAllocatedBy(e.target.value)}
                  placeholder="Your name/ID"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAllocateModal(false);
                  setSelectedBottle(null);
                  setPatientId('');
                  setAllocatedBy('system');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition touch-manipulation"
              >
                Cancel
              </button>
              <button
                onClick={handleAllocate}
                disabled={!patientId || actionBottleId === selectedBottle.id}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 touch-manipulation"
              >
                {actionBottleId === selectedBottle.id ? 'Allocating...' : 'Allocate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Discard Modal */}
      {showDiscardModal && selectedBottle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 lg:p-6 max-w-md w-full">
            <h2 className="text-lg lg:text-xl font-bold text-gray-900 mb-4">
              Discard Bottle
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Bottle: <span className="font-mono font-semibold">{selectedBottle.barcode}</span>
            </p>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Discarding *
              </label>
              <textarea
                value={discardReason}
                onChange={(e) => setDiscardReason(e.target.value)}
                placeholder="Enter reason for discarding this bottle"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowDiscardModal(false);
                  setSelectedBottle(null);
                  setDiscardReason('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition touch-manipulation"
              >
                Cancel
              </button>
              <button
                onClick={handleDiscard}
                disabled={!discardReason || actionBottleId === selectedBottle.id}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 touch-manipulation"
              >
                {actionBottleId === selectedBottle.id ? 'Discarding...' : 'Discard'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
