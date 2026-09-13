import React from 'react';
import { BookOpen, ShieldCheck, Mail, Phone, Heart, ExternalLink, HelpCircle, CheckCircle, FileText } from 'lucide-react';

interface FooterProps {
  onNavigate: (view: string, param?: string) => void;
  onOpenAuth?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenAuth }) => {
  return (
    <footer className="bg-slate-950 text-slate-300 border-t border-slate-800 text-sm mt-auto">
      {/* Trust & Guarantee Strip */}
      <div className="border-b border-slate-800/80 bg-slate-900/60 py-6 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Instant Access</h4>
              <p className="text-xs text-slate-400 mt-0.5">Download immediately after payment</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Verified Syllabus</h4>
              <p className="text-xs text-slate-400 mt-0.5">Curated by top subject faculty</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Lifetime Library</h4>
              <p className="text-xs text-slate-400 mt-0.5">Re-download anytime anywhere</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0 border border-blue-400/20">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Fast Support</h4>
              <p className="text-xs text-slate-400 mt-0.5">Email & WhatsApp assistance</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          
          {/* Col 1: Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                <BookOpen className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-xl tracking-tight text-white">
                Notes<span className="text-indigo-400">Vidya</span>
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-400 max-w-sm leading-relaxed">
              Your digital library of knowledge. India's premier digital platform for curated study notes, competitive exam guides, formula blueprints, college materials, and solved test series. Download instantly upon secure checkout.
            </p>

            <div className="pt-2 text-xs text-slate-400 space-y-1.5">
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-indigo-400" />
                <span>support@notesvidya.com</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-400" />
                <span>+91 (800) 123-4567 (Mon-Sat, 9am - 7pm IST)</span>
              </p>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3">
              Explore Store
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button onClick={() => onNavigate('home')} className="hover:text-indigo-400 transition-colors">
                  Home
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('all-pdfs')} className="hover:text-indigo-400 transition-colors">
                  All PDF Documents
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('all-pdfs', 'bestseller=true')} className="hover:text-indigo-400 transition-colors">
                  Bestselling Notes
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('about')} className="hover:text-indigo-400 transition-colors">
                  About Digital Store
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('faq')} className="hover:text-indigo-400 transition-colors">
                  Frequently Asked Questions
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('contact')} className="hover:text-indigo-400 transition-colors">
                  Contact & Helpdesk
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Popular Categories */}
          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3">
              Top Categories
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button onClick={() => onNavigate('all-pdfs', 'category=cat-comp-exams')} className="hover:text-indigo-400 transition-colors">
                  Competitive Exams (SSC/RRB/UPSC)
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('all-pdfs', 'category=cat-maths')} className="hover:text-indigo-400 transition-colors">
                  Mathematics & Speed Vedic Hacks
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('all-pdfs', 'category=cat-reasoning')} className="hover:text-indigo-400 transition-colors">
                  Logical Reasoning & Puzzles
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('all-pdfs', 'category=cat-gk')} className="hover:text-indigo-400 transition-colors">
                  Static GK & Current Affairs
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('all-pdfs', 'category=cat-computer')} className="hover:text-indigo-400 transition-colors">
                  Computer & IT Fundamentals
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('all-pdfs', 'category=cat-school')} className="hover:text-indigo-400 transition-colors">
                  Class 11 & 12 Board Notes
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Account & Legal */}
          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3">
              Account & Legal
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button onClick={() => onNavigate('dashboard', 'purchased')} className="hover:text-indigo-400 transition-colors">
                  My Purchased Library
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('dashboard', 'orders')} className="hover:text-indigo-400 transition-colors">
                  Track Past Orders
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('dashboard', 'downloads')} className="hover:text-indigo-400 transition-colors">
                  Download History
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('privacy-policy')} className="hover:text-indigo-400 transition-colors">
                  Privacy Policy
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('terms-conditions')} className="hover:text-indigo-400 transition-colors">
                  Terms & Conditions
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('refund-policy')} className="hover:text-indigo-400 transition-colors">
                  Refund Policy (Digital Products)
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Accepted Payment Gateways & Badges */}
        <div className="pt-8 mt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span className="font-semibold text-slate-300">Accepted Secure Payments:</span>
            <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 font-bold">UPI</span>
            <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 font-bold">Google Pay</span>
            <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 font-bold">PhonePe</span>
            <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 font-bold">Paytm</span>
            <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 font-bold">Visa / Mastercard / RuPay</span>
            <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 font-bold">Net Banking</span>
          </div>

          <div className="text-xs text-slate-500">
            © {new Date().getFullYear()} NotesVidya. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};
