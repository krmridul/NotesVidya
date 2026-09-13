import React, { useState } from 'react';
import { X, Download, ShieldCheck, CheckCircle2, ChevronLeft, ChevronRight, FileText, Printer } from 'lucide-react';
import { Product, Order } from '../types.js';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';

interface SecurePdfViewerModalProps {
  product: Product;
  order?: Order;
  onClose: () => void;
}

export const SecurePdfViewerModal: React.FC<SecurePdfViewerModalProps> = ({
  product,
  order,
  onClose
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'license' | 'module1' | 'module2' | 'mcq'>('license');
  const [downloading, setDownloading] = useState(false);

  const orderNumber = order ? order.orderNumber : 'ORD-VERIFIED';
  const customerName = user ? user.name : 'Authorized Student';
  const customerEmail = user ? user.email : 'student@example.com';

  const handleDownload = async () => {
    try {
      setDownloading(true);
      showToast('Generating personalized DRM watermarked PDF...', 'info');

      // Request expiring signed token
      const tokenRes = await api.requestPdfDownloadToken(product.id);

      // Trigger secure download using signed download URL
      const link = document.createElement('a');
      link.href = tokenRes.downloadUrl;
      link.setAttribute('download', `${product.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast('Download started! Your PDF includes your verified license watermark.', 'success');
    } catch (err: any) {
      showToast('Download failed: ' + err.message, 'error');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-4xl w-full h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Top Header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-500 text-slate-950">
                  DRM Verified License
                </span>
                <span className="text-xs text-slate-400">
                  Order #{orderNumber}
                </span>
              </div>
              <h2 className="font-bold text-sm sm:text-base text-slate-100 line-clamp-1 mt-0.5">
                {product.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
              title="Download watermarked PDF binary"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">{downloading ? 'Preparing...' : 'Download PDF'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Close viewer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Reader Tab Navigation */}
        <div className="bg-slate-100 border-b border-slate-200 px-4 flex items-center gap-2 overflow-x-auto text-xs font-semibold text-slate-600">
          <button
            onClick={() => setActiveTab('license')}
            className={`py-3 px-3 border-b-2 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'license'
                ? 'border-indigo-600 text-indigo-600 font-bold bg-white'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            1. Official License Certificate
          </button>
          <button
            onClick={() => setActiveTab('module1')}
            className={`py-3 px-3 border-b-2 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'module1'
                ? 'border-indigo-600 text-indigo-600 font-bold bg-white'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            2. Core Notes & High-Yield Summary
          </button>
          <button
            onClick={() => setActiveTab('module2')}
            className={`py-3 px-3 border-b-2 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'module2'
                ? 'border-indigo-600 text-indigo-600 font-bold bg-white'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            3. Solved PYQs & Speed Hacks
          </button>
          <button
            onClick={() => setActiveTab('mcq')}
            className={`py-3 px-3 border-b-2 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'mcq'
                ? 'border-indigo-600 text-indigo-600 font-bold bg-white'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            4. Practice Mock Sets & Solutions
          </button>
        </div>

        {/* Reading Canvas with Watermark */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-200/70 flex flex-col items-center">
          <div className="bg-white rounded-xl shadow-lg border border-slate-300 w-full max-w-2xl min-h-[500px] p-6 sm:p-12 relative overflow-hidden select-none">
            
            {/* Dynamic Customer Watermark Background */}
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-around opacity-5 rotate-[-25deg]">
              <span className="text-3xl font-black text-slate-950 uppercase tracking-widest text-center">
                LICENSED TO: {customerName.toUpperCase()}<br />
                {customerEmail.toUpperCase()} :: {orderNumber}
              </span>
              <span className="text-3xl font-black text-slate-950 uppercase tracking-widest text-center">
                NOTESVIDYA VERIFIED DIGITAL LICENSE
              </span>
              <span className="text-3xl font-black text-slate-950 uppercase tracking-widest text-center">
                UNAUTHORIZED RESALE STRICTLY PROHIBITED
              </span>
            </div>

            {/* TAB 1: License Certificate */}
            {activeTab === 'license' && (
              <div className="relative z-10 space-y-6">
                <div className="text-center border-b pb-6">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 mb-3 border border-emerald-200">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900">
                    OFFICIAL CERTIFICATE OF DIGITAL OWNERSHIP
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    NotesVidya • Single-User Authorized Study License
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Document Title</span>
                    <strong className="text-slate-900 block mt-0.5">{product.title}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Author / Faculty</span>
                    <strong className="text-slate-900 block mt-0.5">{product.author}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Licensee Name</span>
                    <strong className="text-slate-900 block mt-0.5">{customerName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Licensee Email</span>
                    <strong className="text-slate-900 block mt-0.5">{customerEmail}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Order ID</span>
                    <strong className="text-slate-900 block mt-0.5">#{orderNumber}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Pages / Size</span>
                    <strong className="text-slate-900 block mt-0.5">{product.pages} Pages • {product.fileSize}</strong>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200/80 text-xs text-amber-900 space-y-2">
                  <p className="font-bold">Important Copyright & License Terms:</p>
                  <p className="leading-relaxed">
                    This official study material is licensed exclusively to <strong>{customerName}</strong> ({customerEmail}) for personal preparation. Each page has been stamped with a cryptographic watermark tied to your account. File sharing, redistribution in public Telegram channels, or unauthorized uploads will void your access entitlement.
                  </p>
                </div>

                <div className="text-center pt-2">
                  <button
                    onClick={handleDownload}
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 inline-flex items-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Complete {product.pages}-Page PDF File</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: Core Notes */}
            {activeTab === 'module1' && (
              <div className="relative z-10 space-y-5">
                <div className="border-b pb-3">
                  <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Module 1</span>
                  <h3 className="text-lg font-bold text-slate-900 mt-1">
                    Fundamental Concepts & Master Theory Blueprint
                  </h3>
                  <p className="text-xs text-slate-500">
                    Category: {product.categoryName} | High-Yield Weightage Summary
                  </p>
                </div>

                <div className="space-y-4 text-sm text-slate-700 leading-relaxed">
                  <p className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                    <strong>1. Systematic Syllabus Decomposition:</strong> The official examination blueprint emphasizes precision over exhaustive memorization. 65% of test questions historically concentrate within the first 4 priority sub-themes marked in this guide.
                  </p>

                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-900 text-sm">Key Analytical Rules:</h4>
                    <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-slate-600 pl-1">
                      <li><strong>Rule 1:</strong> Always eliminate mathematically impossible distractors before calculating exact answers.</li>
                      <li><strong>Rule 2:</strong> In objective tests with negative marking, skip unverified conjectures to protect percentile score.</li>
                      <li><strong>Rule 3:</strong> Maintain a dedicated error log for repeated question patterns across recent shifts.</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900">
                    <strong>Exam Hack:</strong> Utilize the speed conversion matrix on Page 24 for time conservation under 40 seconds per question.
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: Solved PYQs */}
            {activeTab === 'module2' && (
              <div className="relative z-10 space-y-5">
                <div className="border-b pb-3">
                  <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Module 2</span>
                  <h3 className="text-lg font-bold text-slate-900 mt-1">
                    Previous 10 Years Solved Questions with Speed Solutions
                  </h3>
                  <p className="text-xs text-slate-500">
                    Verified answers validated against official master answer keys
                  </p>
                </div>

                <div className="space-y-4 text-xs sm:text-sm text-slate-700">
                  <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 shadow-xs">
                    <p className="font-bold text-slate-900">
                      Sample PYQ 1: Analyze optimal formula application for compound variation.
                    </p>
                    <p className="text-slate-600 text-xs leading-relaxed">
                      <strong>Standard Textbook Solution:</strong> 7 lines of algebraic steps (Time taken: ~2.5 minutes).
                    </p>
                    <p className="text-emerald-700 text-xs bg-emerald-50 p-2.5 rounded-lg border border-emerald-100 font-mono">
                      <strong>Speed Shortcut Technique:</strong> Direct ratio inversion: R = (A2 - A1) / A1 * 100%. Result obtained in 25 seconds flat.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 shadow-xs">
                    <p className="font-bold text-slate-900">
                      Sample PYQ 2: Identifying recurrent conceptual triggers in general awareness.
                    </p>
                    <p className="text-slate-600 text-xs leading-relaxed">
                      Constitutional amendments related to fundamental rights and Panchayati Raj institutions appeared in 82% of past papers.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: Practice Mock Sets */}
            {activeTab === 'mcq' && (
              <div className="relative z-10 space-y-5">
                <div className="border-b pb-3">
                  <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Module 3</span>
                  <h3 className="text-lg font-bold text-slate-900 mt-1">
                    Full Practice Mock Sets & Answer Keys
                  </h3>
                  <p className="text-xs text-slate-500">
                    Timed section drills replicating live computer-based test interface
                  </p>
                </div>

                <div className="space-y-3 text-xs sm:text-sm text-slate-700">
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="font-semibold text-slate-800">
                      Practice Mock Set 1 contains 100 curated questions with detailed explanations at the end of the chapter.
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Cutoff benchmark: 78% for General Category / 72% for Reserved Categories.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-950 space-y-2">
                    <p className="font-bold">Offline Study Tip:</p>
                    <p>
                      Click the "Download PDF" button above to save the complete document offline on your phone, tablet, laptop, or e-reader.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Watermark Footer Line in Canvas */}
            <div className="pt-4 border-t border-dashed border-slate-200 mt-8 relative z-10 flex items-center justify-between text-[10px] text-slate-400">
              <span>Licensed to: {customerEmail}</span>
              <span>Order #{orderNumber}</span>
              <span>DRM Protected Copy</span>
            </div>
          </div>
        </div>

        {/* Bottom Footer Bar */}
        <div className="p-3 sm:p-4 border-t border-slate-200 bg-white flex items-center justify-between text-xs text-slate-500">
          <span>{product.pages} total pages in high resolution</span>
          <button
            onClick={handleDownload}
            className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Save Offline PDF (.pdf)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
