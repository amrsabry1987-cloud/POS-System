'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Search, Package, AlertTriangle, ArrowUpDown, RefreshCw } from 'lucide-react';

interface Product {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  category: string;
  unit: string;
  purchase_price: number;
  selling_price: number;
  stock: number;
  min_stock: number;
  is_active: boolean;
}

// Translation Dictionary for Products Screen
const translations = {
  en: {
    title: 'Products & Inventory',
    subtitle: 'Manage catalog, pricing, and stock levels',
    refreshTable: 'Refresh Table',
    addProduct: 'Add Product',
    searchPlaceholder: 'Search by name, SKU, or barcode...',
    totalProducts: 'Total Products:',
    colSkuBarcode: 'SKU / Barcode',
    colProductName: 'Product Name',
    colCategory: 'Category',
    colPurchasePrice: 'Purchase Price',
    colSellingPrice: 'Selling Price',
    colStock: 'Stock',
    colStatus: 'Status',
    loading: 'Loading products...',
    noProducts: 'No products found. Click "Add Product" to add your first item.',
    outOfStock: 'Out of Stock',
    lowStock: 'Low Stock',
    inStock: 'In Stock',
    currency: 'EGP',
    // Modal Translations
    addNewProduct: 'Add New Product',
    productName: 'Product Name *',
    productNamePlaceholder: 'e.g. Beckman Reagent Kit',
    skuCode: 'SKU Code',
    skuPlaceholder: 'SKU-1001',
    barcode: 'Barcode',
    barcodePlaceholder: '6291000281',
    category: 'Category',
    unit: 'Unit',
    unitPlaceholder: 'pcs, box, kg',
    purchasePrice: 'Purchase Price (EGP)',
    sellingPrice: 'Selling Price (EGP) *',
    initialStock: 'Initial Stock',
    minStockAlert: 'Minimum Alert Stock',
    cancel: 'Cancel',
    saveProduct: 'Save Product',
    nameRequired: 'Product name is required',
    errorCreating: 'Error creating product: ',
  },
  ar: {
    title: 'المنتجات والمخزون',
    subtitle: 'إدارة كتالوج المنتجات، الأسعار، ومستويات المخزون',
    refreshTable: 'تحديث الجدول',
    addProduct: 'إضافة منتج',
    searchPlaceholder: 'البحث بالاسم، الكود (SKU)، أو البارکود...',
    totalProducts: 'إجمالي المنتجات:',
    colSkuBarcode: 'الكود / الباركوّد',
    colProductName: 'اسم المنتج',
    colCategory: 'الفئة',
    colPurchasePrice: 'سعر الشراء',
    colSellingPrice: 'سعر البيع',
    colStock: 'المخزون',
    colStatus: 'الحالة',
    loading: 'جاري تحميل المنتجات...',
    noProducts: 'لم يتم العثور على منتجات. انقر على "إضافة منتج" لإضافة أول عنصر.',
    outOfStock: 'نفد المخزون',
    lowStock: 'مخزون منخفض',
    inStock: 'متوفر',
    currency: 'ج.م',
    // Modal Translations
    addNewProduct: 'إضافة منتج جديد',
    productName: 'اسم المنتج *',
    productNamePlaceholder: 'مثال: كاشف معامل بيكج',
    skuCode: 'رمز SKU',
    skuPlaceholder: 'SKU-1001',
    barcode: 'الباركوّد',
    barcodePlaceholder: '6291000281',
    category: 'الفئة',
    unit: 'وحدة القياس',
    unitPlaceholder: 'قطعة، صندوق، كجم',
    purchasePrice: 'سعر الشراء (ج.م)',
    sellingPrice: 'سعر البيع (ج.م) *',
    initialStock: 'المخزون الأولي',
    minStockAlert: 'حد تنبيه نقص المخزون',
    cancel: 'إلغاء',
    saveProduct: 'حفظ المنتج',
    nameRequired: 'اسم المنتج مطلوب',
    errorCreating: 'خطأ أثناء إنشاء المنتج: ',
  },
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  // New Product Form State
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    category: 'General',
    unit: 'pcs',
    purchase_price: 0,
    selling_price: 0,
    stock: 0,
    min_stock: 5,
  });

  // Fetch products from Supabase
  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error);
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Handle Input Changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: e.target.type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  // Submit New Product to Supabase
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return alert(t.nameRequired);

    const { error } = await supabase.from('products').insert([formData]);

    if (error) {
      alert(t.errorCreating + error.message);
    } else {
      setIsModalOpen(false);
      setFormData({
        name: '',
        sku: '',
        barcode: '',
        category: 'General',
        unit: 'pcs',
        purchase_price: 0,
        selling_price: 0,
        stock: 0,
        min_stock: 5,
      });
      fetchProducts();
    }
  };

  // Filter products by search query
  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.barcode && p.barcode.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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
            onClick={fetchProducts}
            className="p-2 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            title={t.refreshTable}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addProduct}</span>
          </button>
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
        <div className="text-sm text-slate-500 font-medium">
          {t.totalProducts} <span className="text-slate-900 dark:text-slate-100 font-bold">{filteredProducts.length}</span>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left rtl:text-right border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-4">{t.colSkuBarcode}</th>
                <th className="p-4">{t.colProductName}</th>
                <th className="p-4">{t.colCategory}</th>
                <th className="p-4 text-right rtl:text-left">{t.colPurchasePrice}</th>
                <th className="p-4 text-right rtl:text-left">{t.colSellingPrice}</th>
                <th className="p-4 text-center">{t.colStock}</th>
                <th className="p-4 text-center">{t.colStatus}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    {t.loading}
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    {t.noProducts}
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const isLowStock = product.stock <= product.min_stock && product.stock > 0;
                  const isOutOfStock = product.stock <= 0;

                  return (
                    <tr key={product.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="p-4 font-mono text-xs text-slate-500">
                        {product.sku || product.barcode || '-'}
                      </td>
                      <td className="p-4 font-semibold text-slate-800 dark:text-slate-100">
                        {product.name}
                      </td>
                      <td className="p-4 text-slate-500">{product.category}</td>
                      <td className="p-4 text-right rtl:text-left text-slate-600 dark:text-slate-400 font-mono">
                        {t.currency} {product.purchase_price.toLocaleString()}
                      </td>
                      <td className="p-4 text-right rtl:text-left font-bold text-slate-900 dark:text-slate-100 font-mono">
                        {t.currency} {product.selling_price.toLocaleString()}
                      </td>
                      <td className="p-4 text-center font-bold font-mono text-slate-800 dark:text-slate-200">
                        {product.stock} {product.unit}
                      </td>
                      <td className="p-4 text-center">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                            {t.outOfStock}
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                            {t.lowStock}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                            {t.inStock}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{t.addNewProduct}</h2>
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
                  {t.productName}
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t.productNamePlaceholder}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    {t.skuCode}
                  </label>
                  <input
                    type="text"
                    name="sku"
                    value={formData.sku}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={t.skuPlaceholder}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    {t.barcode}
                  </label>
                  <input
                    type="text"
                    name="barcode"
                    value={formData.barcode}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={t.barcodePlaceholder}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    {t.category}
                  </label>
                  <input
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    {t.unit}
                  </label>
                  <input
                    type="text"
                    name="unit"
                    value={formData.unit}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={t.unitPlaceholder}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    {t.purchasePrice}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="purchase_price"
                    value={formData.purchase_price}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    {t.sellingPrice}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="selling_price"
                    required
                    value={formData.selling_price}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    {t.initialStock}
                  </label>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    {t.minStockAlert}
                  </label>
                  <input
                    type="number"
                    name="min_stock"
                    value={formData.min_stock}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
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
                  {t.saveProduct}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}