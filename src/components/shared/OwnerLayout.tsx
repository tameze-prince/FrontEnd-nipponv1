'use client';

import React, { useState } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useRouter } from 'next/navigation';
import {
  Menu,
  X,
  BarChart3,
  Package,
  ShoppingCart,
  Users,
  Settings,
  LogOut,
  Home,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface OwnerLayoutProps {
  children: React.ReactNode;
  activeTab?: string;
}

export function OwnerLayout({ children, activeTab = 'dashboard' }: OwnerLayoutProps) {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, href: '/owner/dashboard' },
    { id: 'products', label: 'Produits', icon: Package, href: '/admin/products' },
    { id: 'orders', label: 'Commandes', icon: ShoppingCart, href: '/admin/orders' },
    { id: 'customers', label: 'Clients', icon: Users, href: '/admin/users' },
    { id: 'settings', label: 'Configuration', icon: Settings, href: '/admin/location' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <h1 className="text-2xl font-bold text-orange-500">NipponHub</h1>
            <span className="hidden md:inline text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
              Owner - {user?.city || user?.country}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-600">{user?.email}</p>
            </div>
            <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <nav
          className={`${
            sidebarOpen ? 'block' : 'hidden'
          } md:block w-full md:w-64 bg-white border-r border-gray-200 md:border-0 md:sticky md:top-16 md:max-h-[calc(100vh-4rem)] overflow-y-auto`}
        >
          <div className="p-4 space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    router.push(item.href);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                    isActive
                      ? 'bg-orange-50 text-orange-600 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}

            <div className="pt-4 border-t border-gray-200 mt-4">
              <Button
                onClick={handleLogout}
                variant="ghost"
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="w-5 h-5 mr-3" />
                Déconnexion
              </Button>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
