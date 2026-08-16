'use client';

import React, { useEffect, useState } from 'react';
import { Search, Globe, Plus, LogOut, User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface HeaderProps {
  lang: 'en' | 'ar';
  setLang: (lang: 'en' | 'ar') => void;
}

export default function Header({ lang, setLang }: HeaderProps) {
  const isRtl = lang === 'ar';
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    // Fetch active session user info
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) {
        setUserEmail(session.user.email);
      }
    };
    getUser();

    // Listen for auth state updates
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between">
      {/* Global Search Bar */}
      <div className="relative w-72">
        <Search className="w-4 h-4 absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder={isRtl ? 'بحث في المنتجات، العملاء...' : 'Search products, clients...'}
          className="w-full pl-9 pr-4 rtl:pl-4 rtl:pr-9 py-1.5 text-sm bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg border-0 focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      {/* Header Controls */}
      <div className="flex items-center gap-4">
        {/* Quick Action Button */}
        <Link
          href="/invoices/new"
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>{isRtl ? 'فاتورة جديدة' : 'New Invoice'}</span>
        </Link>

        {/* Language Switcher */}
        <button
          onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
          className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <Globe className="w-4 h-4" />
          <span>{lang === 'en' ? 'العربية' : 'English'}</span>
        </button>

        {/* User Account Info & Logout */}
        <div className="flex items-center gap-3 border-l rtl:border-l-0 rtl:border-r border-slate-200 dark:border-slate-800 pl-4 rtl:pl-0 rtl:pr-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              <UserIcon className="w-4 h-4" />
            </div>
            {userEmail && (
              <span className="hidden sm:inline text-xs font-medium text-slate-700 dark:text-slate-300 max-w-[140px] truncate">
                {userEmail}
              </span>
            )}
          </div>

          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            title={isRtl ? 'تسجيل الخروج' : 'Logout'}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-900 disabled:opacity-50"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden md:inline">{isRtl ? 'خروج' : 'Logout'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}