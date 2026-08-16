'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  Truck, 
  Receipt, 
  CreditCard, 
  BarChart3, 
  Settings,
  ArrowLeftRight,
  LogOut,
  X,
  PanelLeftClose,
  PanelLeft
} from 'lucide-react';

interface SidebarProps {
  lang: 'en' | 'ar';
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export default function Sidebar({
  lang,
  isOpen,
  setIsOpen,
  isCollapsed,
  setIsCollapsed,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isRtl = lang === 'ar';
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const menuItems = [
    { nameEn: 'Dashboard', nameAr: 'لوحة التحكم', href: '/', icon: LayoutDashboard },
    { nameEn: 'Products & Stock', nameAr: 'المنتجات والمخزون', href: '/products', icon: Package },
    { nameEn: 'Clients', nameAr: 'العملاء', href: '/clients', icon: Users },
    { nameEn: 'Suppliers', nameAr: 'الموردون', href: '/suppliers', icon: Truck },
    { nameEn: 'Invoices', nameAr: 'الفواتير والمبيعات', href: '/invoices', icon: Receipt },
    { nameEn: 'Payments & Ledger', nameAr: 'المدفوعات والحسابات', href: '/payments', icon: CreditCard },
    { nameEn: 'Transactions', nameAr: 'سجل المعاملات', href: '/transactions', icon: ArrowLeftRight },
    { nameEn: 'Reports', nameAr: 'التقارير المالية', href: '/reports', icon: BarChart3 },
    { nameEn: 'Settings', nameAr: 'الإعدادات', href: '/settings', icon: Settings },
  ];

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const closeMobileSidebar = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={closeMobileSidebar}
        />
      )}

      {/* Responsive Sidebar Container */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 rtl:left-auto rtl:right-0 z-50 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 rtl:border-r-0 rtl:border-l transition-all duration-300 ease-in-out shrink-0 ${
          isCollapsed ? 'lg:w-20' : 'lg:w-64'
        } ${
          isOpen
            ? 'w-64 translate-x-0'
            : 'w-64 -translate-x-full rtl:translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Header / Collapse Toggle */}
        <div className={`h-16 flex items-center px-4 border-b border-slate-800 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!isCollapsed && (
            <span className="text-lg font-bold text-white tracking-wide truncate">
              {isRtl ? 'نظام إدارة الأعمال' : 'Business POS'}
            </span>
          )}

          {/* Desktop Gemini Sidebar Toggle Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            className="hidden lg:flex p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            {isCollapsed ? <PanelLeft className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={closeMobileSidebar}
            className="p-1.5 text-slate-400 hover:text-white lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMobileSidebar}
                title={isCollapsed ? (isRtl ? item.nameAr : item.nameEn) : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isCollapsed ? 'justify-center px-0' : ''
                } ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {!isCollapsed && <span className="truncate">{isRtl ? item.nameAr : item.nameEn}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer & Logout */}
        <div className="p-3 border-t border-slate-800 space-y-2">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            title={isCollapsed ? (isRtl ? 'تسجيل الخروج' : 'Logout') : undefined}
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-950/40 hover:text-red-300 transition-colors disabled:opacity-50 ${
              isCollapsed ? 'justify-center px-0' : ''
            }`}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span>{isRtl ? 'تسجيل الخروج' : 'Logout'}</span>}
          </button>

          {!isCollapsed && (
            <div className="px-3 text-[11px] text-slate-500">
              <p>{isRtl ? 'النسخة 1.0.0' : 'Version 1.0.0'}</p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}