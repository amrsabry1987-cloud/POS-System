'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { CreditCard, Plus, Search, RefreshCw, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

interface Entity {
  id: string;
  name: string;
  type: 'client' | 'supplier';
  balance: number;
}

interface Payment {
  id: string;
  reference_number: string;
  type: 'client_payment' | 'supplier_payment';
  amount: number;
  method: string;
  notes: string;
  created_at: string;
  entities?: { name: string };
}

const translations = {
  en: {
    pageTitle: 'Ledger & Payments',
    pageSubtitle: 'Record payments received from clients or paid to suppliers',
    refresh: 'Refresh Data',
    recordPaymentBtn: 'Record Payment',
    searchPlaceholder: 'Search by reference # or entity name...',
    colRef: 'Reference',
    colType: 'Type',
    colParty: 'Party',
    colMethod: 'Method',
    colAmount: 'Amount',
    colDate: 'Date',
    loading: 'Loading payments...',
    noPayments: 'No payment records found.',
    typeReceived: 'Received (Client)',
    typePaid: 'Paid (Supplier)',
    modalTitle: 'Record Payment',
    btnClientPayment: '📥 Payment Received (Client)',
    btnSupplierPayment: '📤 Payment Paid (Supplier)',
    selectPartyLabel: (type: string) => `Select ${type === 'client_payment' ? 'Client' : 'Supplier'} *`,
    chooseParty: '-- Choose Party --',
    balance: 'Balance',
    amountLabel: 'Amount (EGP) *',
    methodLabel: 'Payment Method',
    notesLabel: 'Notes / Description',
    notesPlaceholder: 'Optional payment notes...',
    methodCash: 'Cash',
    methodCard: 'Card / POS',
    methodBank: 'Bank Transfer',
    methodWallet: 'Mobile Wallet',
    cancel: 'Cancel',
    savePayment: 'Save Payment',
    alertSelectEntity: 'Select a Client or Supplier',
    alertMinAmount: 'Payment amount must be greater than zero',
    alertFailed: 'Payment failed: ',
    currency: 'EGP',
  },
  ar: {
    pageTitle: 'دفتر الحسابات والمدفوعات',
    pageSubtitle: 'تسجيل التحصيلات من العملاء أو الدفعات للموردين',
    refresh: 'تحديث البيانات',
    recordPaymentBtn: 'تسجيل دفعة / سند',
    searchPlaceholder: 'البحث برقم المرجع أو اسم العميل/المورد...',
    colRef: 'رقم السند / المرجع',
    colType: 'النوع',
    colParty: 'الطرف الثاني',
    colMethod: 'طريقة الدفع',
    colAmount: 'المبلغ',
    colDate: 'التاريخ',
    loading: 'جاري تحميل المدفوعات...',
    noPayments: 'لا توجد سجلات مدفوعات حالياً.',
    typeReceived: 'تحصيل (من عميل)',
    typePaid: 'سداد (لمورد)',
    modalTitle: 'تسجيل عملية دفع / تحصيل',
    btnClientPayment: '📥 تحصيل نقدية (من عميل)',
    btnSupplierPayment: '📤 سداد نقدية (لمورد)',
    selectPartyLabel: (type: string) => `اختر ${type === 'client_payment' ? 'العميل' : 'المورد'} *`,
    chooseParty: '-- اختر الطرف الثاني --',
    balance: 'الرصيد الحالي',
    amountLabel: 'المبلغ (ج.م) *',
    methodLabel: 'طريقة السداد',
    notesLabel: 'ملاحظات / البيان',
    notesPlaceholder: 'ملاحظات اختيارية حول العملية...',
    methodCash: 'نقداً (كاش)',
    methodCard: 'بطاقة إلكترونية / POS',
    methodBank: 'تحويل بنكي',
    methodWallet: 'محفظة إلكترونية',
    cancel: 'إلغاء',
    savePayment: 'حفظ السند',
    alertSelectEntity: 'يرجى تحديد العميل أو المورد',
    alertMinAmount: 'يجب أن يكون مبلغ الدفع أكبر من الصفر',
    alertFailed: 'فشلت عملية حفظ السند: ',
    currency: 'ج.م',
  },
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [lang, setLang] = useState<'en' | 'ar'>('en');

  // Detect Active Language
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

  // Form State
  const [formData, setFormData] = useState({
    type: 'client_payment' as 'client_payment' | 'supplier_payment',
    entity_id: '',
    amount: 0,
    method: 'cash',
    notes: '',
  });

  const fetchData = async () => {
    setLoading(true);
    const { data: payData } = await supabase
      .from('payments')
      .select('*, entities(name)')
      .order('created_at', { ascending: false });

    const { data: entData } = await supabase.from('entities').select('*');

    setPayments(payData || []);
    setEntities(entData || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTypeChange = (type: 'client_payment' | 'supplier_payment') => {
    setFormData((prev) => ({ ...prev, type, entity_id: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.entity_id) return alert(t.alertSelectEntity);
    if (formData.amount <= 0) return alert(t.alertMinAmount);

    const refNo = `PAY-${Date.now().toString().slice(-6)}`;

    // 1. Insert Payment Ledger Record
    const { error: payErr } = await supabase.from('payments').insert([
      {
        reference_number: refNo,
        type: formData.type,
        entity_id: formData.entity_id,
        amount: formData.amount,
        method: formData.method,
        notes: formData.notes,
      },
    ]);

    if (payErr) return alert(t.alertFailed + payErr.message);

    // 2. Adjust Entity Balance
    const selectedEntity = entities.find((e) => e.id === formData.entity_id);
    if (selectedEntity) {
      const balanceAdjustment = formData.type === 'client_payment' ? -formData.amount : formData.amount;
      await supabase
        .from('entities')
        .update({ balance: selectedEntity.balance + balanceAdjustment })
        .eq('id', selectedEntity.id);
    }

    setIsModalOpen(false);
    setFormData({ type: 'client_payment', entity_id: '', amount: 0, method: 'cash', notes: '' });
    fetchData();
  };

  const filteredEntities = entities.filter(
    (e) => e.type === (formData.type === 'client_payment' ? 'client' : 'supplier')
  );

  const filteredPayments = payments.filter(
    (p) =>
      p.reference_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.entities?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getMethodLabel = (method: string) => {
    switch (method) {
      case 'cash':
        return t.methodCash;
      case 'card':
        return t.methodCard;
      case 'bank_transfer':
        return t.methodBank;
      case 'wallet':
        return t.methodWallet;
      default:
        return method;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t.pageTitle}</h1>
          <p className="text-sm text-slate-500">{t.pageSubtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            title={t.refresh}
            className="p-2 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>{t.recordPaymentBtn}</span>
          </button>
        </div>
      </div>

      {/* Search */}
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

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left rtl:text-right border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-4">{t.colRef}</th>
                <th className="p-4">{t.colType}</th>
                <th className="p-4">{t.colParty}</th>
                <th className="p-4">{t.colMethod}</th>
                <th className="p-4 text-right rtl:text-left">{t.colAmount}</th>
                <th className="p-4">{t.colDate}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">{t.loading}</td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    {t.noPayments}
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                      {p.reference_number}
                    </td>
                    <td className="p-4">
                      {p.type === 'client_payment' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          <ArrowDownLeft className="w-3.5 h-3.5" /> {t.typeReceived}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 dark:text-red-400">
                          <ArrowUpRight className="w-3.5 h-3.5" /> {t.typePaid}
                        </span>
                      )}
                    </td>
                    <td className="p-4 font-semibold text-slate-800 dark:text-slate-100">
                      {p.entities?.name || '-'}
                    </td>
                    <td className="p-4 text-xs font-semibold text-slate-600 dark:text-slate-400">
                      {getMethodLabel(p.method)}
                    </td>
                    <td className="p-4 text-right rtl:text-left font-mono font-bold text-slate-900 dark:text-slate-100">
                      {t.currency} {p.amount.toLocaleString()}
                    </td>
                    <td className="p-4 text-xs text-slate-500">
                      {new Date(p.created_at).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{t.modalTitle}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => handleTypeChange('client_payment')}
                  className={`p-2.5 rounded-lg border font-bold text-xs ${
                    formData.type === 'client_payment'
                      ? 'bg-emerald-50 border-emerald-600 text-emerald-700 dark:bg-emerald-950/40'
                      : 'border-slate-300 dark:border-slate-700'
                  }`}
                >
                  {t.btnClientPayment}
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange('supplier_payment')}
                  className={`p-2.5 rounded-lg border font-bold text-xs ${
                    formData.type === 'supplier_payment'
                      ? 'bg-red-50 border-red-600 text-red-700 dark:bg-red-950/40'
                      : 'border-slate-300 dark:border-slate-700'
                  }`}
                >
                  {t.btnSupplierPayment}
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  {t.selectPartyLabel(formData.type)}
                </label>
                <select
                  required
                  value={formData.entity_id}
                  onChange={(e) => setFormData({ ...formData, entity_id: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-none"
                >
                  <option value="">{t.chooseParty}</option>
                  {filteredEntities.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} ({t.balance}: {t.currency} {e.balance})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    {t.amountLabel}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    {t.methodLabel}
                  </label>
                  <select
                    value={formData.method}
                    onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-none"
                  >
                    <option value="cash">{t.methodCash}</option>
                    <option value="card">{t.methodCard}</option>
                    <option value="bank_transfer">{t.methodBank}</option>
                    <option value="wallet">{t.methodWallet}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  {t.notesLabel}
                </label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-none"
                  placeholder={t.notesPlaceholder}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  {t.cancel}
                </button>
                <button type="submit" className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                  {t.savePayment}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}