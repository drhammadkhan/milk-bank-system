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
const milkBankIcon = '/milk-bank-icon.png';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false); // Start closed on mobile
  const location = useLocation();

  const navItems = [
    { icon: Home, label: 'Dashboard', href: '/' },
    { icon: Users, label: 'Donors', href: '/donors' },
    { icon: Beaker, label: 'Batches', href: '/batches' },
    { icon: Package, label: 'Bottles', href: '/bottles' },
    { icon: Truck, label: 'Dispatch', href: '/dispatch' },
  ];

  const isActive = (href: string) => location.pathname === href;

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-30 w-64 bg-gray-900 text-white transition-transform duration-300 flex flex-col`}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Beaker size={24} />
            <span className="font-bold">MilkBank</span>
          </div>
          <button
            onClick={closeSidebar}
            className="p-1 hover:bg-gray-800 rounded transition lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={closeSidebar}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition touch-manipulation ${
                  isActive(item.href)
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                <Icon size={20} />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 space-y-2">
          <Link
            to="/settings/printers"
            onClick={closeSidebar}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition touch-manipulation ${
              isActive('/settings/printers')
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-800'
            }`}
          >
            <Settings size={20} />
            <span className="text-sm font-medium">Printer Settings</span>
          </Link>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-800 rounded-lg transition touch-manipulation">
            <LogOut size={20} />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto lg:ml-0">
        {/* Top Bar */}
        <div className="bg-white shadow sticky top-0 z-10">
          <div className="px-4 lg:px-8 py-3 lg:py-4 flex justify-between items-center">
            <div className="flex items-center gap-2 lg:gap-4">
              {/* Mobile menu button */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 hover:bg-gray-100 rounded-lg lg:hidden touch-manipulation"
              >
                <Menu size={24} />
              </button>
              <h2 className="text-sm lg:text-lg font-semibold text-gray-900 hidden sm:block">
                Evelina Nicu Milk Bank Tracker
              </h2>
              <h2 className="text-sm font-semibold text-gray-900 sm:hidden">MilkBank</h2>
              <img src={evelinaLogo} alt="Evelina London" className="h-8 lg:h-12 hidden sm:block" />
            </div>
            <div className="flex items-center gap-2 lg:gap-4">
              <span className="text-xs lg:text-sm text-gray-600 hidden md:block">User: Admin</span>
              <img src={milkBankIcon} alt="Milk Bank" className="h-8 lg:h-12" />
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </div>
    </div>
  );
};
