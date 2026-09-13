import React, { useState } from 'react';
import {
  CheckCircle2,
  Download,
  Eye,
  ArrowRight,
  FileText,
  Mail,
  ShieldCheck,
  ExternalLink,
  Lock
} from 'lucide-react';
import { Order, Product } from '../types.js';
import { SecurePdfViewerModal } from './SecurePdfViewerModal.js';
import { useToast } from '../context/ToastContext.js';
import { api } from '../lib/api.js';

interface OrderSuccessPageProps {
  order: Order;
  onGoToDashboard: () => void;
  onContinueShopping: () => void;
}

export const OrderSuccessPage: React.FC<OrderSuccessPageProps> = ({
  order,
  onGoToDashboard,
  onContinueShopping
}) => {
  const { showToast } = useToast();
  const [readingProduct, setReadingProduct] = useState<{ id: string; title: string } | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownloadPdf = async (productId: string, title: string) => {
    setDownloadingId(productId);
    try {
      const { downloadUrl, token } = await api.requestPdfToken(productId);
      const res = await fetch(downloadUrl, {
        headers: { 'x-pdf-token': token }
      });

      if (!res.ok) {
        throw new Error('Could not download PDF stream');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.replace(/[^a-zA-Z0-9]/g, '_')}_NotesVidya.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      showToast('Download started! File saved with personal watermark.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Download failed', 'error');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Celebration & Confirmation Card */}
      <div className="bg-white rounded-3xl border border-emerald-200 p-6 sm:p-10 shadow-lg text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          Payment Confirmed via Razorpay
        </span>

        <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Thank You for Your Order!
        </h1>

        <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
          Your payment has been cryptographically verified. Your personalized watermarked PDF files are now active and permanently accessible in your account.
        </p>

        {/* Order Details Chip Strip */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-left text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Order Number</span>
            <strong className="text-slate-900 block font-mono mt-0.5">#{order.orderNumber}</strong>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Transaction ID</span>
            <strong className="text-purple-700 block font-mono mt-0.5 truncate">{order.paymentId || 'RZP-DIRECT'}</strong>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Amount Paid</span>
            <strong className="text-emerald-700 block mt-0.5">₹{order.finalAmount.toFixed(2)}</strong>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">License Email</span>
            <strong className="text-slate-900 block truncate mt-0.5">{order.customerEmail}</strong>
          </div>
        </div>
      </div>

      {/* Instant PDF Access Section */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <h2 className="text-lg font-black text-slate-900">Your Unlocked PDF Downloads</h2>
            <p className="text-xs text-slate-500 mt-0.5">Download immediately or read inside our secure in-browser reader</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>Watermarked with License ID</span>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {order.items.map(item => (
            <div key={item.productId} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-12 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-xs sm:text-sm text-slate-900">{item.title}</h3>
                  <span className="text-[11px] text-slate-500">Paid: ₹{item.price} • DRM Status: Active</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setReadingProduct({ id: item.productId, title: item.title })}
                  className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Read Online</span>
                </button>

                <button
                  onClick={() => handleDownloadPdf(item.productId, item.title)}
                  disabled={downloadingId === item.productId}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{downloadingId === item.productId ? 'Generating...' : 'Download PDF'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
        <button
          onClick={onContinueShopping}
          className="text-xs font-bold text-slate-600 hover:text-slate-900"
        >
          ← Continue Shopping More Notes
        </button>

        <button
          onClick={onGoToDashboard}
          className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md flex items-center gap-2 cursor-pointer"
        >
          <span>View All in My Account</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Secure Reader Modal */}
      {readingProduct && (
        <SecurePdfViewerModal
          productId={readingProduct.id}
          productTitle={readingProduct.title}
          onClose={() => setReadingProduct(null)}
        />
      )}
    </div>
  );
};
