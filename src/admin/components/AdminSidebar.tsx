import React from 'react';
import { AdminTab } from '../../types';
import {
  LayoutDashboard,
  Package,
  Layers,
  Boxes,
  ClipboardList,
  Users,
  BarChart3,
  Globe,
  Quote,
  HelpCircle,
  Briefcase,
  Settings,
  ShieldCheck,
  BellRing,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Trash2,
} from 'lucide-react';
import { Logo } from '../../components/Logo';

interface AdminSidebarProps {
  currentTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onLogout: () => void;
  enquiriesCount?: number;
  lowStockCount?: number;
  recycleBinCount?: number;
  adminName?: string;
  adminRole?: string;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
  onLogout,
  enquiriesCount = 0,
  lowStockCount = 0,
  recycleBinCount = 0,
  adminName = 'Depot Administrator',
  adminRole = 'Administrator',
}) => {
  const menuItems = [
    {
      id: 'dashboard' as AdminTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'products' as AdminTab,
      label: 'Products',
      icon: Package,
    },
    {
      id: 'enquiries' as AdminTab,
      label: 'Enquiries / RFQs',
      icon: ClipboardList,
      badge: enquiriesCount > 0 ? String(enquiriesCount) : undefined,
      badgeColor: 'bg-[#F57C00] text-white font-bold',
    },
    {
      id: 'customers' as AdminTab,
      label: 'Customers',
      icon: Users,
    },
    {
      id: 'recycle-bin' as AdminTab,
      label: 'Recycle Bin',
      icon: Trash2,
      badge: recycleBinCount > 0 ? String(recycleBinCount) : undefined,
      badgeColor: 'bg-amber-100 text-amber-800 font-bold',
    },
    {
      id: 'website-control' as AdminTab,
      label: 'Website Control',
      icon: Globe,
    },
    {
      id: 'settings' as AdminTab,
      label: 'Settings',
      icon: Settings,
    },
  ];

  // Helper to determine if item is active
  const isItemActive = (id: AdminTab) => {
    if (currentTab === id) return true;
    if (
      id === 'website-control' &&
      (currentTab === 'categories' ||
        currentTab === 'website-content' ||
        currentTab === 'content' ||
        currentTab === 'testimonials' ||
        currentTab === 'faqs' ||
        currentTab === 'services')
    ) {
      return true;
    }
    if (
      id === 'settings' &&
      (currentTab === 'website-settings' ||
        currentTab === 'rfq-notifications' ||
        currentTab === 'admin-profile')
    ) {
      return true;
    }
    return false;
  };

  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 z-40 bg-white border-r border-[#E2E8F0] text-[#64748B] transition-all duration-300 flex flex-col shadow-xs ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* 1. Header & Brand */}
      <div className="h-16 sm:h-20 border-b border-[#E2E8F0] px-4 flex items-center justify-between shrink-0 bg-white">
        {!isCollapsed && (
          <div className="flex items-center gap-2 overflow-hidden">
            <Logo variant="light" className="h-7 w-auto" />
            <div className="leading-tight">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#F57C00] block">
                Enterprise Admin
              </span>
              <span className="text-xs font-bold text-[#111827] truncate block">
                KNR Management
              </span>
            </div>
          </div>
        )}

        {isCollapsed && (
          <div className="mx-auto">
            <div className="w-9 h-9 rounded-xl bg-[#F57C00] text-white font-black text-xs flex items-center justify-center shadow-xs">
              KNR
            </div>
          </div>
        )}

        {/* Collapse toggle */}
        <button
          onClick={onToggleCollapse}
          className={`p-1.5 text-slate-400 hover:text-[#111827] rounded-lg hover:bg-[#F8FAFC] transition-colors cursor-pointer ${
            isCollapsed ? 'hidden' : 'block'
          }`}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Navigation Items */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 custom-scrollbar">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isItemActive(item.id);

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left group ${
                active
                  ? 'bg-[#FFF3E0] text-[#F57C00] font-bold shadow-xs'
                  : 'text-[#64748B] hover:text-[#111827] hover:bg-[#F8FAFC]'
              } ${isCollapsed ? 'justify-center px-0' : ''}`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                  active ? 'text-[#F57C00]' : 'text-slate-400 group-hover:text-[#111827]'
                }`}
              />

              {!isCollapsed && (
                <span className="flex-1 truncate">{item.label}</span>
              )}

              {!isCollapsed && item.badge && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${
                    item.badgeColor || 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}

              {isCollapsed && item.badge && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#F57C00]" />
              )}
            </button>
          );
        })}
      </nav>

      {/* 3. Bottom Links & Admin Session Summary */}
      <div className="p-3 border-t border-[#E2E8F0] space-y-2 bg-[#F8FAFC] shrink-0">
        {/* View public website link */}
        <a
          href="#home"
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-[#64748B] hover:text-[#F57C00] hover:bg-white border border-transparent hover:border-[#E2E8F0] transition-all cursor-pointer ${
            isCollapsed ? 'justify-center px-0' : ''
          }`}
          title="Open live public website in new tab"
        >
          <ExternalLink className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span>View Public Site</span>}
        </a>

        {/* User Card & Logout */}
        <div
          className={`flex items-center gap-2.5 p-2 bg-white rounded-xl border border-[#E2E8F0] ${
            isCollapsed ? 'justify-center p-1.5' : ''
          }`}
        >
          <div className="w-8 h-8 rounded-lg bg-[#FFF3E0] text-[#F57C00] font-black text-xs flex items-center justify-center shrink-0">
            {adminName.charAt(0).toUpperCase()}
          </div>

          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-[#111827] truncate">
                {adminName}
              </div>
              <div className="text-[10px] text-[#64748B] capitalize truncate">
                {adminRole}
              </div>
            </div>
          )}

          <button
            onClick={onLogout}
            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
            title="Logout of admin panel"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
