import React, { useState, useEffect } from 'react';
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
  Edit3,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { api } from '../lib/api.js';

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
  const [mode, setMode] = useState<
    'login' | 'register' | 'otp-verify' | 'success' | 'forgot-password' | 'admin-setup'
  >(initialMode);
  const [needsAdminSetup, setNeedsAdminSetup] = useState(false);
  const { login, loginWithGoogle, activateCustomerAccount, setupAdmin, resetPassword } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // OTP Verification states
  const [otp, setOtp] = useState('');
  const [registrationId, setRegistrationId] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [otpExpiresAt, setOtpExpiresAt] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('10:00');
  const [emailDeliveryWarning, setEmailDeliveryWarning] = useState<{
    isIpRestricted: boolean;
    detectedIp?: string;
    actionUrl?: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    api.checkNeedsAdminSetup()
      .then(res => {
        if (res.needsAdminSetup) {
          setNeedsAdminSetup(true);
        }
      })
      .catch(() => {});
  }, []);

  // Countdown timer for OTP expiry
  useEffect(() => {
    if (mode !== 'otp-verify' || !otpExpiresAt) return;

    const timer = setInterval(() => {
      const remaining = Math.max(0, otpExpiresAt - Date.now());
      if (remaining <= 0) {
        setTimeRemaining('00:00');
        clearInterval(timer);
      } else {
        const mins = Math.floor(remaining / 60000);
        const secs = Math.floor((remaining % 60000) / 1000);
        setTimeRemaining(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [mode, otpExpiresAt]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email.trim(), password);
      showToast('Signed in successfully!', 'success');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      let msg = 'Failed to sign in. Please check your credentials.';
      const errCode = err.code || '';
      const errMsg = err.message || '';

      if (
        errCode === 'auth/invalid-credential' ||
        errCode === 'auth/wrong-password' ||
        errMsg.toLowerCase().includes('password')
      ) {
        msg = 'Invalid email or password. Please verify and try again.';
      } else if (
        errCode === 'auth/user-not-found' ||
        errMsg.toLowerCase().includes('user not found')
      ) {
        msg = 'No customer account found with this email. Please create an account.';
      } else if (
        errCode === 'auth/user-disabled' ||
        errMsg.toLowerCase().includes('disabled')
      ) {
        msg = 'This account has been disabled. Please contact support@notesvidya.com.';
      } else if (
        errCode === 'auth/network-request-failed' ||
        errMsg.toLowerCase().includes('network')
      ) {
        msg = 'Network connection issue. Please check your internet connection.';
      } else if (errCode === 'auth/too-many-requests') {
        msg = 'Too many failed login attempts. Please try again later or reset password.';
      } else if (errCode === 'auth/invalid-email') {
        msg = 'Please enter a valid email address.';
      } else if (errMsg) {
        msg = errMsg;
      }
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
      showToast('Signed in with Google successfully!', 'success');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
        showToast(err.message || 'Google sign-in could not be completed.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Customer enters details -> server validates & Brevo sends 6-digit OTP
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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

      setRegistrationId(res.registrationId);
      setOtpExpiresAt(res.expiresAt || (Date.now() + 600000));
      setResendCooldown(60);
      setEmailDeliveryWarning(res.emailDeliveryWarning || null);
      setOtp('');

      setMode('otp-verify');
      showToast(`Verification code sent to ${cleanEmail}`, 'success');
    } catch (err: any) {
      let msg = err.message || 'Registration failed. Please try again.';
      if (err.code === 'auth/email-already-in-use' || msg.includes('already exists')) {
        msg = 'An account with this email already exists. Please sign in.';
      }
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Customer enters OTP -> server verifies OTP -> Firebase Account & Firestore doc created
  const handleOtpVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanOtp = otp.trim();
    if (cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
      showToast('Please enter a valid 6-digit OTP code.', 'error');
      return;
    }

    setLoading(true);
    try {
      // 1. Server verifies OTP cryptographically
      await api.verifyOtp({
        registrationId,
        email: email.trim().toLowerCase(),
        otp: cleanOtp
      });

      // 2. Create/activate customer account in Firebase Authentication & Cloud Firestore
      await activateCustomerAccount({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password
      });

      // 3. Trigger celebration confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {
        // ignore confetti errors
      }

      // 4. Move to Successfully Created screen
      setMode('success');
      showToast('Account successfully verified and activated in Firebase!', 'success');
    } catch (err: any) {
      const msg = err.message || 'Invalid verification code. Please try again.';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || loading) return;

    setLoading(true);
    try {
      const res = await api.resendOtp({
        registrationId,
        email: email.trim().toLowerCase()
      });

      setOtpExpiresAt(res.expiresAt || (Date.now() + 600000));
      setResendCooldown(60);
      setEmailDeliveryWarning(res.emailDeliveryWarning || null);
      showToast('A new 6-digit verification code has been sent!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to resend code. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      showToast('Please enter your email address to reset password.', 'error');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email.trim());
      showToast(`Password reset link sent to ${email.trim()}`, 'success');
      setMode('login');
    } catch (err: any) {
      showToast(err.message || 'Failed to send password reset email.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      showToast('Password must be at least 6 characters.', 'error');
      return;
    }
    setLoading(true);
    try {
      await setupAdmin({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password
      });
      showToast('Administrator configured in Firebase Auth & Firestore!', 'success');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to configure administrator.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header with Close */}
        <div className="p-5 pb-3 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-700 flex items-center justify-center text-white shadow-xs shadow-indigo-600/20">
              <BookOpen className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-slate-900 tracking-tight">
              Notes<span className="text-indigo-600">Vidya</span>
            </span>
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

        {/* Navigation Mode Switcher */}
        {mode === 'login' || mode === 'register' ? (
          <div className="grid grid-cols-2 p-1.5 bg-slate-100 mx-5 mt-4 rounded-xl text-xs font-bold text-slate-600">
            <button
              onClick={() => setMode('login')}
              className={`py-2 rounded-lg transition-all cursor-pointer ${
                mode === 'login' ? 'bg-white text-indigo-600 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode('register')}
              className={`py-2 rounded-lg transition-all cursor-pointer ${
                mode === 'register' ? 'bg-white text-indigo-600 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Create Account
            </button>
          </div>
        ) : mode === 'otp-verify' ? (
          <div className="mx-5 mt-4 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 uppercase tracking-wider">
              <KeyRound className="w-4 h-4" />
              <span>Step 2: Email OTP Verification</span>
            </div>
            <button
              type="button"
              onClick={() => setMode('register')}
              className="text-xs text-slate-500 hover:text-indigo-600 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Details</span>
            </button>
          </div>
        ) : mode === 'success' ? (
          <div className="mx-5 mt-4 flex items-center justify-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-200">
              <Check className="w-3.5 h-3.5" />
              Account Created & Verified
            </span>
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
        ) : (
          <div className="mx-5 mt-4 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
              <Lock className="w-4 h-4" />
              Reset Password
            </span>
            <button
              type="button"
              onClick={() => setMode('login')}
              className="text-xs text-slate-500 hover:text-indigo-600 font-semibold cursor-pointer"
            >
              ← Back to Sign In
            </button>
          </div>
        )}

        {/* Form Content */}
        <div className="p-5 pt-4">
          
          {/* LOGIN MODE */}
          {mode === 'login' && (
            <div className="space-y-3.5">
              {/* Google One-Click Sign In */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 shadow-2xs transition-all flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              <div className="relative my-3 flex items-center justify-center">
                <div className="border-t border-slate-200 w-full" />
                <span className="bg-white px-2.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  or with email
                </span>
              </div>

              <form onSubmit={handleLogin} className="space-y-3">
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
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">Password</label>
                    <button
                      type="button"
                      onClick={() => setMode('forgot-password')}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
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
                  <span>{loading ? 'Authenticating with Firebase...' : 'Sign In'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* REGISTRATION MODE - Step 1 */}
          {mode === 'register' && (
            <div className="space-y-3.5">
              {/* Google One-Click Sign Up */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 shadow-2xs transition-all flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Sign up with Google</span>
              </button>

              <div className="relative my-3 flex items-center justify-center">
                <div className="border-t border-slate-200 w-full" />
                <span className="bg-white px-2.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  or with email & OTP
                </span>
              </div>

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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Phone (Optional)</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+91 9876543210"
                      className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-hidden"
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
                  <span>{loading ? 'Sending Brevo OTP...' : 'Send Verification OTP'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* OTP VERIFICATION MODE - Step 2 */}
          {mode === 'otp-verify' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-2xl text-center">
                <p className="text-xs text-indigo-950 font-medium leading-relaxed">
                  We have sent a secure 6-digit verification code to:
                </p>
                <p className="text-sm font-bold text-indigo-700 mt-0.5">{email}</p>
                <div className="mt-2 flex items-center justify-center gap-1.5 text-xs text-indigo-600 font-semibold">
                  <span>Code expires in:</span>
                  <span className="font-mono bg-white px-2 py-0.5 rounded-md border border-indigo-200">
                    {timeRemaining}
                  </span>
                </div>
              </div>

              {emailDeliveryWarning?.isIpRestricted && (
                <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 leading-relaxed">
                  <div className="flex items-center gap-1.5 font-bold mb-0.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Brevo Delivery Notice</span>
                  </div>
                  <span>{emailDeliveryWarning.message}</span>
                </div>
              )}

              <form onSubmit={handleOtpVerifySubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 text-center">
                    Enter 6-Digit Verification Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    pattern="[0-9]{6}"
                    inputMode="numeric"
                    autoFocus
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    className="w-full text-center tracking-[0.4em] font-mono text-xl py-2.5 px-4 border-2 border-indigo-200 focus:border-indigo-600 rounded-xl focus:outline-hidden transition-colors"
                    required
                  />
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendCooldown > 0 || loading}
                    className={`font-semibold flex items-center gap-1 cursor-pointer ${
                      resendCooldown > 0
                        ? 'text-slate-400 cursor-not-allowed'
                        : 'text-indigo-600 hover:text-indigo-800'
                    }`}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    <span>
                      {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend Verification Code'}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('register')}
                    className="text-slate-500 hover:text-slate-700"
                  >
                    Change email
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  id="verify-otp-btn"
                  className="w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-md shadow-indigo-600/20 transition-all cursor-pointer flex items-center justify-center gap-2 mt-3"
                >
                  <span>{loading ? 'Activating Firebase Account...' : 'Verify & Activate Account'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* SUCCESS SCREEN - "Successfully Created" */}
          {mode === 'success' && (
            <div className="text-center py-2 space-y-4">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner animate-in zoom-in-50 duration-300">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-lg font-black text-slate-900">Successfully Created!</h3>
                <p className="text-xs text-slate-600 mt-1 max-w-xs mx-auto leading-relaxed">
                  Your NotesVidya customer account has been created and verified with Firebase Authentication & Cloud Firestore.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-left text-xs space-y-1.5">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Customer Name</span>
                  <span className="font-bold text-slate-900">{name || 'Customer'}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Email</span>
                  <span className="font-bold text-slate-900">{email}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Account Status</span>
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Active & Verified
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Firestore Profile</span>
                  <span className="font-mono text-[11px] text-indigo-600 font-semibold">customers/{email.split('@')[0]}</span>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (onSuccess) onSuccess();
                    onClose();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Continue to Store & Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-xs text-slate-500 hover:text-indigo-600 font-semibold py-1"
                >
                  Sign in with another account
                </button>
              </div>
            </div>
          )}

          {/* FORGOT PASSWORD MODE */}
          {mode === 'forgot-password' && (
            <form onSubmit={handleForgotPassword} className="space-y-3.5">
              <p className="text-xs text-slate-600 leading-relaxed">
                Enter the email associated with your account. We will send you a secure Firebase password reset link.
              </p>
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

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                <span>{loading ? 'Sending Reset Link...' : 'Send Password Reset Link'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
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
          <span>Real Firebase Authentication &bull; Cloud Firestore Persistent Storage</span>
        </div>
      </div>
    </div>
  );
};

