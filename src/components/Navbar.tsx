import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Search,
  ShoppingCart,
  Heart,
  User as UserIcon,
  Menu,
  X,
  ChevronDown,
  BookOpen,
  GraduationCap,
  ShieldCheck,
  LogOut,
  Sliders,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useCart } from '../context/CartContext.js';
import { useWishlist } from '../context/WishlistContext.js';
import { Category } from '../types.js';
import { api } from '../lib/api.js';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string, param?: string) => void;
  onOpenAuth?: (mode?: 'login' | 'register') => void;
  onOpenAuthModal?: (mode?: 'login' | 'register') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate, onOpenAuth, onOpenAuthModal }) => {
  const { user, isAdmin, logout } = useAuth();
  const { itemCount } = useCart();
  const { wishlist } = useWishlist();

  const openAuth = (mode?: 'login' | 'register') => {
    if (onOpenAuth) {
      onOpenAuth(mode);
    } else if (onOpenAuthModal) {
      onOpenAuthModal(mode);
    }
  };

  const [categories, setCategories] = useState<Category[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const categoryRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.getCategories()
      .then(res => setCategories(res?.categories || []))
      .catch(() => setCategories([]));
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) {
        setCategoryDropdownOpen(false);
      }
      if (userRef.current && !userRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onNavigate('all-pdfs', `search=${encodeURIComponent(searchQuery.trim())}`);
      setMobileMenuOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      {/* Top Notification Announcement Bar */}
      <div className="bg-slate-900 text-slate-200 text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="bg-amber-500/20 text-amber-300 font-semibold px-2 py-0.5 rounded text-[11px] border border-amber-500/30">
              NEW 2025-2026 EDITIONS
            </span>
            <span className="hidden sm:inline">Use coupon code <strong className="text-amber-300">FIRSTBUY</strong> for 20% off your digital study materials!</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5 text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Instant DRM-Licensed Downloads</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => { onNavigate('home'); }}
              className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-hidden"
              id="brand-logo-btn"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-700 flex items-center justify-center text-white shadow-md shadow-indigo-600/20 group-hover:scale-105 transition-transform">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-900 block leading-tight">
                  Notes<span className="text-indigo-600">Vidya</span>
                </span>
                <span className="text-[10px] font-semibold text-slate-500 block">
                  Your Digital Library of Knowledge
                </span>
              </div>
            </button>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1 ml-6">
              <button
                onClick={() => onNavigate('home')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  currentView === 'home'
                    ? 'text-indigo-600 bg-indigo-50 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Home
              </button>

              <button
                onClick={() => onNavigate('all-pdfs')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  currentView === 'all-pdfs'
                    ? 'text-indigo-600 bg-indigo-50 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                All PDFs
              </button>

              {/* Categories Dropdown */}
              <div className="relative" ref={categoryRef}>
                <button
                  onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    categoryDropdownOpen ? 'text-indigo-600 bg-indigo-50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                  id="categories-dropdown-btn"
                >
                  <span>Categories</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${categoryDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {categoryDropdownOpen && (
                  <div className="absolute left-0 mt-2 w-80 rounded-2xl bg-white shadow-xl border border-slate-200 p-3 grid grid-cols-2 gap-1 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="col-span-2 px-2 py-1 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1">
                      Browse by Category
                    </div>
                    {(categories || []).map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => {
                          onNavigate('all-pdfs', `category=${cat.id}`);
                          setCategoryDropdownOpen(false);
                        }}
                        className="flex items-center gap-2 p-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors text-left"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span className="truncate">{cat.name}</span>
                      </button>
                    ))}
                    <div className="col-span-2 pt-2 border-t border-slate-100 mt-1">
                      <button
                        onClick={() => {
                          onNavigate('all-pdfs');
                          setCategoryDropdownOpen(false);
                        }}
                        className="w-full text-center text-xs font-semibold text-indigo-600 hover:text-indigo-800 py-1"
                      >
                        View All Categories →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </nav>
          </div>

          {/* Global Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden md:flex flex-1 max-w-md relative items-center mx-4"
          >
            <Search className={`w-4 h-4 absolute left-3.5 transition-colors ${isSearchFocused ? 'text-indigo-600' : 'text-slate-400'}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              placeholder="Search by exam, subject, author (e.g. math, RRB, SSC)..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-100/80 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/15 focus:outline-hidden transition-all text-slate-800 placeholder-slate-400"
              id="global-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </form>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Wishlist Icon */}
            {user && (
              <button
                onClick={() => onNavigate('dashboard', 'wishlist')}
                className="relative p-2 rounded-xl text-slate-600 hover:text-rose-600 hover:bg-slate-100 transition-colors cursor-pointer"
                title="My Wishlist"
                id="wishlist-header-btn"
              >
                <Heart className="w-5 h-5" />
                {wishlist.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {wishlist.length}
                  </span>
                )}
              </button>
            )}

            {/* Cart Icon */}
            <button
              onClick={() => onNavigate('cart')}
              className="relative p-2 rounded-xl text-slate-700 hover:text-indigo-600 hover:bg-slate-100 transition-colors cursor-pointer flex items-center gap-1.5"
              title="Shopping Cart"
              id="cart-header-btn"
            >
              <div className="relative">
                <ShoppingCart className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-indigo-600 text-white text-[10px] font-bold min-w-4 h-4 px-1 rounded-full flex items-center justify-center shadow-xs">
                    {itemCount}
                  </span>
                )}
              </div>
              <span className="hidden xl:inline text-xs font-semibold text-slate-700">Cart</span>
            </button>

            {/* Admin Switcher badge (if admin) */}
            {isAdmin && (
              <button
                onClick={() => onNavigate('admin')}
                className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  currentView === 'admin'
                    ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30'
                    : 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100'
                }`}
                id="admin-workspace-btn"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Admin Panel</span>
              </button>
            )}

            {/* User Account / Login Button */}
            {user ? (
              <div className="relative" ref={userRef}>
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer"
                  id="user-menu-btn"
                >
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden md:inline text-xs font-semibold text-slate-800 max-w-[100px] truncate">
                    {user.name.split(' ')[0]}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-4 py-2.5 border-b border-slate-100">
                      <p className="text-xs font-semibold text-slate-900 truncate">{user.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                      <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 uppercase">
                        {user.role}
                      </span>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => { onNavigate('dashboard', 'overview'); setUserDropdownOpen(false); }}
                        className="w-full px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-indigo-600 flex items-center gap-2.5 text-left"
                      >
                        <UserIcon className="w-4 h-4 text-slate-400" />
                        <span>My Dashboard</span>
                      </button>

                      <button
                        onClick={() => { onNavigate('dashboard', 'purchased'); setUserDropdownOpen(false); }}
                        className="w-full px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-indigo-600 flex items-center gap-2.5 text-left font-medium"
                      >
                        <FileText className="w-4 h-4 text-emerald-500" />
                        <span>Purchased PDFs & Library</span>
                      </button>

                      <button
                        onClick={() => { onNavigate('dashboard', 'orders'); setUserDropdownOpen(false); }}
                        className="w-full px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-indigo-600 flex items-center gap-2.5 text-left"
                      >
                        <BookOpen className="w-4 h-4 text-slate-400" />
                        <span>My Orders</span>
                      </button>

                      {isAdmin && (
                        <button
                          onClick={() => { onNavigate('admin'); setUserDropdownOpen(false); }}
                          className="w-full px-4 py-2 text-xs text-purple-700 hover:bg-purple-50 flex items-center gap-2.5 text-left font-semibold"
                        >
                          <Sliders className="w-4 h-4 text-purple-600" />
                          <span>Admin Control Center</span>
                        </button>
                      )}
                    </div>

                    <div className="pt-1 border-t border-slate-100">
                      <button
                        onClick={() => { logout(); setUserDropdownOpen(false); onNavigate('home'); }}
                        className="w-full px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openAuth('login')}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-indigo-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  id="nav-login-btn"
                >
                  Log In
                </button>
                <button
                  onClick={() => openAuth('register')}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-600/20 transition-all cursor-pointer"
                  id="nav-register-btn"
                >
                  Register
                </button>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Toggle Navigation Menu"
              id="mobile-menu-toggle"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-4 max-h-[85vh] overflow-y-auto">
          {/* Mobile Search */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search exam notes, questions, authors..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-100 rounded-xl border border-slate-200"
            />
          </form>

          {/* Navigation Links */}
          <div className="flex flex-col gap-1">
            <button
              onClick={() => { onNavigate('home'); setMobileMenuOpen(false); }}
              className="text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Home
            </button>
            <button
              onClick={() => { onNavigate('all-pdfs'); setMobileMenuOpen(false); }}
              className="text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              All PDFs & Study Materials
            </button>
            {user && (
              <>
                <button
                  onClick={() => { onNavigate('dashboard', 'purchased'); setMobileMenuOpen(false); }}
                  className="text-left px-3 py-2 rounded-lg text-sm font-semibold text-emerald-700 bg-emerald-50 flex items-center justify-between"
                >
                  <span>My Purchased PDFs</span>
                  <ShieldCheck className="w-4 h-4" />
                </button>
                <button
                  onClick={() => { onNavigate('dashboard', 'orders'); setMobileMenuOpen(false); }}
                  className="text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  My Orders
                </button>
              </>
            )}
            {isAdmin && (
              <button
                onClick={() => { onNavigate('admin'); setMobileMenuOpen(false); }}
                className="text-left px-3 py-2 rounded-lg text-sm font-bold text-purple-700 bg-purple-50"
              >
                Admin Control Center
              </button>
            )}
          </div>

          {/* Popular Categories Grid on Mobile */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
              Popular Categories
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {(categories || []).slice(0, 8).map(cat => (
                <button
                  key={cat.id}
                  onClick={() => {
                    onNavigate('all-pdfs', `category=${cat.id}`);
                    setMobileMenuOpen(false);
                  }}
                  className="text-left p-2 rounded-lg bg-slate-50 text-xs font-medium text-slate-700 truncate hover:bg-indigo-50 hover:text-indigo-600"
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Auth State on Mobile */}
          <div className="pt-2 border-t border-slate-100">
            {user ? (
              <div className="flex items-center justify-between">
                <div className="text-xs">
                  <p className="font-bold text-slate-800">{user.name}</p>
                  <p className="text-slate-500">{user.email}</p>
                </div>
                <button
                  onClick={() => { logout(); setMobileMenuOpen(false); }}
                  className="text-xs font-bold text-rose-600 px-3 py-1.5 rounded-lg border border-rose-200"
                >
                  Log Out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => { openAuth('login'); setMobileMenuOpen(false); }}
                  className="w-full py-2 text-center text-xs font-semibold text-slate-700 bg-slate-100 rounded-xl"
                >
                  Log In
                </button>
                <button
                  onClick={() => { openAuth('register'); setMobileMenuOpen(false); }}
                  className="w-full py-2 text-center text-xs font-semibold text-white bg-indigo-600 rounded-xl"
                >
                  Create Account
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
