import React, { useState, useEffect } from 'react';
import { Search, Filter, SlidersHorizontal, BookOpen, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { Product, Category } from '../types.js';
import { ProductCard } from './ProductCard.js';
import { api } from '../lib/api.js';

interface AllPdfsPageProps {
  initialSearch?: string;
  initialCategory?: string;
  initialSort?: string;
  onViewProduct: (product: Product) => void;
  onPreviewProduct: (product: Product) => void;
  onBuyNow: (product: Product) => void;
}

export const AllPdfsPage: React.FC<AllPdfsPageProps> = ({
  initialSearch = '',
  initialCategory = '',
  initialSort = 'latest',
  onViewProduct,
  onPreviewProduct,
  onBuyNow
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search states
  const [search, setSearch] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [sort, setSort] = useState(initialSort);
  const [priceRange, setPriceRange] = useState<number>(1000);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Mobile filters toggle
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  useEffect(() => {
    api.getCategories().then(res => setCategories(res.categories || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (initialSearch !== undefined) setSearch(initialSearch);
    if (initialCategory !== undefined) setSelectedCategory(initialCategory);
    if (initialSort !== undefined) setSort(initialSort);
  }, [initialSearch, initialCategory, initialSort]);

  useEffect(() => {
    fetchProducts();
  }, [search, selectedCategory, sort, priceRange, currentPage]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.getProducts({
        search: search.trim() || undefined,
        category: selectedCategory || undefined,
        sort: sort || undefined,
        maxPrice: priceRange < 1000 ? priceRange : undefined,
        page: currentPage,
        limit: 12
      });

      setProducts(res.products || []);
      setTotalPages(res.pagination?.totalPages || 1);
      setTotalItems(res.pagination?.totalItems || 0);
    } catch (err) {
      console.error('Failed to fetch products', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setSort('latest');
    setPriceRange(1000);
    setCurrentPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header Banner */}
      <div className="border-b border-slate-200 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            All PDF Study Materials & Notes
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Showing {totalItems} verified digital study guides & question papers
          </p>
        </div>

        {/* Quick Search & Sort on Desktop */}
        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search PDFs..."
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="lg:hidden p-2 rounded-xl border border-slate-300 text-slate-700 bg-white"
            title="Filter"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Grid: Filters Sidebar + Products Display */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Filters Sidebar */}
        <aside className={`lg:block ${showMobileFilters ? 'block' : 'hidden'} lg:col-span-1 space-y-6`}>
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b pb-3">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-indigo-600" />
                <span>Filters & Sorting</span>
              </span>
              <button
                onClick={handleResetFilters}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset All</span>
              </button>
            </div>

            {/* Sort Dropdown */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Sort Order</label>
              <select
                value={sort}
                onChange={e => {
                  setSort(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-800"
              >
                <option value="latest">Latest Published</option>
                <option value="popularity">Most Popular / Purchases</option>
                <option value="rating">Highest Rated</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Category</label>
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                <button
                  onClick={() => {
                    setSelectedCategory('');
                    setCurrentPage(1);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                    !selectedCategory ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  All Categories
                </button>
                {categories.map(c => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedCategory(c.id);
                      setCurrentPage(1);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer truncate ${
                      selectedCategory === c.id ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Filter Slider */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
                <span>Max Price:</span>
                <span className="text-indigo-600">₹{priceRange}</span>
              </div>
              <input
                type="range"
                min={50}
                max={1000}
                step={25}
                value={priceRange}
                onChange={e => {
                  setPriceRange(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>₹50</span>
                <span>₹1,000</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Products Grid Content */}
        <div className="lg:col-span-3 space-y-6">
          
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-80 bg-slate-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 space-y-3">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-800 text-base">No study materials found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No matching PDF products match your selected filters. Try searching for a different keyword or resetting your filters.
              </p>
              <button
                onClick={handleResetFilters}
                className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-indigo-700"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map(prod => (
                <ProductCard
                  key={prod.id}
                  product={prod}
                  onViewDetails={onViewProduct}
                  onPreview={onPreviewProduct}
                  onBuyNow={onBuyNow}
                />
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-6 border-t border-slate-200">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <span className="text-xs font-bold text-slate-700">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 flex items-center gap-1 cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
