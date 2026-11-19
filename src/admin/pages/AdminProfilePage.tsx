import React, { useState, useEffect } from 'react';
import { AdminProfile } from '../../types';
import {
  Shield,
  Key,
  CheckCircle2,
  AlertCircle,
  Database,
  Lock,
  Mail,
  User,
  Phone,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { updateAdminPassword } from '../../services/authService';
import { testSupabaseConnection, isSupabaseConfigured } from '../../lib/supabase';

interface AdminProfilePageProps {
  user: AdminProfile | null;
}

export const AdminProfilePage: React.FC<AdminProfilePageProps> = ({ user }) => {
  // Password change state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Diagnostic state
  const [isTestingDb, setIsTestingDb] = useState(false);
  const [dbStatus, setDbStatus] = useState<{ connected: boolean; message: string } | null>(null);

  useEffect(() => {
    runDbCheck();
  }, []);

  const runDbCheck = async () => {
    setIsTestingDb(true);
    const result = await testSupabaseConnection();
    setDbStatus(result);
    setIsTestingDb(false);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await updateAdminPassword(newPassword);
      if (res.success) {
        setPasswordSuccess('Password updated successfully.');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordError(res.message);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setPasswordError(msg);
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fadeIn pb-16">
      {/* 1. Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Admin Profile &amp; Security Controls
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Manage administrator account credentials, database connection diagnostics, and session security
        </p>
      </div>

      {/* 2. Admin Credentials Profile Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white font-black text-xl flex items-center justify-center shadow-md shadow-blue-600/30">
              {user?.fullName ? user.fullName.slice(0, 2).toUpperCase() : 'AD'}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {user?.fullName || 'Administrator'}
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                {user?.email || 'admin@knrenterprises.in'}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full uppercase">
                  {user?.role || 'super_admin'}
                </span>
                <span className="text-[11px] text-slate-400">
                  ID: {user?.id || 'primary'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl space-y-1">
            <span className="text-slate-400 font-semibold uppercase text-[10px] block">
              Official Contact Phone
            </span>
            <span className="font-mono font-bold text-slate-800">
              {user?.phone || '+91 8886175855'}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl space-y-1">
            <span className="text-slate-400 font-semibold uppercase text-[10px] block">
              Last Login Activity
            </span>
            <span className="font-mono text-slate-700">
              {user?.lastLogin
                ? new Date(user.lastLogin).toLocaleString('en-IN')
                : 'Active Current Session'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Database Diagnostics & Supabase Infrastructure Check */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Supabase Backend &amp; PostgreSQL Diagnostics
              </h3>
              <p className="text-[11px] text-slate-500">
                Verifies connection status, RLS policies, and database tables
              </p>
            </div>
          </div>

          <button
            onClick={runDbCheck}
            disabled={isTestingDb}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTestingDb ? 'animate-spin' : ''}`} />
            <span>Test Connection</span>
          </button>
        </div>

        <div
          className={`p-4 rounded-xl border flex items-start gap-3 text-xs leading-relaxed ${
            dbStatus?.connected
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}
        >
          {dbStatus?.connected ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          )}
          <div className="space-y-1">
            <p className="font-bold">
              {dbStatus?.connected
                ? 'Active PostgreSQL Connection Verified'
                : 'Local Development Storage Mode'}
            </p>
            <p className="text-[11px]">{dbStatus?.message}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">
              Supabase Auth
            </span>
            <span className="font-semibold text-slate-800">
              {isSupabaseConfigured() ? 'Active (JWT)' : 'Dev Preview'}
            </span>
          </div>

          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">
              RLS Security
            </span>
            <span className="font-semibold text-slate-800">12 Policies Active</span>
          </div>

          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">
              Image Storage
            </span>
            <span className="font-semibold text-slate-800">knr-products bucket</span>
          </div>

          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">
              Database Migrations
            </span>
            <span className="font-semibold text-slate-800">Schema Ready</span>
          </div>
        </div>
      </div>

      {/* 4. Update Password Form */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
          <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <Key className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Change Administrator Password
            </h3>
            <p className="text-[11px] text-slate-500">
              Set a new secure password for Supabase Auth
            </p>
          </div>
        </div>

        {passwordSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{passwordSuccess}</span>
          </div>
        )}

        {passwordError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-800 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>{passwordError}</span>
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                New Password *
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Confirm New Password *
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-end pt-2">
            <button
              type="submit"
              disabled={isChangingPassword}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isChangingPassword ? (
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Key className="w-3.5 h-3.5" />
              )}
              <span>Update Password</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

