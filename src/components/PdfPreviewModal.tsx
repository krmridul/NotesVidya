import React, { useState } from 'react';
import { X, Lock, ShieldAlert, ChevronLeft, ChevronRight, ShoppingCart, Check, BookOpen, AlertTriangle } from 'lucide-react';
import { Product } from '../types.js';
import { useCart } from '../context/CartContext.js';
import { useToast } from '../context/ToastContext.js';

interface PdfPreviewModalProps {
  product: Product;
  onClose: () => void;
  onBuyNow: (product: Product) => void;
}

export const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({
  product,
  onClose,
  onBuyNow
}) => {
  const { addToCart, isInCart } = useCart();
  const { showToast } = useToast();
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  const samples = product.previewSamplePages || [];
  const currentSample = samples[currentPageIndex] || {
    pageNumber: 1,
    title: 'Sample Excerpt',
    excerpt: 'Key formulas and introductory concepts are detailed in this sample excerpt.',
    watermarkNotice: 'PREVIEW COPY - NOTESVIDYA'
  };

  const inCart = isInCart(product.id);

  const handleAddToCart = () => {
    const res = addToCart(product);
    showToast(res.message, res.success ? 'success' : 'info');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center border border-amber-500/20">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded uppercase">
                  Protected Sample Preview
                </span>
                <span className="text-xs text-slate-500">
                  Showing sample page {currentPageIndex + 1} of {Math.max(1, samples.length)}
                </span>
              </div>
              <h2 className="font-bold text-slate-900 text-sm sm:text-base line-clamp-1 mt-0.5">
                {product.title}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            aria-label="Close preview"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Security / Watermark Disclaimer Notice */}
        <div className="bg-amber-50 border-b border-amber-200/60 px-4 py-2 flex items-center gap-2 text-xs text-amber-800">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Anti-Piracy Protected:</strong> This preview is limited to sample excerpts. Complete {product.pages}-page paid PDF with high-resolution diagrams & solutions is delivered securely after verified checkout.
          </span>
        </div>

        {/* PDF Reader Canvas Simulator */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-200/60 flex flex-col items-center justify-center">
          <div className="bg-white rounded-xl shadow-md border border-slate-300 w-full max-w-xl min-h-[420px] p-6 sm:p-10 flex flex-col justify-between relative overflow-hidden select-none">
            
            {/* Watermark Diagonal Overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-10 rotate-[-30deg]">
              <span className="text-4xl sm:text-5xl font-black text-slate-900 uppercase tracking-widest text-center">
                NOTESVIDYA<br />SAMPLE PREVIEW ONLY
              </span>
            </div>

            {/* Document Header in Reader */}
            <div className="border-b pb-4 mb-4 relative z-10">
              <div className="flex justify-between items-center text-xs text-slate-400 uppercase font-semibold tracking-wider">
                <span>{product.categoryName}</span>
                <span>Page {currentSample.pageNumber} / {product.pages}</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mt-2">
                {currentSample.title}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Author: {product.author} | Language: {product.language}
              </p>
            </div>

            {/* Excerpt Body */}
            <div className="space-y-4 text-slate-800 text-sm sm:text-base leading-relaxed relative z-10 flex-1">
              <p className="p-4 bg-slate-50 rounded-xl border border-slate-100 font-mono text-xs sm:text-sm text-slate-700">
                {currentSample.excerpt}
              </p>

              <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 text-xs sm:text-sm text-indigo-900 space-y-2">
                <p className="font-semibold flex items-center gap-1.5 text-indigo-800">
                  <BookOpen className="w-4 h-4" />
                  What is included in the full paid PDF:
                </p>
                <ul className="list-disc list-inside space-y-1 text-xs text-indigo-700">
                  <li>Complete {product.pages} pages with all modules & chapters</li>
                  <li>Step-by-step solved questions with shortcut hacks</li>
                  <li>High-resolution formula cheat sheets & mindmaps</li>
                  <li>Personalized DRM license with your name & order number</li>
                  <li>Lifetime access & unlimited re-downloads from your dashboard</li>
                </ul>
              </div>
            </div>

            {/* Document Footer Notice */}
            <div className="pt-4 border-t border-dashed border-slate-200 mt-6 relative z-10 flex items-center justify-between text-[11px] text-slate-400">
              <span>{currentSample.watermarkNotice}</span>
              <span>File Size: {product.fileSize}</span>
            </div>
          </div>

          {/* Sample Pagination Controls */}
          {samples.length > 1 && (
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={() => setCurrentPageIndex(prev => Math.max(0, prev - 1))}
                disabled={currentPageIndex === 0}
                className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Previous Sample
              </button>
              <span className="text-xs font-semibold text-slate-600">
                {currentPageIndex + 1} of {samples.length}
              </span>
              <button
                onClick={() => setCurrentPageIndex(prev => Math.min(samples.length - 1, prev + 1))}
                disabled={currentPageIndex === samples.length - 1}
                className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 flex items-center gap-1 cursor-pointer"
              >
                Next Sample <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">
              ₹{product.sellingPrice}
            </span>
            {product.originalPrice > product.sellingPrice && (
              <span className="text-sm text-slate-400 line-through">
                ₹{product.originalPrice}
              </span>
            )}
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
              {product.discount}% Discount
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleAddToCart}
              className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-semibold border transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                inCart
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                  : 'border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {inCart ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Added to Cart</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4" />
                  <span>Add to Cart</span>
                </>
              )}
            </button>

            <button
              onClick={() => {
                onClose();
                onBuyNow(product);
              }}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition-all text-center cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Unlock Full PDF - Buy Now</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
