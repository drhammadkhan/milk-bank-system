import React, { useState, useEffect } from 'react';
import {
  Users,
  Beaker,
  Package,
  Truck,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { donors, batches, dispatches } from '../api';

interface DashboardStats {
  totalDonors: number;
  activeBatches: number;
  pendingApprovals: number;
  dispatchedItems: number;
  recentActivity: string;
}

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalDonors: 0,
    activeBatches: 0,
    pendingApprovals: 0,
    dispatchedItems: 0,
    recentActivity: 'Loading...',
  });

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [donorRes, batchRes, dispatchRes] = await Promise.all([
          donors.list(),
          batches.list(),
          dispatches.list(),
        ]);

        setStats({
          totalDonors: donorRes.data.length || 0,
          activeBatches: batchRes.data.filter((b: any) => b.status === 'Pasteurising' || b.status === 'Tested').length || 0,
          pendingApprovals: batchRes.data.filter((b: any) => b.status === 'MicroTestPending').length || 0,
          dispatchedItems: dispatchRes.data.filter((d: any) => d.status === 'Delivered').length || 0,
          recentActivity: `${donorRes.data.length} donors registered`,
        });
      } catch (error) {
        console.error('Error loading stats:', error);
      }
    };

    loadStats();
  }, []);

  const cards = [
    {
      title: 'Total Donors',
      value: stats.totalDonors,
      icon: Users,
      color: 'bg-blue-100 text-blue-600',
      href: '/donors',
    },
    {
      title: 'Active Batches',
      value: stats.activeBatches,
      icon: Beaker,
      color: 'bg-green-100 text-green-600',
      href: '/batches',
    },
    {
      title: 'Pending Approvals',
      value: stats.pendingApprovals,
      icon: AlertCircle,
      color: 'bg-yellow-100 text-yellow-600',
      href: '/batches',
    },
    {
      title: 'Dispatched',
      value: stats.dispatchedItems,
      icon: Truck,
      color: 'bg-purple-100 text-purple-600',
      href: '/dispatch',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">Welcome to Milk Bank Traceability System</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link to={card.href} key={card.title}>
              <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">{card.title}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{card.value}</p>
                  </div>
                  <div className={`${card.color} p-3 rounded-lg`}>
                    <Icon size={24} />
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/donors/new"
            className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 transition"
          >
            <Users className="text-blue-600 mb-2" size={24} />
            <p className="font-medium text-gray-900">Register New Donor</p>
            <p className="text-sm text-gray-600">Start onboarding process</p>
          </Link>

          <Link
            to="/batches/new"
            className="p-4 border border-gray-200 rounded-lg hover:bg-green-50 transition"
          >
            <Package className="text-green-600 mb-2" size={24} />
            <p className="font-medium text-gray-900">Create Batch</p>
            <p className="text-sm text-gray-600">Assign donations to batch</p>
          </Link>

          <Link
            to="/dispatch/new"
            className="p-4 border border-gray-200 rounded-lg hover:bg-purple-50 transition"
          >
            <Truck className="text-purple-600 mb-2" size={24} />
            <p className="font-medium text-gray-900">Create Dispatch</p>
            <p className="text-sm text-gray-600">Prepare for hospital shipment</p>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="flex items-center text-gray-600">
          <Clock size={16} className="mr-2" />
          {stats.recentActivity}
        </div>
      </div>
    </div>
  );
};
