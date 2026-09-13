import React, { useState, useEffect } from 'react';
import {
  Star,
  ShoppingCart,
  Eye,
  Heart,
  Lock,
  Download,
  BookOpen,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Globe,
  HardDrive,
  User,
  Share2,
  MessageSquare,
  ArrowRight
} from 'lucide-react';
import { Product, Review } from '../types.js';
import { useCart } from '../context/CartContext.js';
import { useWishlist } from '../context/WishlistContext.js';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { api } from '../lib/api.js';

interface ProductDetailPageProps {
  productId: string;
  onPreviewProduct: (product: Product) => void;
  onBuyNow: (product: Product) => void;
  onViewProduct: (product: Product) => void;
  onBackToProducts: () => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  productId,
  onPreviewProduct,
  onBuyNow,
  onViewProduct,
  onBackToProducts
}) => {
  const { user } = useAuth();
  const { addToCart, isInCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { showToast } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'syllabus' | 'reviews'>('overview');

  // Review submission form
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    loadProductDetails();
  }, [productId]);

  const loadProductDetails = async () => {
    setLoading(true);
    try {
      const res = await api.getProduct(productId);
      setProduct(res.product);
      setReviews(res.reviews || []);

      // Load related products in the same category
      if (res.product?.categoryId) {
        const catRes = await api.getProducts({ category: res.product.categoryId, limit: 4 });
        setRelatedProducts((catRes.products || []).filter(p => p.id !== res.product.id));
      }
    } catch (err: any) {
      showToast(err.message || 'Product not found', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    if (product.availability === 'unavailable') {
      showToast('This product is currently unavailable', 'error');
      return;
    }
    const res = addToCart(product);
    showToast(res.message, res.success ? 'success' : 'info');
  };

  const handleWishlist = () => {
    if (!product) return;
    toggleWishlist(product);
    showToast(isInWishlist(product.id) ? 'Removed from wishlist' : 'Added to wishlist!', 'info');
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    if (!user) {
      showToast('Please sign in to submit a review', 'error');
      return;
    }
    if (!newComment.trim()) {
      showToast('Please enter your review text', 'error');
      return;
    }

    setSubmittingReview(true);
    try {
      const res = await api.submitReview(product.id, newRating, newComment.trim());
      showToast(res.message, 'success');
      setNewComment('');
      // Reload reviews
      const updated = await api.getProduct(product.id);
      setReviews(updated.reviews || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to submit review', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500 mt-4">Loading study document details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900">PDF Study Material Not Found</h2>
        <p className="text-xs text-slate-500">The requested PDF document could not be located or has been archived.</p>
        <button
          onClick={onBackToProducts}
          className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl"
        >
          Return to PDF Catalog
        </button>
      </div>
    );
  }

  const inCart = isInCart(product.id);
  const inWish = isInWishlist(product.id);
  const isAvailable = product.availability !== 'unavailable';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <button onClick={onBackToProducts} className="hover:text-indigo-600">Home</button>
        <span>/</span>
        <button onClick={onBackToProducts} className="hover:text-indigo-600">All PDFs</button>
        <span>/</span>
        <span className="text-slate-700 font-semibold truncate max-w-xs">{product.title}</span>
      </div>

      {/* Main Product Presentation Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        
        {/* Left Column: Cover Image & Preview Trigger (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="relative rounded-3xl overflow-hidden border border-slate-200 shadow-md bg-slate-100 aspect-[4/5]">
            <img
              src={product.thumbnail}
              alt={product.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />

            {/* Discount Badge */}
            {product.discount > 0 && (
              <div className="absolute top-4 left-4 bg-rose-600 text-white text-xs font-black px-3 py-1.5 rounded-xl shadow-md">
                {product.discount}% DISCOUNT
              </div>
            )}

            {/* Wishlist toggle */}
            <button
              onClick={handleWishlist}
              className={`absolute top-4 right-4 p-2.5 rounded-2xl backdrop-blur-md transition-all shadow-md ${
                inWish
                  ? 'bg-rose-50 text-rose-600 border border-rose-200'
                  : 'bg-white/80 text-slate-700 hover:text-rose-600'
              }`}
              title={inWish ? 'Remove from wishlist' : 'Save to wishlist'}
            >
              <Heart className={`w-5 h-5 ${inWish ? 'fill-rose-500 text-rose-500' : ''}`} />
            </button>

            {/* Watermark Protection overlay notice */}
            <div className="absolute bottom-4 left-4 right-4 p-3 rounded-2xl bg-slate-900/85 backdrop-blur-md text-white text-[11px] flex items-center justify-between border border-slate-700/60">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Licensed Watermarked PDF Document</span>
              </div>
              <span className="font-mono text-slate-400">{product.fileSize}</span>
            </div>
          </div>

          {/* Preview Trigger Bar */}
          <button
            onClick={() => onPreviewProduct(product)}
            className="w-full py-3 px-4 rounded-2xl border-2 border-indigo-600 text-indigo-700 hover:bg-indigo-50 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
          >
            <Eye className="w-4 h-4" />
            <span>Preview Sample Excerpt Pages</span>
          </button>
        </div>

        {/* Right Column: Title, Metadata, Pricing, Actions (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            
            {/* Category & Status Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                {product.categoryName}
              </span>

              {product.bestseller && (
                <span className="text-xs font-black uppercase text-amber-900 bg-amber-200/80 px-2.5 py-1 rounded-lg">
                  Bestseller
                </span>
              )}

              {product.featured && (
                <span className="text-xs font-bold uppercase text-indigo-900 bg-indigo-200/60 px-2.5 py-1 rounded-lg">
                  Editor's Choice
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
              {product.title}
            </h1>

            {/* Author, Rating & Purchase Count */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
              <div className="flex items-center gap-1 text-slate-700">
                <User className="w-4 h-4 text-indigo-600" />
                <span>Author: <strong>{product.author}</strong></span>
              </div>

              <div className="flex items-center gap-1.5 text-amber-500">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
                    />
                  ))}
                </div>
                <span className="font-bold text-slate-800">{product.rating.toFixed(1)}</span>
                <span className="text-slate-400">({product.reviewsCount} customer reviews)</span>
              </div>

              <div className="flex items-center gap-1 text-slate-700">
                <Download className="w-4 h-4 text-emerald-600" />
                <span><strong>{product.purchaseCount.toLocaleString()}</strong> successful downloads</span>
              </div>
            </div>

            {/* Short Description */}
            <p className="text-sm text-slate-600 leading-relaxed pt-1">
              {product.description}
            </p>

            {/* Technical Specifications Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Pages</span>
                <strong className="text-slate-900 block mt-0.5">{product.pages} Pages</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">File Size</span>
                <strong className="text-slate-900 block mt-0.5">{product.fileSize}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Language</span>
                <strong className="text-slate-900 block mt-0.5">{product.language}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Format</span>
                <strong className="text-slate-900 block mt-0.5">High-Res PDF</strong>
              </div>
            </div>

            {/* Pricing Section */}
            <div className="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Limited Time Student Offer
                </span>
                <div className="flex items-baseline gap-3 mt-1">
                  <span className="text-3xl font-black text-slate-900">
                    ₹{product.sellingPrice}
                  </span>
                  {product.originalPrice > product.sellingPrice && (
                    <span className="text-sm text-slate-400 line-through">
                      ₹{product.originalPrice}
                    </span>
                  )}
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    You save ₹{product.originalPrice - product.sellingPrice} ({product.discount}%)
                  </span>
                </div>
              </div>

              {!isAvailable && (
                <span className="text-xs font-bold text-rose-700 bg-rose-100 px-3 py-1 rounded-lg">
                  Currently Unavailable
                </span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleAddToCart}
                disabled={!isAvailable}
                className={`py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm border transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                  !isAvailable
                    ? 'border-slate-200 text-slate-400 cursor-not-allowed'
                    : inCart
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                    : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <ShoppingCart className="w-4 h-4" />
                <span>{inCart ? 'Already In Cart' : 'Add to Cart'}</span>
              </button>

              <button
                onClick={() => onBuyNow(product)}
                disabled={!isAvailable}
                className={`py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm text-white shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  !isAvailable
                    ? 'bg-slate-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/30'
                }`}
              >
                <Lock className="w-4 h-4" />
                <span>Instant Buy Now</span>
              </button>
            </div>

            {/* Trust Assurance Strip */}
            <div className="grid grid-cols-3 gap-2 pt-3 border-t text-[11px] text-slate-500">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Lifetime Re-downloads</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                <span>Encrypted Razorpay Checkout</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-blue-500" />
                <span>Phone / Tablet / PC</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section: Overview, Syllabus / Table of Contents, Verified Reviews */}
      <div className="border-t border-slate-200 pt-8">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
              activeTab === 'overview' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Detailed Overview
          </button>
          <button
            onClick={() => setActiveTab('syllabus')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
              activeTab === 'syllabus' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Syllabus & Chapters Index
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
              activeTab === 'reviews' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Customer Reviews ({reviews.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="py-6">
          {activeTab === 'overview' && (
            <div className="prose prose-slate max-w-none text-sm text-slate-700 leading-relaxed space-y-4">
              <p>{product.fullDescription || product.description}</p>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <h4 className="font-bold text-slate-900 mb-2">Key Highlights of this Study Material:</h4>
                <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-600">
                  <li>Comprehensive syllabus coverage with zero unnecessary theory filler</li>
                  <li>Formulas and shortcut methods verified against recent question shift patterns</li>
                  <li>High-resolution diagram illustrations suitable for phone and tablet viewing</li>
                  <li>Tagged with exam-specific marks weightage indicators</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'syllabus' && (
            <div className="space-y-4 text-xs sm:text-sm text-slate-700">
              <p className="text-slate-500">
                This document is structured into modular units designed for efficient rapid revision:
              </p>
              <div className="divide-y divide-slate-200 border rounded-2xl overflow-hidden bg-white">
                <div className="p-4 bg-slate-50 font-bold text-slate-900 flex justify-between">
                  <span>Chapter 1: Foundational Framework & Analytical Principles</span>
                  <span className="text-xs text-slate-500 font-normal">Pages 1 – 48</span>
                </div>
                <div className="p-4 font-bold text-slate-900 flex justify-between">
                  <span>Chapter 2: High-Yield Topic Derivations & Core Formulations</span>
                  <span className="text-xs text-slate-500 font-normal">Pages 49 – 125</span>
                </div>
                <div className="p-4 bg-slate-50 font-bold text-slate-900 flex justify-between">
                  <span>Chapter 3: Previous 10 Years Questions with Step-by-Step Solutions</span>
                  <span className="text-xs text-slate-500 font-normal">Pages 126 – 210</span>
                </div>
                <div className="p-4 font-bold text-slate-900 flex justify-between">
                  <span>Chapter 4: Speed Formula Sheet & Mock Practice Question Sets</span>
                  <span className="text-xs text-slate-500 font-normal">Pages 211 – {product.pages}</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-8">
              {/* Existing Reviews List */}
              <div className="space-y-4">
                <h3 className="font-bold text-slate-900 text-sm">Verified Purchaser Feedback</h3>
                {reviews.length === 0 ? (
                  <p className="text-xs text-slate-500">No reviews yet. Be the first to review after purchasing!</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {reviews.map(rev => (
                      <div key={rev.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-900">{rev.userName}</span>
                          <div className="flex items-center text-amber-400">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`w-3.5 h-3.5 ${i < rev.rating ? 'fill-amber-400' : 'text-slate-300'}`} />
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">{rev.comment}</p>
                        <span className="text-[10px] text-slate-400 block">{new Date(rev.createdAt).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Review Form */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 max-w-xl space-y-4 shadow-xs">
                <h3 className="font-bold text-slate-900 text-sm">Submit a Product Review</h3>
                <form onSubmit={handleSubmitReview} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Star Rating</label>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => setNewRating(star)}
                          className="p-1 text-amber-400 hover:scale-110 transition-transform cursor-pointer"
                        >
                          <Star className={`w-5 h-5 ${star <= newRating ? 'fill-amber-400' : 'text-slate-300'}`} />
                        </button>
                      ))}
                      <span className="text-xs font-bold text-slate-700 ml-2">{newRating} of 5 stars</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Your Review</label>
                    <textarea
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      placeholder="Share your feedback on the content quality, solutions, and layout..."
                      rows={3}
                      className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
                  >
                    {submittingReview ? 'Submitting...' : 'Post Review'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <div className="border-t border-slate-200 pt-10 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Similar Study Materials in {product.categoryName}</h3>
              <p className="text-xs text-slate-500 mt-0.5">Students preparing for this subject also downloaded these PDFs</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map(p => (
              <div
                key={p.id}
                onClick={() => onViewProduct(p)}
                className="bg-white rounded-2xl border border-slate-200 p-4 hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <img
                    src={p.thumbnail}
                    alt={p.title}
                    referrerPolicy="no-referrer"
                    className="w-full aspect-[4/3] rounded-xl object-cover mb-3"
                  />
                  <h4 className="font-bold text-xs text-slate-900 line-clamp-2">{p.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-1">{p.pages} Pages • {p.author}</p>
                </div>
                <div className="pt-3 border-t mt-3 flex justify-between items-center">
                  <span className="font-extrabold text-sm text-slate-900">₹{p.sellingPrice}</span>
                  <span className="text-xs font-bold text-indigo-600 hover:underline">View PDF →</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
