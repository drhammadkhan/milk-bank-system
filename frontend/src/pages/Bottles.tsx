import React, { useState, useEffect } from 'react';
import { bottles } from '../api';
import { Droplets, Clock, User } from 'lucide-react';

interface Bottle {
  id: string;
  barcode: string;
  batch_id: string;
  volume_ml: number;
  status: string;
  admin_status?: string;
  allocated_to?: string;
  allocated_at?: string;
}

export const BottleList: React.FC = () => {
  const [bottleList, setBottleList] = useState<Bottle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Bottles</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center text-gray-600 py-8">Loading bottles...</div>
        ) : bottleList.length === 0 ? (
          <div className="col-span-full text-center text-gray-600 py-8">No bottles found</div>
        ) : (
          bottleList.map((bottle) => (
            <div key={bottle.id} className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Droplets className="text-blue-600" size={20} />
                  <p className="font-mono font-medium text-gray-900">{bottle.barcode}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(bottle.status)}`}>
                  {bottle.status}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Volume:</span>
                  <span className="font-medium text-gray-900">{bottle.volume_ml} mL</span>
                </div>

                {bottle.allocated_at && (
                  <div className="flex items-start gap-2 text-gray-600">
                    <Clock size={16} className="flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs">Allocated</p>
                      <p className="text-xs text-gray-900">
                        {new Date(bottle.allocated_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}

                {bottle.allocated_to && (
                  <div className="flex items-start gap-2 text-gray-600">
                    <User size={16} className="flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs">Baby ID</p>
                      <p className="text-xs text-gray-900 font-mono">{bottle.allocated_to}</p>
                    </div>
                  </div>
                )}
              </div>

              {bottle.status === 'Available' && (
                <button className="w-full mt-4 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition">
                  Allocate
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
