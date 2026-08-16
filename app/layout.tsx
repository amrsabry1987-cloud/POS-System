'use client';

import './globals.css';
import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isLoginPage = pathname === '/login';

  return (
    <html lang={lang} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <head>
        <meta name="application-name" content="POS Pro" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="POS Pro" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#0f172a" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="bg-slate-50 dark:bg-slate-950 min-h-screen">
        {isLoginPage ? (
          <main className="w-full min-h-screen">{children}</main>
        ) : (
          <div className="flex min-h-screen w-full overflow-x-hidden">
            <Sidebar
              lang={lang}
              isOpen={isOpen}
              setIsOpen={setIsOpen}
              isCollapsed={isCollapsed}
              setIsCollapsed={setIsCollapsed}
            />
            <div className="flex-1 flex flex-col min-w-0 w-full transition-all duration-300">
              <Header
                lang={lang}
                setLang={setLang}
                isOpen={isOpen}
                setIsOpen={setIsOpen}
                isCollapsed={isCollapsed}
                setIsCollapsed={setIsCollapsed}
              />
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