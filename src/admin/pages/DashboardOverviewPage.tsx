import React, { useState, useEffect, useMemo } from 'react';
import { AdminTab, Product, CustomerEnquiry, Category, ConfirmedOrder, Quotation } from '../../types';
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
  Eye,
  RefreshCw,
  Users,
  Send,
  FileCheck2,
  XCircle,
  EyeOff,
} from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { fetchProducts, formatINR } from '../../services/productService';
import { fetchCategories } from '../../services/categoryService';
import { fetchEnquiries } from '../../services/enquiryService';
import { fetchConfirmedOrders, fetchQuotations } from '../../services/quotationService';
import { triggerAutomatic30DayCleanup } from '../../services/recycleBinService';
import { formatISTDateTime, formatRelativeTime } from '../../utils/date';
import { getCustomerDedupKey } from '../../utils/customer';

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
  const [confirmedOrders, setConfirmedOrders] = useState<ConfirmedOrder[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [prodRes, catRes, enqRes, ordersRes, quotRes] = await Promise.all([
        fetchProducts(),
        fetchCategories(),
        fetchEnquiries(),
        fetchConfirmedOrders(),
        fetchQuotations(),
      ]);
      setProducts(prodRes);
      setCategories(catRes);
      setEnquiries(enqRes);
      setConfirmedOrders(ordersRes);
      setQuotations(quotRes);
    } catch (err) {
      console.error('Error loading dashboard statistics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Trigger automated 30-day cleanup of expired soft-deleted records
    triggerAutomatic30DayCleanup().catch(console.warn);

    const handleUpdate = () => loadData();
    window.addEventListener('knr_products_updated', handleUpdate);
    window.addEventListener('knr_enquiries_updated', handleUpdate);
    window.addEventListener('knr_categories_updated', handleUpdate);
    window.addEventListener('knr_orders_updated', handleUpdate);
    window.addEventListener('knr_quotations_updated', handleUpdate);
    window.addEventListener('knr_recycle_bin_updated', handleUpdate);

    return () => {
      window.removeEventListener('knr_products_updated', handleUpdate);
      window.removeEventListener('knr_enquiries_updated', handleUpdate);
      window.removeEventListener('knr_categories_updated', handleUpdate);
      window.removeEventListener('knr_orders_updated', handleUpdate);
      window.removeEventListener('knr_quotations_updated', handleUpdate);
      window.removeEventListener('knr_recycle_bin_updated', handleUpdate);
    };
  }, []);

  // 1. Catalog & Product Statistics (Wholesale RFQ Model - Manual Availability)
  const totalProducts = products.length;
  const activeProducts = products.filter(
    (p) => typeof p.isActive === 'boolean' && p.isActive === true
  ).length;
  const availableCount = products.filter(
    (p) => p.isActive !== false && (p.availability === 'Available' || (!p.availability && p.inStock !== false))
  ).length;
  const enquireCount = products.filter(
    (p) => p.isActive !== false && p.availability === 'Enquire for Availability'
  ).length;
  const discontinuedCount = products.filter(
    (p) => p.availability === 'Discontinued' || p.isActive === false
  ).length;

  const totalCategories = categories.length;

  // Active (non-deleted) enquiries set
  const activeEnquiries = useMemo(() => {
    return enquiries.filter((e) => !e.deletedAt);
  }, [enquiries]);

  // Active (non-deleted) confirmed orders set
  const activeOrders = useMemo(() => {
    return confirmedOrders.filter((o) => !o.deletedAt);
  }, [confirmedOrders]);

  // 2. Unique Customers (Deduplicated with normalized 10-digit phone, email, or entity name)
  // Strictly counts distinct customers who have at least one active, non-deleted enquiry or confirmed order
  const totalCustomers = useMemo(() => {
    const customerKeys = new Set<string>();
    activeEnquiries.forEach((e) => {
      const key = getCustomerDedupKey(e);
      if (key) customerKeys.add(key);
    });
    activeOrders.forEach((o) => {
      const key = getCustomerDedupKey(o);
      if (key) customerKeys.add(key);
    });
    return customerKeys.size;
  }, [activeEnquiries, activeOrders]);

  // 3. RFQ & Order Pipeline Statistics (Computed strictly from active, non-deleted records)
  const totalEnquiries = activeEnquiries.length;
  const newEnquiries = activeEnquiries.filter((e) => e.status === 'New').length;
  const pendingQuotations = activeEnquiries.filter(
    (e) => e.status === 'Quotation Preparing' || e.status === 'Contacted'
  ).length;

  // Verified against actual quotation communication records and status (excluding deleted)
  const quotationsSent = useMemo(() => {
    const sentQuotations = quotations.filter(
      (q) => !q.deletedAt && (q.status === 'Sent' || q.status === 'Accepted')
    );
    if (sentQuotations.length > 0) {
      return sentQuotations.length;
    }
    return activeEnquiries.filter((e) => e.status === 'Quotation Sent').length;
  }, [quotations, activeEnquiries]);

  // Confirmed orders count actual active confirmed order records from confirmed_orders table
  // Excludes records moved to Recycle Bin (deletedAt IS NOT NULL); counts only status === 'Confirmed'
  const confirmedOrdersCount = useMemo(() => {
    return activeOrders.filter((o) => o.status === 'Confirmed').length;
  }, [activeOrders]);

  const lostEnquiries = activeEnquiries.filter(
    (e) => e.status === 'Lost' || e.status === 'Rejected'
  ).length;

  // Recently added products (top 5)
  const recentProducts = useMemo(() => {
    return [...products].slice(0, 5);
  }, [products]);

  // Recent enquiries (top 5)
  const recentEnquiries = useMemo(() => {
    return [...enquiries].slice(0, 5);
  }, [enquiries]);

  // Monthly Enquiry Analytics (Derived strictly from genuine DB enquiries)
  const monthlyAnalytics = useMemo(() => {
    if (enquiries.length === 0) return [];
    const monthsMap: Record<string, { count: number; totalValue: number }> = {};
    enquiries.forEach((enq) => {
      const date = new Date(enq.createdAt);
      if (isNaN(date.getTime())) return;
      const key = date.toLocaleString('en-IN', { month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });
      if (!monthsMap[key]) {
        monthsMap[key] = { count: 0, totalValue: 0 };
      }
      monthsMap[key].count += 1;
      monthsMap[key].totalValue += enq.totalAmount || 0;
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
            className="bg-[#F57C00] hover:bg-[#E06D00] active:scale-95 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-md shadow-orange-500/25 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* 2. Catalog & Availability Statistics Cards (Row 1) */}
      <div>
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
          Catalog &amp; Product Availability (Wholesale Model)
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <StatCard
            title="Total Products"
            value={totalProducts}
            subtitle="In Catalog"
            icon={Package}
            color="orange"
            onClick={() => onNavigateTab('products')}
          />
          <StatCard
            title="Available Now"
            value={availableCount}
            subtitle="Ready to Dispatch"
            icon={CheckCircle}
            color="emerald"
            onClick={() => onNavigateTab('products')}
          />
          <StatCard
            title="On Enquiry"
            value={enquireCount}
            subtitle="Lead Time Supply"
            icon={AlertOctagon}
            color="amber"
            onClick={() => onNavigateTab('products')}
          />
          <StatCard
            title="Discontinued"
            value={discontinuedCount}
            subtitle="Archived / Inactive"
            icon={EyeOff}
            color="slate"
            onClick={() => onNavigateTab('products')}
          />
          <StatCard
            title="Categories"
            value={totalCategories}
            subtitle="Wholesale Slabs"
            icon={Layers}
            color="purple"
            onClick={() => onNavigateTab('website-control')}
          />
          <StatCard
            title="Total Customers"
            value={totalCustomers}
            subtitle="Procuring Entities"
            icon={Users}
            color="blue"
            onClick={() => onNavigateTab('customers')}
          />
        </div>
      </div>

      {/* 3. RFQ & Wholesale Pipeline Statistics Cards (Row 2) */}
      <div>
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
          RFQ Quotation & Procurement Pipeline
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <StatCard
            title="Total Enquiries"
            value={totalEnquiries}
            subtitle="All Time RFQ"
            icon={ClipboardList}
            color="slate"
            onClick={() => onNavigateTab('enquiries')}
          />
          <StatCard
            title="New Enquiries"
            value={newEnquiries}
            subtitle="Awaiting Review"
            icon={Clock}
            color="blue"
            onClick={() => onNavigateTab('enquiries')}
          />
          <StatCard
            title="Preparing Quotes"
            value={pendingQuotations}
            subtitle="Under Pricing"
            icon={AlertTriangle}
            color="amber"
            onClick={() => onNavigateTab('enquiries')}
          />
          <StatCard
            title="Quotations Sent"
            value={quotationsSent}
            subtitle="Delivered via PDF"
            icon={Send}
            color="purple"
            onClick={() => onNavigateTab('enquiries')}
          />
          <StatCard
            title="Confirmed Orders"
            value={confirmedOrdersCount}
            subtitle="Won & Invoiced"
            icon={FileCheck2}
            color="emerald"
            onClick={() => onNavigateTab('enquiries')}
          />
          <StatCard
            title="Lost Enquiries"
            value={lostEnquiries}
            subtitle="Rejected / Lapsed"
            icon={XCircle}
            color="rose"
            onClick={() => onNavigateTab('enquiries')}
          />
        </div>
      </div>

      {/* 4. Middle Section: Recent Customer Enquiries & Monthly Analytics */}
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
              className="text-xs font-bold text-[#F57C00] hover:text-[#E06D00] flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 flex-1">
            {recentEnquiries.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                <ClipboardList className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold text-slate-600">No records available yet.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Institutional RFQs will display here automatically upon receipt.
                </p>
              </div>
            ) : (
              recentEnquiries.map((enq) => {
                const statusColor =
                  enq.status === 'New'
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : enq.status === 'Quotation Sent'
                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                    : enq.status === 'Order Confirmed' || enq.status === 'Completed'
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
                        <span title={formatISTDateTime(enq.createdAt)}>
                          {formatRelativeTime(enq.createdAt)}
                        </span>
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
                        className="p-1.5 text-slate-500 hover:text-[#F57C00] hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
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
            <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#F57C00] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>

          <div className="py-4 space-y-4 flex-1">
            {monthlyAnalytics.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                <TrendingUp className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold text-slate-600">No records available yet.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Analytics will compute automatically as customer RFQs are recorded.
                </p>
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
                        <span className="font-bold text-[#F57C00] bg-orange-50 px-2 py-0.5 rounded-md text-[10px]">
                          {data.count} RFQ
                        </span>
                      </div>
                    </div>
                    {/* Visual Progress Bar */}
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-[#F57C00] h-full rounded-full transition-all duration-500"
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

      {/* 5. Bottom Section: RFQ Operations & Recently Added Products */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Wholesale RFQ Operations (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-orange-50 text-[#F57C00] flex items-center justify-center">
                  <ClipboardList className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  RFQ Operational Pipeline
                </h3>
              </div>
              <button
                onClick={() => onNavigateTab('enquiries')}
                className="text-xs font-bold text-[#F57C00] hover:text-[#E06D00] cursor-pointer"
              >
                View Enquiries
              </button>
            </div>

            <div className="space-y-3 mt-4 text-xs">
              <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2 text-blue-900 font-semibold">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span>New Customer Requests</span>
                </div>
                <span className="font-mono font-bold text-sm text-blue-800 bg-white px-2 py-0.5 rounded-lg shadow-2xs">
                  {newEnquiries}
                </span>
              </div>

              <div className="p-3 bg-amber-50/70 border border-amber-100 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-900 font-semibold">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Quotes Under Preparation</span>
                </div>
                <span className="font-mono font-bold text-sm text-amber-800 bg-white px-2 py-0.5 rounded-lg shadow-2xs">
                  {pendingQuotations}
                </span>
              </div>

              <div className="p-3 bg-purple-50/70 border border-purple-100 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2 text-purple-900 font-semibold">
                  <Send className="w-4 h-4 text-purple-600" />
                  <span>Quotations Delivered</span>
                </div>
                <span className="font-mono font-bold text-sm text-purple-800 bg-white px-2 py-0.5 rounded-lg shadow-2xs">
                  {quotationsSent}
                </span>
              </div>

              <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-900 font-semibold">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>Orders Confirmed &amp; Invoiced</span>
                </div>
                <span className="font-mono font-bold text-sm text-emerald-800 bg-white px-2 py-0.5 rounded-lg shadow-2xs">
                  {confirmedOrdersCount}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Wholesale RFQ Model</span>
            <span className="font-semibold text-emerald-700">Offline Procurement Ready</span>
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
              className="text-xs font-bold text-[#F57C00] hover:text-[#E06D00] flex items-center gap-1 cursor-pointer"
            >
              <span>View All Products</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 mt-2">
            {recentProducts.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No records available yet.
              </div>
            ) : (
              recentProducts.map((p) => (
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
                      className="p-1.5 text-slate-400 hover:text-[#F57C00] hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
                      title="Edit Product"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
