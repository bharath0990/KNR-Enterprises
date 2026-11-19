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
      'website-content',
      'testimonials',
      'faqs',
      'services',
      'website-settings',
      'admin-profile',
    ];
    if (validTabs.includes(clean as AdminTab)) return clean as AdminTab;
    return 'dashboard';
  });

  // Sub-views for Product editing
  const [productFormMode, setProductFormMode] = useState<{
    isOpen: boolean;
    product: Product | null;
  }>({ isOpen: false, product: null });

  // Selected enquiry for direct viewing from dashboard
  const [selectedEnquiry, setSelectedEnquiry] = useState<CustomerEnquiry | null>(null);

  // Badge notification counts
  const [enquiriesCount, setEnquiriesCount] = useState<number>(0);
  const [lowStockCount, setLowStockCount] = useState<number>(0);

  // Sync hash with currentTab
  const handleSelectTab = (tab: AdminTab) => {
    setCurrentTab(tab);
    setProductFormMode({ isOpen: false, product: null });
    setSelectedEnquiry(null);
    window.location.hash = `admin/${tab}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  // Loading spinner during initial auth check
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#070b12] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-400">
            Verifying Administrator Credentials...
          </p>
        </div>
      </div>
    );
  }

  // Not authenticated: Show Login Screen
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

      {/* 6. Website Content */}
      {currentTab === 'website-content' && <WebsiteContentPage />}

      {/* 7. Testimonials */}
      {currentTab === 'testimonials' && <TestimonialsPage />}

      {/* 8. FAQs */}
      {currentTab === 'faqs' && <FaqsPage />}

      {/* 9. Services */}
      {currentTab === 'services' && <ServicesPage />}

      {/* 10. Website Settings */}
      {currentTab === 'website-settings' && <WebsiteSettingsPage />}

      {/* 11. Admin Profile */}
      {currentTab === 'admin-profile' && <AdminProfilePage user={user} />}
    </AdminLayout>
  );
};

