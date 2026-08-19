'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';

interface Entity {
  id: string;
  name: string;
  type: 'client' | 'supplier';
  balance: number;
}

interface Product {
  id: string;
  name: string;
  category?: string; // product category filter (e.g. 'general' | 'expense')
  selling_price: number;
  purchase_price: number;
  stock: number;
}

interface ItemRow {
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

const translations = {
  en: {
    backToInvoices: 'Back to Invoices',
    pageTitleNew: 'Issue New Invoice',
    pageTitleEdit: 'Edit Invoice',
    salesInvoice: '🛒 Sales Invoice (To Client)',
    purchaseOrder: '🛍️ Purchase Order (From Supplier)',
    expenseInvoice: '💸 Internal Expense',
    selectLabel: (type: string) =>
      `Select ${type === 'sale' ? 'Client' : type === 'purchase' ? 'Supplier' : 'Party (Optional)'} *`,
    chooseParty: '-- Choose Party --',
    currBalance: 'Current Balance',
    lineItems: 'Invoice Line Items',
    addRow: 'Add Row',
    colProduct: 'Product / Item',
    colQty: 'Qty',
    colUnitPrice: 'Unit Price',
    colTotal: 'Total',
    selectProduct: '-- Select Product --',
    stock: 'Stock Available',
    subtotal: 'Subtotal:',
    discount: 'Discount:',
    grandTotal: 'Grand Total:',
    amountPaidNow: 'Amount Paid Now:',
    balanceDue: 'Balance Due:',
    submitting: 'Processing Invoice...',
    submitBtnNew: 'Complete & Save Invoice',
    submitBtnEdit: 'Update Invoice',
    alertSelectParty: (type: string) => `Please select a ${type === 'sale' ? 'Client' : 'Supplier'}`,
    alertNoItems: 'Add at least one product item',
    alertError: 'Error saving invoice: ',
    currency: 'EGP',
  },
  ar: {
    backToInvoices: 'العودة إلى الفواتير',
    pageTitleNew: 'إصدار فاتورة جديدة',
    pageTitleEdit: 'تعديل الفاتورة',
    salesInvoice: '🛒 فاتورة مبيعات (لعميل)',
    purchaseOrder: '🛍️ إذن توريد / شراء (من مورد)',
    expenseInvoice: '💸 مصروفات داخلية',
    selectLabel: (type: string) =>
      `اختر ${type === 'sale' ? 'العميل' : type === 'purchase' ? 'المورد' : 'الطرف الثاني (اختياري)'} *`,
    chooseParty: '-- اختر الطرف الثاني --',
    currBalance: 'الرصيد الحالي',
    lineItems: 'بنود الفاتورة',
    addRow: 'إضافة بند',
    colProduct: 'المنتج / البند',
    colQty: 'الكمية',
    colUnitPrice: 'سعر الوحدة',
    colTotal: 'الإجمالي',
    selectProduct: '-- اختر المنتج --',
    stock: 'المخزون المتاح',
    subtotal: 'الإجمالي الفرعي:',
    discount: 'الخصم:',
    grandTotal: 'الإجمالي النهائي:',
    amountPaidNow: 'المدفوع الآن:',
    balanceDue: 'المتبقي (الآجل):',
    submitting: 'جاري حفظ وحساب الفاتورة...',
    submitBtnNew: 'حفظ وتأكيد الفاتورة',
    submitBtnEdit: 'تحديث الفاتورة',
    alertSelectParty: (type: string) => `يرجى تحديد ${type === 'sale' ? 'العميل' : 'المورد'}`,
    alertNoItems: 'يرجى إضافة منتج واحد على الأقل',
    alertError: 'حدث خطأ أثناء حفظ الفاتورة: ',
    currency: 'ج.م',
  },
};

function NewInvoiceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');

  const [type, setType] = useState<'sale' | 'purchase' | 'expense'>('sale');
  const [entities, setEntities] = useState<Entity[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedEntityId, setSelectedEntityId] = useState('');

  const [items, setItems] = useState<ItemRow[]>([]);
  const [discount, setDiscount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  useEffect(() => {
    async function loadData() {
      const { data: entityData } = await supabase.from('entities').select('*');
      const { data: productData } = await supabase.from('products').select('*');
      setEntities(entityData || []);
      setProducts(productData || []);

      if (editId) {
        const { data: existingTx } = await supabase
          .from('transactions')
          .select('*, transaction_items(*)')
          .eq('id', editId)
          .single();

        if (existingTx) {
          const loadedType = existingTx.type === 'expense' ? 'expense' : existingTx.type;
          setType(loadedType);
          setSelectedEntityId(existingTx.entity_id || '');
          setDiscount(existingTx.discount || 0);
          setPaidAmount(existingTx.paid_amount || 0);

          if (existingTx.transaction_items) {
            setItems(
              existingTx.transaction_items.map((it: any) => ({
                product_id: it.product_id,
                quantity: it.quantity,
                unit_price: it.unit_price,
                total_price: it.total_price,
              }))
            );
          }
        }
      }
    }
    loadData();
  }, [editId]);

  const filteredEntities = entities.filter(
    (e) => e.type === (type === 'sale' ? 'client' : 'supplier')
  );

  const filteredProducts = products.filter((p) => {
    if (type === 'expense') {
      return p.category === 'expenses' || p.category === 'expense';
    }
    return p.category !== 'expenses' && p.category !== 'expense';
  });

  const handleAddItem = () => {
    setItems([...items, { product_id: '', quantity: 1, unit_price: 0, total_price: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof ItemRow, value: any) => {
    const updated = [...items];
    const row = { ...updated[index], [field]: value };

    if (field === 'product_id') {
      const p = products.find((prod) => prod.id === value);
      if (p) {
        row.unit_price = type === 'sale' ? p.selling_price : p.purchase_price;
      }
    }

    row.total_price = row.quantity * row.unit_price;
    updated[index] = row;
    setItems(updated);
  };

  const subtotal = items.reduce((sum, item) => sum + item.total_price, 0);
  const grandTotal = Math.max(0, subtotal - discount);
  const balanceDue = Math.max(0, grandTotal - paidAmount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (type !== 'expense' && !selectedEntityId) return alert(t.alertSelectParty(type));
    if (items.length === 0) return alert(t.alertNoItems);

    setIsSubmitting(true);
    const prefix = type === 'sale' ? 'INV' : type === 'purchase' ? 'PUR' : 'EXP';
    const status = paidAmount >= grandTotal ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid';

    let txId = editId;

    const transactionPayload = {
      type: type,
      entity_id: selectedEntityId || null,
      subtotal,
      discount,
      tax: 0,
      total: grandTotal,
      paid_amount: paidAmount,
      balance_due: balanceDue,
      status,
    };

    if (editId) {
      const { error: txErr } = await supabase
        .from('transactions')
        .update(transactionPayload)
        .eq('id', editId);

      if (txErr) {
        alert(t.alertError + txErr.message);
        setIsSubmitting(false);
        return;
      }

      await supabase.from('transaction_items').delete().eq('transaction_id', editId);
    } else {
      const invoiceNumber = `${prefix}-${Date.now().toString().slice(-6)}`;
      const { data: tx, error: txErr } = await supabase
        .from('transactions')
        .insert([
          {
            invoice_number: invoiceNumber,
            ...transactionPayload,
          },
        ])
        .select()
        .single();

      if (txErr) {
        alert(t.alertError + txErr.message);
        setIsSubmitting(false);
        return;
      }
      txId = tx.id;
    }

    for (const item of items) {
      await supabase.from('transaction_items').insert([
        {
          transaction_id: txId,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
        },
      ]);

      if (type !== 'expense') {
        const p = products.find((prod) => prod.id === item.product_id);
        if (p) {
          const newStock = type === 'sale' ? p.stock - item.quantity : p.stock + item.quantity;
          await supabase.from('products').update({ stock: newStock }).eq('id', p.id);
        }
      }
    }

    if (selectedEntityId && type !== 'expense') {
      const selectedEntity = entities.find((e) => e.id === selectedEntityId);
      if (selectedEntity) {
        const balanceChange = type === 'sale' ? balanceDue : -balanceDue;
        await supabase
          .from('entities')
          .update({ balance: selectedEntity.balance + balanceChange })
          .eq('id', selectedEntity.id);
      }
    }

    setIsSubmitting(false);
    router.push('/invoices');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
        >
          <ArrowLeft className="w-4 h-4 rtl:rotate-180" /> {t.backToInvoices}
        </button>
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
          {editId ? t.pageTitleEdit : t.pageTitleNew}
        </h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 space-y-6"
      >
        <div className="grid grid-cols-3 gap-4">
          <button
            type="button"
            onClick={() => {
              setType('sale');
              setSelectedEntityId('');
              setItems([]);
            }}
            className={`p-3 rounded-lg border font-bold text-sm ${
              type === 'sale'
                ? 'bg-blue-50 border-blue-600 text-blue-600 dark:bg-blue-950/40'
                : 'border-slate-300 dark:border-slate-700'
            }`}
          >
            {t.salesInvoice}
          </button>
          <button
            type="button"
            onClick={() => {
              setType('purchase');
              setSelectedEntityId('');
              setItems([]);
            }}
            className={`p-3 rounded-lg border font-bold text-sm ${
              type === 'purchase'
                ? 'bg-blue-50 border-blue-600 text-blue-600 dark:bg-blue-950/40'
                : 'border-slate-300 dark:border-slate-700'
            }`}
          >
            {t.purchaseOrder}
          </button>
          <button
            type="button"
            onClick={() => {
              setType('expense');
              setSelectedEntityId('');
              setItems([]);
            }}
            className={`p-3 rounded-lg border font-bold text-sm ${
              type === 'expense'
                ? 'bg-blue-50 border-blue-600 text-blue-600 dark:bg-blue-950/40'
                : 'border-slate-300 dark:border-slate-700'
            }`}
          >
            {t.expenseInvoice}
          </button>
        </div>

        {type !== 'expense' && (
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              {t.selectLabel(type)}
            </label>
            <select
              required
              value={selectedEntityId}
              onChange={(e) => setSelectedEntityId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-none"
            >
              <option value="">{t.chooseParty}</option>
              {filteredEntities.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} ({t.currBalance}: {t.currency} {e.balance})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-200">
              {t.lineItems}
            </h3>
            <button
              type="button"
              onClick={handleAddItem}
              className="flex items-center gap-1 text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 px-3 py-1.5 rounded-md font-medium"
            >
              <Plus className="w-3.5 h-3.5" /> {t.addRow}
            </button>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500 border-b border-slate-200 dark:border-slate-800">
                <th className="text-left rtl:text-right p-2">{t.colProduct}</th>
                <th className="text-center p-2 w-24">{t.colQty}</th>
                <th className="text-right rtl:text-left p-2 w-32">{t.colUnitPrice}</th>
                <th className="text-right rtl:text-left p-2 w-32">{t.colTotal}</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {items.map((row, idx) => (
                <tr key={idx}>
                  <td className="p-2">
                    <select
                      required
                      value={row.product_id}
                      onChange={(e) => handleItemChange(idx, 'product_id', e.target.value)}
                      className="w-full p-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-none"
                    >
                      <option value="">{t.selectProduct}</option>
                      {filteredProducts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} {type !== 'expense' ? `(${t.stock}: ${p.stock})` : ''}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      min="1"
                      value={row.quantity}
                      onChange={(e) =>
                        handleItemChange(idx, 'quantity', parseInt(e.target.value) || 1)
                      }
                      className="w-full p-1.5 text-xs text-center bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono outline-none"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      step="0.01"
                      value={row.unit_price}
                      onChange={(e) =>
                        handleItemChange(idx, 'unit_price', parseFloat(e.target.value) || 0)
                      }
                      className="w-full p-1.5 text-xs text-right rtl:text-left bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono outline-none"
                    />
                  </td>
                  <td className="p-2 text-right rtl:text-left font-mono font-semibold">
                    {t.currency} {row.total_price.toLocaleString()}
                  </td>
                  <td className="p-2 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-2 max-w-xs ml-auto rtl:mr-auto rtl:ml-0 text-sm">
          <div className="flex justify-between text-slate-600 dark:text-slate-400">
            <span>{t.subtotal}</span>
            <span className="font-mono font-semibold">
              {t.currency} {subtotal.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
            <span>{t.discount}</span>
            <input
              type="number"
              value={discount}
              onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
              className="w-24 p-1 text-xs text-right rtl:text-left bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded outline-none font-mono"
            />
          </div>
          <div className="flex justify-between font-bold text-base text-slate-900 dark:text-slate-100 pt-2 border-t">
            <span>{t.grandTotal}</span>
            <span className="font-mono text-blue-600">
              {t.currency} {grandTotal.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center text-slate-600 dark:text-slate-400 pt-2">
            <span>{t.amountPaidNow}</span>
            <input
              type="number"
              value={paidAmount}
              onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
              className="w-24 p-1 text-xs text-right rtl:text-left bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded outline-none font-mono text-emerald-600 font-bold"
            />
          </div>
          <div className="flex justify-between font-bold text-sm text-red-600 pt-1">
            <span>{t.balanceDue}</span>
            <span className="font-mono">
              {t.currency} {balanceDue.toLocaleString()}
            </span>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
        >
          {isSubmitting ? t.submitting : editId ? t.submitBtnEdit : t.submitBtnNew}
        </button>
      </form>
    </div>
  );
}

export default function NewInvoicePage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-sm text-slate-500">Loading form...</div>}>
      <NewInvoiceContent />
    </Suspense>
  );
}