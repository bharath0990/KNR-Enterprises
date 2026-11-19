import React, { useState, useRef, useEffect } from 'react';
import { AdminTab, AdminProfile, AdminNotification } from '../../types';
import {
  Menu,
  Bell,
  ExternalLink,
  ChevronRight,
  Shield,
  User,
  LogOut,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Wifi,
  WifiOff,
  ShoppingCart,
  MessageCircle,
  Package,
  Boxes,
  Clock,
  Trash2,
  Check,
} from 'lucide-react';
import { useRealtime } from '../../context/RealtimeContext';

interface AdminHeaderProps {
  currentTab: AdminTab;
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onMobileOpenSidebar: () => void;
  user: AdminProfile | null;
  onLogout: () => void;
  onSelectTab: (tab: AdminTab) => void;
  pendingEnquiriesCount?: number;
  onOpenNotificationReference?: (referenceId: string, referenceTab?: AdminTab) => void;
}

const tabTitles: Record<AdminTab, string> = {
  dashboard: 'Dashboard Overview',
  products: 'Product Management',
  categories: 'Category Management',
  inventory: 'Inventory & Stock Logs',
  enquiries: 'Customer RFQ Enquiries',
  customers: 'Customer Directory',
  analytics: 'Procurement Analytics',
  'website-content': 'Website Content Management',
  content: 'Website Content Management',
  testimonials: 'Customer Testimonials',
  faqs: 'FAQs & Knowledge Base',
  services: 'Institutional Services',
  'website-settings': 'Website Control Settings',
  settings: 'Website Control Settings',
  'rfq-notifications': 'RFQ Notification Settings',
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
  onOpenNotificationReference,
}) => {
  const {
    connectionStatus,
    lastSyncTime,
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  } = useRealtime();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close popovers on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatSyncTime = (date: Date) => {
    try {
      return date.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
    } catch {
      return 'Just now';
    }
  };

  const formatNotifTime = (isoString: string) => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const mins = Math.floor(diffMs / 60000);
      if (mins < 1) return 'Just now';
      if (mins < 60) return `${mins}m ago`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `${hrs}h ago`;
      return new Date(isoString).toLocaleDateString('en-IN');
    } catch {
      return 'Recently';
    }
  };

  const getNotifIcon = (type: AdminNotification['type']) => {
    switch (type) {
      case 'rfq':
        return <ShoppingCart className="w-4 h-4 text-[#F57C00]" />;
      case 'contact':
        return <MessageCircle className="w-4 h-4 text-blue-500" />;
      case 'inventory':
        return <Boxes className="w-4 h-4 text-amber-500" />;
      case 'product':
        return <Package className="w-4 h-4 text-purple-500" />;
      default:
        return <Bell className="w-4 h-4 text-[#F57C00]" />;
    }
  };

  const handleNotificationClick = (notif: AdminNotification) => {
    markAsRead(notif.id);
    setShowNotifications(false);
    if (onOpenNotificationReference && notif.referenceId) {
      onOpenNotificationReference(notif.referenceId, notif.referenceTab);
    } else if (notif.referenceTab) {
      onSelectTab(notif.referenceTab);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] h-16 sm:h-20 px-4 sm:px-6 flex items-center justify-between transition-all shadow-xs">
      {/* 1. Left: Mobile menu toggle + Desktop collapse toggle + Breadcrumb */}
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button
          onClick={onMobileOpenSidebar}
          className="md:hidden p-2 text-slate-600 hover:text-[#111827] rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Toggle mobile sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Desktop collapse toggle */}
        <button
          onClick={onToggleSidebar}
          className="hidden md:flex p-2 text-slate-500 hover:text-[#111827] rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Breadcrumb Navigation */}
        <nav className="flex items-center space-x-1.5 text-xs sm:text-sm font-medium text-slate-500">
          <span className="hidden sm:inline hover:text-[#111827]">Admin</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
          <span className="font-bold text-[#111827]">
            {tabTitles[currentTab] || 'Dashboard'}
          </span>
        </nav>
      </div>

      {/* 2. Right: Real-time Connection Status + Notification Bell + User Profile */}
      <div className="flex items-center space-x-2 sm:space-x-4">
        {/* Real-time Connection Status Pill */}
        <div
          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold border transition-colors ${
            connectionStatus === 'connected'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : connectionStatus === 'connecting' || connectionStatus === 'reconnecting'
              ? 'bg-amber-50 text-amber-700 border-amber-200'
              : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}
          title={`Realtime Status: ${connectionStatus}. Last synchronization: ${formatSyncTime(lastSyncTime)}`}
        >
          {connectionStatus === 'connected' ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="capitalize hidden sm:inline">Connected</span>
              <span className="text-[10px] text-emerald-600 font-normal hidden lg:inline">
                • {formatSyncTime(lastSyncTime)}
              </span>
            </>
          ) : connectionStatus === 'reconnecting' || connectionStatus === 'connecting' ? (
            <>
              <RefreshCw className="w-3 h-3 text-amber-600 animate-spin" />
              <span className="capitalize">{connectionStatus}</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3 text-rose-500" />
              <span>Offline</span>
            </>
          )}
        </div>

        {/* Notification Bell Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-slate-500 hover:text-[#111827] rounded-xl hover:bg-slate-100 transition-colors relative cursor-pointer"
            aria-label="Open notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 bg-[#F57C00] text-white text-[10px] font-black rounded-full flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Popover */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-[#E2E8F0] z-50 overflow-hidden animate-fadeIn">
              {/* Header */}
              <div className="px-4 py-3 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-[#111827]">Live Notifications</h4>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FFF3E0] text-[#F57C00]">
                      {unreadCount} new
                    </span>
                  )}
                </div>

                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[11px] font-semibold text-[#F57C00] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>

              {/* Notification List */}
              <div className="max-h-80 overflow-y-auto divide-y divide-[#E2E8F0] custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 px-4">
                    <Bell className="w-8 h-8 mx-auto text-slate-300 mb-2 opacity-50" />
                    <p className="text-xs font-bold text-slate-700">No notifications</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      New customer RFQs and catalog events will appear here in real time.
                    </p>
                  </div>
                ) : (
                  notifications.slice(0, 15).map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`p-3.5 hover:bg-[#F8FAFC] transition-colors cursor-pointer flex items-start gap-3 ${
                        !notif.read ? 'bg-orange-50/40' : ''
                      }`}
                    >
                      <div className="p-2 rounded-xl bg-white border border-[#E2E8F0] shrink-0 mt-0.5 shadow-xs">
                        {getNotifIcon(notif.type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h5 className="text-xs font-bold text-[#111827] truncate">
                            {notif.title}
                          </h5>
                          <span className="text-[10px] text-slate-400 whitespace-nowrap">
                            {formatNotifTime(notif.timestamp)}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#64748B] mt-0.5 line-clamp-2 leading-relaxed">
                          {notif.message}
                        </p>
                        {notif.amount && (
                          <div className="text-[10px] font-mono font-bold text-[#16A34A] mt-1">
                            Est. ₹{notif.amount.toLocaleString('en-IN')}
                          </div>
                        )}
                      </div>

                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-[#F57C00] shrink-0 mt-1.5" />
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="p-2.5 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-between text-xs">
                  <button
                    onClick={() => {
                      onSelectTab('enquiries');
                      setShowNotifications(false);
                    }}
                    className="text-[11px] font-bold text-[#F57C00] hover:underline cursor-pointer"
                  >
                    View All Enquiries →
                  </button>

                  <button
                    onClick={clearNotifications}
                    className="text-[11px] text-slate-400 hover:text-rose-600 flex items-center gap-1 cursor-pointer"
                    title="Clear notification list"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear list</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="User profile menu"
          >
            <div className="w-8 h-8 rounded-lg bg-[#FFF3E0] text-[#F57C00] font-black text-xs flex items-center justify-center border border-orange-200 shadow-xs">
              {(user?.fullName || 'A').charAt(0).toUpperCase()}
            </div>
            <div className="hidden lg:block text-left text-xs">
              <span className="font-bold text-[#111827] block truncate max-w-[120px]">
                {user?.fullName || 'Administrator'}
              </span>
              <span className="text-[10px] text-slate-400 block capitalize">
                {user?.role || 'Admin'}
              </span>
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-[#E2E8F0] p-2 z-50 animate-fadeIn text-xs">
              <div className="p-3 border-b border-[#E2E8F0] mb-1">
                <div className="font-bold text-[#111827] truncate">
                  {user?.fullName || 'Administrator'}
                </div>
                <div className="text-[11px] text-slate-400 truncate">
                  {user?.email || 'admin@knrenterprises.com'}
                </div>
              </div>

              <button
                onClick={() => {
                  onSelectTab('admin-profile');
                  setShowUserMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 hover:text-[#F57C00] hover:bg-[#FFF3E0] rounded-xl transition-colors text-left cursor-pointer"
              >
                <User className="w-4 h-4" />
                <span>Admin Profile & Security</span>
              </button>

              <button
                onClick={() => {
                  onSelectTab('website-settings');
                  setShowUserMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 hover:text-[#F57C00] hover:bg-[#FFF3E0] rounded-xl transition-colors text-left cursor-pointer"
              >
                <Shield className="w-4 h-4" />
                <span>Website Settings</span>
              </button>

              <div className="my-1 border-t border-[#E2E8F0]" />

              <button
                onClick={() => {
                  setShowUserMenu(false);
                  onLogout();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors text-left font-semibold cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
