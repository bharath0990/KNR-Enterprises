import React, { useState, ReactNode } from 'react';
import { AdminTab, AdminProfile } from '../../types';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';

interface AdminLayoutProps {
  currentTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  user: AdminProfile | null;
  onLogout: () => void;
  children: ReactNode;
  enquiriesCount?: number;
  lowStockCount?: number;
  recycleBinCount?: number;
  onOpenNotificationReference?: (referenceId: string, referenceTab?: AdminTab) => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentTab,
  onSelectTab,
  user,
  onLogout,
  children,
  enquiriesCount = 0,
  lowStockCount = 0,
  recycleBinCount = 0,
  onOpenNotificationReference,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans flex">
      {/* 1. Desktop & Tablet Sidebar */}
      <div className="hidden md:block">
        <AdminSidebar
          currentTab={currentTab}
          onSelectTab={onSelectTab}
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
          onLogout={onLogout}
          enquiriesCount={enquiriesCount}
          lowStockCount={lowStockCount}
          recycleBinCount={recycleBinCount}
          adminName={user?.fullName}
          adminRole={user?.role}
        />
      </div>

      {/* 2. Mobile Drawer Sidebar */}
      {mobileSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            onClick={() => setMobileSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
          />

          <div className="relative w-64 max-w-xs bg-white border-r border-[#E2E8F0] flex flex-col z-10 shadow-2xl">
            <AdminSidebar
              currentTab={currentTab}
              onSelectTab={(tab) => {
                onSelectTab(tab);
                setMobileSidebarOpen(false);
              }}
              isCollapsed={false}
              onToggleCollapse={() => setMobileSidebarOpen(false)}
              onLogout={onLogout}
              enquiriesCount={enquiriesCount}
              lowStockCount={lowStockCount}
              recycleBinCount={recycleBinCount}
              adminName={user?.fullName}
              adminRole={user?.role}
            />
          </div>
        </div>
      )}

      {/* 3. Main Content Wrapper */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          isCollapsed ? 'md:pl-20' : 'md:pl-64'
        }`}
      >
        <AdminHeader
          currentTab={currentTab}
          isSidebarCollapsed={isCollapsed}
          onToggleSidebar={() => setIsCollapsed(!isCollapsed)}
          onMobileOpenSidebar={() => setMobileSidebarOpen(true)}
          user={user}
          onLogout={onLogout}
          onSelectTab={onSelectTab}
          pendingEnquiriesCount={enquiriesCount}
          onOpenNotificationReference={onOpenNotificationReference}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

