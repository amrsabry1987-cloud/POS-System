'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  TrendingUp, 
  Users, 
  Truck, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownLeft, 
  RefreshCw,
  Filter,
  Calendar as CalendarIcon,
  ArrowDownRight,
  ArrowUpLeft,
  ChevronDown,
  ChevronUp,
  Wallet,
  Eye,
  EyeOff,
  Receipt,
  CreditCard
} from 'lucide-react';

type DateRangeType = 'today' | 'this_week' | 'this_month' | 'custom';
type EntityTab = 'client' | 'supplier';

const translations = {
  en: {
    title: 'Executive Dashboard',
    subtitle: 'Real-time financial indicators and operations summary',
    totalSales: 'Total Sales',
    paymentsIn: 'Payments In',
    paymentsOut: 'Payments Out',
    clientReceivables: 'Client Receivables',
    supplierPayables: 'Supplier Payables',
    recentInvoices: 'Recent Invoices',
    entityBalances: 'Entities Owed Balances',
    clients: 'Clients',
    suppliers: 'Suppliers',
    invoiceNumber: 'Invoice #',
    type: 'Type',
    party: 'Party',
    invoiceDate: 'Invoice Date',
    total: 'Total',
    sale: 'Sale',
    purchase: 'Purchase',
    walkIn: 'Walk-in',
    lowStockWarnings: 'Low Stock Warnings',
    allHealthy: 'All product inventory levels are healthy.',
    minThreshold: 'Min Threshold',
    units: 'units',
    currency: 'EGP',
    today: 'Today',
    thisWeek: 'This Week (Sat - Fri)',
    thisMonth: 'This Month (1st - End)',
    custom: 'Custom',
    to: 'to',
    noInvoicesFound: 'No invoices found for the selected period',
    noEntitiesFound: 'No active balances found',
    client: 'Client',
    supplier: 'Supplier',
    openingBalance: 'Opening Bal.',
    currentBalance: 'Net Owed Balance',
    actions: 'Actions',
    showDetails: 'Show Details',
    hideDetails: 'Hide Details',
    recordType: 'Record Type',
    dateTime: 'Date / Time',
    amount: 'Invoice/Payment Amount',
    paidAmount: 'Paid Amount',
    invoice: 'Invoice',
    payment: 'Payment',
    noHistoryFound: 'No financial transaction history recorded for this entity.',
  },
  ar: {
    title: 'لوحة التحكم Executive Dashboard',
    subtitle: 'المؤشرات المالية وملخص العمليات في الوقت الفعلي',
    totalSales: 'إجمالي المبيعات',
    paymentsIn: 'المقبوضات (سندات قبض)',
    paymentsOut: 'المدفوعات (سندات صرف)',
    clientReceivables: 'مستحقات عند العملاء',
    supplierPayables: 'ديون للموردين',
    recentInvoices: 'أحدث الفواتير',
    entityBalances: 'أرصدة حسابات العملاء والموردين',
    clients: 'العملاء',
    suppliers: 'الموردون',
    invoiceNumber: 'رقم الفاتورة',
    type: 'النوع',
    party: 'الطرف',
    invoiceDate: 'تاريخ الفاتورة',
    total: 'الإجمالي',
    sale: 'بيع',
    purchase: 'شراء',
    walkIn: 'عميل نقدي',
    lowStockWarnings: 'تنبيهات نقص المخزون',
    allHealthy: 'جميع مستويات المخزون ممتازة.',
    minThreshold: 'الحد الأدنى',
    units: 'قطع',
    currency: 'ج.م',
    today: 'اليوم',
    thisWeek: 'هذا الأسبوع (السبت - الجمعة)',
    thisMonth: 'هذا الشهر (1 - النهاية)',
    custom: 'مخصص',
    to: 'إلى',
    noInvoicesFound: 'لا توجد فواتير للفترة المحددة',
    noEntitiesFound: 'لا توجد أرصدة مستحقة',
    client: 'عميل',
    supplier: 'مورد',
    openingBalance: 'الرصيد الافتتاحي',
    currentBalance: 'الرصيد الصافي المستحق',
    actions: 'الإجراءات',
    showDetails: 'عرض التفاصيل',
    hideDetails: 'إخفاء التفاصيل',
    recordType: 'نوع السجل',
    dateTime: 'التاريخ والوقت',
    amount: 'مبلغ الفاتورة / الدفعة',
    paidAmount: 'المبلغ المدفوع',
    invoice: 'فاتورة',
    payment: 'سند دفع',
    noHistoryFound: 'لا يوجد سجل معاملات مالية لهذا الحساب.',
  },
};

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<'en' | 'ar'>('en');

  // Collapsible panel states
  const [isEntityGridOpen, setIsEntityGridOpen] = useState(true);
  const [isInvoiceGridOpen, setIsInvoiceGridOpen] = useState(true);

  // Entities Grid Tab & Expanded Details State
  const [activeEntityTab, setActiveEntityTab] = useState<EntityTab>('client');
  const [expandedEntityIds, setExpandedEntityIds] = useState<Record<string, boolean>>({});

  // Filter state defaulting to 'this_month'
  const [filterType, setFilterType] = useState<DateRangeType>('this_month');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  const [rawTransactions, setRawTransactions] = useState<any[]>([]);
  const [rawPayments, setRawPayments] = useState<any[]>([]);
  const [rawEntities, setRawEntities] = useState<any[]>([]);
  const [rawProducts, setRawProducts] = useState<any[]>([]);

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

  const toggleEntityDetails = (entityId: string) => {
    setExpandedEntityIds((prev) => ({
      ...prev,
      [entityId]: !prev[entityId],
    }));
  };

  // Boundaries calculation for Date Filtering
  const filterBoundaries = useMemo(() => {
    const now = new Date();
    
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();

    const dayOfWeek = now.getDay();
    const daysSinceSaturday = (dayOfWeek + 1) % 7;
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysSinceSaturday, 0, 0, 0, 0).getTime();
    const weekEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysSinceSaturday + 6, 23, 59, 59, 999).getTime();

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0).getTime();
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).getTime();

    return {
      today: { start: todayStart, end: todayEnd },
      this_week: { start: weekStart, end: weekEnd },
      this_month: { start: monthStart, end: monthEnd }
    };
  }, []);

  const isWithinDateRange = (itemDateRaw: string | undefined) => {
    if (!itemDateRaw) return true;
    const time = new Date(itemDateRaw).getTime();
    if (isNaN(time)) return true;

    if (filterType === 'today') {
      return time >= filterBoundaries.today.start && time <= filterBoundaries.today.end;
    }
    if (filterType === 'this_week') {
      return time >= filterBoundaries.this_week.start && time <= filterBoundaries.this_week.end;
    }
    if (filterType === 'this_month') {
      return time >= filterBoundaries.this_month.start && time <= filterBoundaries.this_month.end;
    }
    if (filterType === 'custom') {
      if (!customStartDate && !customEndDate) return true;
      const start = customStartDate ? new Date(`${customStartDate}T00:00:00`).getTime() : 0;
      const end = customEndDate ? new Date(`${customEndDate}T23:59:59`).getTime() : Date.now();
      return time >= start && time <= end;
    }
    return true;
  };

  const filteredTransactions = useMemo(() => {
    if (!Array.isArray(rawTransactions)) return [];
    return rawTransactions.filter((tx) => isWithinDateRange(tx.created_at || tx.transaction_date || tx.date));
  }, [rawTransactions, filterType, customStartDate, customEndDate, filterBoundaries]);

  const filteredPayments = useMemo(() => {
    if (!Array.isArray(rawPayments)) return [];
    return rawPayments.filter((p) => isWithinDateRange(p.created_at || p.payment_date));
  }, [rawPayments, filterType, customStartDate, customEndDate, filterBoundaries]);

  const filteredTotalRevenue = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.type === 'sale')
      .reduce((sum, t) => sum + Number(t.total || 0), 0);
  }, [filteredTransactions]);

  const filteredPaymentsIn = useMemo(() => {
    return filteredPayments
      .filter((p) => p.type === 'in')
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);
  }, [filteredPayments]);

  const filteredPaymentsOut = useMemo(() => {
    return filteredPayments
      .filter((p) => p.type === 'out')
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);
  }, [filteredPayments]);

  // Calculated Net Balances & Entities Sorted by Most Recent Activity DESC
  const entityBalancesCalculated = useMemo(() => {
    if (!Array.isArray(rawEntities) || rawEntities.length === 0) return [];

    const calculatedList = rawEntities.map((entity) => {
      const openBalance = Number(entity.opening_balance || entity.balance || 0);

      const entityInvoices = rawTransactions.filter((t) => t.entity_id === entity.id);
      const totalSales = entityInvoices
        .filter((t) => t.type === 'sale')
        .reduce((sum, t) => sum + Number(t.total || 0), 0);
      const totalPurchases = entityInvoices
        .filter((t) => t.type === 'purchase')
        .reduce((sum, t) => sum + Number(t.total || 0), 0);

      const entityPayments = rawPayments.filter((p) => p.entity_id === entity.id);
      const totalPaidIn = entityPayments
        .filter((p) => p.type === 'in')
        .reduce((sum, p) => sum + Number(p.amount || 0), 0);
      const totalPaidOut = entityPayments
        .filter((p) => p.type === 'out')
        .reduce((sum, p) => sum + Number(p.amount || 0), 0);

      let netOwed = 0;
      if (entity.type === 'client') {
        netOwed = openBalance + totalSales - totalPaidIn;
      } else {
        netOwed = openBalance + totalPurchases - totalPaidOut;
      }

      // Format ledger details for collapsible view
      const formattedInvoices = entityInvoices.map((inv) => ({
        id: inv.id,
        kind: 'invoice',
        rawDate: inv.created_at || inv.transaction_date || inv.date,
        label: `${inv.invoice_number ? '#' + inv.invoice_number : t.invoice} (${inv.type === 'sale' ? t.sale : t.purchase})`,
        amount: Number(inv.total || 0),
        paidAmount: Number(inv.paid_amount || inv.paid || 0),
      }));

      const formattedPayments = entityPayments.map((pmt) => ({
        id: pmt.id,
        kind: 'payment',
        rawDate: pmt.created_at || pmt.payment_date,
        label: `${t.payment} (${pmt.type === 'in' ? t.paymentsIn : t.paymentsOut})`,
        amount: Number(pmt.amount || 0),
        paidAmount: Number(pmt.amount || 0),
      }));

      // Sort inner ledger items by date/time DESC
      const ledgerDetails = [...formattedInvoices, ...formattedPayments].sort((a, b) => {
        const timeA = new Date(a.rawDate || 0).getTime();
        const timeB = new Date(b.rawDate || 0).getTime();
        return timeB - timeA;
      });

      // Find the entity's single most recent activity date/time
      const latestActivityTimestamp = ledgerDetails.length > 0
        ? new Date(ledgerDetails[0].rawDate || 0).getTime()
        : 0;

      return {
        ...entity,
        calculatedOpenBalance: openBalance,
        calculatedBalance: netOwed,
        ledgerDetails,
        latestActivityTimestamp,
      };
    }).filter((e) => Math.abs(e.calculatedBalance) > 0);

    // Sort entities list by most recent invoice or payment DESC
    return calculatedList.sort((a, b) => b.latestActivityTimestamp - a.latestActivityTimestamp);
  }, [rawEntities, rawTransactions, rawPayments, t]);

  const filteredReceivables = useMemo(() => {
    return entityBalancesCalculated
      .filter((e) => e.type === 'client' && e.calculatedBalance > 0)
      .reduce((sum, e) => sum + e.calculatedBalance, 0);
  }, [entityBalancesCalculated]);

  const filteredPayables = useMemo(() => {
    return entityBalancesCalculated
      .filter((e) => e.type === 'supplier' && e.calculatedBalance > 0)
      .reduce((sum, e) => sum + e.calculatedBalance, 0);
  }, [entityBalancesCalculated]);

  const displayedEntities = useMemo(() => {
    return entityBalancesCalculated.filter((e) => e.type === activeEntityTab);
  }, [entityBalancesCalculated, activeEntityTab]);

  const lowStockProducts = useMemo(() => {
    return rawProducts ? rawProducts.filter((p) => p.stock <= p.min_stock) : [];
  }, [rawProducts]);

  const fetchDashboardData = async () => {
    setLoading(true);

    const { data: transactions } = await supabase
      .from('transactions')
      .select('*, entities(name)');

    const { data: payments } = await supabase.from('payments').select('*');
    const { data: entities } = await supabase.from('entities').select('*');
    const { data: products } = await supabase.from('products').select('*');

    setRawTransactions((transactions || []).slice().reverse());
    setRawPayments(payments || []);
    setRawEntities(entities || []);
    setRawProducts(products || []);

    setLoading(false);
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6 w-full min-w-0">
      {/* Header & Date Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100">{t.title}</h1>
          <p className="text-xs md:text-sm text-slate-500">{t.subtitle}</p>
        </div>

        {/* Date Filter Controls Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-xl shadow-sm">
            <Filter className="w-4 h-4 text-slate-400 mx-1 shrink-0" />
            
            <button
              onClick={() => setFilterType('today')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                filterType === 'today'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {t.today}
            </button>

            <button
              onClick={() => setFilterType('this_week')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                filterType === 'this_week'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {t.thisWeek}
            </button>

            <button
              onClick={() => setFilterType('this_month')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                filterType === 'this_month'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {t.thisMonth}
            </button>

            <button
              onClick={() => setFilterType('custom')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                filterType === 'custom'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {t.custom}
            </button>
          </div>

          {filterType === 'custom' && (
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-xs text-slate-400">{t.to}</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          )}

          <button
            onClick={fetchDashboardData}
            className="p-2 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors shrink-0 bg-white dark:bg-slate-900 shadow-sm"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Sales */}
        <div className="bg-white dark:bg-slate-900 p-4 md:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t.totalSales}</span>
            <div className="p-2 bg-blue-50 dark:bg-blue-950/50 text-blue-600 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xl md:text-2xl font-mono font-bold text-slate-900 dark:text-slate-100">
            {t.currency} {filteredTotalRevenue.toLocaleString()}
          </div>
        </div>

        {/* Payments In */}
        <div className="bg-white dark:bg-slate-900 p-4 md:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t.paymentsIn}</span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 rounded-lg">
              <ArrowDownRight className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xl md:text-2xl font-mono font-bold text-emerald-600 dark:text-emerald-400">
            {t.currency} {filteredPaymentsIn.toLocaleString()}
          </div>
        </div>

        {/* Payments Out */}
        <div className="bg-white dark:bg-slate-900 p-4 md:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t.paymentsOut}</span>
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 rounded-lg">
              <ArrowUpLeft className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xl md:text-2xl font-mono font-bold text-indigo-600 dark:text-indigo-400">
            {t.currency} {filteredPaymentsOut.toLocaleString()}
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
            {t.currency} {filteredReceivables.toLocaleString()}
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
            {t.currency} {filteredPayables.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-w-0">
        <div className="lg:col-span-2 space-y-6 min-w-0">
          
          {/* 1. Collapsible & Tabbed Entity Balances Grid (Sorted DESC by latest transaction) */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden min-w-0">
            <div className="p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-blue-600" />
                <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
                  {t.entityBalances}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                {/* Tabs Split */}
                <div className="flex items-center p-1 bg-slate-200/60 dark:bg-slate-800 rounded-lg">
                  <button
                    onClick={() => setActiveEntityTab('client')}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                      activeEntityTab === 'client'
                        ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {t.clients} ({entityBalancesCalculated.filter((e) => e.type === 'client').length})
                  </button>
                  <button
                    onClick={() => setActiveEntityTab('supplier')}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                      activeEntityTab === 'supplier'
                        ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {t.suppliers} ({entityBalancesCalculated.filter((e) => e.type === 'supplier').length})
                  </button>
                </div>

                <button
                  onClick={() => setIsEntityGridOpen(!isEntityGridOpen)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  {isEntityGridOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {isEntityGridOpen && (
              <div className="p-4 md:p-5 overflow-x-auto">
                <table className="w-full text-xs md:text-sm text-left rtl:text-right">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 text-xs font-semibold">
                    <tr>
                      <th className="p-2.5 md:p-3">{t.party}</th>
                      <th className="p-2.5 md:p-3 text-right rtl:text-left">{t.openingBalance}</th>
                      <th className="p-2.5 md:p-3 text-right rtl:text-left">{t.currentBalance}</th>
                      <th className="p-2.5 md:p-3 text-center">{t.actions}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {displayedEntities.length > 0 ? (
                      displayedEntities.map((e) => {
                        const isExpanded = !!expandedEntityIds[e.id];

                        return (
                          <React.Fragment key={e.id}>
                            <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                              <td className="p-2.5 md:p-3 font-medium text-slate-800 dark:text-slate-200">{e.name}</td>
                              <td className="p-2.5 md:p-3 text-right rtl:text-left font-mono text-slate-500">
                                {t.currency} {e.calculatedOpenBalance.toLocaleString()}
                              </td>
                              <td className={`p-2.5 md:p-3 text-right rtl:text-left font-mono font-bold ${
                                e.calculatedBalance > 0 
                                  ? e.type === 'client' ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'
                                  : 'text-emerald-600 dark:text-emerald-400'
                              }`}>
                                {t.currency} {e.calculatedBalance.toLocaleString()}
                              </td>
                              <td className="p-2.5 md:p-3 text-center">
                                <button
                                  onClick={() => toggleEntityDetails(e.id)}
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                                    isExpanded
                                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700'
                                      : 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900 hover:bg-blue-100'
                                  }`}
                                >
                                  {isExpanded ? (
                                    <>
                                      <EyeOff className="w-3.5 h-3.5" />
                                      <span>{t.hideDetails}</span>
                                    </>
                                  ) : (
                                    <>
                                      <Eye className="w-3.5 h-3.5" />
                                      <span>{t.showDetails}</span>
                                    </>
                                  )}
                                </button>
                              </td>
                            </tr>

                            {/* Nested Details Collapsible Grid */}
                            {isExpanded && (
                              <tr>
                                <td colSpan={4} className="bg-slate-50/80 dark:bg-slate-900/60 p-3 md:p-4 border-y border-slate-200 dark:border-slate-800">
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300 pb-1">
                                      <span>Invoices & Payments Ledger ({e.name})</span>
                                      <span className="font-mono text-slate-400">Items: {e.ledgerDetails.length}</span>
                                    </div>

                                    {e.ledgerDetails.length > 0 ? (
                                      <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
                                        <table className="w-full text-xs">
                                          <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                                            <tr>
                                              <th className="p-2 text-left rtl:text-right">{t.recordType}</th>
                                              <th className="p-2 text-left rtl:text-right">{t.dateTime}</th>
                                              <th className="p-2 text-right rtl:text-left">{t.amount}</th>
                                              <th className="p-2 text-right rtl:text-left">{t.paidAmount}</th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                            {e.ledgerDetails.map((item: any) => {
                                              const formattedDate = item.rawDate 
                                                ? new Date(item.rawDate).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                  })
                                                : '-';

                                              return (
                                                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                                                  <td className="p-2 font-medium text-slate-800 dark:text-slate-200">
                                                    <span className="inline-flex items-center gap-1.5">
                                                      {item.kind === 'invoice' ? (
                                                        <Receipt className="w-3.5 h-3.5 text-blue-500" />
                                                      ) : (
                                                        <CreditCard className="w-3.5 h-3.5 text-emerald-500" />
                                                      )}
                                                      {item.label}
                                                    </span>
                                                  </td>
                                                  <td className="p-2 text-slate-500 font-mono whitespace-nowrap">
                                                    {formattedDate}
                                                  </td>
                                                  <td className="p-2 text-right rtl:text-left font-mono font-semibold text-slate-700 dark:text-slate-300">
                                                    {t.currency} {item.amount.toLocaleString()}
                                                  </td>
                                                  <td className="p-2 text-right rtl:text-left font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                                                    {t.currency} {item.paidAmount.toLocaleString()}
                                                  </td>
                                                </tr>
                                              );
                                            })}
                                          </tbody>
                                        </table>
                                      </div>
                                    ) : (
                                      <p className="text-xs text-slate-400 text-center py-3">
                                        {t.noHistoryFound}
                                      </p>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-slate-400 text-xs">
                          {t.noEntitiesFound}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 2. Collapsible Recent Invoices Grid */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden min-w-0">
            <button
              onClick={() => setIsInvoiceGridOpen(!isInvoiceGridOpen)}
              className="w-full p-4 md:p-5 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-100/50 dark:hover:bg-slate-800/60 transition-colors border-b border-slate-100 dark:border-slate-800"
            >
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-blue-600" />
                <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
                  {t.recentInvoices}
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono font-bold">
                  {filteredTransactions.length}
                </span>
              </div>
              {isInvoiceGridOpen ? (
                <ChevronUp className="w-5 h-5 text-slate-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-400" />
              )}
            </button>

            {isInvoiceGridOpen && (
              <div className="p-4 md:p-5 overflow-x-auto">
                <table className="w-full text-xs md:text-sm text-left rtl:text-right">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 text-xs font-semibold">
                    <tr>
                      <th className="p-2.5 md:p-3">{t.invoiceNumber}</th>
                      <th className="p-2.5 md:p-3">{t.type}</th>
                      <th className="p-2.5 md:p-3">{t.party}</th>
                      <th className="p-2.5 md:p-3">{t.invoiceDate}</th>
                      <th className="p-2.5 md:p-3 text-right rtl:text-left">{t.total}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredTransactions.length > 0 ? (
                      filteredTransactions.slice(0, 10).map((tx) => {
                        const txDateRaw = tx.created_at || tx.transaction_date || tx.date;
                        const formattedDate = txDateRaw 
                          ? new Date(txDateRaw).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                          : '-';

                        return (
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
                            <td className="p-2.5 md:p-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                              <div className="flex items-center gap-1">
                                <CalendarIcon className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>{formattedDate}</span>
                              </div>
                            </td>
                            <td className="p-2.5 md:p-3 text-right rtl:text-left font-mono font-bold">
                              {t.currency} {tx.total?.toLocaleString()}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-400 text-xs">
                          {t.noInvoicesFound}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* Low Stock Widget */}
        <div className="bg-white dark:bg-slate-900 p-4 md:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 min-w-0 h-fit">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-base">
            <AlertTriangle className="w-5 h-5" />
            <span>{t.lowStockWarnings} ({lowStockProducts.length})</span>
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