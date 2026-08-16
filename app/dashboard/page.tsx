'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Truck, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownLeft, 
  RefreshCw 
} from 'lucide-react';

const translations = {
  en: {
    title: 'Executive Dashboard',
    subtitle: 'Real-time financial indicators and operations summary',
    totalSales: 'Total Sales',
    estNetMargin: 'Est. Net Margin',
    clientReceivables: 'Client Receivables',
    supplierPayables: 'Supplier Payables',
    recentInvoices: 'Recent Invoices',
    invoiceNumber: 'Invoice #',
    type: 'Type',
    party: 'Party',
    total: 'Total',
    sale: 'Sale',
    purchase: 'Purchase',
    walkIn: 'Walk-in',
    lowStockWarnings: 'Low Stock Warnings',
    allHealthy: 'All product inventory levels are healthy.',
    minThreshold: 'Min Threshold',
    units: 'units',
    currency: 'EGP',
  },
  ar: {
    title: 'لوحة التحكم Executive Dashboard',
    subtitle: 'المؤشرات المالية وملخص العمليات في الوقت الفعلي',
    totalSales: 'إجمالي المبيعات',
    estNetMargin: 'هامش الربح التقديري',
    clientReceivables: 'مستحقات عند العملاء',
    supplierPayables: 'ديون للموردين',
    recentInvoices: 'أحدث الفواتير',
    invoiceNumber: 'رقم الفاتورة',
    type: 'النوع',
    party: 'الطرف',
    total: 'الإجمالي',
    sale: 'بيع',
    purchase: 'شراء',
    walkIn: 'عميل نقدي',
    lowStockWarnings: 'تنبيهات نقص المخزون',
    allHealthy: 'جميع مستويات المخزون ممتازة.',
    minThreshold: 'الحد الأدنى',
    units: 'قطع',
    currency: 'ج.م',
  },
};

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<'en' | 'ar'>('en');

  const [stats, setStats] = useState({
    totalRevenue: 0,
    estimatedProfit: 0,
    totalReceivables: 0,
    totalPayables: 0,
    lowStockCount: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);

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

  const fetchDashboardData = async () => {
    setLoading(true);

    const { data: transactions } = await supabase
      .from('transactions')
      .select('*, entities(name)');

    const { data: entities } = await supabase.from('entities').select('*');
    const { data: products } = await supabase.from('products').select('*');
    const { data: items } = await supabase.from('transaction_items').select('*');

    let revenue = 0;
    if (transactions) {
      revenue = transactions
        .filter((t) => t.type === 'sale')
        .reduce((sum, t) => sum + Number(t.total || 0), 0);
    }

    let profit = 0;
    if (items && products && transactions) {
      const saleTxIds = new Set(
        transactions.filter((t) => t.type === 'sale').map((t) => t.id)
      );

      items.forEach((item) => {
        if (saleTxIds.has(item.transaction_id)) {
          const prod = products.find((p) => p.id === item.product_id);
          const cost = prod ? prod.purchase_price : 0;
          profit += (item.unit_price - cost) * item.quantity;
        }
      });
    }

    let receivables = 0;
    let payables = 0;
    if (entities) {
      entities.forEach((e) => {
        if (e.type === 'client' && e.balance > 0) receivables += e.balance;
        if (e.type === 'supplier' && e.balance < 0) payables += Math.abs(e.balance);
      });
    }

    const lowStock = products ? products.filter((p) => p.stock <= p.min_stock) : [];

    setStats({
      totalRevenue: revenue,
      estimatedProfit: profit,
      totalReceivables: receivables,
      totalPayables: payables,
      lowStockCount: lowStock.length,
    });

    setLowStockProducts(lowStock);
    setRecentTransactions((transactions || []).slice(-5).reverse());
    setLoading(false);
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6 w-full min-w-0">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100">{t.title}</h1>
          <p className="text-xs md:text-sm text-slate-500">{t.subtitle}</p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="p-2 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors shrink-0"
          title="Refresh Data"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-white dark:bg-slate-900 p-4 md:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t.totalSales}</span>
            <div className="p-2 bg-blue-50 dark:bg-blue-950/50 text-blue-600 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xl md:text-2xl font-mono font-bold text-slate-900 dark:text-slate-100">
            {t.currency} {stats.totalRevenue.toLocaleString()}
          </div>
        </div>

        {/* Gross Profit */}
        <div className="bg-white dark:bg-slate-900 p-4 md:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t.estNetMargin}</span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 rounded-lg">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xl md:text-2xl font-mono font-bold text-emerald-600 dark:text-emerald-400">
            {t.currency} {stats.estimatedProfit.toLocaleString()}
          </div>
        </div>

        {/* Client Receivables */}
        <div className="bg-white dark:bg-slate-900 p-4 md:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t.clientReceivables}</span>
            <div className="p-2 bg-amber-50 dark:bg-amber-950/50 text-amber-600 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xl md:text-2xl font-mono font-bold text-amber-600 dark:text-amber-400">
            {t.currency} {stats.totalReceivables.toLocaleString()}
          </div>
        </div>

        {/* Supplier Payables */}
        <div className="bg-white dark:bg-slate-900 p-4 md:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t.supplierPayables}</span>
            <div className="p-2 bg-red-50 dark:bg-red-950/50 text-red-600 rounded-lg">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xl md:text-2xl font-mono font-bold text-red-600 dark:text-red-400">
            {t.currency} {stats.totalPayables.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-w-0">
        {/* Recent Invoices List */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-4 md:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm min-w-0">
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-4">
            {t.recentInvoices}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs md:text-sm text-left rtl:text-right">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 text-xs font-semibold">
                <tr>
                  <th className="p-2.5 md:p-3">{t.invoiceNumber}</th>
                  <th className="p-2.5 md:p-3">{t.type}</th>
                  <th className="p-2.5 md:p-3">{t.party}</th>
                  <th className="p-2.5 md:p-3 text-right rtl:text-left">{t.total}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentTransactions.map((tx) => (
                  <tr key={tx.id}>
                    <td className="p-2.5 md:p-3 font-mono font-bold text-blue-600">{tx.invoice_number}</td>
                    <td className="p-2.5 md:p-3">
                      {tx.type === 'sale' ? (
                        <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                          <ArrowUpRight className="w-3 h-3" /> {t.sale}
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-blue-600 flex items-center gap-1">
                          <ArrowDownLeft className="w-3 h-3" /> {t.purchase}
                        </span>
                      )}
                    </td>
                    <td className="p-2.5 md:p-3 font-medium">{tx.entities?.name || t.walkIn}</td>
                    <td className="p-2.5 md:p-3 text-right rtl:text-left font-mono font-bold">
                      {t.currency} {tx.total?.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Widget */}
        <div className="bg-white dark:bg-slate-900 p-4 md:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 min-w-0">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-base">
            <AlertTriangle className="w-5 h-5" />
            <span>{t.lowStockWarnings} ({stats.lowStockCount})</span>
          </div>
          {lowStockProducts.length === 0 ? (
            <p className="text-xs text-slate-500 py-4">{t.allHealthy}</p>
          ) : (
            <div className="space-y-3">
              {lowStockProducts.map((p) => (
                <div key={p.id} className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-xs">
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-200">{p.name}</div>
                    <div className="text-slate-400">{t.minThreshold}: {p.min_stock}</div>
                  </div>
                  <div className="font-mono font-bold text-red-600 bg-red-100 dark:bg-red-950/50 px-2 py-1 rounded">
                    {p.stock} {t.units}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}