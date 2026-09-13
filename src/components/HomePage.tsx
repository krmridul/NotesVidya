import React, { useState, useEffect } from 'react';
import {
  Search,
  BookOpen,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Download,
  Star,
  ChevronDown,
  Layers,
  Award,
  Zap,
  Clock,
  HelpCircle
} from 'lucide-react';
import { Product, Category } from '../types.js';
import { ProductCard } from './ProductCard.js';
import { api } from '../lib/api.js';

interface HomePageProps {
  onNavigate: (view: string, param?: string) => void;
  onPreviewProduct: (product: Product) => void;
  onViewProduct: (product: Product) => void;
  onBuyNow: (product: Product) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onNavigate,
  onPreviewProduct,
  onViewProduct,
  onBuyNow
}) => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [bestsellers, setBestsellers] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [heroSearch, setHeroSearch] = useState('');
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  useEffect(() => {
    api.getFeaturedProducts().then(res => {
      setFeaturedProducts(res.featured || []);
      setBestsellers(res.bestsellers || []);
    }).catch(() => {});

    api.getCategories().then(res => setCategories(res.categories || [])).catch(() => {});
  }, []);

  const handleHeroSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (heroSearch.trim()) {
      onNavigate('all-pdfs', `search=${encodeURIComponent(heroSearch.trim())}`);
    }
  };

  const quickPicks = [
    { label: 'RRB NTPC', query: 'RRB' },
    { label: 'SSC CGL', query: 'SSC' },
    { label: 'Vedic Math', query: 'Vedic' },
    { label: 'Class 12 Physics', query: 'Physics' },
    { label: 'Static GK 2025', query: 'General Knowledge' },
    { label: 'Computer Aptitude', query: 'Computer' },
    { label: 'UPSC GS', query: 'UPSC' }
  ];

  const faqs = [
    {
      q: 'How do I purchase and access my digital PDF products?',
      a: 'Select any study material or question paper and click "Buy Now" or "Add to Cart". Complete your payment securely via UPI, Card, or Net Banking on Razorpay. Upon successful verification, your PDF is unlocked instantly in your account library with lifetime access.'
    },
    {
      q: 'How do I download my purchased PDFs to my phone or computer?',
      a: 'Go to "My Account" → "Purchased PDFs". You will find your unlocked document ready with a "Download PDF" button. Each PDF is dynamically rendered with your personalized single-user license watermark.'
    },
    {
      q: 'What should I do if money was deducted but payment says failed or pending?',
      a: 'All transactions are cryptographically verified against the Razorpay payment gateway. If any network timeout occurs, your order status will automatically sync within 15 minutes, or you can contact our 24/7 helpdesk with your payment ID for instant manual unlocking.'
    },
    {
      q: 'Can I preview sample pages before purchasing?',
      a: 'Yes! Every PDF product features a "Preview PDF" button allowing you to inspect sample pages, chapter blueprints, and format before making a purchase.'
    },
    {
      q: 'What is the refund policy on digital PDFs?',
      a: 'Since digital PDFs are downloadable goods with immediate delivery, sales are generally final. However, if you experience a technical corrupt file issue that our support team cannot resolve, a full refund will be processed within 5-7 business days.'
    },
    {
      q: 'Do I get lifetime access and unlimited re-downloads?',
      a: 'Yes! Once purchased, your PDF remains permanently accessible in your NotesVidya account. You can log in and re-download anytime on any device.'
    }
  ];

  return (
    <div className="space-y-16 pb-16">
      
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 text-white pt-12 pb-20 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        
        {/* Glow ambient decorations */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-6">
          
          {/* Top Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>2025-2026 DIGITAL STUDY MATERIALS & EXAM NOTES</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
            High-Scoring Exam Notes, Books & Solved Papers in <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-sky-300 to-blue-400">PDF Format</span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Download comprehensive revision modules, formula cheat sheets, previous 10-year question banks, and competitive syllabus blueprints. Instant digital delivery after secure checkout.
          </p>

          {/* Search Hero Box */}
          <form onSubmit={handleHeroSearchSubmit} className="max-w-2xl mx-auto relative flex items-center shadow-2xl">
            <Search className="w-5 h-5 absolute left-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={heroSearch}
              onChange={e => setHeroSearch(e.target.value)}
              placeholder="Search by exam (SSC, RRB, UPSC, Board, Class 12, Vedic Math)..."
              className="w-full pl-12 pr-32 py-4 rounded-2xl bg-white text-slate-900 text-sm font-medium border-2 border-indigo-400/40 shadow-inner focus:outline-hidden focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20"
              id="hero-search-input"
            />
            <button
              type="submit"
              className="absolute right-2.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md cursor-pointer"
            >
              Search
            </button>
          </form>

          {/* Quick Pick Chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <span className="text-xs text-slate-400 font-semibold mr-1">Trending:</span>
            {quickPicks.map(chip => (
              <button
                key={chip.label}
                onClick={() => onNavigate('all-pdfs', `search=${encodeURIComponent(chip.query)}`)}
                className="px-3 py-1 rounded-lg bg-slate-800/80 hover:bg-indigo-900/60 border border-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <button
              onClick={() => onNavigate('all-pdfs')}
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all cursor-pointer"
            >
              <span>Browse All PDFs</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                const el = document.getElementById('categories-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-6 py-3 rounded-xl bg-slate-800/90 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-sm transition-all cursor-pointer"
            >
              Explore Categories
            </button>
          </div>

          {/* Trust Guarantees */}
          <div className="pt-8 border-t border-slate-800/80 grid grid-cols-3 gap-4 max-w-2xl mx-auto text-xs text-slate-300">
            <div className="flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Instant Download</span>
            </div>
            <div className="flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>Razorpay Verified</span>
            </div>
            <div className="flex items-center justify-center gap-1.5">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Personalized DRM</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. POPULAR CATEGORIES */}
      <section id="categories-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
              Top Disciplines
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-2">
              Featured Categories
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Handcrafted revision notes structured for government exams, colleges, and schools
            </p>
          </div>

          <button
            onClick={() => onNavigate('all-pdfs')}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer self-start sm:self-auto"
          >
            <span>View All Categories</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Category Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {(categories || []).slice(0, 6).map(cat => (
            <button
              key={cat.id}
              onClick={() => onNavigate('all-pdfs', `category=${cat.id}`)}
              className="group p-4 bg-white rounded-2xl border border-slate-200/90 hover:border-indigo-300 shadow-xs hover:shadow-lg transition-all text-left flex flex-col justify-between cursor-pointer hover:-translate-y-1"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
                  {cat.name}
                </h3>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Browse Notes →
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* 3. BESTSELLING PDFS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2.5 py-1 rounded-md">
                Top Rated Study Materials
              </span>
              <span className="text-xs text-slate-500 font-semibold hidden sm:inline">Updated for 2025</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-2">
              Bestselling PDF Products
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Trusted by over 40,000 students across India
            </p>
          </div>

          <button
            onClick={() => onNavigate('all-pdfs', 'bestseller=true')}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer self-start sm:self-auto"
          >
            <span>See All Bestsellers</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {(bestsellers || []).slice(0, 4).map(prod => (
            <ProductCard
              key={prod.id}
              product={prod}
              onViewDetails={onViewProduct}
              onPreview={onPreviewProduct}
              onBuyNow={onBuyNow}
            />
          ))}
        </div>
      </section>

      {/* 4. FEATURED EXAM COLLECTIONS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
              Editor's Handpicked
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-2">
              Featured Study Collections
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Curated chapter notes, solved formulas, and question banks
            </p>
          </div>

          <button
            onClick={() => onNavigate('all-pdfs', 'featured=true')}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer self-start sm:self-auto"
          >
            <span>View All Featured</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {(featuredProducts || []).slice(0, 4).map(prod => (
            <ProductCard
              key={prod.id}
              product={prod}
              onViewDetails={onViewProduct}
              onPreview={onPreviewProduct}
              onBuyNow={onBuyNow}
            />
          ))}
        </div>
      </section>

      {/* 5. WHY CHOOSE US */}
      <section className="bg-slate-50 border-y border-slate-200/80 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-100/70 px-2.5 py-1 rounded-md">
              Digital Excellence
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-2">
              Why Students Trust NotesVidya
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Designed specifically for friction-free digital study document delivery
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Instant Digital Access</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Zero shipping wait time. The exact moment your Razorpay payment confirms, your PDF is ready for immediate offline download or in-browser reading.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Secure Razorpay Payments</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Pay with confidence using UPI (GPay, PhonePe, Paytm), RuPay/Visa/Mastercard cards, or Net Banking with enterprise 256-bit encryption.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">High Quality & Clean Typography</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                No messy handwritten scans. Our PDFs feature crisp vector typography, clear equation layouts, and high-resolution diagrams readable on any screen.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Download className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Lifetime Unlimited Re-Downloads</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Switched phones or got a new tablet? Log in anytime to your customer portal and re-download your entire study library without paying again.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Affordable Student Pricing</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Direct-from-faculty pricing with heavy discounts up to 60% off physical books, saving students money without sacrificing depth.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Watermarked DRM Protection</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Every download is stamped with your personal license details, protecting authentic authors while guaranteeing genuine exam preparation notes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. TESTIMONIALS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
            Student Feedback
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-2">
            Loved by Aspirants Across India
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real feedback from verified purchasers preparing for competitive exams
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed italic">
                "The Vedic Mathematics speed calculation hacks saved me at least 15 minutes in the Quantitative section of SSC CGL. Instant download and clean layout!"
              </p>
            </div>
            <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
              <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                AK
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-900">Amit Kumar</h4>
                <p className="text-[11px] text-slate-400">SSC CGL Aspirant • Patna</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed italic">
                "The RRB NTPC General Awareness guide is extremely concise with zero fluff. Having offline access on my tablet made traveling and revising so simple."
              </p>
            </div>
            <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
              <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center">
                PS
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-900">Pooja Sharma</h4>
                <p className="text-[11px] text-slate-400">Railway NTPC Candidate • Jaipur</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed italic">
                "Class 12 Physics derivation blueprints cleared all confusion before my CBSE board examinations. Best ₹149 investment for revision."
              </p>
            </div>
            <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
              <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                RV
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-900">Rohan Verma</h4>
                <p className="text-[11px] text-slate-400">CBSE Class 12 • Delhi</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FREQUENTLY ASKED QUESTIONS */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
            Common Inquiries
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-2">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs transition-all"
            >
              <button
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 cursor-pointer"
              >
                <span className="font-bold text-xs sm:text-sm text-slate-900">
                  {faq.q}
                </span>
                <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${activeFaq === idx ? 'rotate-180 text-indigo-600' : ''}`} />
              </button>

              {activeFaq === idx && (
                <div className="px-4 sm:px-5 pb-5 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 8. BOTTOM CTA BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-blue-700 rounded-3xl p-8 sm:p-12 text-white text-center space-y-4 shadow-xl relative overflow-hidden">
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
            Start Preparing Smarter Today
          </h2>
          <p className="text-xs sm:text-sm text-indigo-100 max-w-xl mx-auto leading-relaxed">
            Instant downloads, verified exam solutions, and personalized DRM watermarked notes. Join thousands of high-scoring students.
          </p>
          <div className="pt-2">
            <button
              onClick={() => onNavigate('all-pdfs')}
              className="px-6 py-3 rounded-xl bg-white text-indigo-700 font-bold text-xs sm:text-sm shadow-md hover:bg-indigo-50 transition-colors cursor-pointer"
            >
              Explore Full PDF Catalog →
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
