'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Plus, 
  Edit2, 
  X, 
  Save, 
  ArrowDownLeft, 
  ArrowUpRight, 
  FileText, 
  Share2,
  Printer 
} from 'lucide-react';

interface Entity {
  id: string;
  name: string;
  type: 'client' | 'supplier';
  balance: number;
}

interface Payment {
  id: string;
  type: 'in' | 'out';
  entity_id: string;
  amount: number;
  payment_date?: string;
  method?: string;
  notes?: string;
  created_at: string;
  entities?: { name: string; type: string };
}

const translations = {
  en: {
    pageTitle: 'Payments & Receipts',
    newPaymentBtn: 'Record New Payment',
    modalTitleNew: 'Record New Payment',
    modalTitleEdit: 'Edit Payment Record',
    colType: 'Type',
    colParty: 'Party Name',
    colAmount: 'Amount',
    colDate: 'Payment Date',
    colMethod: 'Method',
    colNotes: 'Notes',
    colActions: 'Actions',
    typeIn: 'Receipt In',
    typeOut: 'Payment Out',
    typeIncome: '📥 Receipt / Payment In (Client)',
    typeExpense: '📤 Payment Out (Supplier)',
    selectEntity: (type: string) => `Select ${type === 'in' ? 'Client' : 'Supplier'} *`,
    chooseEntity: '-- Choose Party --',
    currBalance: 'Current Balance',
    amount: 'Payment Amount *',
    paymentDate: 'Payment Date *',
    paymentMethod: 'Payment Method',
    cash: 'Cash',
    bank: 'Bank Transfer',
    check: 'Check',
    notes: 'Notes / Description',
    submitting: 'Saving...',
    submitBtnNew: 'Record Payment',
    submitAndShareBtn: 'Save & Share WhatsApp',
    submitBtnEdit: 'Update Payment',
    alertSelectEntity: 'Please select a client or supplier',
    alertError: 'Error saving payment: ',
    noRecords: 'No payment records found.',
    currency: 'EGP',
    pdfViewTitle: 'Payment Voucher',
    printPdf: 'Print PDF',
    closePdf: 'Close',
  },
  ar: {
    pageTitle: 'المدفوعات والمقبوضات',
    newPaymentBtn: 'تسجيل دفعة جديدة',
    modalTitleNew: 'تسجيل دفعة جديدة',
    modalTitleEdit: 'تعديل سجل الدفعة',
    colType: 'النوع',
    colParty: 'اسم الطرف الثاني',
    colAmount: 'المبلغ',
    colDate: 'تاريخ الدفعة',
    colMethod: 'طريقة الدفع',
    colNotes: 'ملاحظات',
    colActions: 'إجراءات',
    typeIn: 'سند قبض',
    typeOut: 'سند صرف',
    typeIncome: '📥 سند قبض / تحصيل (من عميل)',
    typeExpense: '📤 سند صرف / دفع (لمورد)',
    selectEntity: (type: string) => `اختر ${type === 'in' ? 'العميل' : 'المورد'} *`,
    chooseEntity: '-- اختر الطرف الثاني --',
    currBalance: 'الرصيد الحالي',
    amount: 'مبلغ الدفعة *',
    paymentDate: 'تاريخ الدفعة *',
    paymentMethod: 'طريقة الدفع',
    cash: 'نقداً',
    bank: 'تحويل بنكي',
    check: 'شيك',
    notes: 'ملاحظات / البيان',
    submitting: 'جاري الحفظ...',
    submitBtnNew: 'حفظ وتأكيد الدفعة',
    submitAndShareBtn: 'حفظ ومشاركة WhatsApp',
    submitBtnEdit: 'تحديث سجل الدفعة',
    alertSelectEntity: 'يرجى تحديد العميل أو المورد',
    alertError: 'حدث خطأ أثناء حفظ الدفعة: ',
    noRecords: 'لا توجد سجلات مدفوعات.',
    currency: 'ج.م',
    pdfViewTitle: 'سند الدفع / المقبوضات',
    printPdf: 'طباعة PDF',
    closePdf: 'إغلاق',
  },
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // PDF Preview Modal State
  const [selectedPdfPayment, setSelectedPdfPayment] = useState<Payment | null>(null);

  // Form states
  const [paymentType, setPaymentType] = useState<'in' | 'out'>('in');
  const [selectedEntityId, setSelectedEntityId] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lang, setLang] = useState<'en' | 'ar'>('en');

  const [originalPayment, setOriginalPayment] = useState<{
    amount: number;
    entity_id: string;
    type: 'in' | 'out';
  } | null>(null);

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

  const fetchInitialData = async () => {
    const { data: entityData } = await supabase.from('entities').select('*');
    setEntities(entityData || []);

    const { data: paymentData } = await supabase
      .from('payments')
      .select('*, entities(name, type)')
      .order('created_at', { ascending: false });

    setPayments(paymentData || []);
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setPaymentType('in');
    setSelectedEntityId('');
    setAmount('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod('cash');
    setNotes('');
    setOriginalPayment(null);
  };

  const handleOpenModal = (paymentToEdit?: Payment) => {
    if (paymentToEdit) {
      setEditingId(paymentToEdit.id);
      setPaymentType(paymentToEdit.type || 'in');
      setSelectedEntityId(paymentToEdit.entity_id || '');
      setAmount(paymentToEdit.amount || 0);
      
      const dateVal = paymentToEdit.payment_date || paymentToEdit.created_at;
      setPaymentDate(
        dateVal ? new Date(dateVal).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
      );
      
      setPaymentMethod(paymentToEdit.method || 'cash');
      setNotes(paymentToEdit.notes || '');

      setOriginalPayment({
        amount: Number(paymentToEdit.amount) || 0,
        entity_id: paymentToEdit.entity_id || '',
        type: paymentToEdit.type || 'in',
      });
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const filteredEntities = entities.filter(
    (e) => e.type === (paymentType === 'in' ? 'client' : 'supplier')
  );

  const savePaymentRecord = async () => {
    const numericAmount = Number(amount);
    const paymentPayload = {
      type: paymentType,
      entity_id: selectedEntityId,
      amount: numericAmount,
      payment_date: paymentDate,
      method: paymentMethod,
      notes,
    };

    if (editingId) {
      const { error: pErr } = await supabase
        .from('payments')
        .update(paymentPayload)
        .eq('id', editingId);

      if (pErr) throw pErr;

      if (originalPayment && originalPayment.entity_id) {
        const origEntity = entities.find((e) => e.id === originalPayment.entity_id);
        if (origEntity) {
          const revertedBalance =
            originalPayment.type === 'in'
              ? origEntity.balance + originalPayment.amount
              : origEntity.balance - originalPayment.amount;

          if (originalPayment.entity_id === selectedEntityId) {
            const finalBalance =
              paymentType === 'in'
                ? revertedBalance - numericAmount
                : revertedBalance + numericAmount;

            await supabase
              .from('entities')
              .update({ balance: finalBalance })
              .eq('id', selectedEntityId);
          } else {
            await supabase
              .from('entities')
              .update({ balance: revertedBalance })
              .eq('id', originalPayment.entity_id);

            const targetEntity = entities.find((e) => e.id === selectedEntityId);
            if (targetEntity) {
              const targetNewBalance =
                paymentType === 'in'
                  ? targetEntity.balance - numericAmount
                  : targetEntity.balance + numericAmount;

              await supabase
                .from('entities')
                .update({ balance: targetNewBalance })
                .eq('id', selectedEntityId);
            }
          }
        }
      }
    } else {
      const { error: pErr } = await supabase.from('payments').insert([paymentPayload]);
      if (pErr) throw pErr;

      const selectedEntity = entities.find((e) => e.id === selectedEntityId);
      if (selectedEntity) {
        const balanceChange = paymentType === 'in' ? -numericAmount : numericAmount;
        await supabase
          .from('entities')
          .update({ balance: selectedEntity.balance + balanceChange })
          .eq('id', selectedEntity.id);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent, shareWhatsApp: boolean = false) => {
    e.preventDefault();
    if (!selectedEntityId) return alert(t.alertSelectEntity);
    if (!amount || Number(amount) <= 0) return;

    setIsSubmitting(true);

    try {
      await savePaymentRecord();

      if (shareWhatsApp) {
        const entityName = entities.find((e) => e.id === selectedEntityId)?.name || '';
        const docType = paymentType === 'in' ? t.typeIn : t.typeOut;
        const msg = encodeURIComponent(
          `*${t.pageTitle} - ${docType}*\n` +
          `------------------------------\n` +
          `👤 *الطرف:* ${entityName}\n` +
          `💰 *المبلغ:* ${amount} ${t.currency}\n` +
          `📅 *التاريخ:* ${paymentDate}\n` +
          `💳 *طريقة الدفع:* ${paymentMethod === 'cash' ? t.cash : paymentMethod === 'bank' ? t.bank : t.check}\n` +
          `📝 *البيان:* ${notes || '-'}\n` +
          `------------------------------\n` +
          `شكراً لتعاملكم معنا!`
        );
        window.open(`https://wa.me/?text=${msg}`, '_blank');
      }

      setIsSubmitting(false);
      handleCloseModal();
      fetchInitialData();
    } catch (error: any) {
      alert(t.alertError + (error.message || 'Error occurred'));
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t.pageTitle}</h1>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-4 py-2.5 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" /> {t.newPaymentBtn}
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left rtl:text-right">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-xs uppercase border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="p-4">{t.colType}</th>
              <th className="p-4">{t.colParty}</th>
              <th className="p-4">{t.colAmount}</th>
              <th className="p-4">{t.colDate}</th>
              <th className="p-4">{t.colMethod}</th>
              <th className="p-4">{t.colNotes}</th>
              <th className="p-4 text-center">{t.colActions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {payments.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400">
                  {t.noRecords}
                </td>
              </tr>
            ) : (
              payments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="p-4 font-semibold">
                    {p.type === 'in' ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full text-xs">
                        <ArrowDownLeft className="w-3.5 h-3.5" /> {t.typeIn}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1 rounded-full text-xs">
                        <ArrowUpRight className="w-3.5 h-3.5" /> {t.typeOut}
                      </span>
                    )}
                  </td>
                  <td className="p-4 font-medium text-slate-800 dark:text-slate-200">
                    {p.entities?.name || '-'}
                  </td>
                  <td className="p-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                    {t.currency} {Number(p.amount).toLocaleString()}
                  </td>
                  <td className="p-4 font-mono text-xs text-slate-600 dark:text-slate-400">
                    {p.payment_date || p.created_at?.split('T')[0]}
                  </td>
                  <td className="p-4 capitalize text-xs text-slate-500">
                    {p.method === 'cash'
                      ? t.cash
                      : p.method === 'bank'
                      ? t.bank
                      : t.check}
                  </td>
                  <td className="p-4 text-xs text-slate-500 max-w-xs truncate">{p.notes || '-'}</td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => setSelectedPdfPayment(p)}
                        className="p-1.5 text-slate-500 hover:text-emerald-600 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="View PDF / Print"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenModal(p)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* New / Edit Payment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                {editingId ? t.modalTitleEdit : t.modalTitleNew}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setPaymentType('in');
                    setSelectedEntityId('');
                  }}
                  className={`p-2.5 rounded-lg border font-bold text-xs ${
                    paymentType === 'in'
                      ? 'bg-emerald-50 border-emerald-600 text-emerald-600 dark:bg-emerald-950/40'
                      : 'border-slate-300 dark:border-slate-700'
                  }`}
                >
                  {t.typeIncome}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPaymentType('out');
                    setSelectedEntityId('');
                  }}
                  className={`p-2.5 rounded-lg border font-bold text-xs ${
                    paymentType === 'out'
                      ? 'bg-rose-50 border-rose-600 text-rose-600 dark:bg-rose-950/40'
                      : 'border-slate-300 dark:border-slate-700'
                  }`}
                >
                  {t.typeExpense}
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  {t.selectEntity(paymentType)}
                </label>
                <select
                  required
                  value={selectedEntityId}
                  onChange={(e) => setSelectedEntityId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-none"
                >
                  <option value="">{t.chooseEntity}</option>
                  {filteredEntities.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} ({t.currBalance}: {t.currency} {e.balance})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    {t.amount}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value ? parseFloat(e.target.value) : '')}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono outline-none"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    {t.paymentDate}
                  </label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  {t.paymentMethod}
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-none"
                >
                  <option value="cash">{t.cash}</option>
                  <option value="bank">{t.bank}</option>
                  <option value="check">{t.check}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  {t.notes}
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-none resize-none"
                />
              </div>

              <div className="pt-2 flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Cancel
                </button>

                {!editingId && (
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={(e) => handleSubmit(e, true)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Share2 className="w-4 h-4" />
                    {t.submitAndShareBtn}
                  </button>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  {isSubmitting ? t.submitting : editingId ? t.submitBtnEdit : t.submitBtnNew}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PDF / Voucher Viewer Modal */}
      {selectedPdfPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 space-y-6 shadow-2xl relative">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                {t.pdfViewTitle}
              </h2>
              <button
                onClick={() => setSelectedPdfPayment(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable PDF Content Card */}
            <div id="payment-voucher-pdf" className="p-6 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/40 space-y-4">
              <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-700 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                    {selectedPdfPayment.type === 'in' ? t.typeIn : t.typeOut}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">ID: {selectedPdfPayment.id.slice(0, 8)}</p>
                </div>
                <div className="text-right rtl:text-left">
                  <span className="text-xs text-slate-500 block">{t.colDate}</span>
                  <span className="text-sm font-mono font-bold text-slate-700 dark:text-slate-300">
                    {selectedPdfPayment.payment_date || selectedPdfPayment.created_at?.split('T')[0]}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block mb-1">{t.colParty}</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                    {selectedPdfPayment.entities?.name || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">{t.paymentMethod}</span>
                  <span className="font-semibold capitalize text-slate-700 dark:text-slate-300">
                    {selectedPdfPayment.method === 'cash' ? t.cash : selectedPdfPayment.method === 'bank' ? t.bank : t.check}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <span className="text-xs text-slate-500 font-bold">{t.colAmount}:</span>
                <span className="text-lg font-mono font-bold text-blue-600 dark:text-blue-400">
                  {t.currency} {Number(selectedPdfPayment.amount).toLocaleString()}
                </span>
              </div>

              {selectedPdfPayment.notes && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-xs">
                  <span className="text-slate-400 block mb-1">{t.notes}</span>
                  <p className="text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 p-2 rounded border border-slate-100 dark:border-slate-800">
                    {selectedPdfPayment.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedPdfPayment(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                {t.closePdf}
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                {t.printPdf}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}