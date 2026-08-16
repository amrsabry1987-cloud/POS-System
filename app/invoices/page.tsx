'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Plus, Search, Receipt, ArrowUpRight, ArrowDownLeft, RefreshCw } from 'lucide-react';

interface Transaction {
  id: string;
  invoice_number: string;
  type: 'sale' | 'purchase';
  total: number;
  paid_amount: number;
  balance_due: number;
  status: 'paid' | 'partial' | 'unpaid';
  created_at: string;
  entities?: { name: string };
}

// Translation Dictionary for Invoices Screen
const translations = {
  en: {
    title: 'Invoices & Sales',
    subtitle: 'Track all commercial sales and purchase records',
    refreshTable: 'Refresh Table',
    newInvoice: 'New Invoice',
    searchPlaceholder: 'Search by invoice # or client/supplier...',
    colInvoiceNum: 'Invoice #',
    colType: 'Type',
    colParty: 'Party (Client / Supplier)',
    colTotal: 'Total',
    colPaid: 'Paid',
    colBalanceDue: 'Balance Due',
    colStatus: 'Status',
    colDate: 'Date',
    loading: 'Loading invoices...',
    noInvoices: 'No invoices found. Click "New Invoice" to issue one.',
    typeSale: 'Sale',
    typePurchase: 'Purchase',
    walkIn: 'Walk-in Customer',
    statusPaid: 'PAID',
    statusPartial: 'PARTIAL',
    statusUnpaid: 'UNPAID',
    currency: 'EGP',
  },
  ar: {
    title: 'الفواتير والمبيعات',
    subtitle: 'متابعة كافة سجلات المبيعات والمشتريات التجارية',
    refreshTable: 'تحديث الجدول',
    newInvoice: 'فاتورة جديدة',
    searchPlaceholder: 'البحث برقم الفاتورة أو اسم العميل/المورد...',
    colInvoiceNum: 'رقم الفاتورة',
    colType: 'النوع',
    colParty: 'الطرف الثاني (العميل / المورد)',
    colTotal: 'الإجمالي',
    colPaid: 'المسدد',
    colBalanceDue: 'المتبقي',
    colStatus: 'الحالة',
    colDate: 'التاريخ',
    loading: 'جاري تحميل الفواتير...',
    noInvoices: 'لم يتم العثور على فواتير. انقر على "فاتورة جديدة" لإصدار واحدة.',
    typeSale: 'بيع',
    typePurchase: 'شراء',
    walkIn: 'عميل نقدي (بدون حساب)',
    statusPaid: 'مدفوع',
    statusPartial: 'جزئي',
    statusUnpaid: 'غير مدفوع',
    currency: 'ج.م',
  },
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [lang, setLang] = useState<'en' | 'ar'>('en');

  // Detect active language from local storage or html dir
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

  const fetchInvoices = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('transactions')
      .select('*, entities(name)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching invoices:', error);
    } else {
      setInvoices(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const filteredInvoices = invoices.filter(
    (inv) =>
      inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.entities?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusLabel = (status: 'paid' | 'partial' | 'unpaid') => {
    switch (status) {
      case 'paid':
        return t.statusPaid;
      case 'partial':
        return t.statusPartial;
      case 'unpaid':
        return t.statusUnpaid;
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t.title}</h1>
          <p className="text-sm text-slate-500">{t.subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchInvoices}
            className="p-2 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            title={t.refreshTable}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            href="/invoices/new"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>{t.newInvoice}</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full pl-9 pr-4 rtl:pl-4 rtl:pr-9 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left rtl:text-right border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-4">{t.colInvoiceNum}</th>
                <th className="p-4">{t.colType}</th>
                <th className="p-4">{t.colParty}</th>
                <th className="p-4 text-right rtl:text-left">{t.colTotal}</th>
                <th className="p-4 text-right rtl:text-left">{t.colPaid}</th>
                <th className="p-4 text-right rtl:text-left">{t.colBalanceDue}</th>
                <th className="p-4 text-center">{t.colStatus}</th>
                <th className="p-4">{t.colDate}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    {t.loading}
                  </td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    {t.noInvoices}
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                      {inv.invoice_number}
                    </td>
                    <td className="p-4">
                      {inv.type === 'sale' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          <ArrowUpRight className="w-3.5 h-3.5" /> {t.typeSale}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
                          <ArrowDownLeft className="w-3.5 h-3.5" /> {t.typePurchase}
                        </span>
                      )}
                    </td>
                    <td className="p-4 font-semibold text-slate-800 dark:text-slate-100">
                      {inv.entities?.name || t.walkIn}
                    </td>
                    <td className="p-4 text-right rtl:text-left font-mono font-bold text-slate-900 dark:text-slate-100">
                      {t.currency} {inv.total.toLocaleString()}
                    </td>
                    <td className="p-4 text-right rtl:text-left font-mono text-emerald-600 dark:text-emerald-400">
                      {t.currency} {inv.paid_amount.toLocaleString()}
                    </td>
                    <td className="p-4 text-right rtl:text-left font-mono text-red-600 dark:text-red-400 font-bold">
                      {t.currency} {inv.balance_due.toLocaleString()}
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          inv.status === 'paid'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : inv.status === 'partial'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}
                      >
                        {getStatusLabel(inv.status)}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-slate-500">
                      {new Date(inv.created_at).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}
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