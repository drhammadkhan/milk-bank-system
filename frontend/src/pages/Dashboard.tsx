import React, { useState, useEffect } from 'react';
import {
  Users,
  Beaker,
  Package,
  Truck,
  AlertCircle,
  Clock,
  Droplets,
  Check,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { donors, batches, dispatches, donations } from '../api';

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
  const [newDonations, setNewDonations] = useState<any[]>([]);
  const [acknowledging, setAcknowledging] = useState<string | null>(null);

  const loadNewDonations = async () => {
    try {
      const res = await donations.listUnacknowledged();
      setNewDonations(res.data);
    } catch (error) {
      console.error('Error loading new donations:', error);
    }
  };

  const handleAcknowledge = async (donationId: string) => {
    try {
      setAcknowledging(donationId);
      await donations.acknowledge(donationId);
      setNewDonations(newDonations.filter(d => d.id !== donationId));
    } catch (error) {
      console.error('Error acknowledging donation:', error);
    } finally {
      setAcknowledging(null);
    }
  };

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

        await loadNewDonations();
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

      {/* New Donations Alert */}
      {newDonations.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-300 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 mt-1">
              <Droplets className="text-blue-600" size={28} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-blue-900 mb-1">
                🎉 New Milk Donations Received!
              </h3>
              <p className="text-blue-800 mb-4">
                The core team has {newDonations.length} new donation{newDonations.length !== 1 ? 's' : ''} to acknowledge:
              </p>
              <div className="space-y-3">
                {newDonations.map((donation: any) => {
                  const donationDate = new Date(donation.donation_date);
                  const formattedDate = donationDate.toLocaleDateString();
                  return (
                    <div
                      key={donation.id}
                      className="bg-white rounded-lg p-3 flex items-center justify-between"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {donation.number_of_bottles} bottle{donation.number_of_bottles !== 1 ? 's' : ''} donated
                        </p>
                        <p className="text-sm text-gray-600">
                          {formattedDate}
                          {donation.notes && ` • ${donation.notes}`}
                        </p>
                      </div>
                      <button
                        onClick={() => handleAcknowledge(donation.id)}
                        disabled={acknowledging === donation.id}
                        className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
                      >
                        <Check size={18} />
                        {acknowledging === donation.id ? 'Acknowledging...' : 'Acknowledge'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

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
