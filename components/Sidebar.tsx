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
  LogOut
} from 'lucide-react';

interface SidebarProps {
  lang: 'en' | 'ar';
}

export default function Sidebar({ lang }: SidebarProps) {
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

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 min-h-screen flex flex-col border-r border-slate-800 rtl:border-r-0 rtl:border-l">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        <span className="text-xl font-bold text-white tracking-wide">
          {isRtl ? 'نظام إدارة الأعمال' : 'Business POS Pro'}
        </span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span>{isRtl ? item.nameAr : item.nameEn}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-slate-800 space-y-2">
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-950/40 hover:text-red-300 transition-colors disabled:opacity-50"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <span>{isRtl ? 'تسجيل الخروج' : 'Logout'}</span>
        </button>

        <div className="px-3 text-[11px] text-slate-500">
          <p>{isRtl ? 'النسخة 1.0.0' : 'Version 1.0.0'}</p>
        </div>
      </div>
    </aside>
  );
}