import React, { useState, useEffect, useMemo } from 'react';
import { CustomerEnquiry, Product, Category } from '../../types';
import { fetchEnquiries } from '../../services/enquiryService';
import { fetchProducts } from '../../services/productService';
import { fetchCategories } from '../../services/categoryService';
import {
  TrendingUp,
  BarChart3,
  PieChart,
  MapPin,
  FileText,
  DollarSign,
  Package,
  Layers,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const [enquiries, setEnquiries] = useState<CustomerEnquiry[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [eData, pData, cData] = await Promise.all([
        fetchEnquiries(),
        fetchProducts(),
        fetchCategories(),
      ]);
      setEnquiries(eData);
      setProducts(pData);
      setCategories(cData);
    } catch (err) {
      console.error('Failed to load analytics data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('knr_enquiries_updated', loadData);
    window.addEventListener('knr_products_updated', loadData);
    return () => {
      window.removeEventListener('knr_enquiries_updated', loadData);
      window.removeEventListener('knr_products_updated', loadData);
    };
  }, []);

  // 1. Overall stats
  const totalEnquiries = enquiries.length;
  const totalPipelineValue = useMemo(() => {
    return enquiries.reduce((sum, e) => sum + (e.totalAmount || 0), 0);
  }, [enquiries]);

  const averageEnquiryValue = totalEnquiries > 0 ? Math.round(totalPipelineValue / totalEnquiries) : 0;

  // 2. Status Breakdown
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      New: 0,
      Contacted: 0,
      'Quotation Sent': 0,
      Approved: 0,
      Completed: 0,
      Rejected: 0,
    };
    enquiries.forEach((e) => {
      if (counts[e.status] !== undefined) {
        counts[e.status]++;
      } else {
        counts.New++;
      }
    });
    return counts;
  }, [enquiries]);

  // 3. District Distribution
  const districtDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    enquiries.forEach((e) => {
      const dist = e.district?.trim() || 'Ranga Reddy District';
      counts[dist] = (counts[dist] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, count]) => ({ name, count, percent: Math.round((count / (totalEnquiries || 1)) * 100) }))
      .sort((a, b) => b.count - a.count);
  }, [enquiries, totalEnquiries]);

  // 4. Inventory Health
  const inventoryHealth = useMemo(() => {
    let inStock = 0;
    let lowStock = 0;
    let outOfStock = 0;

    products.forEach((p) => {
      const qty = p.stockQuantity ?? 100;
      const threshold = p.lowStockThreshold ?? 10;
      if (qty <= 0) outOfStock++;
      else if (qty <= threshold) lowStock++;
      else inStock++;
    });

    return { inStock, lowStock, outOfStock, total: products.length };
  }, [products]);

  // 5. Monthly breakdown
  const monthlyVolume = useMemo(() => {
    const months: Record<string, number> = {};
    enquiries.forEach((e) => {
      const date = new Date(e.createdAt);
      const key = date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      months[key] = (months[key] || 0) + 1;
    });
    return Object.entries(months).map(([month, count]) => ({ month, count }));
  }, [enquiries]);

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider text-[#F57C00] bg-[#FFF3E0] mb-1">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Real-time Business Intelligence</span>
          </div>
          <h1 className="text-2xl font-black text-[#111827] tracking-tight">
            Procurement Analytics & Metrics
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Live database analytics tracking institutional tender enquiries, pipeline value, and district trends
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-[#111827] border border-[#E2E8F0] rounded-xl text-xs font-bold transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#F57C00]' : ''}`} />
          <span>Refresh Analytics</span>
        </button>
      </div>

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs">
          <span className="text-xs font-semibold text-[#64748B]">Total Pipeline Value</span>
          <div className="text-2xl font-black text-[#111827] mt-1 font-mono">
            ₹{totalPipelineValue.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-[#16A34A] font-medium mt-1 block">
            Across {totalEnquiries} logged RFQ submissions
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs">
          <span className="text-xs font-semibold text-[#64748B]">Average RFQ Basket</span>
          <div className="text-2xl font-black text-[#F57C00] mt-1 font-mono">
            ₹{averageEnquiryValue.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-slate-400 font-medium mt-1 block">
            Per institutional procurement enquiry
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs">
          <span className="text-xs font-semibold text-[#64748B]">Pending / New RFQs</span>
          <div className="text-2xl font-black text-blue-600 mt-1">
            {statusCounts.New + statusCounts.Contacted}
          </div>
          <span className="text-[11px] text-slate-400 font-medium mt-1 block">
            Awaiting proforma generation or dispatch
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs">
          <span className="text-xs font-semibold text-[#64748B]">Active Catalog Products</span>
          <div className="text-2xl font-black text-[#111827] mt-1">
            {products.filter((p) => p.isActive !== false).length}
          </div>
          <span className="text-[11px] text-slate-400 font-medium mt-1 block">
            Across {categories.length} active supply categories
          </span>
        </div>
      </div>

      {/* 3. Status Funnel & District Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Enquiry Conversion Funnel (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#111827] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#F57C00]" />
              <span>RFQ Enquiry Lifecycle Funnel</span>
            </h2>
            <span className="text-xs text-[#64748B] font-semibold">{totalEnquiries} Total</span>
          </div>

          <div className="space-y-3">
            {[
              { label: 'New / Unreviewed', count: statusCounts.New, color: 'bg-blue-500' },
              { label: 'Contacted Client', count: statusCounts.Contacted, color: 'bg-amber-500' },
              { label: 'GST Proforma Quoted', count: statusCounts['Quotation Sent'], color: 'bg-indigo-500' },
              { label: 'Approved by Panchayat / EPC', count: statusCounts.Approved, color: 'bg-emerald-500' },
              { label: 'Dispatched & Completed', count: statusCounts.Completed, color: 'bg-teal-600' },
              { label: 'Declined / Withdrawn', count: statusCounts.Rejected, color: 'bg-slate-400' },
            ].map((stage) => {
              const pct = totalEnquiries > 0 ? Math.round((stage.count / totalEnquiries) * 100) : 0;
              return (
                <div key={stage.label} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-[#111827]">{stage.label}</span>
                    <span className="font-mono text-slate-500">
                      {stage.count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-full ${stage.color} rounded-full transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* District Distribution (5 cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#111827] flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#F57C00]" />
              <span>Telangana District Distribution</span>
            </h2>
          </div>

          <div className="space-y-3">
            {districtDistribution.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No district records logged yet.
              </div>
            ) : (
              districtDistribution.slice(0, 5).map((dist) => (
                <div key={dist.name} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-[#111827]">{dist.name}</span>
                    <span className="font-mono font-bold text-[#F57C00]">{dist.count} orders</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-[#F57C00] rounded-full transition-all duration-500"
                      style={{ width: `${dist.percent}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 4. Warehouse Inventory Status */}
      <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-xs">
        <h2 className="text-base font-bold text-[#111827] mb-4 flex items-center gap-2">
          <Package className="w-4 h-4 text-[#F57C00]" />
          <span>Warehouse Depot Stock Health</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
            <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Ample Stock</span>
            </div>
            <div className="text-2xl font-black text-emerald-900">{inventoryHealth.inStock}</div>
            <span className="text-[11px] text-emerald-700">Products ready for instant highway dispatch</span>
          </div>

          <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
            <div className="flex items-center gap-2 text-amber-800 text-xs font-bold mb-1">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>Low Stock Alerts</span>
            </div>
            <div className="text-2xl font-black text-amber-900">{inventoryHealth.lowStock}</div>
            <span className="text-[11px] text-amber-700">Approaching depot threshold quantity</span>
          </div>

          <div className="p-4 bg-rose-50 rounded-xl border border-rose-100">
            <div className="flex items-center gap-2 text-rose-800 text-xs font-bold mb-1">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Out of Stock</span>
            </div>
            <div className="text-2xl font-black text-rose-900">{inventoryHealth.outOfStock}</div>
            <span className="text-[11px] text-rose-700">Requires depot truckload replenishment</span>
          </div>
        </div>
      </div>
    </div>
  );
};

