'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Package,
  ShoppingCart,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Warehouse,
  Tag,
  Globe,
} from 'lucide-react';
import { NotificationBell } from './NotificationBell';

const adminNavItems = [
  { name: 'Tableau de Bord', href: '/admin', icon: BarChart3 },
  { name: 'Utilisateurs', href: '/admin/users', icon: Users },
  { name: 'Produits', href: '/admin/products', icon: Package },
  { name: 'Stock', href: '/admin/stock', icon: Warehouse },
  { name: 'Commandes', href: '/admin/orders', icon: ShoppingCart },
  { name: 'Clients', href: '/admin/clients', icon: Users },
  { name: 'Catégories', href: '/admin/categories', icon: Tag },
  { name: 'Franchises', href: '/admin/franchises', icon: Tag },
  { name: 'Promotions', href: '/admin/promotions', icon: Tag },
  { name: 'Localisation', href: '/admin/location', icon: Globe },
  { name: 'Configuration', href: '/admin/configuration', icon: Settings },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside
        className={`${
          isMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 fixed lg:relative lg:w-64 w-64 h-screen bg-white shadow-lg z-40 transition-transform duration-300 overflow-y-auto`}
      >
        {/* Sidebar Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <Link href="/admin" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">N</span>
              </div>
              <div>
                <p className="font-bold text-gray-900">NipponHub</p>
                <p className="text-xs text-gray-500">Admin</p>
              </div>
            </Link>
            <button
              onClick={() => setIsMenuOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-orange-50 text-orange-600 font-semibold'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-200 absolute bottom-0 w-full">
          <button className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
            <LogOut className="w-5 h-5" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white shadow-sm">
          <div className="px-6 py-4 flex justify-between items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden text-gray-600 hover:text-gray-900"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex-1"></div>

            <div className="flex items-center gap-4">
              {/* Notifications */}
              <NotificationBell />

              {/* Profile */}
              <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                  A
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-semibold text-gray-900">Admin</p>
                  <p className="text-xs text-gray-500">Owner</p>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-500 ml-2" />
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto p-6 lg:p-8">{children}</main>
      </div>

      {/* Mobile Overlay */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 lg:hidden z-30"
          onClick={() => setIsMenuOpen(false)}
        ></div>
      )}
    </div>
  );
}
