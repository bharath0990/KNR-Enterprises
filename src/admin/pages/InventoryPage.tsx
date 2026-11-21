import React, { useState, useEffect, useMemo } from 'react';
import { Product, InventoryLog } from '../../types';
import {
  Boxes,
  AlertTriangle,
  CheckCircle,
  AlertOctagon,
  Plus,
  Minus,
  Save,
  Clock,
  Search,
  Filter,
  History,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { fetchProducts } from '../../services/productService';
import { fetchInventoryLogs, adjustStock } from '../../services/inventoryService';
import { formatISTDateTime } from '../../utils/date';

export const InventoryPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [activeTab, setActiveTab] = useState<'current_stock' | 'stock_logs'>('current_stock');

  // Quick edit stock modal / state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newStockInput, setNewStockInput] = useState<number>(0);
  const [adjustmentReason, setAdjustmentReason] = useState<InventoryLog['changeType']>('manual_adjustment');
  const [adjustmentNotes, setAdjustmentNotes] = useState<string>('');
  const [isSavingStock, setIsSavingStock] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [prodRes, logRes] = await Promise.all([
        fetchProducts(),
        fetchInventoryLogs(),
      ]);
      setProducts(prodRes);
      setLogs(logRes);
    } catch (err) {
      console.error('Failed to load inventory:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleUpdate = () => loadData();
    window.addEventListener('knr_inventory_updated', handleUpdate);
    window.addEventListener('knr_products_updated', handleUpdate);

    return () => {
      window.removeEventListener('knr_inventory_updated', handleUpdate);
      window.removeEventListener('knr_products_updated', handleUpdate);
    };
  }, []);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const stock = p.stockQuantity ?? 100;
      const threshold = p.lowStockThreshold ?? 10;
      const isOutOfStock = !p.inStock || stock <= 0;
      const isLowStock = stock > 0 && stock <= threshold;

      if (stockFilter === 'in_stock' && isOutOfStock) return false;
      if (stockFilter === 'out_of_stock' && !isOutOfStock) return false;
      if (stockFilter === 'low_stock' && !isLowStock) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          p.name.toLowerCase().includes(query) ||
          p.sku?.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [products, searchQuery, stockFilter]);

  // Overall Inventory Metrics
  const totalStockItems = products.reduce((sum, p) => sum + (p.stockQuantity ?? 0), 0);
  const inStockCount = products.filter((p) => p.inStock && (p.stockQuantity ?? 0) > 0).length;
  const lowStockCount = products.filter((p) => {
    const s = p.stockQuantity ?? 0;
    return s > 0 && s <= (p.lowStockThreshold ?? 10);
  }).length;
  const outOfStockCount = products.filter((p) => !p.inStock || (p.stockQuantity ?? 0) <= 0).length;

  const handleOpenAdjust = (p: Product) => {
    setEditingProduct(p);
    setNewStockInput(p.stockQuantity ?? 0);
    setAdjustmentReason('manual_adjustment');
    setAdjustmentNotes('');
    setSaveSuccessMsg(null);
  };

  const handleQuickDelta = async (p: Product, delta: number) => {
    const currentStock = p.stockQuantity ?? 0;
    const targetStock = Math.max(0, currentStock + delta);
    const reason = delta > 0 ? 'shipment_received' : 'manual_adjustment';
    const notes = delta > 0 ? `Quick restock +${delta} ${p.unit}` : `Stock reduction ${delta} ${p.unit}`;

    try {
      await adjustStock(p.id, targetStock, reason, notes);
      setProducts((prev) =>
        prev.map((item) =>
          item.id === p.id
            ? { ...item, stockQuantity: targetStock, inStock: targetStock > 0 }
            : item
        )
      );
    } catch (err) {
      alert(`Error updating stock: ${err}`);
    }
  };

  const handleSaveStockAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    setIsSavingStock(true);
    try {
      await adjustStock(
        editingProduct.id,
        newStockInput,
        adjustmentReason,
        adjustmentNotes.trim() || 'Manual stock adjustment'
      );

      setSaveSuccessMsg(`Stock updated for ${editingProduct.name}`);
      setTimeout(() => {
        setEditingProduct(null);
        setSaveSuccessMsg(null);
        loadData();
      }, 700);
    } catch (err) {
      alert(`Failed to save stock: ${err}`);
    } finally {
      setIsSavingStock(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Inventory &amp; Stock Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Depot inventory levels, minimum threshold alerts, and verified stock audit history
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={isLoading}
          className="p-2.5 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer self-start sm:self-auto flex items-center gap-2 text-xs font-semibold"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Sync Stock</span>
        </button>
      </div>

      {/* 2. Top Metric Pills */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase">Total Units in Stock</p>
          <h3 className="text-2xl font-black text-slate-900 mt-1">{totalStockItems.toLocaleString('en-IN')}</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Across all catalog lines</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <p className="text-xs font-semibold text-emerald-600 uppercase">In Stock Products</p>
          <h3 className="text-2xl font-black text-emerald-700 mt-1">{inStockCount}</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Available for instant dispatch</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <p className="text-xs font-semibold text-amber-600 uppercase">Low Stock Alerts</p>
          <h3 className="text-2xl font-black text-amber-700 mt-1">{lowStockCount}</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Below alert threshold</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <p className="text-xs font-semibold text-rose-600 uppercase">Out of Stock</p>
          <h3 className="text-2xl font-black text-rose-700 mt-1">{outOfStockCount}</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Requires immediate intake</p>
        </div>
      </div>

      {/* 3. Navigation Tabs: Current Stock vs Stock Change History */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('current_stock')}
          className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'current_stock'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Current Stock Levels ({products.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('stock_logs')}
          className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'stock_logs'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Stock Change History ({logs.length})</span>
        </button>
      </div>

      {/* TAB 1: CURRENT STOCK MANAGEMENT */}
      {activeTab === 'current_stock' && (
        <div className="space-y-4">
          {/* Search & Filter */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search product stock..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value as any)}
                className="w-full sm:w-auto bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white"
              >
                <option value="all">All Items ({products.length})</option>
                <option value="in_stock">In Stock ({inStockCount})</option>
                <option value="low_stock">Low Stock Alerts ({lowStockCount})</option>
                <option value="out_of_stock">Out of Stock ({outOfStockCount})</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">Product Name</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">HSN Code</th>
                    <th className="py-3 px-3 text-center">Alert Threshold</th>
                    <th className="py-3 px-3 text-center">Current Stock</th>
                    <th className="py-3 px-3 text-center">Stock Status</th>
                    <th className="py-3 px-3 text-center">Quick Adjust</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <Boxes className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        No records available yet.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((p) => {
                    const stock = p.stockQuantity ?? 0;
                    const threshold = p.lowStockThreshold ?? 10;
                    const isOut = !p.inStock || stock <= 0;
                    const isLow = stock > 0 && stock <= threshold;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={p.image}
                              alt={p.name}
                              className="w-10 h-10 rounded-xl object-cover bg-slate-100 border border-slate-200 shrink-0"
                            />
                            <div className="min-w-0 max-w-xs">
                              <p className="font-bold text-slate-900 truncate">{p.name}</p>
                              <p className="text-[11px] text-slate-500 truncate font-mono">
                                {p.sku || p.id}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                          {p.category}
                        </td>

                        <td className="py-3 px-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                          {p.hsnCode}
                        </td>

                        <td className="py-3 px-3 text-center whitespace-nowrap font-mono text-slate-500">
                          {threshold} {p.unit}
                        </td>

                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <span
                            className={`font-mono font-bold text-sm px-2.5 py-0.5 rounded-lg ${
                              isOut
                                ? 'bg-rose-100 text-rose-700'
                                : isLow
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {stock} {p.unit}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          {isOut ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full">
                              <AlertOctagon className="w-3 h-3" />
                              <span>Out of Stock</span>
                            </span>
                          ) : isLow ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full">
                              <AlertTriangle className="w-3 h-3" />
                              <span>Low Stock</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                              <CheckCircle className="w-3 h-3" />
                              <span>In Stock</span>
                            </span>
                          )}
                        </td>

                        {/* Quick +/- buttons */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <div className="inline-flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                            <button
                              onClick={() => handleQuickDelta(p, -5)}
                              className="p-1 hover:bg-white rounded-lg text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                              title="Decrease stock by 5"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-[10px] font-mono font-semibold px-1 text-slate-500">
                              &plusmn;
                            </span>
                            <button
                              onClick={() => handleQuickDelta(p, 10)}
                              className="p-1 hover:bg-white rounded-lg text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                              title="Increase stock by 10"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>

                        {/* Set Exact Stock */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => handleOpenAdjust(p)}
                            className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                          >
                            Set Stock
                          </button>
                        </td>
                      </tr>
                    );
                  }))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INVENTORY LOGS / AUDIT TRAIL */}
      {activeTab === 'stock_logs' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Stock Adjustment Audit Log
              </h3>
              <p className="text-xs text-slate-500">
                Detailed record of all inventory modifications and depot shipments
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <th className="py-3 px-4">Date &amp; Time</th>
                  <th className="py-3 px-4">Product ID / Name</th>
                  <th className="py-3 px-3 text-center">Previous</th>
                  <th className="py-3 px-3 text-center">Change</th>
                  <th className="py-3 px-3 text-center">New Stock</th>
                  <th className="py-3 px-3">Reason</th>
                  <th className="py-3 px-4">Notes</th>
                  <th className="py-3 px-4">Logged By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No records available yet.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {formatISTDateTime(log.createdAt)}
                      </td>

                      <td className="py-3 px-4 font-bold text-slate-900">
                        {log.productName || log.productId}
                      </td>

                      <td className="py-3 px-3 text-center font-mono text-slate-500">
                        {log.previousStock}
                      </td>

                      <td className="py-3 px-3 text-center font-mono font-bold whitespace-nowrap">
                        <span
                          className={
                            log.changeAmount > 0
                              ? 'text-emerald-600'
                              : log.changeAmount < 0
                              ? 'text-rose-600'
                              : 'text-slate-500'
                          }
                        >
                          {log.changeAmount > 0 ? `+${log.changeAmount}` : log.changeAmount}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-900">
                        {log.newStock}
                      </td>

                      <td className="py-3 px-3 capitalize text-slate-700 whitespace-nowrap">
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-medium">
                          {log.changeType.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                        {log.notes || '—'}
                      </td>

                      <td className="py-3 px-4 text-slate-500 font-semibold whitespace-nowrap">
                        {log.createdBy}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Adjust Stock Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div
            className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 text-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Adjust Product Stock
              </h3>
              <button
                onClick={() => setEditingProduct(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                &times;
              </button>
            </div>

            {saveSuccessMsg && (
              <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{saveSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveStockAdjustment} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  Product
                </label>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-xs text-slate-900">
                  {editingProduct.name}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    Current Stock
                  </label>
                  <div className="p-2.5 rounded-xl bg-slate-100 font-mono font-bold text-xs text-slate-700">
                    {editingProduct.stockQuantity ?? 0} {editingProduct.unit}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    New Stock Quantity *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newStockInput}
                    onChange={(e) => setNewStockInput(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reason for Stock Change *
                </label>
                <select
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                >
                  <option value="manual_adjustment">Manual Stock Adjustment</option>
                  <option value="shipment_received">Depot Shipment Received</option>
                  <option value="audit_correction">Audit Verification Correction</option>
                  <option value="damaged">Damaged / Expired Stock Removal</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Audit Notes / Waybill Ref
                </label>
                <input
                  type="text"
                  value={adjustmentNotes}
                  onChange={(e) => setAdjustmentNotes(e.target.value)}
                  placeholder="e.g. Truck consignment intake 50 bags from factory"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingStock}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2 rounded-xl shadow-md shadow-blue-600/25 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSavingStock ? (
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>Save Stock Update</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

