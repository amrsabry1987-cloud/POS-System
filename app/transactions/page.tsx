'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { RefreshCw } from 'lucide-react';

interface LogItem {
  id: string;
  ref: string;
  // Replace:
  type: item.type,

// With:
type: item.type: "SALE" | "PURCHASE" | "CLIENT PAYMENT" | "SUPPLIER PAYMENT",
  party: string;
  amount: number;
  date: string;
}

const translations = {
  en: {
    title: 'Transaction Audit Log',
    subtitle: 'Complete chronological ledger history',
    refresh: 'Refresh Logs',
    colRef: 'Reference',
    colType: 'Type',
    colParty: 'Party',
    colAmount: 'Amount',
    colDate: 'Date',
    loading: 'Loading audit logs...',
    noData: 'No transaction logs found.',
    typeSale: 'SALE',
    typePurchase: 'PURCHASE',
    typeClientPayment: 'CLIENT PAYMENT',
    typeSupplierPayment: 'SUPPLIER PAYMENT',
    walkIn: 'Walk-in Customer',
    currency: 'EGP',
  },
  ar: {
    title: 'سجل تدقيق المعاملات',
    subtitle: 'التاريخ الكامل لدفتر الأستاذ والحركات المالية بترتيب زمني',
    refresh: 'تحديث السجل',
    colRef: 'رقم المرجع / الفاتورة',
    colType: 'نوع الحركة',
    colParty: 'الطرف الثاني',
    colAmount: 'المبلغ',
    colDate: 'التاريخ والتوقيت',
    loading: 'جاري تحميل سجل المعاملات...',
    noData: 'لا توجد حركات تسديد أو فواتير مسجلة.',
    typeSale: 'فاتورة مبيعات',
    typePurchase: 'فاتورة مشتريات',
    typeClientPayment: 'تحصيل من عميل',
    typeSupplierPayment: 'سداد لمورد',
    walkIn: 'عميل نقدي (بدون حساب)',
    currency: 'ج.م',
  },
};

export default function TransactionsPage() {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<'en' | 'ar'>('en');

  // Language Detection
  useEffect(() => {
    const updateLanguage = () => {
      const storedLang = localStorage.getItem('app_lang');
      const isRtl = document.documentElement.dir === 'rtl' || document.documentElement.lang === 'ar';
      if (storedLang === 'ar' || storedLang === 'en') {
        setLang(storedLang);
      } else if (isRtl) {
        setLang('ar');
      } else {
        setLang('en');
      }
    };

    updateLanguage();
    window.addEventListener('storage', updateLanguage);
    return () => window.removeEventListener('storage', updateLanguage);
  }, []);

  const t = translations[lang];

  const fetchLogs = async () => {
    setLoading(true);
    const { data: invoices } = await supabase.from('transactions').select('*, entities(name)');
    const { data: payments } = await supabase.from('payments').select('*, entities(name)');

    const combined: LogItem[] = [
      ...(invoices || []).map((i) => ({
        id: i.id,
        ref: i.invoice_number,
        type: i.type.toUpperCase() as 'SALE' | 'PURCHASE',
        party: i.entities?.name || t.walkIn,
        amount: i.total,
        date: i.created_at,
      })),
      ...(payments || []).map((p) => ({
        id: p.id,
        ref: p.reference_number,
        type: p.type === 'client_payment' ? 'CLIENT PAYMENT' : 'SUPPLIER PAYMENT',
        party: p.entities?.name || '-',
        amount: p.amount,
        date: p.created_at,
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setLogs(combined);
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, [lang]);

  const getTypeBadge = (type: LogItem['type']) => {
    switch (type) {
      case 'SALE':
        return (
          <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
            {t.typeSale}
          </span>
        );
      case 'PURCHASE':
        return (
          <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
            {t.typePurchase}
          </span>
        );
      case 'CLIENT PAYMENT':
        return (
          <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400">
            {t.typeClientPayment}
          </span>
        );
      case 'SUPPLIER PAYMENT':
        return (
          <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
            {t.typeSupplierPayment}
          </span>
        );
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t.title}</h1>
          <p className="text-sm text-slate-500">{t.subtitle}</p>
        </div>
        <button
          onClick={fetchLogs}
          title={t.refresh}
          className="p-2 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left rtl:text-right border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-4">{t.colRef}</th>
                <th className="p-4">{t.colType}</th>
                <th className="p-4">{t.colParty}</th>
                <th className="p-4 text-right rtl:text-left">{t.colAmount}</th>
                <th className="p-4">{t.colDate}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    {t.loading}
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    {t.noData}
                  </td>
                </tr>
              ) : (
                logs.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                      {row.ref}
                    </td>
                    <td className="p-4">{getTypeBadge(row.type)}</td>
                    <td className="p-4 font-semibold text-slate-800 dark:text-slate-100">
                      {row.party}
                    </td>
                    <td className="p-4 text-right rtl:text-left font-mono font-bold text-slate-900 dark:text-slate-100">
                      {t.currency} {row.amount.toLocaleString()}
                    </td>
                    <td className="p-4 text-xs text-slate-500">
                      {new Date(row.date).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
