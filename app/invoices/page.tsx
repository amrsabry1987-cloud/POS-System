'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import {
  Plus,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Edit,
  Maximize2,
  Minimize2,
  Receipt,
} from 'lucide-react';

interface TransactionItem {
  id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  products?: { name: string };
}

interface Transaction {
  id: string;
  invoice_number: string;
  type: 'sale' | 'purchase' | 'expense';
  total: number;
  paid_amount: number;
  balance_due: number;
  status: 'paid' | 'partial' | 'unpaid';
  created_at: string;
  entities?: { name: string };
  transaction_items?: TransactionItem[];
}

const translations = {
  en: {
    title: 'Invoices & Sales',
    subtitle: 'Track all commercial sales, purchase records, and internal expenses',
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
    colActions: 'Actions',
    loading: 'Loading invoices...',
    noInvoices: 'No invoices found. Click "New Invoice" to issue one.',
    typeSale: 'Sale',
    typePurchase: 'Purchase',
    typeExpense: 'Internal Expense',
    tabAll: 'All Invoices',
    tabSale: 'Sales',
    tabPurchase: 'Purchases',
    tabExpense: 'Expenses',
    expandAll: 'Expand All',
    collapseAll: 'Collapse All',
    walkIn: 'Walk-in Customer / Internal',
    statusPaid: 'PAID',
    statusPartial: 'PARTIAL',
    statusUnpaid: 'UNPAID',
    currency: 'EGP',
    detailsItem: 'Item Name',
    detailsQty: 'Qty',
    detailsPrice: 'Unit Price',
    detailsTotal: 'Total',
    noItems: 'No line items recorded.',
    editInvoice: 'Edit Invoice',
  },
  ar: {
    title: 'الفواتير والمبيعات',
    subtitle: 'متابعة كافة سجلات المبيعات والمشتريات والمصروفات الداخلية',
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
    colActions: 'إجراءات',
    loading: 'جاري تحميل الفواتير...',
    noInvoices: 'لم يتم العثور على فواتير. انقر على "فاتورة جديدة" لإصدار واحدة.',
    typeSale: 'بيع',
    typePurchase: 'شراء',
    typeExpense: 'مصروفات داخلية',
    tabAll: 'الكل',
    tabSale: 'مبيعات',
    tabPurchase: 'مشتريات',
    tabExpense: 'مصروفات داخلية',
    expandAll: 'توسيع الكل',
    collapseAll: 'طي الكل',
    walkIn: 'عميل نقدي / داخلي',
    statusPaid: 'مدفوع',
    statusPartial: 'جزئي',
    statusUnpaid: 'غير مدفوع',
    currency: 'ج.م',
    detailsItem: 'اسم البند / المنتج',
    detailsQty: 'الكمية',
    detailsPrice: 'سعر الوحدة',
    detailsTotal: 'الإجمالي',
    noItems: 'لا توجد تفاصيل لهذا السجل.',
    editInvoice: 'تعديل الفاتورة',
  },
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'sale' | 'purchase' | 'expense'>('all');
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [lang, setLang] = useState<'en' | 'ar'>('en');

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
      .select('*, entities(name), transaction_items(*, products(name))')
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

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleExpandAll = (expand: boolean) => {
    const newExpandedState: Record<string, boolean> = {};
    if (expand) {
      filteredInvoices.forEach((inv) => {
        newExpandedState[inv.id] = true;
      });
    }
    setExpandedRows(newExpandedState);
  };

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.entities?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || inv.type === activeTab;
    return matchesSearch && matchesTab;
  });

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

  const isAllExpanded =
    filteredInvoices.length > 0 &&
    filteredInvoices.every((inv) => expandedRows[inv.id]);

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

      {/* Tabs Filter */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab('all')}
          className={`pb-3 px-4 text-sm font-semibold transition-colors border-b-2 ${
            activeTab === 'all'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          {t.tabAll}
        </button>
        <button
          onClick={() => setActiveTab('sale')}
          className={`pb-3 px-4 text-sm font-semibold transition-colors border-b-2 ${
            activeTab === 'sale'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          {t.tabSale}
        </button>
        <button
          onClick={() => setActiveTab('purchase')}
          className={`pb-3 px-4 text-sm font-semibold transition-colors border-b-2 ${
            activeTab === 'purchase'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          {t.tabPurchase}
        </button>
        <button
          onClick={() => setActiveTab('expense')}
          className={`pb-3 px-4 text-sm font-semibold transition-colors border-b-2 ${
            activeTab === 'expense'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          {t.tabExpense}
        </button>
      </div>

      {/* Filter, Search & Expand/Collapse All Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
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

        <button
          onClick={() => toggleExpandAll(!isAllExpanded)}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
        >
          {isAllExpanded ? (
            <>
              <Minimize2 className="w-3.5 h-3.5" />
              <span>{t.collapseAll}</span>
            </>
          ) : (
            <>
              <Maximize2 className="w-3.5 h-3.5" />
              <span>{t.expandAll}</span>
            </>
          )}
        </button>
      </div>

      {/* Invoices Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left rtl:text-right border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-4 w-10"></th>
                <th className="p-4">{t.colInvoiceNum}</th>
                <th className="p-4">{t.colType}</th>
                <th className="p-4">{t.colParty}</th>
                <th className="p-4 text-right rtl:text-left">{t.colTotal}</th>
                <th className="p-4 text-right rtl:text-left">{t.colPaid}</th>
                <th className="p-4 text-right rtl:text-left">{t.colBalanceDue}</th>
                <th className="p-4 text-center">{t.colStatus}</th>
                <th className="p-4">{t.colDate}</th>
                <th className="p-4 text-center">{t.colActions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-500">
                    {t.loading}
                  </td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-500">
                    {t.noInvoices}
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <React.Fragment key={inv.id}>
                    <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="p-4 text-center">
                        <button
                          onClick={() => toggleRow(inv.id)}
                          className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors text-slate-500"
                        >
                          {expandedRows[inv.id] ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4 rtl:rotate-180" />
                          )}
                        </button>
                      </td>
                      <td className="p-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                        {inv.invoice_number}
                      </td>
                      <td className="p-4">
                        {inv.type === 'sale' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                            <ArrowUpRight className="w-3.5 h-3.5" /> {t.typeSale}
                          </span>
                        ) : inv.type === 'purchase' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
                            <ArrowDownLeft className="w-3.5 h-3.5" /> {t.typePurchase}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                            <Receipt className="w-3.5 h-3.5" /> {t.typeExpense}
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
                      <td className="p-4 text-center">
                        <Link
                          href={`/invoices/new?edit=${inv.id}`}
                          className="inline-flex items-center p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors"
                          title={t.editInvoice}
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>

                    {/* Collapsible Detail Section */}
                    {expandedRows[inv.id] && (
                      <tr className="bg-slate-50/70 dark:bg-slate-800/40">
                        <td colSpan={10} className="p-4 pl-12 rtl:pr-12">
                          <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                            {inv.transaction_items && inv.transaction_items.length > 0 ? (
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                                    <th className="p-2 text-left rtl:text-right">{t.detailsItem}</th>
                                    <th className="p-2 text-center w-20">{t.detailsQty}</th>
                                    <th className="p-2 text-right rtl:text-left w-28">{t.detailsPrice}</th>
                                    <th className="p-2 text-right rtl:text-left w-28">{t.detailsTotal}</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                  {inv.transaction_items.map((item) => (
                                    <tr key={item.id}>
                                      <td className="p-2 font-medium text-slate-800 dark:text-slate-200">
                                        {item.products?.name || 'Item'}
                                      </td>
                                      <td className="p-2 text-center font-mono">{item.quantity}</td>
                                      <td className="p-2 text-right rtl:text-left font-mono">
                                        {t.currency} {item.unit_price.toLocaleString()}
                                      </td>
                                      <td className="p-2 text-right rtl:text-left font-mono font-semibold">
                                        {t.currency} {item.total_price.toLocaleString()}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            ) : (
                              <p className="text-xs text-slate-500 text-center py-2">{t.noItems}</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}