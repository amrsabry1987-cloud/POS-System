'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Search, Users, Truck, RefreshCw, Phone, Mail, MapPin, Edit, CheckCircle2, XCircle } from 'lucide-react';

interface Entity {
  id: string;
  type: 'client' | 'supplier';
  name: string;
  phone: string;
  email: string;
  address: string;
  credit_limit: number;
  balance: number; // Positive = Client owes us / Negative = We owe Supplier
  is_active: boolean;
  created_at: string;
}

// Translation Dictionary for Entities/Clients & Suppliers Screen
const translations = {
  en: {
    clientsTitle: 'Clients Management',
    suppliersTitle: 'Suppliers Management',
    clientsSubtitle: 'Track customer accounts, contact details, and receivables',
    suppliersSubtitle: 'Manage vendor details, contact info, and payables',
    refreshTable: 'Refresh Table',
    addClient: 'Add Client',
    addSupplier: 'Add Supplier',
    editClient: 'Edit Client',
    editSupplier: 'Edit Supplier',
    tabClients: 'Clients (Customers)',
    tabSuppliers: 'Suppliers (Vendors)',
    searchPlaceholderClient: 'Search clients by name or phone...',
    searchPlaceholderSupplier: 'Search suppliers by name or phone...',
    showInactive: 'Show Inactive',
    total: 'Total:',
    colName: 'Name',
    colContact: 'Contact Info',
    colAddress: 'Address',
    colCreditLimit: 'Credit Limit',
    colCurrentBalance: 'Current Balance',
    colStatus: 'Status',
    colActions: 'Actions',
    loading: 'Loading records...',
    noClients: 'No clients found.',
    noSuppliers: 'No suppliers found.',
    owesUs: '(Owes Us)',
    overpaid: '(Overpaid)',
    weOwe: '(We Owe)',
    creditBalance: '(Credit Balance)',
    currency: 'EGP',
    // Modal Translations
    addNewClient: 'Add New Client',
    addNewSupplier: 'Add New Supplier',
    nameRequiredLabel: 'Name *',
    namePlaceholderClient: 'e.g. Al-Amal Hospital / Ahmed Hassan',
    namePlaceholderSupplier: 'e.g. Global Medical Supplies',
    phoneNumber: 'Phone Number',
    phonePlaceholder: '01000000000',
    email: 'Email',
    emailPlaceholder: 'contact@domain.com',
    address: 'Address',
    addressPlaceholder: 'Street address, City...',
    creditLimit: 'Credit Limit (EGP)',
    openingBalance: 'Opening Balance (EGP)',
    balancePlaceholder: 'Positive = Owes us',
    activeStatus: 'Active Account',
    cancel: 'Cancel',
    saveClient: 'Save Client',
    saveSupplier: 'Save Supplier',
    nameRequired: 'Name is required',
    errorCreating: 'Error saving ',
    active: 'Active',
    inactive: 'Inactive',
  },
  ar: {
    clientsTitle: 'إدارة العملاء',
    suppliersTitle: 'إدارة الموردين',
    clientsSubtitle: 'متابعة حسابات العملاء، بيانات الاتصال، والمستحقات المالية',
    suppliersSubtitle: 'إدارة بيانات الموردين، تفاصيل الاتصال، والالتزامات المالية',
    refreshTable: 'تحديث الجدول',
    addClient: 'إضافة عميل',
    addSupplier: 'إضافة مورد',
    editClient: 'تعديل بيانات عميل',
    editSupplier: 'تعديل بيانات مورد',
    tabClients: 'العملاء',
    tabSuppliers: 'الموردون',
    searchPlaceholderClient: 'البحث عن عميل بالاسم أو رقم الهاتف...',
    searchPlaceholderSupplier: 'البحث عن مورد بالاسم أو رقم الهاتف...',
    showInactive: 'إظهار غير النشطين',
    total: 'الإجمالي:',
    colName: 'الاسم',
    colContact: 'بيانات الاتصال',
    colAddress: 'العنوان',
    colCreditLimit: 'الحد الائتماني',
    colCurrentBalance: 'الرصيد الحالي',
    colStatus: 'الحالة',
    colActions: 'إجراءات',
    loading: 'جاري تحميل السجلات...',
    noClients: 'لم يتم العثور على عملاء.',
    noSuppliers: 'لم يتم العثور على موردين.',
    owesUs: '(مستحق عليه)',
    overpaid: '(دفع زياده)',
    weOwe: '(مستحق له)',
    creditBalance: '(رصيد دائن)',
    currency: 'ج.م',
    // Modal Translations
    addNewClient: 'إضافة عميل جديد',
    addNewSupplier: 'إضافة مورد جديد',
    nameRequiredLabel: 'الاسم *',
    namePlaceholderClient: 'مثال: مستشفى الأمل / أحمد حسن',
    namePlaceholderSupplier: 'مثال: الشروق للمستلزمات الطبية',
    phoneNumber: 'رقم الهاتف',
    phonePlaceholder: '01000000000',
    email: 'البريد الإلكتروني',
    emailPlaceholder: 'contact@domain.com',
    address: 'العنوان',
    addressPlaceholder: 'اسم الشارع، المدينة...',
    creditLimit: 'الحد الائتماني (ج.م)',
    openingBalance: 'الرصيد الافتتاحي (ج.م)',
    balancePlaceholder: 'قيمة موجبة = مستحق عليه',
    activeStatus: 'حساب نشط',
    cancel: 'إلغاء',
    saveClient: 'حفظ العميل',
    saveSupplier: 'حفظ المورد',
    nameRequired: 'الاسم مطلوب',
    errorCreating: 'خطأ أثناء حفظ ',
    active: 'نشط',
    inactive: 'غير نشط',
  },
};

export default function EntitiesPage() {
  const [activeTab, setActiveTab] = useState<'client' | 'supplier'>('client');
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntityId, setEditingEntityId] = useState<string | null>(null);
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

  // Entity Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    credit_limit: 0,
    balance: 0,
    is_active: true,
  });

  // Fetch Entities from Supabase
  const fetchEntities = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('entities')
      .select('*')
      .eq('type', activeTab)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching entities:', error);
    } else {
      setEntities(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEntities();
  }, [activeTab]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === 'number' ? parseFloat(value) || 0 : value,
      }));
    }
  };

  const handleOpenAddModal = () => {
    setEditingEntityId(null);
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      credit_limit: 0,
      balance: 0,
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (entity: Entity) => {
    setEditingEntityId(entity.id);
    setFormData({
      name: entity.name || '',
      phone: entity.phone || '',
      email: entity.email || '',
      address: entity.address || '',
      credit_limit: entity.credit_limit || 0,
      balance: entity.balance || 0,
      is_active: entity.is_active ?? true,
    });
    setIsModalOpen(true);
  };

  // Submit Entity (Create or Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return alert(t.nameRequired);

    if (editingEntityId) {
      // Update existing entity
      const { error } = await supabase
        .from('entities')
        .update({
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
          credit_limit: formData.credit_limit,
          balance: formData.balance,
          is_active: formData.is_active,
        })
        .eq('id', editingEntityId);

      if (error) {
        alert(t.errorCreating + activeTab + ': ' + error.message);
      } else {
        setIsModalOpen(false);
        fetchEntities();
      }
    } else {
      // Create new entity
      const payload = {
        ...formData,
        type: activeTab,
      };

      const { error } = await supabase.from('entities').insert([payload]);

      if (error) {
        alert(t.errorCreating + activeTab + ': ' + error.message);
      } else {
        setIsModalOpen(false);
        fetchEntities();
      }
    }
  };

  // Filter Entities by Search Query and Active Status Boolean
  const filteredEntities = entities.filter((e) => {
    const matchesSearch =
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.phone && e.phone.includes(searchQuery));

    const matchesStatus = showInactive ? true : e.is_active !== false;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            {activeTab === 'client' ? t.clientsTitle : t.suppliersTitle}
          </h1>
          <p className="text-sm text-slate-500">
            {activeTab === 'client' ? t.clientsSubtitle : t.suppliersSubtitle}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchEntities}
            className="p-2 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            title={t.refreshTable}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>{activeTab === 'client' ? t.addClient : t.addSupplier}</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('client')}
          className={`flex items-center gap-2 px-5 py-3 font-semibold text-sm border-b-2 transition-colors ${
            activeTab === 'client'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>{t.tabClients}</span>
        </button>
        <button
          onClick={() => setActiveTab('supplier')}
          className={`flex items-center gap-2 px-5 py-3 font-semibold text-sm border-b-2 transition-colors ${
            activeTab === 'supplier'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>{t.tabSuppliers}</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative w-full max-w-md">
            <Search className="w-4 h-4 absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={activeTab === 'client' ? t.searchPlaceholderClient : t.searchPlaceholderSupplier}
              className="w-full pl-9 pr-4 rtl:pl-4 rtl:pr-9 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <label className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300 cursor-pointer select-none shrink-0">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
            />
            <span>{t.showInactive}</span>
          </label>
        </div>
        <div className="text-sm text-slate-500 font-medium">
          {t.total} <span className="text-slate-900 dark:text-slate-100 font-bold">{filteredEntities.length}</span>
        </div>
      </div>

      {/* Entities Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left rtl:text-right border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-4">{t.colName}</th>
                <th className="p-4">{t.colContact}</th>
                <th className="p-4">{t.colAddress}</th>
                <th className="p-4 text-right rtl:text-left">{t.colCreditLimit}</th>
                <th className="p-4 text-right rtl:text-left">{t.colCurrentBalance}</th>
                <th className="p-4 text-center">{t.colStatus}</th>
                <th className="p-4 text-center">{t.colActions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    {t.loading}
                  </td>
                </tr>
              ) : filteredEntities.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    {activeTab === 'client' ? t.noClients : t.noSuppliers}
                  </td>
                </tr>
              ) : (
                filteredEntities.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 font-semibold text-slate-800 dark:text-slate-100">
                      {item.name}
                    </td>
                    <td className="p-4 text-xs text-slate-500 space-y-1">
                      {item.phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{item.phone}</span>
                        </div>
                      )}
                      {item.email && (
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>{item.email}</span>
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-xs text-slate-500">
                      {item.address ? (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{item.address}</span>
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="p-4 text-right rtl:text-left font-mono text-slate-600 dark:text-slate-400">
                      {t.currency} {(item.credit_limit || 0).toLocaleString()}
                    </td>
                    <td className="p-4 text-right rtl:text-left font-mono font-bold">
                      {item.balance > 0 ? (
                        <span className="text-amber-600 dark:text-amber-400">
                          {t.currency} {item.balance.toLocaleString()} {activeTab === 'client' ? t.owesUs : t.overpaid}
                        </span>
                      ) : item.balance < 0 ? (
                        <span className="text-red-600 dark:text-red-400">
                          {t.currency} {Math.abs(item.balance).toLocaleString()} {activeTab === 'supplier' ? t.weOwe : t.creditBalance}
                        </span>
                      ) : (
                        <span className="text-slate-400">{t.currency} 0</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {item.is_active !== false ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                          <CheckCircle2 className="w-3 h-3" />
                          {t.active}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          <XCircle className="w-3 h-3" />
                          {t.inactive}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleOpenEditModal(item)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        title={activeTab === 'client' ? t.editClient : t.editSupplier}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Entity Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                {editingEntityId
                  ? activeTab === 'client'
                    ? t.editClient
                    : t.editSupplier
                  : activeTab === 'client'
                  ? t.addNewClient
                  : t.addNewSupplier}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  {t.nameRequiredLabel}
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={activeTab === 'client' ? t.namePlaceholderClient : t.namePlaceholderSupplier}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    {t.phoneNumber}
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={t.phonePlaceholder}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    {t.email}
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={t.emailPlaceholder}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  {t.address}
                </label>
                <textarea
                  name="address"
                  rows={2}
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t.addressPlaceholder}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    {t.creditLimit}
                  </label>
                  <input
                    type="number"
                    name="credit_limit"
                    value={formData.credit_limit}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    {t.openingBalance}
                  </label>
                  <input
                    type="number"
                    name="balance"
                    value={formData.balance}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    placeholder={t.balancePlaceholder}
                  />
                </div>
              </div>

              {/* Active Indicator Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="is_active"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                  {t.activeStatus}
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  {activeTab === 'client' ? t.saveClient : t.saveSupplier}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}