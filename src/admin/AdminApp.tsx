import React, { useState, useEffect } from 'react';
import { AdminTab, Product, CustomerEnquiry } from '../types';
import { useAuth } from '../context/AuthContext';
import { AdminLayout } from './components/AdminLayout';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { DashboardOverviewPage } from './pages/DashboardOverviewPage';
import { ProductsPage } from './pages/ProductsPage';
import { ProductFormPage } from './pages/ProductFormPage';
import { EnquiriesPage } from './pages/EnquiriesPage';
import { CustomersPage } from './pages/CustomersPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { WebsiteControlPage, WebsiteControlSubtab } from './pages/WebsiteControlPage';
import { SettingsPage, SettingsSubtab } from './pages/SettingsPage';
import { RecycleBinPage } from './pages/RecycleBinPage';
import { fetchEnquiries } from '../services/enquiryService';
import { fetchProducts } from '../services/productService';
import { fetchRecycleBinItems } from '../services/recycleBinService';

interface AdminAppProps {
  onBackToWebsite: () => void;
}

export const AdminApp: React.FC<AdminAppProps> = ({ onBackToWebsite }) => {
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  // Active Admin Tab
  const [currentTab, setCurrentTab] = useState<AdminTab>(() => {
    const hash = window.location.hash.toLowerCase();
    const clean = hash.replace(/^#admin\/?/, '');
    const validTabs: AdminTab[] = [
      'dashboard',
      'products',
      'enquiries',
      'customers',
      'recycle-bin',
      'website-control',
      'settings',
      'categories',
      'inventory',
      'analytics',
      'website-content',
      'content',
      'testimonials',
      'faqs',
      'services',
      'website-settings',
      'rfq-notifications',
      'admin-profile',
    ];
    if (clean === 'content' || clean === 'website-content' || clean === 'categories' || clean === 'services' || clean === 'faqs' || clean === 'testimonials') return 'website-control';
    if (clean === 'website-settings' || clean === 'rfq-notifications' || clean === 'admin-profile') return 'settings';
    if (clean === 'inventory') return 'products';
    if (validTabs.includes(clean as AdminTab)) return clean as AdminTab;
    return 'dashboard';
  });

  // Sub-views for Product editing
  const [productFormMode, setProductFormMode] = useState<{
    isOpen: boolean;
    product: Product | null;
  }>({ isOpen: false, product: null });

  // Selected enquiry for direct viewing from dashboard or notifications
  const [selectedEnquiry, setSelectedEnquiry] = useState<CustomerEnquiry | null>(null);

  // Badge notification counts
  const [enquiriesCount, setEnquiriesCount] = useState<number>(0);
  const [lowStockCount, setLowStockCount] = useState<number>(0);
  const [recycleBinCount, setRecycleBinCount] = useState<number>(0);

  // Sync hash with currentTab
  const handleSelectTab = (tab: AdminTab) => {
    let target = tab;
    if (
      tab === 'content' ||
      tab === 'website-content' ||
      tab === 'categories' ||
      tab === 'services' ||
      tab === 'faqs' ||
      tab === 'testimonials'
    ) {
      target = 'website-control';
    } else if (
      tab === 'website-settings' ||
      tab === 'rfq-notifications' ||
      tab === 'admin-profile'
    ) {
      target = 'settings';
    } else if (tab === 'inventory') {
      target = 'products';
    }

    setCurrentTab(target);
    setProductFormMode({ isOpen: false, product: null });
    setSelectedEnquiry(null);
    window.location.hash = `admin/${target}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle clicking on a notification from the header
  const handleOpenNotificationReference = async (referenceId: string, referenceTab?: AdminTab) => {
    if (referenceTab === 'enquiries' || !referenceTab) {
      try {
        const list = await fetchEnquiries();
        const found = list.find((e) => e.id === referenceId);
        if (found) {
          setSelectedEnquiry(found);
          handleSelectTab('enquiries');
          return;
        }
      } catch (err) {
        console.warn('Failed to fetch enquiry by notification reference:', err);
      }
      handleSelectTab('enquiries');
    } else {
      handleSelectTab(referenceTab);
    }
  };

  // Load badge counts
  useEffect(() => {
    if (!isAuthenticated) return;

    const loadCounts = async () => {
      try {
        const [enq, prods, binItems] = await Promise.all([
          fetchEnquiries(),
          fetchProducts(),
          fetchRecycleBinItems(),
        ]);
        const pending = enq.filter((e) => e.status === 'New' || e.status === 'Contacted').length;
        setEnquiriesCount(pending);

        const low = prods.filter((p) => {
          const s = p.stockQuantity ?? 100;
          return s <= (p.lowStockThreshold ?? 10);
        }).length;
        setLowStockCount(low);
        setRecycleBinCount(binItems.length);
      } catch {
        // ignore
      }
    };

    loadCounts();
    const handleUpdate = () => loadCounts();
    window.addEventListener('knr_enquiries_updated', handleUpdate);
    window.addEventListener('knr_products_updated', handleUpdate);
    window.addEventListener('knr_recycle_bin_updated', handleUpdate);

    return () => {
      window.removeEventListener('knr_enquiries_updated', handleUpdate);
      window.removeEventListener('knr_products_updated', handleUpdate);
      window.removeEventListener('knr_recycle_bin_updated', handleUpdate);
    };
  }, [isAuthenticated]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center text-slate-700">
        <div className="w-12 h-12 border-4 border-orange-500/20 border-t-[#F57C00] rounded-full animate-spin mb-4" />
        <h2 className="text-sm font-bold text-[#111827]">
          Verifying Administrator Session...
        </h2>
        <p className="text-xs text-[#64748B] mt-1">Connecting to Supabase PostgreSQL</p>
      </div>
    );
  }

  // Not authenticated: Show Login Page
  if (!isAuthenticated) {
    return (
      <AdminLoginPage
        onSuccess={() => {
          handleSelectTab('dashboard');
        }}
        onBackToWebsite={onBackToWebsite}
      />
    );
  }

  // Authenticated: Show Admin Dashboard
  return (
    <AdminLayout
      currentTab={currentTab}
      onSelectTab={handleSelectTab}
      user={user}
      onLogout={async () => {
        await logout();
        window.location.hash = '';
      }}
      enquiriesCount={enquiriesCount}
      lowStockCount={lowStockCount}
      recycleBinCount={recycleBinCount}
      onOpenNotificationReference={handleOpenNotificationReference}
    >
      {/* 1. Dashboard Overview */}
      {currentTab === 'dashboard' && (
        <DashboardOverviewPage
          onNavigateTab={handleSelectTab}
          onAddNewProduct={() => {
            setCurrentTab('products');
            setProductFormMode({ isOpen: true, product: null });
          }}
          onEditProduct={(p) => {
            setCurrentTab('products');
            setProductFormMode({ isOpen: true, product: p });
          }}
          onViewEnquiry={(enq) => {
            setSelectedEnquiry(enq);
            setCurrentTab('enquiries');
          }}
        />
      )}

      {/* 2. Product Management (Table vs Add/Edit Form) */}
      {currentTab === 'products' && (
        <>
          {productFormMode.isOpen ? (
            <ProductFormPage
              product={productFormMode.product}
              onBack={() => setProductFormMode({ isOpen: false, product: null })}
              onSaved={() => {
                setProductFormMode({ isOpen: false, product: null });
              }}
            />
          ) : (
            <ProductsPage
              onAddNewProduct={() =>
                setProductFormMode({ isOpen: true, product: null })
              }
              onEditProduct={(p) =>
                setProductFormMode({ isOpen: true, product: p })
              }
            />
          )}
        </>
      )}

      {/* 3. Customer Enquiries / RFQs */}
      {currentTab === 'enquiries' && (
        <EnquiriesPage initialSelectedEnquiry={selectedEnquiry} />
      )}

      {/* 4. Customers Directory */}
      {currentTab === 'customers' && (
        <CustomersPage
          onViewEnquiry={(enq) => {
            setSelectedEnquiry(enq);
            setCurrentTab('enquiries');
          }}
        />
      )}

      {/* 5. Recycle Bin (30-day retention & recovery) */}
      {currentTab === 'recycle-bin' && (
        <RecycleBinPage adminName={user?.fullName} />
      )}

      {/* 5. Website Control (CMS) */}
      {(currentTab === 'website-control' ||
        currentTab === 'website-content' ||
        currentTab === 'content' ||
        currentTab === 'categories' ||
        currentTab === 'testimonials' ||
        currentTab === 'faqs' ||
        currentTab === 'services') && (
        <WebsiteControlPage />
      )}

      {/* 6. Settings */}
      {(currentTab === 'settings' ||
        currentTab === 'website-settings' ||
        currentTab === 'rfq-notifications' ||
        currentTab === 'admin-profile') && (
        <SettingsPage user={user} />
      )}

      {/* Backward-compatible fallback for analytics */}
      {currentTab === 'analytics' && <AnalyticsPage />}
    </AdminLayout>
  );
};
