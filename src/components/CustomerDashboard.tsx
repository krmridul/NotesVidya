import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  FileText,
  ShoppingBag,
  Download,
  Heart,
  KeyRound,
  ShieldCheck,
  Calendar,
  ExternalLink,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { useCart } from '../context/CartContext.js';
import { Product, Order, DownloadLog, WishlistItem } from '../types.js';
import { api } from '../lib/api.js';

interface CustomerDashboardProps {
  initialTab?: string;
  onOpenViewer: (product: Product, order?: Order) => void;
  onViewProduct: (product: Product) => void;
  onNavigate: (view: string, param?: string) => void;
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({
  initialTab = 'overview',
  onOpenViewer,
  onViewProduct,
  onNavigate
}) => {
  const { user, updateUser, logout } = useAuth();
  const { showToast } = useToast();
  const { addToCart } = useCart();

  const [activeTab, setActiveTab] = useState(initialTab || 'overview');
  const [loading, setLoading] = useState(true);

  // Dashboard data
  const [purchasedPdfs, setPurchasedPdfs] = useState<Array<{ product: Product; order: Order; purchasedAt: string }>>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [downloads, setDownloads] = useState<DownloadLog[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [selectedOrderReceipt, setSelectedOrderReceipt] = useState<Order | null>(null);

  // Profile edit state
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone);
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [purchasedRes, ordersRes, downloadsRes, wishlistRes] = await Promise.all([
        api.getMyPurchasedPdfs(),
        api.getMyOrders(),
        api.getMyDownloads(),
        api.getMyWishlist()
      ]);

      setPurchasedPdfs(purchasedRes?.purchased || []);
      setOrders(ordersRes?.orders || []);
      setDownloads(downloadsRes?.downloads || []);
      setWishlist(wishlistRes?.wishlist || []);
    } catch (err: any) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (productId: string, productTitle: string) => {
    try {
      showToast('Preparing licensed watermarked PDF for download...', 'info');
      const tokenRes = await api.requestPdfDownloadToken(productId);

      const link = document.createElement('a');
      link.href = tokenRes.downloadUrl;
      link.setAttribute('download', `${productTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast('Download started!', 'success');
      // Refresh downloads list
      const freshDownloads = await api.getMyDownloads();
      setDownloads(freshDownloads.downloads || []);
    } catch (err: any) {
      showToast('Download error: ' + err.message, 'error');
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await api.updateProfile({ name, phone });
      updateUser(res.user);
      showToast('Profile updated successfully', 'success');
    } catch (err: any) {
      showToast(err.message || 'Update failed', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }
    setChangingPassword(true);
    try {
      const res = await api.changePassword({ currentPassword, newPassword, confirmPassword });
      showToast(res.message, 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      showToast(err.message || 'Failed to update password', 'error');
    } finally {
      setChangingPassword(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white border border-slate-200 rounded-3xl shadow-xl text-center">
        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <UserIcon className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-slate-900">Sign in to view your dashboard</h2>
        <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
          Please sign in with your NotesVidya customer account to access your purchased study materials, order history, and account settings.
        </p>
        <button
          onClick={() => onNavigate('home')}
          className="mt-6 w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
        >
          Return to Store & Sign In
        </button>
      </div>
    );
  }

  const totalSpent = orders
    .filter(o => o.paymentStatus === 'paid')
    .reduce((sum, o) => sum + o.finalAmount, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-3xl text-white p-6 sm:p-8 mb-8 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-white text-2xl font-black shadow-inner">
            {user?.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Verified Student Account
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
              Welcome back, {user?.name}!
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
              {user?.email} • Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '2025'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('all-pdfs')}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition-all cursor-pointer"
          >
            Browse New Study Materials
          </button>
        </div>
      </div>

      {/* Main Grid: Sidebar Tabs + Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Sidebar Nav */}
        <div className="lg:col-span-1 space-y-2">
          <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-xs space-y-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'overview' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <UserIcon className="w-4 h-4" />
              <span>Overview</span>
            </button>

            <button
              onClick={() => setActiveTab('purchased')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'purchased' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>Purchased PDFs</span>
              </div>
              {purchasedPdfs.length > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {purchasedPdfs.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'orders' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-4 h-4" />
                <span>My Orders</span>
              </div>
              {orders.length > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  {orders.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('downloads')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'downloads' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Download className="w-4 h-4" />
              <span>Downloads History</span>
            </button>

            <button
              onClick={() => setActiveTab('wishlist')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'wishlist' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Heart className="w-4 h-4 text-rose-500" />
                <span>Wishlist</span>
              </div>
              {wishlist.length > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-800">
                  {wishlist.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'profile' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <UserIcon className="w-4 h-4" />
              <span>Profile Settings</span>
            </button>

            <button
              onClick={() => setActiveTab('password')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'password' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <KeyRound className="w-4 h-4" />
              <span>Security & Password</span>
            </button>
          </div>
        </div>

        {/* Content Tabs Area */}
        <div className="lg:col-span-3">
          
          {/* TAB: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-slate-400">Total PDF Products</span>
                    <FileText className="w-5 h-5 text-indigo-600" />
                  </div>
                  <p className="text-2xl font-black text-slate-900 mt-2">{purchasedPdfs.length}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">In your personalized digital library</p>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-slate-400">Total Spent</span>
                    <ShoppingBag className="w-5 h-5 text-emerald-600" />
                  </div>
                  <p className="text-2xl font-black text-slate-900 mt-2">₹{totalSpent.toFixed(2)}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Across {orders.length} verified order(s)</p>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-slate-400">Total Downloads</span>
                    <Download className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-2xl font-black text-slate-900 mt-2">{downloads.length}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Unlimited lifetime re-downloads</p>
                </div>
              </div>

              {/* Quick Purchased PDFs Preview */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    Recent Purchased PDFs
                  </h3>
                  {purchasedPdfs.length > 0 && (
                    <button
                      onClick={() => setActiveTab('purchased')}
                      className="text-xs font-bold text-indigo-600 hover:underline"
                    >
                      View All Library ({purchasedPdfs.length}) →
                    </button>
                  )}
                </div>

                {purchasedPdfs.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-700">No purchased PDFs yet</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      Explore our catalog of competitive exam notes, formula sheets, and solved papers.
                    </p>
                    <button
                      onClick={() => onNavigate('all-pdfs')}
                      className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white shadow-sm"
                    >
                      Browse PDF Catalog
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {purchasedPdfs.slice(0, 3).map(({ product, order, purchasedAt }) => (
                      <div key={product.id} className="py-3 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={product.thumbnail}
                            alt={product.title}
                            referrerPolicy="no-referrer"
                            className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                          />
                          <div>
                            <h4 className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-1">{product.title}</h4>
                            <p className="text-[11px] text-slate-500">
                              Order #{order.orderNumber} • {new Date(purchasedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onOpenViewer(product, order)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100"
                          >
                            Read Online
                          </button>
                          <button
                            onClick={() => handleDownload(product.id, product.title)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-600 hover:bg-emerald-50"
                            title="Download PDF"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: PURCHASED PDFS (Complete Library) */}
          {activeTab === 'purchased' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">My Purchased PDFs & Library</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Authorized digital copies with your personal watermark license
                  </p>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
                  {purchasedPdfs.length} Document(s) Unlocked
                </span>
              </div>

              {purchasedPdfs.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">Your library is currently empty</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Once you purchase any study materials or PDFs, they will appear here forever with unlimited downloads.
                  </p>
                  <button
                    onClick={() => onNavigate('all-pdfs')}
                    className="mt-4 px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  >
                    Explore Available PDFs
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {purchasedPdfs.map(({ product, order, purchasedAt }) => (
                    <div
                      key={product.id}
                      className="p-4 rounded-2xl border border-slate-200/90 hover:border-indigo-200 bg-white hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div className="flex gap-3 mb-3">
                        <img
                          src={product.thumbnail}
                          alt={product.title}
                          referrerPolicy="no-referrer"
                          className="w-16 h-20 rounded-xl object-cover border border-slate-200 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] font-bold text-indigo-600 uppercase bg-indigo-50 px-2 py-0.5 rounded">
                            {product.categoryName}
                          </span>
                          <h4 className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-2 mt-1">
                            {product.title}
                          </h4>
                          <p className="text-[11px] text-slate-500 mt-1">
                            {product.pages} Pages • {product.fileSize}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Purchased: {new Date(purchasedAt).toLocaleDateString()} (Order #{order.orderNumber})
                          </p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
                        <button
                          onClick={() => onOpenViewer(product, order)}
                          className="py-2 px-3 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Read Online</span>
                        </button>

                        <button
                          onClick={() => handleDownload(product.id, product.title)}
                          className="py-2 px-3 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download PDF</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: MY ORDERS */}
          {activeTab === 'orders' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <h3 className="font-bold text-slate-900 text-lg mb-4">My Orders History</h3>

              {orders.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-sm">
                  No orders found.
                </div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {orders.map(order => (
                    <div key={order.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs sm:text-sm text-slate-900">
                            Order #{order.orderNumber}
                          </span>
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                              order.paymentStatus === 'paid'
                                ? 'bg-emerald-100 text-emerald-800'
                                : order.paymentStatus === 'pending'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {order.paymentStatus}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Date: {new Date(order.createdAt).toLocaleString()} • {order.items.length} item(s)
                        </p>
                        <p className="text-xs font-semibold text-slate-700 mt-0.5">
                          Total: ₹{order.finalAmount.toFixed(2)} (via {order.paymentMethod || 'Razorpay'})
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedOrderReceipt(order)}
                          className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                        >
                          View Receipt
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: DOWNLOADS LOG */}
          {activeTab === 'downloads' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <h3 className="font-bold text-slate-900 text-lg mb-4">Downloads History</h3>
              {downloads.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No download activity logged yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left text-slate-600">
                    <thead className="bg-slate-50 uppercase text-[10px] font-bold text-slate-400 border-b">
                      <tr>
                        <th className="p-3">Date & Time</th>
                        <th className="p-3">Product Name</th>
                        <th className="p-3">IP Address</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {downloads.map(d => (
                        <tr key={d.id} className="hover:bg-slate-50">
                          <td className="p-3">{new Date(d.downloadedAt).toLocaleString()}</td>
                          <td className="p-3 font-semibold text-slate-800">{d.productTitle}</td>
                          <td className="p-3 font-mono text-slate-500">{d.ipAddress}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB: WISHLIST */}
          {activeTab === 'wishlist' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <h3 className="font-bold text-slate-900 text-lg mb-4">Saved Wishlist ({wishlist.length})</h3>
              {wishlist.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No saved items in your wishlist.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {wishlist.map(item => (
                    <div key={item.id} className="p-4 rounded-xl border border-slate-200 flex gap-3 items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.product?.thumbnail}
                          alt={item.product?.title}
                          referrerPolicy="no-referrer"
                          className="w-12 h-14 rounded-lg object-cover"
                        />
                        <div>
                          <h4 className="font-bold text-xs text-slate-900 line-clamp-1">{item.product?.title}</h4>
                          <span className="text-xs font-extrabold text-indigo-600">₹{item.product?.sellingPrice}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (item.product) {
                            addToCart(item.product);
                            showToast('Added to cart!', 'success');
                          }
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700"
                      >
                        Add to Cart
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: PROFILE */}
          {activeTab === 'profile' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs max-w-lg">
              <h3 className="font-bold text-slate-900 text-lg mb-4">Profile Information</h3>
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email (Cannot be changed)</label>
                  <input
                    type="email"
                    value={user?.email}
                    disabled
                    className="w-full px-3.5 py-2 text-sm border rounded-xl bg-slate-100 text-slate-500 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border rounded-xl"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  {savingProfile ? 'Saving...' : 'Save Profile Details'}
                </button>
              </form>
            </div>
          )}

          {/* TAB: PASSWORD */}
          {activeTab === 'password' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs max-w-lg">
              <h3 className="font-bold text-slate-900 text-lg mb-4">Change Password</h3>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border rounded-xl"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  {changingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Order Receipt Modal */}
      {selectedOrderReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">Order #{selectedOrderReceipt.orderNumber}</h3>
                <p className="text-xs text-slate-500">{new Date(selectedOrderReceipt.createdAt).toLocaleString()}</p>
              </div>
              <button onClick={() => setSelectedOrderReceipt(null)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="font-semibold text-slate-600">Payment Status: </span>
                <span className="font-bold uppercase text-emerald-700">{selectedOrderReceipt.paymentStatus}</span>
                <span className="ml-2 text-slate-400">({selectedOrderReceipt.paymentMethod})</span>
              </div>

              <div className="border rounded-xl p-3 space-y-2">
                <p className="font-bold text-slate-800">Items Ordered:</p>
                {(selectedOrderReceipt?.items || []).map(item => (
                  <div key={item.productId} className="flex justify-between">
                    <span className="text-slate-700 truncate max-w-[240px]">{item.title}</span>
                    <span className="font-semibold text-slate-900">₹{item.price}</span>
                  </div>
                ))}
                <div className="pt-2 border-t flex justify-between font-bold text-sm text-slate-900">
                  <span>Total Amount Paid</span>
                  <span>₹{selectedOrderReceipt.finalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedOrderReceipt(null)}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl"
            >
              Close Receipt
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
