import React from 'react';
import { Star, ShoppingCart, Eye, Heart, Download, BookOpen, Check } from 'lucide-react';
import { Product } from '../types.js';
import { useCart } from '../context/CartContext.js';
import { useWishlist } from '../context/WishlistContext.js';
import { useToast } from '../context/ToastContext.js';

interface ProductCardProps {
  product: Product;
  onViewDetails: (product: Product) => void;
  onPreview: (product: Product) => void;
  onBuyNow: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onViewDetails,
  onPreview,
  onBuyNow
}) => {
  const { addToCart, isInCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { showToast } = useToast();

  const inCart = isInCart(product.id);
  const inWishlist = isInWishlist(product.id);
  const isAvailable = product.availability !== 'unavailable';

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAvailable) {
      showToast('This PDF is currently unavailable for purchase', 'error');
      return;
    }
    const res = addToCart(product);
    showToast(res.message, res.success ? 'success' : 'info');
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWishlist(product);
    showToast(inWishlist ? 'Removed from wishlist' : 'Saved to wishlist!', 'info');
  };

  return (
    <div
      id={`product-card-${product.id}`}
      className="group bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between hover:-translate-y-1 relative"
    >
      {/* Top Cover / Thumbnail Area */}
      <div className="relative aspect-[4/3] sm:aspect-[16/11] bg-slate-100 overflow-hidden cursor-pointer" onClick={() => onViewDetails(product)}>
        <img
          src={product.thumbnail}
          alt={product.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Dark subtle overlay on hover */}
        <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-slate-900/20 transition-colors" />

        {/* Discount Badge */}
        {product.discount > 0 && (
          <div className="absolute top-2.5 left-2.5 bg-rose-600 text-white text-[11px] font-extrabold px-2.5 py-1 rounded-lg shadow-sm">
            {product.discount}% OFF
          </div>
        )}

        {/* Featured / Bestseller Pills */}
        <div className="absolute top-2.5 right-2.5 flex flex-col gap-1 items-end">
          {product.bestseller && (
            <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-md shadow-xs uppercase tracking-wide">
              Bestseller
            </span>
          )}
          {product.featured && (
            <span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs uppercase">
              Featured
            </span>
          )}
        </div>

        {/* Wishlist toggle button */}
        <button
          onClick={handleWishlist}
          className={`absolute bottom-2.5 right-2.5 p-2 rounded-xl backdrop-blur-md transition-all shadow-sm cursor-pointer ${
            inWishlist
              ? 'bg-rose-50 text-rose-600 border border-rose-200'
              : 'bg-white/85 text-slate-700 hover:text-rose-600 hover:bg-white'
          }`}
          title={inWishlist ? 'Remove from wishlist' : 'Save to wishlist'}
          aria-label="Wishlist toggle"
        >
          <Heart className={`w-4 h-4 ${inWishlist ? 'fill-rose-500 text-rose-500' : ''}`} />
        </button>

        {/* Quick Preview Hover Action */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPreview(product);
          }}
          className="absolute bottom-2.5 left-2.5 bg-slate-900/80 hover:bg-slate-900 text-white text-xs font-semibold px-2.5 py-1.5 rounded-xl backdrop-blur-md flex items-center gap-1.5 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          title="Sample Preview"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Preview PDF</span>
        </button>
      </div>

      {/* Content Area */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Category & Rating Bar */}
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md truncate max-w-[140px]">
              {product.categoryName}
            </span>

            <div className="flex items-center gap-1 text-xs">
              <div className="flex items-center text-amber-500">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span className="font-bold ml-1 text-slate-800">{product.rating.toFixed(1)}</span>
              </div>
              <span className="text-slate-400 text-[11px]">({product.purchaseCount.toLocaleString()})</span>
            </div>
          </div>

          {/* Title */}
          <h3
            onClick={() => onViewDetails(product)}
            className="font-bold text-slate-900 text-sm leading-snug line-clamp-2 hover:text-indigo-600 transition-colors cursor-pointer mb-1.5"
            title={product.title}
          >
            {product.title}
          </h3>

          {/* Short Description */}
          <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Footer Meta & Pricing */}
        <div className="pt-2.5 border-t border-slate-100">
          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-2">
            <span>{product.pages} Pages</span>
            <span>{product.fileSize}</span>
            <span className="truncate max-w-[90px]">{product.language}</span>
          </div>

          {/* Price Row */}
          <div className="flex items-baseline justify-between mb-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-extrabold text-slate-900">
                ₹{product.sellingPrice}
              </span>
              {product.originalPrice > product.sellingPrice && (
                <span className="text-xs text-slate-400 line-through">
                  ₹{product.originalPrice}
                </span>
              )}
            </div>

            {!isAvailable && (
              <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                Currently Unavailable
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onViewDetails(product)}
              className="w-full py-2 px-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors text-center cursor-pointer"
            >
              View Details
            </button>

            {isAvailable ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onBuyNow(product);
                }}
                className="w-full py-2 px-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-600/20 rounded-xl transition-all text-center cursor-pointer flex items-center justify-center gap-1"
              >
                Buy Now
              </button>
            ) : (
              <button
                disabled
                className="w-full py-2 px-2 text-xs font-semibold text-slate-400 bg-slate-100 rounded-xl cursor-not-allowed text-center"
              >
                Unavailable
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
