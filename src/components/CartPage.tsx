import React, { useState } from 'react';
import {
  Trash2,
  Tag,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ShoppingBag,
  FileText
} from 'lucide-react';
import { useCart } from '../context/CartContext.js';
import { useToast } from '../context/ToastContext.js';
import { Product } from '../types.js';

interface CartPageProps {
  onProceedToCheckout: () => void;
  onContinueShopping: () => void;
  onViewProduct: (product: Product) => void;
}

export const CartPage: React.FC<CartPageProps> = ({
  onProceedToCheckout,
  onContinueShopping,
  onViewProduct
}) => {
  const { cart, removeFromCart, coupon, discountAmount, finalAmount, applyCoupon, removeCoupon } = useCart();
  const { showToast } = useToast();
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCodeInput.trim()) {
      showToast('Please enter a coupon code', 'error');
      return;
    }

    setApplyingCoupon(true);
    const res = await applyCoupon(couponCodeInput.trim());
    showToast(res.message, res.success ? 'success' : 'error');
    setApplyingCoupon(false);
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    setCouponCodeInput('');
    showToast('Coupon removed', 'info');
  };

  const cartItems = cart?.items || [];

  if (cartItems.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-5">
        <div className="w-20 h-20 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-xs">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Your Cart is Currently Empty</h2>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
          Looks like you haven't added any study materials or question papers yet. Explore our bestselling PDF collections to start revising.
        </p>
        <div>
          <button
            onClick={onContinueShopping}
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <span>Browse All PDFs</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Shopping Cart ({cartItems.length} {cartItems.length === 1 ? 'Item' : 'Items'})
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Digital PDF downloads with instant access upon payment verification
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Cart Items List (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-xs">
            {cartItems.map(item => (
              <div key={item.productId} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    className="w-14 h-18 rounded-xl object-cover border border-slate-200 shadow-xs shrink-0"
                  />
                  <div>
                    <h3
                      onClick={() => onViewProduct(item.product)}
                      className="font-bold text-sm text-slate-900 hover:text-indigo-600 transition-colors cursor-pointer line-clamp-1"
                    >
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {item.pages} Pages • High-Res PDF • By {item.author}
                    </p>
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold mt-1.5">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Digital Download • Single User License</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <div className="text-right">
                    <span className="font-extrabold text-base text-slate-900">
                      ₹{item.price}
                    </span>
                    {item.originalPrice > item.price && (
                      <span className="text-xs text-slate-400 line-through block">
                        ₹{item.originalPrice}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      removeFromCart(item.productId);
                      showToast('Item removed from cart', 'info');
                    }}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                    title="Remove from Cart"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={onContinueShopping}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
            >
              <span>← Continue Browsing More Notes</span>
            </button>
          </div>
        </div>

        {/* Order Summary & Coupon (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Summary Box */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
            <h2 className="font-black text-slate-900 text-base">Order Summary</h2>

            {/* Coupon Application */}
            <div className="pt-1">
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-indigo-600" />
                <span>Apply Coupon or Discount</span>
              </label>

              {coupon ? (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-emerald-800 font-mono">{coupon.code}</span>
                    <span className="text-emerald-600 block text-[11px]">
                      {coupon.discountType === 'percentage' ? `${coupon.discountValue}% OFF` : `₹${coupon.discountValue} OFF`} applied
                    </span>
                  </div>
                  <button
                    onClick={handleRemoveCoupon}
                    className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    value={couponCodeInput}
                    onChange={e => setCouponCodeInput(e.target.value.toUpperCase())}
                    placeholder="e.g. EXAM2025"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl uppercase font-mono"
                  />
                  <button
                    type="submit"
                    disabled={applyingCoupon}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer shrink-0"
                  >
                    {applyingCoupon ? '...' : 'Apply'}
                  </button>
                </form>
              )}

              <p className="text-[10px] text-slate-400 mt-1.5">
                Tip: Try code <strong>EXAM2025</strong> for 20% off orders over ₹200
              </p>
            </div>

            {/* Pricing Breakdown */}
            <div className="border-t border-slate-200 pt-4 space-y-2 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal ({cart.items.length} items):</span>
                <span className="font-semibold text-slate-900">₹{cart.subtotal.toFixed(2)}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Coupon Discount:</span>
                  <span>-₹{discountAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Delivery & Platform Fee:</span>
                <span className="font-semibold text-emerald-600 uppercase text-[10px]">FREE (Digital)</span>
              </div>

              <div className="border-t border-slate-200 pt-3 flex justify-between items-baseline font-black text-base text-slate-900">
                <span>Total Amount:</span>
                <span className="text-xl font-black text-indigo-600">₹{finalAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Checkout Action Button */}
            <button
              onClick={onProceedToCheckout}
              className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>Proceed to Checkout (₹{finalAmount.toFixed(2)})</span>
            </button>

            {/* Guarantees */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5 text-[11px] text-slate-500">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span>Encrypted 256-bit Razorpay Checkout</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Instant PDF unlocking in your portal</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
