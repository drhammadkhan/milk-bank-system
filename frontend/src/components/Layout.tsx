import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Users,
  Beaker,
  Package,
  Truck,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';
import evelinaLogo from '../assets/evelina-logo.png';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  const navItems = [
    { icon: Home, label: 'Dashboard', href: '/' },
    { icon: Users, label: 'Donors', href: '/donors' },
    { icon: Beaker, label: 'Batches', href: '/batches' },
    { icon: Package, label: 'Bottles', href: '/bottles' },
    { icon: Truck, label: 'Dispatch', href: '/dispatch' },
  ];

  const isActive = (href: string) => location.pathname === href;

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-gray-900 text-white transition-all duration-300 flex flex-col`}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <div className={`flex items-center gap-2 ${!sidebarOpen && 'hidden'}`}>
            <Beaker size={24} />
            <span className="font-bold">MilkBank</span>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 hover:bg-gray-800 rounded transition"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-3 px-4 py-2 rounded-lg transition ${
                  isActive(item.href)
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
                title={item.label}
              >
                <Icon size={20} />
                {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 space-y-2">
          <Link
            to="/settings/printers"
            className={`flex items-center gap-3 px-4 py-2 rounded-lg transition ${
              isActive('/settings/printers')
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-800'
            }`}
          >
            <Settings size={20} />
            {sidebarOpen && <span className="text-sm font-medium">Printer Settings</span>}
          </Link>
          <button className="w-full flex items-center gap-3 px-4 py-2 text-gray-300 hover:bg-gray-800 rounded-lg transition">
            <LogOut size={20} />
            {sidebarOpen && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Top Bar */}
        <div className="bg-white shadow">
          <div className="px-8 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold text-gray-900">Evelina Nicu Milk Bank Tracking System</h2>
              <img src={evelinaLogo} alt="Evelina London" className="h-12" />
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">User: Admin</span>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="p-8">
          {children}
        </div>
      </div>
    </div>
  );
};
