import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Lock,
  Mail,
  User,
  Phone,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  BookOpen,
  CheckCircle2,
  RefreshCw,
  Edit2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { api } from '../lib/api.js';
import { User as UserType } from '../types.js';

interface AuthModalProps {
  initialMode?: 'login' | 'register' | 'admin-setup';
  onClose: () => void;
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  initialMode = 'login',
  onClose,
  onSuccess
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'verify-otp' | 'admin-setup'>(initialMode);
  const [needsAdminSetup, setNeedsAdminSetup] = useState(false);
  const { login, setupAdmin, setAuthSession } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [emailConfigError, setEmailConfigError] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // OTP Verification States
  const [registrationId, setRegistrationId] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');
  const [pendingName, setPendingName] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [otpExpiryTimestamp, setOtpExpiryTimestamp] = useState<number>(0);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(600); // 10 min
  const [resendCooldown, setResendCooldown] = useState<number>(60);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  // Change Email inside OTP screen
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [newEmailInput, setNewEmailInput] = useState('');
  const [savingNewEmail, setSavingNewEmail] = useState(false);

  // Success Popup state (only opens upon confirmed backend OTP validation)
  const [successPopupOpen, setSuccessPopupOpen] = useState(false);
  const [verifiedUserData, setVerifiedUserData] = useState<UserType | null>(null);
  const [verifiedTokenData, setVerifiedTokenData] = useState<string | null>(null);

  // Refs for OTP input boxes
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    api.checkNeedsAdminSetup()
      .then(res => {
        if (res.needsAdminSetup) {
          setNeedsAdminSetup(true);
        }
      })
      .catch(() => {});
  }, []);

  // Expiry countdown timer
  useEffect(() => {
    if (mode !== 'verify-otp' || otpExpiryTimestamp <= 0) return;

    const tick = () => {
      const remaining = Math.max(0, Math.floor((otpExpiryTimestamp - Date.now()) / 1000));
      setSecondsRemaining(remaining);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [mode, otpExpiryTimestamp]);

  // Resend cooldown timer
  useEffect(() => {
    if (mode !== 'verify-otp' || resendCooldown <= 0) return;

    const interval = setInterval(() => {
      setResendCooldown(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [mode, resendCooldown]);

  // Auto-focus first OTP input when opening verify screen
  useEffect(() => {
    if (mode === 'verify-otp') {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [mode]);

  const formatTimer = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email.trim(), password);
      showToast('Logged in successfully!', 'success');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Login failed. Check your email and password.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Registration Form Submission -> Triggers Server OTP generation & Email dispatch
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailConfigError(null);

    if (password !== confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }
    if (password.length < 6) {
      showToast('Password must be at least 6 characters.', 'error');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      showToast('Please enter a valid email address.', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await api.initiateRegistration({
        name: name.trim(),
        email: cleanEmail,
        phone: phone.trim(),
        password,
        confirmPassword
      });

      // Prepare OTP verification screen
      setRegistrationId(res.registrationId);
      setPendingEmail(res.email);
      setPendingName(name.trim());
      setOtpExpiryTimestamp(res.expiresAt || (Date.now() + 10 * 60 * 1000));
      setSecondsRemaining(600);
      setResendCooldown(60);
      setOtpDigits(['', '', '', '', '', '']);
      setMode('verify-otp');
      showToast('Verification code sent to your email.', 'success');
    } catch (err: any) {
      if (err.requiresConfig || err.message?.includes('BREVO_API_KEY') || err.message?.includes('SMTP_HOST')) {
        setEmailConfigError(err.configHelp || err.message);
      }
      showToast(err.message || 'Unable to send verification email. Please try again later.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP digit entry
  const handleDigitChange = (index: number, val: string) => {
    // Only accept numbers
    const numeric = val.replace(/\D/g, '');
    if (!numeric) {
      const updated = [...otpDigits];
      updated[index] = '';
      setOtpDigits(updated);
      return;
    }

    // Handle single digit
    const singleDigit = numeric.slice(-1);
    const updated = [...otpDigits];
    updated[index] = singleDigit;
    setOtpDigits(updated);

    // Auto-advance to next box
    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (otpDigits[index] === '' && index > 0) {
        inputRefs.current[index - 1]?.focus();
        const updated = [...otpDigits];
        updated[index - 1] = '';
        setOtpDigits(updated);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pastedData) return;

    const updated = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      updated[i] = pastedData[i] || '';
    }
    setOtpDigits(updated);

    const nextIndex = Math.min(pastedData.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const enteredOtp = otpDigits.join('').trim();

    if (enteredOtp.length !== 6) {
      showToast('Please enter the complete 6-digit OTP.', 'error');
      return;
    }

    if (secondsRemaining <= 0) {
      showToast('OTP has expired. Please request a new OTP.', 'error');
      return;
    }

    setIsVerifying(true);
    try {
      const res = await api.verifyOtp({
        registrationId,
        email: pendingEmail,
        otp: enteredOtp
      });

      // Verification succeeded!
      setVerifiedUserData(res.user);
      setVerifiedTokenData(res.token);

      // Trigger the official Success Popup (Requirement 5 & 14)
      setSuccessPopupOpen(true);
    } catch (err: any) {
      showToast(err.message || 'Invalid OTP. Please try again.', 'error');
      // If code was invalid, refocus first box
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  // Step 3: Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isResending) return;

    setIsResending(true);
    try {
      const res = await api.resendOtp({
        registrationId,
        email: pendingEmail
      });

      setOtpExpiryTimestamp(res.expiresAt);
      setSecondsRemaining(600);
      setResendCooldown(60);
      setOtpDigits(['', '', '', '', '', '']);
      showToast('New verification code sent to your email.', 'success');
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      showToast(err.message || 'Unable to send verification email. Please try again later.', 'error');
    } finally {
      setIsResending(false);
    }
  };

  // Step 4: Change Email
  const handleChangeEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNew = newEmailInput.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanNew)) {
      showToast('Please enter a valid email address.', 'error');
      return;
    }

    if (cleanNew === pendingEmail.toLowerCase()) {
      setIsChangingEmail(false);
      return;
    }

    setSavingNewEmail(true);
    try {
      const res = await api.changeRegistrationEmail({
        registrationId,
        oldEmail: pendingEmail,
        newEmail: cleanNew
      });

      setPendingEmail(res.email);
      setOtpExpiryTimestamp(res.expiresAt);
      setSecondsRemaining(600);
      setResendCooldown(60);
      setOtpDigits(['', '', '', '', '', '']);
      setIsChangingEmail(false);
      showToast(`New verification code sent to ${res.email}`, 'success');
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      showToast(err.message || "Failed to update email. Please try again.", 'error');
    } finally {
      setSavingNewEmail(false);
    }
  };

  // Post-Verification Continue Action (Requirement 5 & 8)
  const handleContinueToLogin = () => {
    if (verifiedUserData && verifiedTokenData) {
      setAuthSession(verifiedUserData, verifiedTokenData);
    }
    setSuccessPopupOpen(false);
    setEmail(verifiedUserData?.email || pendingEmail);
    setPassword('');
    setMode('login');
    showToast('Your account has been created successfully.', 'success');
  };

  const handleAdminSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }
    if (password.length < 6) {
      showToast('Password must be at least 6 characters.', 'error');
      return;
    }
    setLoading(true);
    try {
      await setupAdmin({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password
      });
      showToast('Store administrator initialized successfully!', 'success');
      setNeedsAdminSetup(false);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to initialize administrator.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      
      {/* SUCCESS POPUP (Requirement 5 & 14): Only shown after backend confirms OTP verification */}
      {successPopupOpen ? (
        <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-emerald-100 p-6 sm:p-8 text-center animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-200 shadow-sm">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          
          <h3 className="text-xl font-extrabold text-slate-900 tracking-tight mb-2">
            Successfully Created
          </h3>
          
          <p className="text-sm text-slate-600 mb-6 leading-relaxed">
            Your account has been created successfully.
          </p>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-left mb-6 text-xs text-slate-700 space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Full Name:</span>
              <span className="font-semibold text-slate-900">{verifiedUserData?.name || pendingName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Verified Email:</span>
              <span className="font-semibold text-slate-900">{verifiedUserData?.email || pendingEmail}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Status:</span>
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Verified & Active
              </span>
            </div>
          </div>

          <button
            onClick={handleContinueToLogin}
            id="otp-continue-login-btn"
            className="w-full py-3 px-5 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/25 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Continue to Login</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        /* STANDARD MODAL CONTENT */
        <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
          
          {/* Header with Close */}
          <div className="p-5 pb-3 flex items-center justify-between border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-700 flex items-center justify-center text-white shadow-sm shadow-indigo-600/20">
                <BookOpen className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-slate-900 tracking-tight">Notes<span className="text-indigo-600">Vidya</span></span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* First-time Admin Initialization Notice */}
          {needsAdminSetup && (
            <div className="mx-5 mt-4 p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                <div>
                  <span className="font-bold block">First-Time Store Setup</span>
                  <span>No admin account exists yet in the database.</span>
                </div>
              </div>
              <button
                onClick={() => setMode('admin-setup')}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] rounded-lg transition-colors cursor-pointer shrink-0 ml-2"
              >
                Setup Admin
              </button>
            </div>
          )}

          {/* Configuration Banner if Transactional Email is Unconfigured */}
          {emailConfigError && (
            <div className="mx-5 mt-4 p-3.5 bg-amber-50 rounded-xl border border-amber-300 text-xs text-amber-900 space-y-1">
              <div className="flex items-center gap-2 font-bold text-amber-800">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Email Provider Setup Required</span>
              </div>
              <p className="text-[11px] text-amber-700 leading-normal">
                NotesVidya uses Brevo Transactional Email to dispatch customer registration OTPs. Please configure <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-amber-900">BREVO_API_KEY</code> and <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-amber-900">EMAIL_FROM</code> in environment variables or Store Settings.
              </p>
            </div>
          )}

          {/* Navigation Mode Switcher (Hidden in OTP mode) */}
          {mode !== 'admin-setup' && mode !== 'verify-otp' ? (
            <div className="grid grid-cols-2 p-1.5 bg-slate-100 mx-5 mt-4 rounded-xl text-xs font-bold text-slate-600">
              <button
                onClick={() => { setMode('login'); setEmailConfigError(null); }}
                className={`py-2 rounded-lg transition-all cursor-pointer ${
                  mode === 'login' ? 'bg-white text-indigo-600 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => { setMode('register'); setEmailConfigError(null); }}
                className={`py-2 rounded-lg transition-all cursor-pointer ${
                  mode === 'register' ? 'bg-white text-indigo-600 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                Create Account
              </button>
            </div>
          ) : mode === 'admin-setup' ? (
            <div className="mx-5 mt-4 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-700 flex items-center gap-1.5">
                <KeyRound className="w-4 h-4" />
                Store Administrator Setup
              </span>
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-xs text-slate-500 hover:text-indigo-600 font-semibold cursor-pointer"
              >
                ← Back to Sign In
              </button>
            </div>
          ) : null}

          {/* Form Content */}
          <div className="p-5 pt-4">
            
            {/* LOGIN MODE */}
            {mode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-hidden"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-hidden"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
                >
                  <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* REGISTRATION MODE (Initiates OTP flow) */}
            {mode === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Enter your full name"
                      className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-hidden"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="your.email@example.com"
                      className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-hidden"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Phone</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+91 9876543210"
                      className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-hidden"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Min 6 chars"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-hidden"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Confirm"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-hidden"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  id="register-submit-btn"
                  className="w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
                >
                  <span>{loading ? 'Sending OTP...' : 'Continue with Email Verification'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* REAL EMAIL OTP VERIFICATION SCREEN */}
            {mode === 'verify-otp' && (
              <div className="space-y-4">
                <div className="text-center space-y-1.5">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-2 border border-indigo-100">
                    <Mail className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
                    Verify Your Email
                  </h3>
                  <p className="text-xs text-slate-600 max-w-xs mx-auto">
                    We've sent a 6-digit verification code to your email address:
                  </p>
                  
                  {/* Highlighted Email & Change Email trigger */}
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full text-xs font-semibold text-slate-800 border border-slate-200">
                    <span>{pendingEmail}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setNewEmailInput(pendingEmail);
                        setIsChangingEmail(true);
                      }}
                      className="text-indigo-600 hover:text-indigo-800 transition-colors p-0.5 cursor-pointer"
                      title="Change email"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Inline Change Email Form */}
                {isChangingEmail && (
                  <form onSubmit={handleChangeEmailSubmit} className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-2">
                    <label className="block text-[11px] font-bold text-indigo-900">
                      Enter Updated Email Address:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={newEmailInput}
                        onChange={e => setNewEmailInput(e.target.value)}
                        placeholder="new.email@example.com"
                        className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-indigo-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                        required
                      />
                      <button
                        type="submit"
                        disabled={savingNewEmail}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors"
                      >
                        {savingNewEmail ? 'Updating...' : 'Update & Send'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsChangingEmail(false)}
                        className="px-2 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {/* 6-Digit OTP Boxes */}
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="flex justify-center gap-2 sm:gap-2.5 my-2">
                    {otpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={el => { inputRefs.current[idx] = el; }}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={digit}
                        onChange={e => handleDigitChange(idx, e.target.value)}
                        onKeyDown={e => handleKeyDown(idx, e)}
                        onPaste={handlePaste}
                        className={`w-11 h-12 sm:w-12 sm:h-13 text-center text-xl font-extrabold rounded-xl border transition-all focus:outline-hidden ${
                          digit
                            ? 'border-indigo-600 bg-indigo-50/30 text-indigo-950 ring-2 ring-indigo-500/20'
                            : 'border-slate-300 bg-slate-50/50 text-slate-900 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20'
                        }`}
                        autoComplete="one-time-code"
                      />
                    ))}
                  </div>

                  {/* Expiry Countdown Timer */}
                  <div className="text-center">
                    {secondsRemaining > 0 ? (
                      <span className="text-xs font-semibold text-slate-500">
                        OTP expires in <span className="font-mono font-bold text-indigo-600">{formatTimer(secondsRemaining)}</span>
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-red-600">
                        OTP has expired. Please request a new OTP.
                      </span>
                    )}
                  </div>

                  {/* Primary Verify Button */}
                  <button
                    type="submit"
                    disabled={isVerifying || otpDigits.join('').length !== 6 || secondsRemaining <= 0}
                    id="verify-otp-submit-btn"
                    className="w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white shadow-md shadow-indigo-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>{isVerifying ? 'Verifying...' : 'Verify OTP'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  {/* Resend OTP & Change Email Actions */}
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={resendCooldown > 0 || isResending}
                      className="font-bold text-indigo-600 hover:text-indigo-800 disabled:text-slate-400 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer py-1"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                      <span>
                        {resendCooldown > 0
                          ? `Resend OTP in ${resendCooldown}s`
                          : isResending
                          ? 'Sending OTP...'
                          : 'Resend OTP'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setMode('register');
                        setOtpDigits(['', '', '', '', '', '']);
                      }}
                      className="font-semibold text-slate-500 hover:text-slate-800 py-1 cursor-pointer"
                    >
                      ← Start Over
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ADMIN SETUP MODE */}
            {mode === 'admin-setup' && (
              <form onSubmit={handleAdminSetup} className="space-y-3">
                <p className="text-xs text-slate-600">
                  Configure your master administrator credentials to access the Admin Panel, manage products, and monitor sales.
                </p>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Administrator Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Store Administrator"
                      className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-hidden"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Admin Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="admin@yourdomain.com"
                      className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-hidden"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Admin Phone Number</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+91 9876543210"
                      className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-hidden"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Min 6 chars"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-hidden"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Confirm"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-hidden"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm bg-purple-700 hover:bg-purple-800 text-white shadow-md shadow-purple-700/20 transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
                >
                  <span>{loading ? 'Initializing Administrator...' : 'Save & Initialize Admin'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>

          {/* Security Trust Footer */}
          <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Cryptographic OTP email verification &bull; NotesVidya Security</span>
          </div>
        </div>
      )}
    </div>
  );
};
