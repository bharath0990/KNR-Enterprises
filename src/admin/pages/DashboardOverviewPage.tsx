import React, { useState, useEffect, useMemo } from 'react';
import { AdminTab, Product, CustomerEnquiry, Category } from '../../types';
import {
  Package,
  CheckCircle,
  AlertOctagon,
  Layers,
  ClipboardList,
  Clock,
  ArrowRight,
  Plus,
  TrendingUp,
  AlertTriangle,
  Phone,
  MessageCircle,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { fetchProducts, formatINR } from '../../services/productService';
import { fetchCategories } from '../../services/categoryService';
import { fetchEnquiries } from '../../services/enquiryService';

interface DashboardOverviewPageProps {
  onNavigateTab: (tab: AdminTab) => void;
  onAddNewProduct: () => void;
  onEditProduct: (product: Product) => void;
  onViewEnquiry: (enquiry: CustomerEnquiry) => void;
}

export const DashboardOverviewPage: React.FC<DashboardOverviewPageProps> = ({
  onNavigateTab,
  onAddNewProduct,
  onEditProduct,
  onViewEnquiry,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [enquiries, setEnquiries] = useState<CustomerEnquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [prodRes, catRes, enqRes] = await Promise.all([
        fetchProducts(),
        fetchCategories(),
        fetchEnquiries(),
      ]);
      setProducts(prodRes);
      setCategories(catRes);
      setEnquiries(enqRes);
    } catch (err) {
      console.error('Error loading dashboard statistics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleUpdate = () => loadData();
    window.addEventListener('knr_products_updated', handleUpdate);
    window.addEventListener('knr_enquiries_updated', handleUpdate);
    window.addEventListener('knr_categories_updated', handleUpdate);

    return () => {
      window.removeEventListener('knr_products_updated', handleUpdate);
      window.removeEventListener('knr_enquiries_updated', handleUpdate);
      window.removeEventListener('knr_categories_updated', handleUpdate);
    };
  }, []);

  // Compute actual real statistics
  const totalProducts = products.length;
  const activeProducts = products.filter((p) => p.isActive !== false).length;
  const outOfStockProducts = products.filter((p) => !p.inStock || (p.stockQuantity !== undefined && p.stockQuantity <= 0)).length;
  const lowStockProductsList = useMemo(() => {
    return products.filter((p) => {
      const threshold = p.lowStockThreshold ?? 10;
      const stock = p.stockQuantity ?? 100;
      return stock <= threshold;
    });
  }, [products]);

  const totalCategories = categories.length;
  const totalEnquiries = enquiries.length;
  const pendingEnquiries = enquiries.filter((e) => e.status === 'New' || e.status === 'Contacted').length;

  // Recently added products (top 5)
  const recentProducts = useMemo(() => {
    return [...products].slice(0, 5);
  }, [products]);

  // Recent enquiries (top 5)
  const recentEnquiries = useMemo(() => {
    return [...enquiries].slice(0, 5);
  }, [enquiries]);

  // Monthly Enquiry Analytics (Derived from actual enquiries data)
  const monthlyAnalytics = useMemo(() => {
    const monthsMap: Record<string, { count: number; totalValue: number }> = {};
    enquiries.forEach((enq) => {
      const date = new Date(enq.createdAt);
      const key = date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      if (!monthsMap[key]) {
        monthsMap[key] = { count: 0, totalValue: 0 };
      }
      monthsMap[key].count += 1;
      monthsMap[key].totalValue += enq.totalAmount;
    });
    return Object.entries(monthsMap).slice(-6);
  }, [enquiries]);

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* 1. Header Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time management for KNR Enterprises wholesale products, inventory &amp; institutional RFQs
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            disabled={isLoading}
            className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
            title="Refresh database records"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={onAddNewProduct}
            className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-md shadow-blue-600/25 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* 2. Primary 6 Database Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Products */}
        <StatCard
          title="Total Products"
          value={totalProducts}
          subtitle="In Catalog"
          icon={Package}
          color="blue"
          onClick={() => onNavigateTab('products')}
        />

        {/* Active Products */}
        <StatCard
          title="Active Products"
          value={activeProducts}
          subtitle="Public Catalog"
          icon={CheckCircle}
          color="emerald"
          onClick={() => onNavigateTab('products')}
        />

        {/* Out of Stock Products */}
        <StatCard
          title="Out of Stock"
          value={outOfStockProducts}
          subtitle="Zero Inventory"
          icon={AlertOctagon}
          color="rose"
          onClick={() => onNavigateTab('inventory')}
        />

        {/* Total Categories */}
        <StatCard
          title="Categories"
          value={totalCategories}
          subtitle="Product Slabs"
          icon={Layers}
          color="purple"
          onClick={() => onNavigateTab('categories')}
        />

        {/* Total RFQ Enquiries */}
        <StatCard
          title="Total Enquiries"
          value={totalEnquiries}
          subtitle="All Time RFQ"
          icon={ClipboardList}
          color="slate"
          onClick={() => onNavigateTab('enquiries')}
        />

        {/* Pending Enquiries */}
        <StatCard
          title="Pending RFQs"
          value={pendingEnquiries}
          subtitle="Needs Follow-up"
          icon={Clock}
          color="amber"
          onClick={() => onNavigateTab('enquiries')}
        />
      </div>

      {/* 3. Middle Section: Recent Customer Enquiries & Monthly Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Enquiries (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Recent Customer RFQ Enquiries
              </h3>
              <p className="text-xs text-slate-500">
                Latest quotes requested by Gram Panchayats and Contractors
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('enquiries')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 flex-1">
            {recentEnquiries.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400">
                No customer enquiries recorded yet.
              </div>
            ) : (
              recentEnquiries.map((enq) => {
                const statusColor =
                  enq.status === 'New'
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : enq.status === 'Quotation Sent'
                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                    : enq.status === 'Approved' || enq.status === 'Completed'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-slate-100 text-slate-700 border-slate-200';

                return (
                  <div
                    key={enq.id}
                    className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/70 px-2 rounded-xl transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-800">
                          {enq.enquiryNumber}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${statusColor}`}
                        >
                          {enq.status}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-900 truncate mt-0.5">
                        {enq.customerName}
                        {enq.organisation ? ` (${enq.organisation})` : ''}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {enq.mandal ? `${enq.mandal}, ` : ''}{enq.district || enq.state} &bull;{' '}
                        {new Date(enq.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </p>
                    </div>

                    <div className="text-right shrink-0 flex items-center gap-3">
                      <div>
                        <div className="text-xs font-bold text-slate-900 font-mono">
                          {formatINR(enq.totalAmount)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {enq.items?.length || 1} item(s)
                        </div>
                      </div>

                      <button
                        onClick={() => onViewEnquiry(enq)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Monthly Enquiry Analytics (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Enquiry Flow Analytics
              </h3>
              <p className="text-xs text-slate-500">
                Monthly tender volume &amp; quote values from database
              </p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>

          <div className="py-4 space-y-4 flex-1">
            {monthlyAnalytics.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400">
                Analytics will appear as enquiries are received.
              </div>
            ) : (
              monthlyAnalytics.map(([month, data]) => {
                const maxCount = Math.max(...monthlyAnalytics.map(([, d]) => d.count), 1);
                const barPercent = Math.min(100, Math.round((data.count / maxCount) * 100));

                return (
                  <div key={month} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700">{month}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-500">
                          {formatINR(data.totalValue)}
                        </span>
                        <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md text-[10px]">
                          {data.count} RFQ
                        </span>
                      </div>
                    </div>
                    {/* Visual Progress Bar */}
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${barPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Verified Telangana Procurements</span>
            <span className="font-semibold text-slate-800">100% Audit Ready</span>
          </div>
        </div>
      </div>

      {/* 4. Bottom Section: Low Stock Alerts & Recently Added Products */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Low Stock Alerts (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Low Stock Alerts
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('inventory')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
            >
              Manage Stock
            </button>
          </div>

          <div className="divide-y divide-slate-100 mt-2">
            {lowStockProductsList.length === 0 ? (
              <div className="py-8 text-center text-xs text-emerald-600 font-semibold">
                All catalog inventory items are adequately stocked.
              </div>
            ) : (
              lowStockProductsList.slice(0, 4).map((p) => (
                <div
                  key={p.id}
                  className="py-2.5 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={p.image}
                      alt={p.name}
                      className="w-9 h-9 rounded-lg object-cover bg-slate-100 border border-slate-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 truncate">{p.name}</p>
                      <p className="text-[11px] text-slate-400">
                        Threshold: {p.lowStockThreshold ?? 10} {p.unit}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`font-mono font-bold px-2 py-0.5 rounded-md ${
                        (p.stockQuantity ?? 0) <= 0
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {p.stockQuantity ?? 0} {p.unit}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recently Added Products (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Recently Added Products
              </h3>
              <p className="text-xs text-slate-500">
                Latest updates to the KNR wholesale catalog
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('products')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
            >
              <span>View All Products</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 mt-2">
            {recentProducts.map((p) => (
              <div
                key={p.id}
                className="py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50/70 px-2 rounded-xl transition-colors text-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={p.image}
                    alt={p.name}
                    className="w-10 h-10 rounded-lg object-cover bg-slate-100 border border-slate-200 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 truncate">{p.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {p.category} &bull; MOQ: {p.moq} {p.unit} &bull; HSN: {p.hsnCode}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className="font-bold text-slate-900 font-mono">
                      {formatINR(p.price)}
                    </div>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                        p.isActive !== false
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {p.isActive !== false ? 'Active' : 'Hidden'}
                    </span>
                  </div>

                  <button
                    onClick={() => onEditProduct(p)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                    title="Edit Product"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

