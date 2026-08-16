'use client';

import './globals.css'; // <-- Add this line back (or import '@/app/globals.css';)
import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [lang, setLang] = useState<'en' | 'ar'>('en');

  const isLoginPage = pathname === '/login';

  return (
    <html lang={lang} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <body className="bg-slate-50 dark:bg-slate-950 min-h-screen">
        {isLoginPage ? (
          <main className="w-full min-h-screen">{children}</main>
        ) : (
          <div className="flex min-h-screen">
            <Sidebar lang={lang} />
            <div className="flex-1 flex flex-col min-w-0">
              <Header lang={lang} setLang={setLang} />
              <main className="flex-1 p-6 overflow-y-auto">{children}</main>
            </div>
          </div>
        )}
      </body>
    </html>
  );
}