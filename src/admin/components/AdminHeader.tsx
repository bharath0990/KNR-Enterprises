import React, { useState } from 'react';
import { AdminTab, AdminProfile } from '../../types';
import {
  Menu,
  Bell,
  ExternalLink,
  Database,
  ChevronRight,
  Shield,
  User,
  LogOut,
  CheckCircle2,
} from 'lucide-react';
import { isSupabaseConfigured } from '../../lib/supabase';

interface AdminHeaderProps {
  currentTab: AdminTab;
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onMobileOpenSidebar: () => void;
  user: AdminProfile | null;
  onLogout: () => void;
  onSelectTab: (tab: AdminTab) => void;
  pendingEnquiriesCount?: number;
}

const tabTitles: Record<AdminTab, string> = {
  dashboard: 'Dashboard Overview',
  products: 'Product Management',
  categories: 'Category Management',
  inventory: 'Inventory & Stock Logs',
  enquiries: 'Customer RFQ Enquiries',
  'website-content': 'Website Content Management',
  testimonials: 'Customer Testimonials',
  faqs: 'FAQs & Knowledge Base',
  services: 'Institutional Services',
  'website-settings': 'Website Control Settings',
  'admin-profile': 'Administrator Profile & Security',
};

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  currentTab,
  isSidebarCollapsed,
  onToggleSidebar,
  onMobileOpenSidebar,
  user,
  onLogout,
  onSelectTab,
  pendingEnquiriesCount = 0,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const isDbConnected = isSupabaseConfigured();

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 h-16 sm:h-20 px-4 sm:px-6 flex items-center justify-between transition-all">
      {/* 1. Left: Mobile menu toggle + Breadcrumb */}
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button
          onClick={onMobileOpenSidebar}
          className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Toggle mobile sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Desktop collapse toggle */}
        <button
          onClick={onToggleSidebar}
          className="hidden md:flex p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Breadcrumb Navigation */}
        <nav className="flex items-center space-x-1.5 text-xs sm:text-sm font-medium text-slate-500">
          <span className="hidden sm:inline hover:text-slate-800">Admin</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
          <span className="font-bold text-slate-900">
            {tabTitles[currentTab] || 'Dashboard'}
          </span>
        </nav>
      </div>

      {/* 2. Right: Database status + View site + Notifications + User profile */}
      <div className="flex items-center space-x-2 sm:space-x-4">
        {/* Supabase Status Pill */}
        <div
          className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors ${
            isDbConnected
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}
          title={
            isDbConnected
              ? 'Supabase PostgreSQL & Storage Connected'
              : 'Running in Local Storage Development Mode. Configure VITE_SUPABASE_URL in .env to connect to live Supabase.'
          }
        >
          <Database className={`w-3.5 h-3.5 ${isDbConnected ? 'text-emerald-500' : 'text-amber-500'}`} />
          <span>{isDbConnected ? 'Supabase Live' : 'Local Dev Store'}</span>
        </div>

        {/* View Public Website */}
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden md:inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-blue-200 bg-white hover:bg-blue-50/50 transition-all cursor-pointer"
        >
          <span>View Website</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-slate-600 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-colors relative cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {pendingEnquiriesCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white" />
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 z-50 animate-fadeIn">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Admin Notifications
                </h4>
                <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-full">
                  {pendingEnquiriesCount} New
                </span>
              </div>

              <div className="py-2 space-y-2 max-h-60 overflow-y-auto">
                {pendingEnquiriesCount > 0 ? (
                  <div
                    onClick={() => {
                      onSelectTab('enquiries');
                      setShowNotifications(false);
                    }}
                    className="p-2.5 rounded-xl bg-blue-50/50 hover:bg-blue-50 border border-blue-100 transition-colors cursor-pointer text-left"
                  >
                    <div className="text-xs font-bold text-blue-900">
                      Pending RFQ Enquiries
                    </div>
                    <div className="text-[11px] text-blue-700 mt-0.5">
                      You have {pendingEnquiriesCount} new customer enquiry requiring response.
                    </div>
                  </div>
                ) : (
                  <div className="py-4 text-center text-xs text-slate-500">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                    All customer RFQ enquiries are up to date.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Admin User Avatar & Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
              {user?.fullName ? user.fullName.slice(0, 2).toUpperCase() : 'AD'}
            </div>
            <div className="hidden lg:block text-left leading-tight">
              <span className="text-xs font-bold text-slate-900 block truncate max-w-[120px]">
                {user?.fullName || 'Administrator'}
              </span>
              <span className="text-[10px] text-slate-500 block capitalize">
                {user?.role || 'Admin'}
              </span>
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-2xl py-2 z-50 animate-fadeIn">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {user?.fullName || 'Administrator'}
                </p>
                <p className="text-[11px] text-slate-500 truncate">
                  {user?.email || 'admin@knrenterprises.in'}
                </p>
              </div>

              <button
                onClick={() => {
                  onSelectTab('admin-profile');
                  setShowUserMenu(false);
                }}
                className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
              >
                <User className="w-4 h-4 text-slate-400" />
                <span>My Profile &amp; Password</span>
              </button>

              <button
                onClick={() => {
                  onSelectTab('website-settings');
                  setShowUserMenu(false);
                }}
                className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
              >
                <Shield className="w-4 h-4 text-slate-400" />
                <span>Website Controls</span>
              </button>

              <div className="pt-1 mt-1 border-t border-slate-100">
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    onLogout();
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

