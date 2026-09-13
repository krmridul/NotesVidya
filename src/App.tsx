import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { CartProvider, useCart } from './context/CartContext.js';
import { WishlistProvider } from './context/WishlistContext.js';
import { ToastProvider, useToast } from './context/ToastContext.js';

import { Navbar } from './components/Navbar.js';
import { Footer } from './components/Footer.js';
import { HomePage } from './components/HomePage.js';
import { AllPdfsPage } from './components/AllPdfsPage.js';
import { ProductDetailPage } from './components/ProductDetailPage.js';
import { CartPage } from './components/CartPage.js';
import { CheckoutPage } from './components/CheckoutPage.js';
import { OrderSuccessPage } from './components/OrderSuccessPage.js';
import { CustomerDashboard } from './components/CustomerDashboard.js';
import { AdminPanel } from './components/AdminPanel.js';
import { StaticPages } from './components/StaticPages.js';

import { AuthModal } from './components/AuthModal.js';
import { PdfPreviewModal } from './components/PdfPreviewModal.js';
import { SecurePdfViewerModal } from './components/SecurePdfViewerModal.js';

import { Product, Order } from './types.js';

const MainAppContent: React.FC = () => {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { showToast } = useToast();

  // Navigation state
  const [currentView, setCurrentView] = useState<string>('home');
  const [viewParam, setViewParam] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [dashboardTab, setDashboardTab] = useState<'purchased-pdfs' | 'orders' | 'profile'>('purchased-pdfs');

  // Global modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | 'admin-setup'>('login');
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);
  const [secureReadingProduct, setSecureReadingProduct] = useState<{ id: string; title: string } | null>(null);

  const handleOpenAuth = (mode: 'login' | 'register' | 'admin-setup' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  // Scroll to top on navigation
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentView, selectedProduct]);

  const handleNavigate = (view: string, param?: string) => {
    if (view === 'orders') {
      if (!user) {
        handleOpenAuth('login');
        showToast('Please sign in to view your orders', 'info');
        return;
      }
      setDashboardTab('orders');
      setCurrentView('dashboard');
      return;
    }

    if (view === 'my-account') {
      if (!user) {
        handleOpenAuth('login');
        showToast('Please sign in to access your account', 'info');
        return;
      }
      setDashboardTab('purchased-pdfs');
      setCurrentView('dashboard');
      return;
    }

    setViewParam(param || '');
    setCurrentView(view);
  };

  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product);
    setCurrentView('product-detail');
  };

  const handleBuyNow = (product: Product) => {
    addToCart(product);
    setCurrentView('checkout');
  };

  const handleOrderSuccess = (order: Order) => {
    setCompletedOrder(order);
    setCurrentView('order-success');
  };

  // If in Admin View, show full-screen admin control center
  if (currentView === 'admin') {
    return (
      <AdminPanel
        onBackToStore={() => setCurrentView('home')}
      />
    );
  }

  // Parse any query params passed to all-pdfs
  let initialSearch = '';
  let initialCategory = '';
  let initialSort = 'latest';

  if (currentView === 'all-pdfs' && viewParam) {
    const params = new URLSearchParams(viewParam);
    initialSearch = params.get('search') || '';
    initialCategory = params.get('category') || '';
    if (params.get('bestseller') === 'true') initialSort = 'popularity';
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 antialiased selection:bg-indigo-500 selection:text-white">
      
      {/* Sticky Top Navigation Bar */}
      <Navbar
        onNavigate={handleNavigate}
        onOpenAuth={handleOpenAuth}
        onOpenAuthModal={handleOpenAuth}
        currentView={currentView}
      />

      {/* Main Routed Content Area */}
      <main className="flex-1">
        {currentView === 'home' && (
          <HomePage
            onNavigate={handleNavigate}
            onPreviewProduct={p => setPreviewProduct(p)}
            onViewProduct={handleViewProduct}
            onBuyNow={handleBuyNow}
          />
        )}

        {currentView === 'all-pdfs' && (
          <AllPdfsPage
            initialSearch={initialSearch}
            initialCategory={initialCategory}
            initialSort={initialSort}
            onViewProduct={handleViewProduct}
            onPreviewProduct={p => setPreviewProduct(p)}
            onBuyNow={handleBuyNow}
          />
        )}

        {currentView === 'product-detail' && selectedProduct && (
          <ProductDetailPage
            productId={selectedProduct.id}
            onPreviewProduct={p => setPreviewProduct(p)}
            onBuyNow={handleBuyNow}
            onViewProduct={handleViewProduct}
            onBackToProducts={() => handleNavigate('all-pdfs')}
          />
        )}

        {currentView === 'cart' && (
          <CartPage
            onProceedToCheckout={() => handleNavigate('checkout')}
            onContinueShopping={() => handleNavigate('all-pdfs')}
            onViewProduct={handleViewProduct}
          />
        )}

        {currentView === 'checkout' && (
          <CheckoutPage
            onOrderSuccess={handleOrderSuccess}
            onBackToCart={() => handleNavigate('cart')}
          />
        )}

        {currentView === 'order-success' && completedOrder && (
          <OrderSuccessPage
            order={completedOrder}
            onGoToDashboard={() => {
              setDashboardTab('purchased-pdfs');
              handleNavigate('dashboard');
            }}
            onContinueShopping={() => handleNavigate('all-pdfs')}
          />
        )}

        {currentView === 'dashboard' && (
          <CustomerDashboard
            initialTab={dashboardTab}
            onOpenViewer={(product) => setSecureReadingProduct({ id: product.id, title: product.title })}
            onViewProduct={handleViewProduct}
            onNavigate={handleNavigate}
          />
        )}

        {['about', 'contact', 'faq', 'privacy', 'terms', 'refund', 'disclaimer'].includes(currentView) && (
          <StaticPages
            pageType={currentView as any}
            onNavigate={handleNavigate}
          />
        )}
      </main>

      {/* Global Modals */}
      {isAuthModalOpen && (
        <AuthModal
          initialMode={authModalMode}
          onClose={() => setIsAuthModalOpen(false)}
          onSuccess={() => {
            setCurrentView('dashboard');
          }}
        />
      )}

      {previewProduct && (
        <PdfPreviewModal
          product={previewProduct}
          onClose={() => setPreviewProduct(null)}
          onBuyNow={p => {
            setPreviewProduct(null);
            handleBuyNow(p);
          }}
        />
      )}

      {secureReadingProduct && (
        <SecurePdfViewerModal
          productId={secureReadingProduct.id}
          productTitle={secureReadingProduct.title}
          onClose={() => setSecureReadingProduct(null)}
        />
      )}

      {/* Footer */}
      <Footer onNavigate={handleNavigate} onOpenAuth={() => handleOpenAuth('login')} />
    </div>
  );
};

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <MainAppContent />
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
