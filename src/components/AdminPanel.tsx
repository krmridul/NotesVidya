import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  FileText,
  Boxes,
  Layers,
  Users,
  ShoppingBag,
  CreditCard,
  Tag,
  MessageSquare,
  Mail,
  Settings,
  Plus,
  Trash2,
  Edit,
  CheckCircle2,
  XCircle,
  Search,
  ArrowUpRight,
  TrendingUp,
  Download,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Eye,
  Sliders
} from 'lucide-react';
import {
  Product,
  Category,
  Order,
  PaymentRecord,
  Coupon,
  Review,
  StoreSettings,
  AnalyticsSummary,
  EmailNotification
} from '../types.js';
import { api } from '../lib/api.js';
import { useToast } from '../context/ToastContext.js';
import { useAuth } from '../context/AuthContext.js';

interface AdminPanelProps {
  onBackToStore: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onBackToStore }) => {
  const { showToast } = useToast();
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'products' | 'stock' | 'categories' | 'customers' | 'orders' | 'payments' | 'coupons' | 'reviews' | 'emails' | 'settings'
  >('dashboard');

  const [loading, setLoading] = useState(true);

  // Admin Data states
  const [stats, setStats] = useState<AnalyticsSummary | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [emails, setEmails] = useState<EmailNotification[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);

  // Modals & form states
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Partial<Coupon> | null>(null);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPdf(true);
    try {
      const res = await api.uploadPdfFile(file);
      setEditingProduct(prev => prev ? ({ ...prev, pdfFileKey: res.fileKey, fileSize: res.fileSize }) : null);
      showToast(`Encrypted PDF stored in vault (${res.fileSize})`, 'success');
    } catch (err: any) {
      showToast(err.message || 'PDF upload failed', 'error');
    } finally {
      setUploadingPdf(false);
    }
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingThumbnail(true);
    try {
      const res = await api.uploadThumbnailFile(file);
      setEditingProduct(prev => prev ? ({ ...prev, thumbnail: res.url }) : null);
      showToast('Product cover thumbnail uploaded', 'success');
    } catch (err: any) {
      showToast(err.message || 'Thumbnail upload failed', 'error');
    } finally {
      setUploadingThumbnail(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user && (isAdmin || user.role === 'admin')) {
      loadAllData();
    }
  }, [authLoading, user, isAdmin]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [
        statsData,
        productsData,
        categoriesData,
        ordersData,
        customersData,
        paymentsData,
        couponsData,
        reviewsData,
        emailsData,
        settingsData
      ] = await Promise.all([
        api.getAdminStats(),
        api.getAdminProducts(),
        api.getAdminCategories(),
        api.getAdminOrders(),
        api.getAdminCustomers(),
        api.getAdminPayments(),
        api.getAdminCoupons(),
        api.getAdminReviews(),
        api.getAdminEmails(),
        api.getAdminSettings()
      ]);

      setStats(statsData);
      setProducts(productsData.products || []);
      setCategories(categoriesData.categories || []);
      setOrders(ordersData.orders || []);
      setCustomers(customersData.customers || []);
      setPayments(paymentsData.payments || []);
      setCoupons(couponsData.coupons || []);
      setReviews(reviewsData.reviews || []);
      setEmails(emailsData.emails || []);
      setSettings(settingsData.settings || null);
    } catch (err: any) {
      showToast('Failed to load admin data: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Product Actions
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct?.title || !editingProduct?.categoryId || !editingProduct?.sellingPrice) {
      showToast('Please provide title, category, and selling price', 'error');
      return;
    }

    try {
      if (editingProduct.id) {
        await api.updateAdminProduct(editingProduct.id, editingProduct);
        showToast('Product updated successfully', 'success');
      } else {
        await api.createAdminProduct(editingProduct);
        showToast('New PDF Product added successfully', 'success');
      }
      setIsProductModalOpen(false);
      setEditingProduct(null);
      loadAllData();
    } catch (err: any) {
      showToast(err.message || 'Product save failed', 'error');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this PDF product?')) return;
    try {
      await api.deleteAdminProduct(id);
      showToast('Product deleted', 'success');
      loadAllData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Category Actions
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory?.name) return;
    try {
      if (editingCategory.id) {
        await api.updateAdminCategory(editingCategory.id, editingCategory);
        showToast('Category updated', 'success');
      } else {
        await api.createAdminCategory(editingCategory);
        showToast('Category created', 'success');
      }
      setIsCategoryModalOpen(false);
      setEditingCategory(null);
      loadAllData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm('Delete category?')) return;
    try {
      await api.deleteAdminCategory(id);
      showToast('Category removed', 'success');
      loadAllData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Coupon Actions
  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCoupon?.code || !editingCoupon?.discountValue) return;
    try {
      if (editingCoupon.id) {
        await api.updateAdminCoupon(editingCoupon.id, editingCoupon);
        showToast('Coupon updated', 'success');
      } else {
        await api.createAdminCoupon(editingCoupon);
        showToast('Coupon created', 'success');
      }
      setIsCouponModalOpen(false);
      setEditingCoupon(null);
      loadAllData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!window.confirm('Delete coupon?')) return;
    try {
      await api.deleteAdminCoupon(id);
      showToast('Coupon removed', 'success');
      loadAllData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Customer Toggle Status
  const handleToggleCustomer = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      await api.updateAdminCustomerStatus(id, nextStatus);
      showToast(`Customer marked as ${nextStatus}`, 'success');
      loadAllData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Review status
  const handleUpdateReviewStatus = async (id: string, status: 'approved' | 'pending' | 'hidden') => {
    try {
      await api.updateAdminReviewStatus(id, status);
      showToast(`Review set to ${status}`, 'success');
      loadAllData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Order status update
  const handleUpdateOrderStatus = async (id: string, orderStatus: string, paymentStatus: string) => {
    try {
      await api.updateAdminOrderStatus(id, { orderStatus, paymentStatus });
      showToast('Order status updated', 'success');
      if (viewingOrder && viewingOrder.id === id) {
        setViewingOrder(prev => prev ? { ...prev, orderStatus: orderStatus as any, paymentStatus: paymentStatus as any } : null);
      }
      loadAllData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Settings update
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    try {
      await api.updateAdminSettings(settings);
      showToast('Store settings saved successfully', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
          <span className="font-bold text-slate-300">Verifying administrative access...</span>
        </div>
      </div>
    );
  }

  if (!user || (!isAdmin && user.role !== 'admin')) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white text-center">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-rose-400">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black tracking-tight">Admin Access Restricted</h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-2 leading-relaxed">
            {!user
              ? 'You must be signed in with administrator credentials to access the store management system.'
              : 'Your current account does not have administrator privileges. Customer accounts cannot access the admin panel.'}
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={onBackToStore}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs sm:text-sm transition-all cursor-pointer"
            >
              Return to NotesVidya Store
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Top Admin Navbar */}
      <header className="bg-slate-950 border-b border-slate-800 px-6 py-3.5 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-purple-600/30">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-sm sm:text-base text-white tracking-tight flex items-center gap-2">
              <span>Admin Control Center</span>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-purple-900/60 text-purple-300 border border-purple-700/50">
                Store Manager
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">NotesVidya Admin Suite</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadAllData}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Refresh Store Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={onBackToStore}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>Return to Public Store</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Admin Workspace Layout */}
      <div className="flex-1 flex flex-col md:flex-row">
        
        {/* Sidebar Nav */}
        <aside className="w-full md:w-64 bg-slate-950/80 border-r border-slate-800 p-4 space-y-1 shrink-0">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'dashboard' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard & Analytics</span>
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'products' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4" />
              <span>PDF Products</span>
            </div>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
              {products.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('stock')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'stock' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>Digital Inventory / Stock</span>
          </button>

          <button
            onClick={() => setActiveTab('categories')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'categories' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <Layers className="w-4 h-4" />
              <span>Categories</span>
            </div>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
              {categories.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('customers')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'customers' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <Users className="w-4 h-4" />
              <span>Customers</span>
            </div>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
              {customers.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'orders' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-4 h-4" />
              <span>Orders</span>
            </div>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
              {orders.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('payments')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'payments' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <CreditCard className="w-4 h-4" />
              <span>Payment Ledger</span>
            </div>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
              {payments.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('coupons')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'coupons' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <Tag className="w-4 h-4" />
              <span>Coupons & Discounts</span>
            </div>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
              {coupons.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('reviews')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'reviews' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <MessageSquare className="w-4 h-4" />
              <span>Reviews Moderation</span>
            </div>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
              {reviews.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('emails')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'emails' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4" />
              <span>Email Notification Logs</span>
            </div>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
              {emails.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'settings' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Store Settings & Razorpay</span>
          </button>
        </aside>

        {/* Content View */}
        <main className="flex-1 p-6 overflow-y-auto max-w-7xl">
          
          {/* TAB: DASHBOARD & METRICS */}
          {activeTab === 'dashboard' && stats && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-white">Marketplace Performance</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Real-time revenue, order telemetry, and customer downloads</p>
                </div>
              </div>

              {/* 10 High-Level Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Total Sales</span>
                  <p className="text-xl font-black text-emerald-400 mt-1">₹{stats.totalSales.toLocaleString()}</p>
                  <span className="text-[10px] text-slate-500">Gross revenue</span>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Today's Sales</span>
                  <p className="text-xl font-black text-white mt-1">₹{stats.todaySales.toLocaleString()}</p>
                  <span className="text-[10px] text-emerald-400">Live 24h</span>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Monthly Sales</span>
                  <p className="text-xl font-black text-white mt-1">₹{stats.monthlySales.toLocaleString()}</p>
                  <span className="text-[10px] text-slate-500">Current calendar month</span>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Total Orders</span>
                  <p className="text-xl font-black text-white mt-1">{stats.totalOrders}</p>
                  <span className="text-[10px] text-slate-500">{stats.successfulOrders} successful</span>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Pending Orders</span>
                  <p className="text-xl font-black text-amber-400 mt-1">{stats.pendingOrders}</p>
                  <span className="text-[10px] text-slate-500">Awaiting payment</span>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Failed Payments</span>
                  <p className="text-xl font-black text-rose-400 mt-1">{stats.failedPayments}</p>
                  <span className="text-[10px] text-slate-500">Declined/aborted</span>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Total Customers</span>
                  <p className="text-xl font-black text-white mt-1">{stats.totalCustomers}</p>
                  <span className="text-[10px] text-slate-500">Registered accounts</span>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Total PDFs</span>
                  <p className="text-xl font-black text-white mt-1">{stats.totalPdfs}</p>
                  <span className="text-[10px] text-slate-500">{products.filter(p => p.availability !== 'unavailable').length} available</span>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Total Downloads</span>
                  <p className="text-xl font-black text-blue-400 mt-1">{stats.totalDownloads}</p>
                  <span className="text-[10px] text-slate-500">Watermarked deliveries</span>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Avg. Order Value</span>
                  <p className="text-xl font-black text-purple-400 mt-1">
                    ₹{stats.successfulOrders ? (stats.totalSales / stats.successfulOrders).toFixed(0) : '0'}
                  </p>
                  <span className="text-[10px] text-slate-500">Per paying transaction</span>
                </div>
              </div>

              {/* Visual Performance Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Daily Sales Bar Chart */}
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-300">
                      7-Day Revenue Trend
                    </h3>
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="space-y-2">
                    {(stats?.dailySales || []).map(d => (
                      <div key={d.date} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">{d.date}</span>
                          <span className="font-bold text-emerald-400">₹{d.amount.toFixed(0)}</span>
                        </div>
                        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${Math.min(100, (d.amount / 3000) * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Selling Products */}
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-300">
                    Top Selling Study Materials
                  </h3>
                  <div className="space-y-3">
                    {(stats?.topSellingProducts || []).map((p, idx) => (
                      <div key={p.productId} className="flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2 truncate">
                          <span className="w-5 h-5 rounded bg-slate-800 text-slate-400 font-bold text-[10px] flex items-center justify-center shrink-0">
                            #{idx + 1}
                          </span>
                          <span className="font-semibold text-slate-200 truncate">{p.title}</span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-bold text-indigo-400">{p.purchases} sales</span>
                          <span className="text-slate-500 block text-[10px]">₹{p.revenue.toFixed(0)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Orders in Dashboard */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-300">
                    Recent Customer Orders
                  </h3>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="text-xs font-bold text-purple-400 hover:underline"
                  >
                    View All Orders →
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left text-slate-300">
                    <thead className="bg-slate-900 text-slate-400 uppercase text-[10px]">
                      <tr>
                        <th className="p-2.5">Order</th>
                        <th className="p-2.5">Customer</th>
                        <th className="p-2.5">Amount</th>
                        <th className="p-2.5">Status</th>
                        <th className="p-2.5">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {orders.slice(0, 5).map(o => (
                        <tr key={o.id} className="hover:bg-slate-900/50">
                          <td className="p-2.5 font-bold text-white">#{o.orderNumber}</td>
                          <td className="p-2.5">{o.customerName}</td>
                          <td className="p-2.5 font-semibold text-emerald-400">₹{o.finalAmount.toFixed(2)}</td>
                          <td className="p-2.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              o.paymentStatus === 'paid' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-amber-950 text-amber-300'
                            }`}>
                              {o.paymentStatus}
                            </span>
                          </td>
                          <td className="p-2.5 text-slate-400">{new Date(o.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: PRODUCTS MANAGEMENT */}
          {activeTab === 'products' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-white">PDF Products Catalog</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Manage digital notes, pricing, previews, and publication status</p>
                </div>
                <button
                  onClick={() => {
                    setEditingProduct({
                      title: '',
                      description: '',
                      fullDescription: '',
                      categoryId: categories[0]?.id || 'cat-comp-exams',
                      author: 'Senior Exam Faculty',
                      originalPrice: 499,
                      sellingPrice: 199,
                      pages: 250,
                      fileSize: '18.5 MB',
                      language: 'English & Hindi',
                      tags: ['2025 Exam', 'Study Notes'],
                      status: 'published',
                      availability: 'available',
                      featured: true,
                      bestseller: false,
                      previewSamplePages: [
                        { pageNumber: 1, title: 'Sample Chapter Blueprint', excerpt: 'Key conceptual formula sheet sample.', watermarkNotice: 'SAMPLE ONLY' }
                      ]
                    });
                    setIsProductModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-md flex items-center gap-1.5 cursor-pointer self-start"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New PDF</span>
                </button>
              </div>

              {/* Search & Category Filter */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Search PDFs by title, author, tag..."
                    className="w-full pl-9 pr-4 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500"
                  />
                </div>
                <select
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white"
                >
                  <option value="">All Categories</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Products Table */}
              <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-x-auto">
                <table className="w-full text-xs text-left text-slate-300">
                  <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="p-3">Cover & Title</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Price</th>
                      <th className="p-3">Pages / Size</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Availability</th>
                      <th className="p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {products
                      .filter(p => !categoryFilter || p.categoryId === categoryFilter)
                      .filter(p => !searchTerm || p.title.toLowerCase().includes(searchTerm.toLowerCase()) || p.author.toLowerCase().includes(searchTerm.toLowerCase()))
                      .map(prod => (
                        <tr key={prod.id} className="hover:bg-slate-900/60">
                          <td className="p-3 flex items-center gap-3">
                            <img
                              src={prod.thumbnail}
                              alt={prod.title}
                              referrerPolicy="no-referrer"
                              className="w-10 h-12 rounded object-cover border border-slate-700 shrink-0"
                            />
                            <div>
                              <span className="font-bold text-white block line-clamp-1 max-w-xs">{prod.title}</span>
                              <span className="text-[11px] text-slate-400">By {prod.author}</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-semibold">
                              {prod.categoryName}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="font-bold text-white">₹{prod.sellingPrice}</span>
                            <span className="text-[10px] text-slate-500 line-through block">₹{prod.originalPrice}</span>
                          </td>
                          <td className="p-3">
                            <span>{prod.pages} pgs</span>
                            <span className="text-slate-500 text-[10px] block">{prod.fileSize}</span>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              prod.status === 'published' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-800 text-slate-400'
                            }`}>
                              {prod.status}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              prod.availability === 'available' ? 'bg-blue-950 text-blue-400 border border-blue-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
                            }`}>
                              {prod.availability}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => {
                                  setEditingProduct(prod);
                                  setIsProductModalOpen(true);
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                                title="Edit Product"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(prod.id)}
                                className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950"
                                title="Delete Product"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: DIGITAL INVENTORY / STOCK */}
          {activeTab === 'stock' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-white">Digital Inventory & Availability</h2>
                <p className="text-xs text-slate-400 mt-0.5">Control product availability, purchase caps, and download limits</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Active Published</span>
                  <p className="text-2xl font-black text-emerald-400 mt-1">
                    {products.filter(p => p.status === 'published' && p.availability === 'available').length}
                  </p>
                </div>
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Draft Items</span>
                  <p className="text-2xl font-black text-amber-400 mt-1">
                    {products.filter(p => p.status === 'draft').length}
                  </p>
                </div>
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Marked Unavailable</span>
                  <p className="text-2xl font-black text-rose-400 mt-1">
                    {products.filter(p => p.availability === 'unavailable').length}
                  </p>
                </div>
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Total Lifetime Sales</span>
                  <p className="text-2xl font-black text-indigo-400 mt-1">
                    {products.reduce((sum, p) => sum + p.purchaseCount, 0)}
                  </p>
                </div>
              </div>

              {/* Availability Fast Toggle List */}
              <div className="bg-slate-950 rounded-2xl border border-slate-800 p-5 space-y-3">
                <h3 className="text-xs font-bold uppercase text-slate-300">Quick Availability Controls</h3>
                <div className="divide-y divide-slate-800">
                  {products.map(p => (
                    <div key={p.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                      <div>
                        <span className="font-bold text-white block">{p.title}</span>
                        <span className="text-[11px] text-slate-500">Purchases: {p.purchaseCount} • Rating: {p.rating}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={async () => {
                            const newAvail = p.availability === 'available' ? 'unavailable' : 'available';
                            await api.updateAdminProduct(p.id, { availability: newAvail });
                            showToast(`Updated to ${newAvail}`, 'success');
                            loadAllData();
                          }}
                          className={`px-3 py-1 rounded-lg text-xs font-bold uppercase transition-all ${
                            p.availability === 'available'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800 hover:bg-emerald-900'
                              : 'bg-rose-950 text-rose-400 border border-rose-800 hover:bg-rose-900'
                          }`}
                        >
                          {p.availability}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB: CATEGORIES */}
          {activeTab === 'categories' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-white">Categories Management</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Organize study notes by exam boards and academic levels</p>
                </div>
                <button
                  onClick={() => {
                    setEditingCategory({ name: '', slug: '', description: '', active: true });
                    setIsCategoryModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Category</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map(c => (
                  <div key={c.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-white text-sm">{c.name}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${c.active ? 'bg-emerald-950 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                          {c.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed mb-3">{c.description}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setEditingCategory(c);
                          setIsCategoryModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(c.id)}
                        className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: CUSTOMERS */}
          {activeTab === 'customers' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-black text-white">Registered Customer Accounts</h2>
                <p className="text-xs text-slate-400 mt-0.5">Manage customer privileges and access history (Passwords securely hidden)</p>
              </div>

              <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-x-auto">
                <table className="w-full text-xs text-left text-slate-300">
                  <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="p-3">Customer Name</th>
                      <th className="p-3">Email</th>
                      <th className="p-3">Phone</th>
                      <th className="p-3">Orders</th>
                      <th className="p-3">Total Spend</th>
                      <th className="p-3">Purchased PDFs</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {customers.map(c => (
                      <tr key={c.id} className="hover:bg-slate-900/60">
                        <td className="p-3 font-bold text-white">{c.name}</td>
                        <td className="p-3">{c.email}</td>
                        <td className="p-3 font-mono">{c.phone}</td>
                        <td className="p-3 font-semibold">{c.totalOrders}</td>
                        <td className="p-3 font-bold text-emerald-400">₹{c.totalSpending}</td>
                        <td className="p-3">{c.purchasedPdfsCount} items</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${c.status === 'active' ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'}`}>
                            {c.status}
                          </span>
                        </td>
                        <td className="p-3">
                          <button
                            onClick={() => handleToggleCustomer(c.id, c.status)}
                            className="px-2 py-1 rounded text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                          >
                            {c.status === 'active' ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: ORDERS */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-black text-white">Orders & Transactions</h2>
                <p className="text-xs text-slate-400 mt-0.5">Inspect customer purchases, payment verification status, and fulfillment logs</p>
              </div>

              <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-x-auto">
                <table className="w-full text-xs text-left text-slate-300">
                  <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="p-3">Order Number</th>
                      <th className="p-3">Customer</th>
                      <th className="p-3">Items Count</th>
                      <th className="p-3">Total Amount</th>
                      <th className="p-3">Payment Status</th>
                      <th className="p-3">Order Status</th>
                      <th className="p-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {orders.map(o => (
                      <tr key={o.id} className="hover:bg-slate-900/60">
                        <td className="p-3 font-bold text-white">#{o.orderNumber}</td>
                        <td className="p-3">
                          <span className="block font-semibold text-slate-200">{o.customerName}</span>
                          <span className="text-[10px] text-slate-500">{o.customerEmail}</span>
                        </td>
                        <td className="p-3">{o.items.length} PDF(s)</td>
                        <td className="p-3 font-bold text-emerald-400">₹{o.finalAmount.toFixed(2)}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            o.paymentStatus === 'paid' ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
                          }`}>
                            {o.paymentStatus}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-300">
                            {o.orderStatus}
                          </span>
                        </td>
                        <td className="p-3">
                          <button
                            onClick={() => setViewingOrder(o)}
                            className="px-3 py-1 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white cursor-pointer"
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: PAYMENTS */}
          {activeTab === 'payments' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-black text-white">Payment Ledger</h2>
                <p className="text-xs text-slate-400 mt-0.5">Secure payment records verified against payment gateway signatures</p>
              </div>

              <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-x-auto">
                <table className="w-full text-xs text-left text-slate-300">
                  <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="p-3">Transaction ID</th>
                      <th className="p-3">Order Number</th>
                      <th className="p-3">Customer</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Gateway / Method</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {payments.map(p => (
                      <tr key={p.id} className="hover:bg-slate-900/60">
                        <td className="p-3 font-mono text-[11px] text-purple-300">{p.transactionId}</td>
                        <td className="p-3 font-bold text-white">#{p.orderNumber}</td>
                        <td className="p-3">{p.customerName}</td>
                        <td className="p-3 font-black text-emerald-400">₹{p.amount.toFixed(2)}</td>
                        <td className="p-3">
                          <span className="font-semibold text-slate-300">{p.gateway}</span>
                          <span className="text-[10px] text-slate-500 block">{p.paymentMethod}</span>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-950 text-emerald-400">
                            {p.status}
                          </span>
                        </td>
                        <td className="p-3 text-slate-500">{new Date(p.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: COUPONS */}
          {activeTab === 'coupons' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-white">Coupons & Promotional Codes</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Configure discounts, percentage off, minimum order rules, and usage caps</p>
                </div>
                <button
                  onClick={() => {
                    setEditingCoupon({
                      code: 'EXAM2025',
                      discountType: 'percentage',
                      discountValue: 20,
                      minOrderAmount: 200,
                      maxDiscountAmount: 100,
                      active: true
                    });
                    setIsCouponModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Coupon</span>
                </button>
              </div>

              <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-x-auto">
                <table className="w-full text-xs text-left text-slate-300">
                  <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="p-3">Coupon Code</th>
                      <th className="p-3">Discount Type</th>
                      <th className="p-3">Value</th>
                      <th className="p-3">Min Order</th>
                      <th className="p-3">Used / Limit</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {coupons.map(cp => (
                      <tr key={cp.id} className="hover:bg-slate-900/60">
                        <td className="p-3 font-mono font-bold text-amber-300">{cp.code}</td>
                        <td className="p-3 uppercase text-[10px]">{cp.discountType}</td>
                        <td className="p-3 font-bold text-white">
                          {cp.discountType === 'percentage' ? `${cp.discountValue}%` : `₹${cp.discountValue}`}
                        </td>
                        <td className="p-3">₹{cp.minOrderAmount}</td>
                        <td className="p-3">{cp.usageCount} / {cp.usageLimit || '∞'}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${cp.active ? 'bg-emerald-950 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                            {cp.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                setEditingCoupon(cp);
                                setIsCouponModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteCoupon(cp.id)}
                              className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: REVIEWS MODERATION */}
          {activeTab === 'reviews' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-black text-white">Reviews Moderation</h2>
                <p className="text-xs text-slate-400 mt-0.5">Approve, hide, or remove customer feedback</p>
              </div>

              <div className="space-y-3">
                {reviews.map(r => (
                  <div key={r.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{r.userName}</span>
                        <span className="text-amber-400 font-bold text-xs">★ {r.rating}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          r.status === 'approved' ? 'bg-emerald-950 text-emerald-400' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {r.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{r.comment}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {r.status !== 'approved' && (
                        <button
                          onClick={() => handleUpdateReviewStatus(r.id, 'approved')}
                          className="px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-600 text-white"
                        >
                          Approve
                        </button>
                      )}
                      {r.status !== 'hidden' && (
                        <button
                          onClick={() => handleUpdateReviewStatus(r.id, 'hidden')}
                          className="px-3 py-1 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300"
                        >
                          Hide
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: EMAIL NOTIFICATIONS */}
          {activeTab === 'emails' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-black text-white">Dispatched Email Notification Logs</h2>
                <p className="text-xs text-slate-400 mt-0.5">Audit log of system transactional emails sent to customers</p>
              </div>

              <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-x-auto">
                <table className="w-full text-xs text-left text-slate-300">
                  <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="p-3">Event Type</th>
                      <th className="p-3">Recipient</th>
                      <th className="p-3">Subject</th>
                      <th className="p-3">Dispatched Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {emails.map(em => (
                      <tr key={em.id} className="hover:bg-slate-900/60">
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-purple-300">
                            {em.type.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-3 font-semibold text-white">{em.to}</td>
                        <td className="p-3 text-slate-300">{em.subject}</td>
                        <td className="p-3 text-slate-500">{new Date(em.sentAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: SETTINGS */}
          {activeTab === 'settings' && settings && (
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 max-w-2xl space-y-5">
              <div>
                <h2 className="text-xl font-black text-white">Store Settings & Payment Gateway</h2>
                <p className="text-xs text-slate-400 mt-0.5">Configure branding, Razorpay credentials, and policies</p>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Store Name</label>
                  <input
                    type="text"
                    value={settings.siteName}
                    onChange={e => setSettings({ ...settings, siteName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Support Email</label>
                    <input
                      type="email"
                      value={settings.supportEmail}
                      onChange={e => setSettings({ ...settings, supportEmail: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Support Phone</label>
                    <input
                      type="text"
                      value={settings.supportPhone}
                      onChange={e => setSettings({ ...settings, supportPhone: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Currency Code</label>
                    <input
                      type="text"
                      value={settings.currencyCode}
                      onChange={e => setSettings({ ...settings, currencyCode: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Currency Symbol</label>
                    <input
                      type="text"
                      value={settings.currencySymbol}
                      onChange={e => setSettings({ ...settings, currencySymbol: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Tax / GST Rate (%)</label>
                    <input
                      type="number"
                      value={settings.taxRate}
                      onChange={e => setSettings({ ...settings, taxRate: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-800/40 space-y-3">
                  <h4 className="font-bold text-purple-300">Razorpay Payment Gateway Setup</h4>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Razorpay Key ID</label>
                    <input
                      type="text"
                      value={settings.razorpayKeyId}
                      onChange={e => setSettings({ ...settings, razorpayKeyId: e.target.value })}
                      placeholder="rzp_test_..."
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Gateway Mode</label>
                    <select
                      value={settings.paymentGatewayMode}
                      onChange={e => setSettings({ ...settings, paymentGatewayMode: e.target.value as any })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white"
                    >
                      <option value="test">Sandbox / Test Mode (Instant verification)</option>
                      <option value="live">Live Production Mode</option>
                    </select>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-800/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-indigo-300">Brevo Transactional Email & OTP Verification</h4>
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded-full border border-emerald-500/30">
                      Active API Provider
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    NotesVidya uses the Brevo API to send 6-digit registration OTP verification codes. Make sure the sender email is verified in your Brevo account.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Verified Brevo Sender Email
                      </label>
                      <input
                        type="email"
                        value={settings.emailSenderAddress || settings.brevoSenderEmail || ''}
                        onChange={e => setSettings({
                          ...settings,
                          emailSenderAddress: e.target.value,
                          brevoSenderEmail: e.target.value
                        })}
                        placeholder="e.g. support@notesvidya.com or your-verified@email.com"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono text-xs"
                      />
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Must match an active sender in your Brevo Senders list.
                      </span>
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Sender Display Name
                      </label>
                      <input
                        type="text"
                        value={settings.emailSenderName || settings.brevoSenderName || 'NotesVidya'}
                        onChange={e => setSettings({
                          ...settings,
                          emailSenderName: e.target.value,
                          brevoSenderName: e.target.value
                        })}
                        placeholder="NotesVidya"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs"
                      />
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        The name displayed in customer inboxes.
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl font-bold bg-purple-600 hover:bg-purple-500 text-white"
                >
                  Save Store Settings
                </button>
              </form>
            </div>
          )}
        </main>
      </div>

      {/* Product Add / Edit Modal */}
      {isProductModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-slate-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">
                {editingProduct.id ? 'Edit PDF Product' : 'Add New PDF Product'}
              </h3>
              <button onClick={() => setIsProductModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Title</label>
                <input
                  type="text"
                  value={editingProduct.title || ''}
                  onChange={e => setEditingProduct({ ...editingProduct, title: e.target.value })}
                  placeholder="e.g. RRB NTPC General Awareness Master Guide"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Category</label>
                  <select
                    value={editingProduct.categoryId || ''}
                    onChange={e => setEditingProduct({ ...editingProduct, categoryId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Author / Faculty</label>
                  <input
                    type="text"
                    value={editingProduct.author || ''}
                    onChange={e => setEditingProduct({ ...editingProduct, author: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Original Price (₹)</label>
                  <input
                    type="number"
                    value={editingProduct.originalPrice || 0}
                    onChange={e => setEditingProduct({ ...editingProduct, originalPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Selling Price (₹)</label>
                  <input
                    type="number"
                    value={editingProduct.sellingPrice || 0}
                    onChange={e => setEditingProduct({ ...editingProduct, sellingPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Pages</label>
                  <input
                    type="number"
                    value={editingProduct.pages || 100}
                    onChange={e => setEditingProduct({ ...editingProduct, pages: parseInt(e.target.value) || 100 })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Short Description</label>
                <textarea
                  value={editingProduct.description || ''}
                  onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Status</label>
                  <select
                    value={editingProduct.status || 'published'}
                    onChange={e => setEditingProduct({ ...editingProduct, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Availability</label>
                  <select
                    value={editingProduct.availability || 'available'}
                    onChange={e => setEditingProduct({ ...editingProduct, availability: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  >
                    <option value="available">Available</option>
                    <option value="unavailable">Unavailable (Disabled for purchase)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-2">
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingProduct.featured || false}
                    onChange={e => setEditingProduct({ ...editingProduct, featured: e.target.checked })}
                    className="rounded text-purple-600"
                  />
                  <span className="text-slate-300">Featured</span>
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingProduct.bestseller || false}
                    onChange={e => setEditingProduct({ ...editingProduct, bestseller: e.target.checked })}
                    className="rounded text-purple-600"
                  />
                  <span className="text-slate-300">Bestseller</span>
                </label>
              </div>

              <div className="space-y-3 pt-2 border-t border-slate-800">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">File & Assets Upload</h4>
                
                <div className="grid grid-cols-2 gap-3">
                  {/* PDF Upload */}
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="font-semibold text-slate-300">Protected PDF File</label>
                      {uploadingPdf && <RefreshCw className="w-3.5 h-3.5 text-purple-400 animate-spin" />}
                    </div>
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={handlePdfUpload}
                      disabled={uploadingPdf}
                      className="w-full text-[11px] text-slate-400 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[11px] file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-500 cursor-pointer"
                    />
                    {editingProduct.pdfFileKey ? (
                      <div className="text-[11px] text-emerald-400 font-mono truncate">
                        ✓ Vault File: {editingProduct.pdfFileKey} {editingProduct.fileSize ? `(${editingProduct.fileSize})` : ''}
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-500">Upload master PDF stored securely in vault</p>
                    )}
                  </div>

                  {/* Thumbnail Cover Upload */}
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="font-semibold text-slate-300">Cover Thumbnail</label>
                      {uploadingThumbnail && <RefreshCw className="w-3.5 h-3.5 text-purple-400 animate-spin" />}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleThumbnailUpload}
                      disabled={uploadingThumbnail}
                      className="w-full text-[11px] text-slate-400 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[11px] file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-500 cursor-pointer"
                    />
                    {editingProduct.thumbnail ? (
                      <div className="text-[11px] text-emerald-400 truncate flex items-center gap-1.5">
                        <img src={editingProduct.thumbnail} alt="Cover" className="w-6 h-6 object-cover rounded border border-slate-700" />
                        <span className="truncate">{editingProduct.thumbnail}</span>
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-500">Upload JPEG/PNG cover thumbnail</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold bg-purple-600 hover:bg-purple-500 text-white"
                >
                  Save PDF Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {isCategoryModalOpen && editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">
                {editingCategory.id ? 'Edit Category' : 'Create Category'}
              </h3>
              <button onClick={() => setIsCategoryModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Category Name</label>
                <input
                  type="text"
                  value={editingCategory.name || ''}
                  onChange={e => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Description</label>
                <textarea
                  value={editingCategory.description || ''}
                  onChange={e => setEditingCategory({ ...editingCategory, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                />
              </div>

              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingCategory.active !== false}
                  onChange={e => setEditingCategory({ ...editingCategory, active: e.target.checked })}
                  className="rounded text-purple-600"
                />
                <span className="text-slate-300">Active</span>
              </label>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold bg-purple-600 hover:bg-purple-500 text-white"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Coupon Modal */}
      {isCouponModalOpen && editingCoupon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">
                {editingCoupon.id ? 'Edit Coupon' : 'Create Coupon'}
              </h3>
              <button onClick={() => setIsCouponModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveCoupon} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Coupon Code</label>
                <input
                  type="text"
                  value={editingCoupon.code || ''}
                  onChange={e => setEditingCoupon({ ...editingCoupon, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono uppercase"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Discount Type</label>
                  <select
                    value={editingCoupon.discountType || 'percentage'}
                    onChange={e => setEditingCoupon({ ...editingCoupon, discountType: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Discount Value</label>
                  <input
                    type="number"
                    value={editingCoupon.discountValue || 0}
                    onChange={e => setEditingCoupon({ ...editingCoupon, discountValue: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Min Order Amount (₹)</label>
                  <input
                    type="number"
                    value={editingCoupon.minOrderAmount || 0}
                    onChange={e => setEditingCoupon({ ...editingCoupon, minOrderAmount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Usage Limit</label>
                  <input
                    type="number"
                    value={editingCoupon.usageLimit || ''}
                    onChange={e => setEditingCoupon({ ...editingCoupon, usageLimit: parseInt(e.target.value) || undefined })}
                    placeholder="Unlimited"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCouponModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold bg-purple-600 hover:bg-purple-500 text-white"
                >
                  Save Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {viewingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-slate-900 rounded-2xl max-w-lg w-full p-6 border border-slate-800 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-white text-base">Order #{viewingOrder.orderNumber}</h3>
                <p className="text-slate-400">{new Date(viewingOrder.createdAt).toLocaleString()}</p>
              </div>
              <button onClick={() => setViewingOrder(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <p className="text-slate-400">Customer: <strong className="text-white">{viewingOrder.customerName}</strong></p>
                <p className="text-slate-400">Email: <strong className="text-white">{viewingOrder.customerEmail}</strong></p>
                <p className="text-slate-400">Phone: <strong className="text-white">{viewingOrder.customerPhone}</strong></p>
                <p className="text-slate-400">Payment ID: <strong className="font-mono text-purple-300">{viewingOrder.paymentId || 'N/A'}</strong></p>
              </div>

              <div>
                <span className="font-bold text-slate-300 block mb-1">Purchased Products:</span>
                <div className="divide-y divide-slate-800">
                  {viewingOrder.items.map(it => (
                    <div key={it.productId} className="py-2 flex justify-between">
                      <span className="text-white">{it.title}</span>
                      <span className="font-bold text-emerald-400">₹{it.price}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-sm text-white">
                <span>Final Total Paid:</span>
                <span className="text-emerald-400">₹{viewingOrder.finalAmount.toFixed(2)}</span>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center gap-2">
                <span className="text-slate-400 font-semibold">Change Status:</span>
                <button
                  onClick={() => handleUpdateOrderStatus(viewingOrder.id, 'completed', 'paid')}
                  className="px-3 py-1 rounded bg-emerald-700 text-white font-bold"
                >
                  Mark Paid
                </button>
                <button
                  onClick={() => handleUpdateOrderStatus(viewingOrder.id, 'failed', 'failed')}
                  className="px-3 py-1 rounded bg-rose-700 text-white font-bold"
                >
                  Mark Failed
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
