import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  ArrowRight,
  Mail,
  User,
  Phone,
  CheckCircle2,
  FileText,
  AlertCircle
} from 'lucide-react';
import { useCart } from '../context/CartContext.js';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { api } from '../lib/api.js';
import { PaymentGatewayModal } from './PaymentGatewayModal.js';
import { Order } from '../types.js';

interface CheckoutPageProps {
  onOrderSuccess: (order: Order) => void;
  onBackToCart: () => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  onOrderSuccess,
  onBackToCart
}) => {
  const { cart, finalAmount, clearCart, coupon, discountAmount } = useCart();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [acceptTerms, setAcceptTerms] = useState(true);

  // Gateway Modal State
  const [isGatewayOpen, setIsGatewayOpen] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [creatingOrder, setCreatingOrder] = useState(false);

  const handleInitiatePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim() || !customerEmail.trim()) {
      showToast('Please provide your name and email address', 'error');
      return;
    }

    if (!acceptTerms) {
      showToast('Please agree to terms and digital goods conditions', 'error');
      return;
    }

    const cartItems = cart?.items || [];
    if (cartItems.length === 0) {
      showToast('Your cart is empty', 'error');
      return;
    }

    const resolvedCouponCode = typeof coupon === 'string' ? coupon : (coupon as any)?.code || undefined;

    setCreatingOrder(true);
    try {
      const res = await api.createOrder({
        productIds: cartItems.map(it => it.productId),
        couponCode: resolvedCouponCode,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim().toLowerCase(),
        customerPhone: customerPhone.trim() || '9876543210'
      });

      setCurrentOrder(res.order);
      setIsGatewayOpen(true);
    } catch (err: any) {
      showToast(err.message || 'Failed to create order', 'error');
    } finally {
      setCreatingOrder(false);
    }
  };

  const handlePaymentCompleted = (verifiedOrder: Order) => {
    setIsGatewayOpen(false);
    clearCart();
    showToast('Payment successful! Your PDFs have been unlocked.', 'success');
    onOrderSuccess(verifiedOrder);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Secure Digital Checkout
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Enter customer details for instant PDF licensing and order invoice
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Customer Information Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleInitiatePayment} className="space-y-5">
            
            {/* Customer Details Box */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-600" />
                <span>1. Customer & Account Information</span>
              </h2>

              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                  <p className="text-[10px] text-slate-400 mt-1">This name will be embossed on your PDF watermark.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={e => setCustomerEmail(e.target.value)}
                      placeholder="e.g. yourname@gmail.com"
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      required
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Receipt & access link will be dispatched here.</p>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Mobile Phone (Optional)
                    </label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={e => setCustomerPhone(e.target.value)}
                      placeholder="e.g. +91 98765 43210"
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Used for payment updates & SMS alerts.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Lock className="w-4 h-4 text-indigo-600" />
                <span>2. Payment Gateway Provider</span>
              </h2>

              <div className="p-4 rounded-xl border-2 border-indigo-600 bg-indigo-50/50 flex items-start gap-3">
                <input
                  type="radio"
                  name="gateway"
                  checked
                  readOnly
                  className="mt-1 text-indigo-600"
                />
                <div>
                  <strong className="text-xs text-slate-900 block">
                    Razorpay Payment Gateway (Instant Delivery)
                  </strong>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Supports UPI (Google Pay, PhonePe, Paytm, BHIM), Credit/Debit Cards (RuPay, Visa, Mastercard), Net Banking, and Wallets.
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2 py-0.5 rounded bg-white text-indigo-700 border border-indigo-200 text-[10px] font-bold">UPI</span>
                    <span className="px-2 py-0.5 rounded bg-white text-indigo-700 border border-indigo-200 text-[10px] font-bold">Cards</span>
                    <span className="px-2 py-0.5 rounded bg-white text-indigo-700 border border-indigo-200 text-[10px] font-bold">NetBanking</span>
                  </div>
                </div>
              </div>

              {/* Terms Checkbox */}
              <label className="flex items-start gap-2.5 text-xs text-slate-600 pt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={e => setAcceptTerms(e.target.checked)}
                  className="mt-0.5 rounded text-indigo-600"
                />
                <span>
                  I understand that these are non-tangible digital downloadable PDF materials with instant delivery. I agree to the <span className="text-indigo-600 font-semibold underline">Terms & Conditions</span> and <span className="text-indigo-600 font-semibold underline">Refund Policy</span>.
                </span>
              </label>
            </div>

            {/* Launch Payment Button */}
            <button
              type="submit"
              disabled={creatingOrder}
              className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>
                {creatingOrder ? 'Setting up Secure Gateway...' : `Pay ₹${finalAmount.toFixed(2)} with Razorpay`}
              </span>
            </button>
          </form>

          <button
            onClick={onBackToCart}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1"
          >
            <span>← Back to Shopping Cart</span>
          </button>
        </div>

        {/* Order Items Preview Column (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Order Summary</h3>

            {/* Items */}
            <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto pr-1">
              {(cart?.items || []).map(it => (
                <div key={it.productId} className="py-3 flex items-center gap-3">
                  <img
                    src={it.thumbnail}
                    alt={it.title}
                    referrerPolicy="no-referrer"
                    className="w-10 h-13 rounded-lg object-cover border border-slate-200 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-xs text-slate-900 truncate">{it.title}</h4>
                    <span className="text-[10px] text-slate-500">{it.pages} pgs • By {it.author}</span>
                  </div>
                  <span className="font-extrabold text-xs text-slate-900 shrink-0">
                    ₹{it.price}
                  </span>
                </div>
              ))}
            </div>

            {/* Price Calculations */}
            <div className="border-t border-slate-200 pt-3 space-y-2 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Items Subtotal:</span>
                <span className="font-semibold text-slate-900">₹{(cart?.subtotal || 0).toFixed(2)}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Coupon ({typeof coupon === 'string' ? coupon : (coupon as any)?.code || 'APPLIED'}):</span>
                  <span>-₹{discountAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Platform & DRM Fee:</span>
                <span className="text-emerald-600 font-bold uppercase text-[10px]">FREE</span>
              </div>

              <div className="border-t border-slate-200 pt-3 flex justify-between items-baseline font-black text-slate-900 text-base">
                <span>Final Payable:</span>
                <span className="text-xl text-indigo-600">₹{finalAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Security Assurance */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500 space-y-1.5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Zero card info stored on our servers</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Instant access unlocked right after payment</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Gateway Modal Popup */}
      {isGatewayOpen && currentOrder && (
        <PaymentGatewayModal
          order={currentOrder}
          onSuccess={handlePaymentCompleted}
          onClose={() => setIsGatewayOpen(false)}
        />
      )}
    </div>
  );
};
