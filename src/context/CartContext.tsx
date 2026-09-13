import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '../types.js';
import { api } from '../lib/api.js';

export interface CartItemFormatted {
  productId: string;
  product: Product;
  title: string;
  thumbnail: string;
  price: number;
  pages: number;
  author: string;
}

export interface CartObject {
  items: CartItemFormatted[];
  itemCount: number;
  subtotal: number;
  total: number;
}

export interface CartContextType {
  cart: CartObject;
  items: Product[];
  itemCount: number;
  subtotal: number;
  coupon: string | null;
  couponCode: string | null;
  couponDiscount: number;
  discountAmount: number;
  finalTotal: number;
  finalAmount: number;
  appliedCouponMessage: string | null;
  addToCart: (product: Product) => { success: boolean; message: string };
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  isInCart: (productId: string) => boolean;
  applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('dps_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [couponCode, setCouponCode] = useState<string | null>(() => localStorage.getItem('dps_coupon'));
  const [couponDiscount, setCouponDiscount] = useState<number>(0);
  const [appliedCouponMessage, setAppliedCouponMessage] = useState<string | null>(null);

  // Sync cart to localStorage
  useEffect(() => {
    localStorage.setItem('dps_cart', JSON.stringify(items));
  }, [items]);

  const subtotal = items.reduce((sum, item) => sum + item.sellingPrice, 0);

  // Validate coupon whenever subtotal changes or coupon code is present
  useEffect(() => {
    async function revalidateCoupon() {
      if (!couponCode || items.length === 0) {
        setCouponDiscount(0);
        setAppliedCouponMessage(null);
        return;
      }

      try {
        const res = await api.validateCoupon(couponCode, subtotal);
        if (res.valid) {
          setCouponDiscount(res.discountAmount);
          setAppliedCouponMessage(res.message);
        } else {
          setCouponDiscount(0);
          setCouponCode(null);
          localStorage.removeItem('dps_coupon');
        }
      } catch {
        setCouponDiscount(0);
        setCouponCode(null);
        localStorage.removeItem('dps_coupon');
      }
    }

    revalidateCoupon();
  }, [couponCode, subtotal, items.length]);

  const finalTotal = Math.max(0, Number((subtotal - couponDiscount).toFixed(2)));

  const addToCart = (product: Product) => {
    if (items.some(i => i.id === product.id)) {
      return { success: false, message: `"${product.title}" is already in your cart.` };
    }
    setItems(prev => [...prev, product]);
    return { success: true, message: `Added "${product.title}" to cart!` };
  };

  const removeFromCart = (productId: string) => {
    setItems(prev => prev.filter(i => i.id !== productId));
  };

  const clearCart = () => {
    setItems([]);
    setCouponCode(null);
    setCouponDiscount(0);
    setAppliedCouponMessage(null);
    localStorage.removeItem('dps_cart');
    localStorage.removeItem('dps_coupon');
  };

  const isInCart = (productId: string) => {
    return items.some(i => i.id === productId);
  };

  const applyCoupon = async (code: string) => {
    try {
      const res = await api.validateCoupon(code, subtotal);
      if (res.valid) {
        setCouponCode(res.code);
        setCouponDiscount(res.discountAmount);
        setAppliedCouponMessage(res.message);
        localStorage.setItem('dps_coupon', res.code);
        return { success: true, message: res.message };
      }
      return { success: false, message: 'Invalid coupon' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to apply coupon' };
    }
  };

  const removeCoupon = () => {
    setCouponCode(null);
    setCouponDiscount(0);
    setAppliedCouponMessage(null);
    localStorage.removeItem('dps_coupon');
  };

  const cartItems: CartItemFormatted[] = (items || []).map(p => ({
    productId: p.id,
    product: p,
    title: p.title,
    thumbnail: p.thumbnail,
    price: p.sellingPrice,
    pages: p.pages,
    author: p.author
  }));

  const cart: CartObject = {
    items: cartItems,
    itemCount: cartItems.length,
    subtotal,
    total: finalTotal
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        items,
        itemCount: items.length,
        subtotal,
        coupon: couponCode,
        couponCode,
        couponDiscount,
        discountAmount: couponDiscount,
        finalTotal,
        finalAmount: finalTotal,
        appliedCouponMessage,
        addToCart,
        removeFromCart,
        clearCart,
        isInCart,
        applyCoupon,
        removeCoupon
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
