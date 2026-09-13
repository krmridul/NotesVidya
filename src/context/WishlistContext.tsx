import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '../types.js';
import { useAuth } from './AuthContext.js';
import { api } from '../lib/api.js';

interface WishlistContextType {
  wishlist: Product[];
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (product: Product) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState<Product[]>([]);

  useEffect(() => {
    async function loadWishlist() {
      if (!user) {
        setWishlist([]);
        return;
      }
      try {
        const res = await api.getMyWishlist();
        if (res && Array.isArray(res.wishlist)) {
          setWishlist(res.wishlist.map((w: any) => w.product || w).filter(Boolean));
        } else {
          setWishlist([]);
        }
      } catch (err) {
        console.error('Failed to load wishlist', err);
        setWishlist([]);
      }
    }
    loadWishlist();
  }, [user]);

  const isInWishlist = (productId: string) => {
    return wishlist.some(p => p.id === productId);
  };

  const toggleWishlist = async (product: Product) => {
    if (!user) return;
    if (isInWishlist(product.id)) {
      await removeFromWishlist(product.id);
    } else {
      try {
        await api.addToWishlist(product.id);
        setWishlist(prev => [...prev, product]);
      } catch (err) {
        console.error('Failed to add to wishlist', err);
      }
    }
  };

  const removeFromWishlist = async (productId: string) => {
    if (!user) return;
    try {
      await api.removeFromWishlist(productId);
      setWishlist(prev => prev.filter(p => p.id !== productId));
    } catch (err) {
      console.error('Failed to remove from wishlist', err);
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        isInWishlist,
        toggleWishlist,
        removeFromWishlist
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
