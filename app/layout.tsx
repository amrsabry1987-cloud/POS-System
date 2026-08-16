'use client';

import './globals.css';
import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { Menu } from 'lucide-react';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const isLoginPage = pathname === '/login';

  return (
    <html lang={lang} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <body className="bg-slate-50 dark:bg-slate-950 min-h-screen">
        {isLoginPage ? (
          <main className="w-full min-h-screen">{children}</main>
        ) : (
          <div className="flex min-h-screen w-full overflow-x-hidden">
            <Sidebar lang={lang} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
            <div className="flex-1 flex flex-col min-w-0 w-full">
              {/* Header bar with mobile toggle */}
              <div className="flex items-center bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 lg:hidden">
                <button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="p-4 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  aria-label="Toggle Navigation"
                >
                  <Menu className="w-6 h-6" />
                </button>
                <div className="flex-1">
                  <Header lang={lang} setLang={setLang} />
                </div>
              </div>

              {/* Desktop Header */}
              <div className="hidden lg:block">
                <Header lang={lang} setLang={setLang} />
              </div>

              <main className="flex-1 p-4 md:p-6 overflow-y-auto min-w-0 w-full">
                {children}
              </main>
            </div>
          </div>
        )}
      </body>
    </html>
  );
}