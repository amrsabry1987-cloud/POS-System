'use client';

import React, { useEffect, useState } from 'react';
import { Search, Globe, Plus, LogOut, User as UserIcon, PanelLeft, Menu } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface HeaderProps {
  lang: 'en' | 'ar';
  setLang: (lang: 'en' | 'ar') => void;
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
}

export default function Header({
  lang,
  setLang,
  isOpen,
  setIsOpen,
  isCollapsed,
  setIsCollapsed,
}: HeaderProps) {
  const isRtl = lang === 'ar';
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) {
        setUserEmail(session.user.email);
      }
    };
    getUser();

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
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 md:px-6 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger Menu Toggle */}
        {setIsOpen && (
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
            aria-label="Toggle Mobile Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Gemini Desktop Sidebar Panel Toggle Button */}
        {setIsCollapsed && (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <PanelLeft className="w-5 h-5" />
          </button>
        )}

        {/* Search Input */}
        <div className="relative w-40 sm:w-64 md:w-72">
          <Search className="w-4 h-4 absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={isRtl ? 'بحث...' : 'Search...'}
            className="w-full pl-9 pr-3 rtl:pl-3 rtl:pr-9 py-1.5 text-xs sm:text-sm bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg border-0 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      {/* Header Right Actions */}
      <div className="flex items-center gap-2 sm:gap-4">
        <Link
          href="/invoices/new"
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">{isRtl ? 'فاتورة جديدة' : 'New Invoice'}</span>
        </Link>

        {/* Language Toggle */}
        <button
          onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
          className="flex items-center gap-1.5 text-xs font-semibold px-2 sm:px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
        >
          <Globe className="w-4 h-4" />
          <span>{lang === 'en' ? 'العربية' : 'EN'}</span>
        </button>

        {/* User Account Info */}
        <div className="flex items-center gap-2 border-l rtl:border-l-0 rtl:border-r border-slate-200 dark:border-slate-800 pl-2 sm:pl-4 rtl:pl-0 rtl:pr-2 sm:rtl:pr-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0">
              <UserIcon className="w-4 h-4" />
            </div>
            {userEmail && (
              <span className="hidden xl:inline text-xs font-medium text-slate-700 dark:text-slate-300 max-w-[120px] truncate">
                {userEmail}
              </span>
            )}
          </div>

          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            title={isRtl ? 'تسجيل الخروج' : 'Logout'}
            className="flex items-center gap-1.5 p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors disabled:opacity-50"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden md:inline">{isRtl ? 'خروج' : 'Logout'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}