import React from 'react';
import { AdminTab } from '../../types';
import {
  LayoutDashboard,
  Package,
  Layers,
  Boxes,
  ClipboardList,
  Globe,
  Quote,
  HelpCircle,
  Briefcase,
  Settings,
  ShieldCheck,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
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
      id: 'categories' as AdminTab,
      label: 'Categories',
      icon: Layers,
    },
    {
      id: 'inventory' as AdminTab,
      label: 'Inventory',
      icon: Boxes,
      badge: lowStockCount > 0 ? `${lowStockCount} alert` : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    },
    {
      id: 'enquiries' as AdminTab,
      label: 'Customer Enquiries',
      icon: ClipboardList,
      badge: enquiriesCount > 0 ? String(enquiriesCount) : undefined,
      badgeColor: 'bg-blue-500 text-white font-bold',
    },
    {
      id: 'website-content' as AdminTab,
      label: 'Website Content',
      icon: Globe,
    },
    {
      id: 'testimonials' as AdminTab,
      label: 'Testimonials',
      icon: Quote,
    },
    {
      id: 'faqs' as AdminTab,
      label: 'FAQs',
      icon: HelpCircle,
    },
    {
      id: 'services' as AdminTab,
      label: 'Services',
      icon: Briefcase,
    },
    {
      id: 'website-settings' as AdminTab,
      label: 'Website Settings',
      icon: Settings,
    },
    {
      id: 'admin-profile' as AdminTab,
      label: 'Admin Profile',
      icon: ShieldCheck,
    },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 z-40 bg-[#0a0e17] border-r border-slate-800 text-slate-300 transition-all duration-300 flex flex-col ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* 1. Header & Brand */}
      <div className="h-16 sm:h-20 border-b border-slate-800/80 px-4 flex items-center justify-between shrink-0">
        {!isCollapsed && (
          <div className="flex items-center gap-2 overflow-hidden">
            <Logo variant="dark" className="h-7 w-auto" />
            <div className="leading-tight">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 block">
                Enterprise Admin
              </span>
              <span className="text-xs font-bold text-white truncate block">
                KNR Management
              </span>
            </div>
          </div>
        )}

        {isCollapsed && (
          <div className="mx-auto">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-black text-sm flex items-center justify-center shadow-md">
              KNR
            </div>
          </div>
        )}

        {/* Collapse toggle */}
        <button
          onClick={onToggleCollapse}
          className={`p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors cursor-pointer ${
            isCollapsed ? 'hidden' : 'block'
          }`}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Navigation items (12 items) */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 custom-scrollbar">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer group relative ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              } ${isCollapsed ? 'justify-center px-0' : ''}`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon
                className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 transition-colors ${
                  isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                }`}
              />

              {!isCollapsed && (
                <span className="truncate flex-1 text-left">{item.label}</span>
              )}

              {!isCollapsed && item.badge && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                    item.badgeColor || 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}

              {/* Tooltip for collapsed state */}
              {isCollapsed && (
                <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-900 border border-slate-700 text-white text-xs rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50 whitespace-nowrap">
                  {item.label}
                  {item.badge && ` (${item.badge})`}
                </div>
              )}
            </button>
          );
        })}

        {/* Public Website Link */}
        <div className="pt-3 mt-3 border-t border-slate-800/80">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors ${
              isCollapsed ? 'justify-center px-0' : ''
            }`}
            title="View Public Website"
          >
            <ExternalLink className="w-4 h-4 shrink-0 text-orange-400" />
            {!isCollapsed && <span>View Live Website</span>}
          </a>
        </div>
      </nav>

      {/* 3. Footer / User profile & Logout */}
      <div className="p-3 border-t border-slate-800/80 shrink-0 bg-[#080c14]">
        {!isCollapsed ? (
          <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/40 text-blue-400 font-bold text-xs flex items-center justify-center shrink-0">
                {adminName ? adminName.slice(0, 2).toUpperCase() : 'AD'}
              </div>
              <div className="min-w-0 leading-tight">
                <p className="text-xs font-bold text-white truncate">{adminName}</p>
                <p className="text-[10px] text-slate-400 truncate capitalize">{adminRole}</p>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={onToggleCollapse}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              title="Expand sidebar"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={onLogout}
              className="p-2 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};

