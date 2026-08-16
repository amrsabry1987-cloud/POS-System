'use client';

import React, { useState, useEffect } from 'react';
import { Save, Building, Database, Check, Globe } from 'lucide-react';

const translations = {
  en: {
    pageTitle: 'System Settings',
    pageSubtitle: 'Configure business profiles, invoice defaults, and local parameters',
    sectionProfile: 'Company Profile (Print Header Info)',
    companyName: 'Company / Store Name',
    phone: 'Contact Phone',
    address: 'Business Address',
    sectionFinancial: 'Financial & Currency Defaults',
    currencySymbol: 'Default Currency Symbol',
    taxRate: 'Sales Tax Rate (%)',
    invoicePrefix: 'Invoice Number Prefix',
    sectionLanguage: 'Language & Interface',
    selectLanguage: 'System Language',
    saveBtn: 'Save Preferences',
    savedSuccess: 'Preferences saved successfully!',
  },
  ar: {
    pageTitle: 'إعدادات النظام',
    pageSubtitle: 'تكوين بيانات المؤسسة، افتراضيات الفواتير، واللغة',
    sectionProfile: 'بيانات المؤسسة (ترويسة الطباعة)',
    companyName: 'اسم الشركة / المتجر',
    phone: 'رقم التواصل',
    address: 'العنوان التجاري',
    sectionFinancial: 'الافتراضيات المالية والعملة',
    currencySymbol: 'رمز العملة الافتراضي',
    taxRate: 'نسبة الضريبة (%)',
    invoicePrefix: 'بادئة ترقيم الفواتير',
    sectionLanguage: 'اللغة والواجهة',
    selectLanguage: 'لغة النظام',
    saveBtn: 'حفظ الإعدادات',
    savedSuccess: 'تم حفظ الإعدادات بنجاح!',
  },
};

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const [lang, setLang] = useState<'en' | 'ar'>('en');

  const [settings, setSettings] = useState({
    companyName: 'My Commercial Business',
    phone: '01000000000',
    address: 'Quesna, Menofya, Egypt',
    currency: 'EGP',
    taxRate: 0,
    invoicePrefix: 'INV-',
  });

  // Load Saved Settings & Detect Language
  useEffect(() => {
    const savedSettings = localStorage.getItem('app_settings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error('Failed to parse settings', e);
      }
    }

    const storedLang = localStorage.getItem('app_lang');
    const isRtl = document.documentElement.dir === 'rtl' || document.documentElement.lang === 'ar';
    if (storedLang === 'ar' || storedLang === 'en') {
      setLang(storedLang);
    } else if (isRtl) {
      setLang('ar');
    } else {
      setLang('en');
    }
  }, []);

  const t = translations[lang];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings({ ...settings, [e.target.name]: e.target.value });
  };

  const handleLanguageChange = (newLang: 'en' | 'ar') => {
    setLang(newLang);
    localStorage.setItem('app_lang', newLang);
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLang;
    window.dispatchEvent(new Event('storage'));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('app_settings', JSON.stringify(settings));
    window.dispatchEvent(new Event('storage'));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t.pageTitle}</h1>
        <p className="text-sm text-slate-500">{t.pageSubtitle}</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Language & Regional Settings */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 font-bold text-slate-800 dark:text-slate-100">
            <Globe className="w-5 h-5 text-blue-600" />
            <span>{t.sectionLanguage}</span>
          </div>

          <div className="max-w-xs">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              {t.selectLanguage}
            </label>
            <select
              value={lang}
              onChange={(e) => handleLanguageChange(e.target.value as 'en' | 'ar')}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-none font-medium"
            >
              <option value="en">English (US)</option>
              <option value="ar">العربية (Arabic)</option>
            </select>
          </div>
        </div>

        {/* Business Profile Section */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 font-bold text-slate-800 dark:text-slate-100">
            <Building className="w-5 h-5 text-blue-600" />
            <span>{t.sectionProfile}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                {t.companyName}
              </label>
              <input
                type="text"
                name="companyName"
                value={settings.companyName}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                {t.phone}
              </label>
              <input
                type="text"
                name="phone"
                value={settings.phone}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-none font-mono"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                {t.address}
              </label>
              <input
                type="text"
                name="address"
                value={settings.address}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-none"
              />
            </div>
          </div>
        </div>

        {/* Invoice & Financial Defaults */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 font-bold text-slate-800 dark:text-slate-100">
            <Database className="w-5 h-5 text-blue-600" />
            <span>{t.sectionFinancial}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                {t.currencySymbol}
              </label>
              <input
                type="text"
                name="currency"
                value={settings.currency}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                {t.taxRate}
              </label>
              <input
                type="number"
                name="taxRate"
                value={settings.taxRate}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                {t.invoicePrefix}
              </label>
              <input
                type="text"
                name="invoicePrefix"
                value={settings.invoicePrefix}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-none font-mono"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>{t.saveBtn}</span>
          </button>

          {saved && (
            <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 animate-fade-in">
              <Check className="w-4 h-4" /> {t.savedSuccess}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}