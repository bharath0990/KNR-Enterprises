import React, { useState } from 'react';
import {
  Lock,
  Mail,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  Key,
  CheckCircle2,
  Database,
  ArrowLeft,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Logo } from '../../components/Logo';
import { useAuth } from '../../context/AuthContext';
import { sendPasswordReset } from '../../services/authService';
import { isSupabaseConfigured } from '../../lib/supabase';

interface AdminLoginPageProps {
  onSuccess: () => void;
  onBackToWebsite: () => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({
  onSuccess,
  onBackToWebsite,
}) => {
  const { login } = useAuth();
  const [mode, setMode] = useState<'login' | 'forgot_password'>('login');

  // Login form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Reset form
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);
  const [resetErrorMessage, setResetErrorMessage] = useState<string | null>(null);

  const isDbConfigured = isSupabaseConfigured();

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const res = await login(email, password);
      if (res.success) {
        onSuccess();
      } else {
        setErrorMessage(res.error || 'Invalid administrator credentials.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetErrorMessage(null);
    setResetSuccessMessage(null);
    setResetLoading(true);

    try {
      const res = await sendPasswordReset(resetEmail);
      if (res.success) {
        setResetSuccessMessage(res.message);
      } else {
        setResetErrorMessage(res.message);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setResetErrorMessage(msg);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#111827] flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-[#FFF3E0] selection:text-[#F57C00] relative overflow-hidden">
      {/* Background ambient warm orange accent glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-100/40 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-slate-200/50 rounded-full blur-[140px] pointer-events-none" />

      {/* Back to public website button */}
      <div className="absolute top-6 left-6 z-10">
        <button
          onClick={onBackToWebsite}
          className="flex items-center gap-2 text-xs font-semibold text-[#64748B] hover:text-[#111827] px-3.5 py-2 rounded-xl border border-[#E2E8F0] hover:border-slate-300 bg-white shadow-xs transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to KNR Website</span>
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        {/* Brand Logo & Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center mb-1">
            <Logo variant="light" className="h-9 w-auto" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF3E0] border border-orange-200 text-[#F57C00] text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Authorized Personnel Only</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#111827] tracking-tight font-display">
            Admin Portal Access
          </h2>
          <p className="text-xs text-[#64748B] max-w-xs mx-auto">
            Manage product catalog, pricing slabs, Swachh Bharat inventory, and government RFQ enquiries
          </p>
        </div>

        {/* Card */}
        <div className="mt-8 bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 shadow-xl">
          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-rose-700 text-xs font-medium animate-fadeIn">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-1.5">
                  Admin Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@example.com"
                    className="w-full bg-slate-50 border border-[#E2E8F0] rounded-xl pl-10 pr-3 py-2.5 text-sm text-[#111827] placeholder-slate-400 focus:outline-none focus:border-[#F57C00] focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-[#111827]">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot_password');
                      setErrorMessage(null);
                    }}
                    className="text-xs text-[#F57C00] hover:underline transition-colors cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-50 border border-[#E2E8F0] rounded-xl pl-10 pr-10 py-2.5 text-sm text-[#111827] placeholder-slate-400 focus:outline-none focus:border-[#F57C00] focus:bg-white transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#F57C00] hover:bg-[#E06D00] text-white py-3 px-4 rounded-xl font-bold text-sm shadow-md shadow-orange-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <span>Authenticating Credentials...</span>
                  ) : (
                    <>
                      <span>Sign In to Dashboard</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleResetSubmit} className="space-y-4">
              <div className="text-center mb-2">
                <h3 className="font-bold text-base text-[#111827]">Reset Admin Password</h3>
                <p className="text-xs text-[#64748B] mt-1">
                  Enter your registered administrator email to receive a recovery link.
                </p>
              </div>

              {resetSuccessMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-emerald-800 text-xs font-medium">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{resetSuccessMessage}</span>
                </div>
              )}

              {resetErrorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-rose-700 text-xs font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{resetErrorMessage}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-1.5">
                  Registered Admin Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="admin@example.com"
                    className="w-full bg-slate-50 border border-[#E2E8F0] rounded-xl pl-10 pr-3 py-2.5 text-sm text-[#111827] placeholder-slate-400 focus:outline-none focus:border-[#F57C00] focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full bg-[#F57C00] hover:bg-[#E06D00] text-white py-2.5 px-4 rounded-xl font-bold text-sm shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {resetLoading ? 'Sending Recovery Link...' : 'Send Password Reset Link'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setResetErrorMessage(null);
                    setResetSuccessMessage(null);
                  }}
                  className="w-full py-2 text-xs font-semibold text-[#64748B] hover:text-[#111827] transition-colors cursor-pointer"
                >
                  Return to Sign In
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Database backend badge */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-1.5 text-[11px] text-[#64748B]">
            <Database className="w-3.5 h-3.5 text-[#F57C00]" />
            <span>Supabase PostgreSQL & Realtime Backend</span>
          </div>
        </div>
      </div>
    </div>
  );
};
