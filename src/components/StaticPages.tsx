import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, ShieldCheck, HelpCircle, CheckCircle2 } from 'lucide-react';
import { useToast } from '../context/ToastContext.js';

interface StaticPageProps {
  pageType: 'about' | 'contact' | 'faq' | 'privacy' | 'terms' | 'refund' | 'disclaimer';
  onNavigate: (view: string) => void;
}

export const StaticPages: React.FC<StaticPageProps> = ({ pageType, onNavigate }) => {
  const { showToast } = useToast();

  // Contact Form State
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [submittedContact, setSubmittedContact] = useState(false);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactEmail || !contactMessage) {
      showToast('Please complete all required fields', 'error');
      return;
    }
    setSubmittedContact(true);
    showToast('Inquiry submitted! Our support team will reply within 4 hours.', 'success');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* 1. ABOUT US */}
      {pageType === 'about' && (
        <div className="space-y-6">
          <div className="border-b pb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded">
              Who We Are
            </span>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight mt-2">
              About NotesVidya
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Your digital library of knowledge — empowering students with verified exam blueprints and high-scoring notes
            </p>
          </div>

          <div className="prose prose-slate max-w-none text-sm text-slate-600 leading-relaxed space-y-4">
            <p>
              <strong>NotesVidya</strong> is a modern digital learning platform and knowledge repository dedicated exclusively to high-yield digital study materials, competitive exam notes, solved question papers, formula blueprints, and academic ebooks.
            </p>
            <p>
              We solve the friction of heavy physical book deliveries and messy illegible photocopies. Every document in our catalog is typeset in crisp high-resolution vector typography, thoroughly vetted by experienced faculty, and delivered instantly to your account with zero shipping delays.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 not-prose">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-2xl font-black text-indigo-600">40,000+</span>
                <p className="text-xs font-semibold text-slate-800 mt-1">Students Supported</p>
                <p className="text-[11px] text-slate-500">Across 28 Indian states</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-2xl font-black text-indigo-600">100%</span>
                <p className="text-xs font-semibold text-slate-800 mt-1">Digital Delivery</p>
                <p className="text-[11px] text-slate-500">Instant PDF download</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-2xl font-black text-indigo-600">256-Bit</span>
                <p className="text-xs font-semibold text-slate-800 mt-1">Razorpay Verified</p>
                <p className="text-[11px] text-slate-500">Safe UPI & card payments</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. CONTACT US */}
      {pageType === 'contact' && (
        <div className="space-y-6">
          <div className="border-b pb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded">
              Get in Touch
            </span>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight mt-2">
              Contact Customer Support
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Have questions about your order, downloads, or payment? We're here to assist.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Contact Details */}
            <div className="space-y-5">
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 text-xs">
                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-indigo-600 mt-0.5" />
                  <div>
                    <strong className="text-slate-900 block">Email Desk</strong>
                    <span className="text-slate-600">support@notesvidya.com</span>
                    <span className="text-slate-400 block text-[10px]">Average reply time: under 2 hours</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-indigo-600 mt-0.5" />
                  <div>
                    <strong className="text-slate-900 block">WhatsApp Support</strong>
                    <span className="text-slate-600">+91 98765 43210</span>
                    <span className="text-slate-400 block text-[10px]">Mon – Sat: 9:00 AM – 8:00 PM IST</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-indigo-600 mt-0.5" />
                  <div>
                    <strong className="text-slate-900 block">Headquarters</strong>
                    <span className="text-slate-600">NotesVidya Knowledge Center, Koramangala, Bengaluru, Karnataka 560034</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="font-bold text-slate-900 text-sm">Send us a Message</h3>

              {submittedContact ? (
                <div className="p-6 bg-emerald-50 rounded-xl border border-emerald-200 text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                  <h4 className="font-bold text-emerald-900 text-sm">Inquiry Received</h4>
                  <p className="text-xs text-emerald-700">Thank you. An academic counselor will contact you shortly.</p>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Your Name</label>
                    <input
                      type="text"
                      value={contactName}
                      onChange={e => setContactName(e.target.value)}
                      placeholder="Enter your name"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Email Address</label>
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={e => setContactEmail(e.target.value)}
                      placeholder="e.g. yourname@gmail.com"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Subject</label>
                    <input
                      type="text"
                      value={contactSubject}
                      onChange={e => setContactSubject(e.target.value)}
                      placeholder="e.g. Order #1002 download inquiry"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Message</label>
                    <textarea
                      value={contactMessage}
                      onChange={e => setContactMessage(e.target.value)}
                      placeholder="Describe your question or issue..."
                      rows={3}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl cursor-pointer"
                  >
                    Submit Support Ticket
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. FAQ */}
      {pageType === 'faq' && (
        <div className="space-y-6">
          <div className="border-b pb-4">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Frequently Asked Questions (FAQ)
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Everything you need to know about purchasing, accessing, and downloading digital PDFs
            </p>
          </div>

          <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
            <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-1">
              <h3 className="font-bold text-slate-900 text-sm">When will I get access to my purchased PDF?</h3>
              <p>Immediately! Once your Razorpay transaction confirms, the PDF is unlocked in your account instantly. You will also see a direct download link on the order confirmation screen.</p>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-1">
              <h3 className="font-bold text-slate-900 text-sm">How does the watermark work?</h3>
              <p>Each PDF is digitally stamped with your registered customer name, email address, and order identifier. This identifies you as the authorized single-user licensee.</p>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-1">
              <h3 className="font-bold text-slate-900 text-sm">Can I print the PDF files?</h3>
              <p>Yes, all purchased PDFs can be printed for your personal offline revision and study binders.</p>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-1">
              <h3 className="font-bold text-slate-900 text-sm">What payment options are supported?</h3>
              <p>We support all Indian and International options powered by Razorpay: Google Pay, PhonePe, Paytm, BHIM, credit/debit cards (RuPay, Visa, Mastercard), and 50+ Net Banking institutions.</p>
            </div>
          </div>
        </div>
      )}

      {/* 4. PRIVACY POLICY */}
      {pageType === 'privacy' && (
        <div className="space-y-6 text-xs text-slate-600 leading-relaxed">
          <div className="border-b pb-4">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Privacy Policy
            </h1>
            <p className="text-slate-400 mt-1">Last updated: January 2025</p>
          </div>

          <p>
            At <strong>NotesVidya</strong>, your privacy and data security are our highest priority. This Privacy Policy details how we collect, handle, and safeguard customer personal information.
          </p>

          <h3 className="font-bold text-slate-900 text-sm">1. Information We Collect</h3>
          <p>
            When you create an account or complete a purchase, we collect your name, email address, and optionally your phone number. We NEVER receive or store raw credit/debit card numbers or bank credentials; all payment tokenization is handled securely by Razorpay.
          </p>

          <h3 className="font-bold text-slate-900 text-sm">2. Use of Information</h3>
          <p>
            Your information is used strictly to fulfill digital orders, generate single-user DRM watermarks, send transactional purchase receipts, and provide technical download support.
          </p>
        </div>
      )}

      {/* 5. TERMS & CONDITIONS */}
      {pageType === 'terms' && (
        <div className="space-y-6 text-xs text-slate-600 leading-relaxed">
          <div className="border-b pb-4">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Terms & Conditions
            </h1>
            <p className="text-slate-400 mt-1">Effective Date: January 1, 2025</p>
          </div>

          <p>
            By purchasing and accessing digital goods on <strong>NotesVidya</strong>, you agree to comply with and be bound by the following terms of service.
          </p>

          <h3 className="font-bold text-slate-900 text-sm">1. Single-User License</h3>
          <p>
            Each purchased PDF document grants an exclusive, revocable, non-transferable single-user personal study license. You may not re-sell, redistribute, publish online, or share your watermarked file on Telegram channels or public repositories.
          </p>

          <h3 className="font-bold text-slate-900 text-sm">2. Anti-Piracy Notice</h3>
          <p>
            Unauthorized redistribution or tampering with dynamic watermark headers constitutes a violation of copyright law and will result in immediate termination of store access and potential legal claim.
          </p>
        </div>
      )}

      {/* 6. REFUND POLICY */}
      {pageType === 'refund' && (
        <div className="space-y-6 text-xs text-slate-600 leading-relaxed">
          <div className="border-b pb-4">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Refund & Cancellation Policy
            </h1>
            <p className="text-slate-400 mt-1">Clear digital products guarantee</p>
          </div>

          <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-800">
            <strong>Digital Products Notice:</strong> Unlike physical merchandise, digital downloadable PDFs are delivered immediately into your account and cannot be "returned" in the traditional sense.
          </div>

          <h3 className="font-bold text-slate-900 text-sm">Eligible Refund Circumstances:</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>Duplicate charge for the exact same order due to a payment gateway double deduction.</li>
            <li>Corrupt or unreadable PDF file that our technical support team cannot rectify within 24 hours.</li>
            <li>Major discrepancy between sample preview index and delivered syllabus file.</li>
          </ul>

          <h3 className="font-bold text-slate-900 text-sm">Processing Time</h3>
          <p>
            Approved refunds will be credited back to your original payment source (UPI account or bank card) via Razorpay within 5 to 7 business days.
          </p>
        </div>
      )}

      {/* 7. DISCLAIMER */}
      {pageType === 'disclaimer' && (
        <div className="space-y-6 text-xs text-slate-600 leading-relaxed">
          <div className="border-b pb-4">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Academic & Examination Disclaimer
            </h1>
          </div>

          <p>
            All study materials, past question solutions, and formula summaries available on <strong>NotesVidya</strong> are curated for educational reference and self-preparation assistance.
          </p>
          <p>
            We are an independent educational publisher. We are not officially affiliated with or endorsed by government examination boards (including UPSC, SSC, RRB, CBSE, or state public service commissions). All trademarks and exam names belong to their respective authorities.
          </p>
        </div>
      )}

      <div className="pt-6 border-t mt-8">
        <button
          onClick={() => onNavigate('home')}
          className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
        >
          ← Return to Home Page
        </button>
      </div>
    </div>
  );
};
