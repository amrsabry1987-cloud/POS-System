'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X, Store, LayoutDashboard, Package, Users, ShoppingCart, Receipt, BarChart3, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface MobileNavProps {
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
}

export default function MobileNav({ isOpen = false, setIsOpen }: MobileNavProps) {
  const pathname = usePathname();

  const navLinks = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'POS / Sales', href: '/invoices', icon: ShoppingCart },
    { name: 'Products', href: '/products', icon: Package },
    { name: 'Clients & Suppliers', href: '/clients', icon: Users },
    { name: 'Purchases', href: '/payments', icon: Receipt },
    { name: 'Reports', href: '/reports', icon: BarChart3 },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const closeDrawer = () => {
    if (setIsOpen) setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Slide-over Drawer Overlay */}
      <div
        className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm lg:hidden transition-opacity"
        onClick={closeDrawer}
      />

      {/* Slide-over Side Drawer */}
      <div
        className={`fixed top-0 bottom-0 left-0 rtl:left-auto rtl:right-0 z-50 w-64 bg-white dark:bg-slate-900 border-r rtl:border-r-0 rtl:border-l border-slate-200 dark:border-slate-800 transform transition-transform duration-300 ease-in-out lg:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full rtl:translate-x-full'
        }`}
      >
        <div className="p-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Store className="w-6 h-6 text-blue-600" />
            <span className="font-bold text-slate-800 dark:text-slate-100">POS System</span>
          </div>
          <button
            onClick={closeDrawer}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeDrawer}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{link.name}</span>
              </Link>
            );
          })}

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 mt-6 rounded-lg text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </nav>
      </div>
    </>
  );
}