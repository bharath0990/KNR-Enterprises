import React, { useState, useEffect } from 'react';
import { AdminTab, Product, CustomerEnquiry } from '../types';
import { useAuth } from '../context/AuthContext';
import { AdminLayout } from './components/AdminLayout';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { DashboardOverviewPage } from './pages/DashboardOverviewPage';
import { ProductsPage } from './pages/ProductsPage';
import { ProductFormPage } from './pages/ProductFormPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { InventoryPage } from './pages/InventoryPage';
import { EnquiriesPage } from './pages/EnquiriesPage';
import { CustomersPage } from './pages/CustomersPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { WebsiteContentPage } from './pages/WebsiteContentPage';
import { TestimonialsPage } from './pages/TestimonialsPage';
import { FaqsPage } from './pages/FaqsPage';
import { ServicesPage } from './pages/ServicesPage';
import { WebsiteSettingsPage } from './pages/WebsiteSettingsPage';
import { AdminProfilePage } from './pages/AdminProfilePage';
import { fetchEnquiries } from '../services/enquiryService';
import { fetchProducts } from '../services/productService';

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
      'categories',
      'inventory',
      'enquiries',
      'customers',
      'analytics',
      'website-content',
      'content',
      'testimonials',
      'faqs',
      'services',
      'website-settings',
      'settings',
      'admin-profile',
    ];
    if (clean === 'content') return 'website-content';
    if (clean === 'settings') return 'website-settings';
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

  // Sync hash with currentTab
  const handleSelectTab = (tab: AdminTab) => {
    let target = tab;
    if (tab === 'content') target = 'website-content';
    if (tab === 'settings') target = 'website-settings';

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
        const [enq, prods] = await Promise.all([
          fetchEnquiries(),
          fetchProducts(),
        ]);
        const pending = enq.filter((e) => e.status === 'New' || e.status === 'Contacted').length;
        setEnquiriesCount(pending);

        const low = prods.filter((p) => {
          const s = p.stockQuantity ?? 100;
          return s <= (p.lowStockThreshold ?? 10);
        }).length;
        setLowStockCount(low);
      } catch {
        // ignore
      }
    };

    loadCounts();
    const handleUpdate = () => loadCounts();
    window.addEventListener('knr_enquiries_updated', handleUpdate);
    window.addEventListener('knr_products_updated', handleUpdate);

    return () => {
      window.removeEventListener('knr_enquiries_updated', handleUpdate);
      window.removeEventListener('knr_products_updated', handleUpdate);
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

      {/* 3. Categories */}
      {currentTab === 'categories' && <CategoriesPage />}

      {/* 4. Inventory */}
      {currentTab === 'inventory' && <InventoryPage />}

      {/* 5. Customer Enquiries */}
      {currentTab === 'enquiries' && (
        <EnquiriesPage initialSelectedEnquiry={selectedEnquiry} />
      )}

      {/* 6. Customers Directory */}
      {currentTab === 'customers' && (
        <CustomersPage
          onViewEnquiry={(enq) => {
            setSelectedEnquiry(enq);
            setCurrentTab('enquiries');
          }}
        />
      )}

      {/* 7. Procurement Analytics */}
      {currentTab === 'analytics' && <AnalyticsPage />}

      {/* 8. Website Content */}
      {(currentTab === 'website-content' || currentTab === 'content') && (
        <WebsiteContentPage />
      )}

      {/* 9. Testimonials */}
      {currentTab === 'testimonials' && <TestimonialsPage />}

      {/* 10. FAQs */}
      {currentTab === 'faqs' && <FaqsPage />}

      {/* 11. Services */}
      {currentTab === 'services' && <ServicesPage />}

      {/* 12. Website Settings */}
      {(currentTab === 'website-settings' || currentTab === 'settings') && (
        <WebsiteSettingsPage />
      )}

      {/* 13. Admin Profile */}
      {currentTab === 'admin-profile' && <AdminProfilePage user={user} />}
    </AdminLayout>
  );
};
