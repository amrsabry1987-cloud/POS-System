'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Printer } from 'lucide-react';

interface Entity {
  id: string;
  name: string;
  type: 'client' | 'supplier';
  phone?: string;
  balance: number;
}

const translations = {
  en: {
    pageTitle: 'Financial Reports & Statements',
    pageSubtitle: 'Generate, review, and print key business performance audit sheets',
    printBtn: 'Print / Export PDF',
    tabPnl: 'Profit & Loss Statement',
    tabValuation: 'Inventory Valuation',
    tabAging: 'Outstanding Balances (Aging)',
    letterheadTitle: 'Commercial Account Statement',
    generatedOn: 'Generated on',
    // P&L
    pnlTitle: 'Income Statement (Profit & Loss)',
    pnlSales: 'Total Sales Revenue',
    pnlCogs: 'Less: Cost of Goods Sold (COGS)',
    pnlProfit: 'Estimated Gross Profit',
    // Valuation
    valTitle: 'Stock Asset Valuation',
    valUnits: 'Total Units in Stock',
    valCost: 'Inventory Cost Value (Purchase Base)',
    valRetail: 'Expected Retail Realization',
    unitsSuffix: 'units',
    // Aging
    agingTitle: 'Entity Unpaid Balances Ledger',
    colParty: 'Party Name',
    colType: 'Entity Type',
    colPhone: 'Phone',
    colBalance: 'Running Balance',
    clientType: 'Client',
    supplierType: 'Supplier',
    owesUs: 'Owes Us',
    weOwe: 'We Owe',
    loading: 'Loading report data...',
    noData: 'No outstanding balances found.',
    currency: 'EGP',
  },
  ar: {
    pageTitle: 'التقارير المالية والقوائم',
    pageSubtitle: 'استعراض وطباعة قوائم الأرباح والخسائر وتقييم المخزون وأرصدة الحسابات',
    printBtn: 'طباعة / تصدير PDF',
    tabPnl: 'قائمة الأرباح والخسائر (P&L)',
    tabValuation: 'تقييم المخزون',
    tabAging: 'أرصدة الحسابات والمديونيات',
    letterheadTitle: 'كشف حساب مالي تجاري',
    generatedOn: 'تاريخ الإصدار',
    // P&L
    pnlTitle: 'قائمة الدخل (الأرباح والخسائر)',
    pnlSales: 'إجمالي إيرادات المبيعات',
    pnlCogs: 'يُخصم: تكلفة البضاعة المباعة (COGS)',
    pnlProfit: 'مجمل الربح التقديري',
    // Valuation
    valTitle: 'تقييم أصول البضاعة والمخزون',
    valUnits: 'إجمالي الكميات بالمخزن',
    valCost: 'قيمة المخزون بسعر الشراء (التكلفة)',
    valRetail: 'القيمة البيعية التقديرية (القطاعي)',
    unitsSuffix: 'قطعة/وحدة',
    // Aging
    agingTitle: 'دفتر أرصدة العملاء والموردين المتبقية',
    colParty: 'اسم العميل / المورد',
    colType: 'نوع الحساب',
    colPhone: 'رقم الهاتف',
    colBalance: 'الرصيد المتبقي',
    clientType: 'عميل',
    supplierType: 'مورد',
    owesUs: 'مستحق لنا',
    weOwe: 'مستحق علينا',
    loading: 'جاري تحميل بيانات التقرير...',
    noData: 'لا توجد أرصدة معلقة حالياً.',
    currency: 'ج.م',
  },
};

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState<'pnl' | 'valuation' | 'aging'>('pnl');
  const [lang, setLang] = useState<'en' | 'ar'>('en');

  const [pnlData, setPnlData] = useState({ revenue: 0, cogs: 0, grossProfit: 0 });
  const [stockValuation, setStockValuation] = useState({ totalCost: 0, totalRetail: 0, totalItems: 0 });
  const [agingData, setAgingData] = useState<Entity[]>([]);

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

  const fetchReportData = async () => {
    setLoading(true);

    // 1. P&L Data
    const { data: txs } = await supabase.from('transactions').select('*');
    const { data: items } = await supabase.from('transaction_items').select('*');
    const { data: prods } = await supabase.from('products').select('*');

    if (txs && items && prods) {
      let revenue = 0;
      let cogs = 0;

      const saleTxIds = new Set(txs.filter((t) => t.type === 'sale').map((t) => t.id));
      revenue = txs.filter((t) => t.type === 'sale').reduce((sum, t) => sum + Number(t.total || 0), 0);

      items.forEach((item) => {
        if (saleTxIds.has(item.transaction_id)) {
          const p = prods.find((prod) => prod.id === item.product_id);
          const cost = p ? p.purchase_price : 0;
          cogs += cost * item.quantity;
        }
      });

      setPnlData({ revenue, cogs, grossProfit: revenue - cogs });
    }

    // 2. Stock Valuation
    if (prods) {
      let totalCost = 0;
      let totalRetail = 0;
      let totalItems = 0;

      prods.forEach((p) => {
        totalCost += (p.purchase_price || 0) * (p.stock || 0);
        totalRetail += (p.selling_price || 0) * (p.stock || 0);
        totalItems += p.stock || 0;
      });

      setStockValuation({ totalCost, totalRetail, totalItems });
    }

    // 3. Receivables & Payables Aging
    const { data: entities } = await supabase.from('entities').select('*').neq('balance', 0);
    setAgingData(entities || []);

    setLoading(false);
  };

  useEffect(() => {
    fetchReportData();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t.pageTitle}</h1>
          <p className="text-sm text-slate-500">{t.pageSubtitle}</p>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Printer className="w-4 h-4" />
          <span>{t.printBtn}</span>
        </button>
      </div>

      {/* Tabs - Hidden in Print */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 print:hidden overflow-x-auto">
        <button
          onClick={() => setReportType('pnl')}
          className={`px-5 py-3 font-semibold text-sm border-b-2 transition-colors whitespace-nowrap ${
            reportType === 'pnl' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'
          }`}
        >
          {t.tabPnl}
        </button>
        <button
          onClick={() => setReportType('valuation')}
          className={`px-5 py-3 font-semibold text-sm border-b-2 transition-colors whitespace-nowrap ${
            reportType === 'valuation' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'
          }`}
        >
          {t.tabValuation}
        </button>
        <button
          onClick={() => setReportType('aging')}
          className={`px-5 py-3 font-semibold text-sm border-b-2 transition-colors whitespace-nowrap ${
            reportType === 'aging' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'
          }`}
        >
          {t.tabAging}
        </button>
      </div>

      {/* Report Container */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 print:border-none print:shadow-none print:p-0">
        
        {/* Printable Letterhead Header */}
        <div className="border-b pb-4 mb-6 border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{t.letterheadTitle}</h2>
          <p className="text-xs text-slate-500">
            {t.generatedOn}: {new Date().toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}
          </p>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-500">{t.loading}</div>
        ) : (
          <>
            {/* 1. Profit & Loss Report */}
            {reportType === 'pnl' && (
              <div className="space-y-4 max-w-xl">
                <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 border-b pb-2 border-slate-200 dark:border-slate-800">
                  {t.pnlTitle}
                </h3>
                <div className="flex justify-between py-2 text-sm border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-400">{t.pnlSales}</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                    {t.currency} {pnlData.revenue.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-2 text-sm border-b border-slate-100 dark:border-slate-800 text-red-600">
                  <span>{t.pnlCogs}</span>
                  <span className="font-mono font-bold">- {t.currency} {pnlData.cogs.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-3 text-base font-bold bg-slate-50 dark:bg-slate-800/50 px-3 rounded-lg text-emerald-600 dark:text-emerald-400">
                  <span>{t.pnlProfit}</span>
                  <span className="font-mono">{t.currency} {pnlData.grossProfit.toLocaleString()}</span>
                </div>
              </div>
            )}

            {/* 2. Inventory Valuation Report */}
            {reportType === 'valuation' && (
              <div className="space-y-4 max-w-xl">
                <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 border-b pb-2 border-slate-200 dark:border-slate-800">
                  {t.valTitle}
                </h3>
                <div className="flex justify-between py-2 text-sm border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-400">{t.valUnits}</span>
                  <span className="font-mono font-bold">
                    {stockValuation.totalItems.toLocaleString()} {t.unitsSuffix}
                  </span>
                </div>
                <div className="flex justify-between py-2 text-sm border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-400">{t.valCost}</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                    {t.currency} {stockValuation.totalCost.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-3 text-base font-bold bg-slate-50 dark:bg-slate-800/50 px-3 rounded-lg text-blue-600 dark:text-blue-400">
                  <span>{t.valRetail}</span>
                  <span className="font-mono">{t.currency} {stockValuation.totalRetail.toLocaleString()}</span>
                </div>
              </div>
            )}

            {/* 3. Outstanding Balances Aging Report */}
            {reportType === 'aging' && (
              <div className="space-y-4">
                <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 border-b pb-2 border-slate-200 dark:border-slate-800">
                  {t.agingTitle}
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left rtl:text-right border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-xs font-semibold border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="p-3">{t.colParty}</th>
                        <th className="p-3">{t.colType}</th>
                        <th className="p-3">{t.colPhone}</th>
                        <th className="p-3 text-right rtl:text-left">{t.colBalance}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {agingData.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-slate-500">
                            {t.noData}
                          </td>
                        </tr>
                      ) : (
                        agingData.map((e) => (
                          <tr key={e.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">{e.name}</td>
                            <td className="p-3 text-xs text-slate-500">
                              {e.type === 'client' ? t.clientType : t.supplierType}
                            </td>
                            <td className="p-3 font-mono text-xs text-slate-600 dark:text-slate-400">{e.phone || '-'}</td>
                            <td className="p-3 text-right rtl:text-left font-mono font-bold">
                              {e.balance > 0 ? (
                                <span className="text-amber-600 dark:text-amber-400">
                                  {t.currency} {e.balance.toLocaleString()} ({t.owesUs})
                                </span>
                              ) : (
                                <span className="text-red-600 dark:text-red-400">
                                  {t.currency} {Math.abs(e.balance).toLocaleString()} ({t.weOwe})
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}