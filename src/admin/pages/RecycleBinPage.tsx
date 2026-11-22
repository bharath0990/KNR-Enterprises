import React, { useState, useEffect, useMemo } from 'react';
import { RecycleBinItem } from '../../types';
import {
  fetchRecycleBinItems,
  restoreRecycleBinItem,
  permanentlyDeleteRecycleBinItem,
  emptyRecycleBin,
} from '../../services/recycleBinService';
import { formatISTDateTime } from '../../utils/date';
import { formatINR } from '../../services/productService';
import { ConfirmModal } from '../components/ConfirmModal';
import {
  Trash2,
  RotateCcw,
  Search,
  RefreshCw,
  AlertTriangle,
  Clock,
  ShieldAlert,
  Building,
  Phone,
  CheckCircle2,
  FileText,
  PackageCheck,
  Filter,
  ArrowUpDown,
} from 'lucide-react';

interface RecycleBinPageProps {
  adminName?: string;
}

export const RecycleBinPage: React.FC<RecycleBinPageProps> = ({ adminName = 'Administrator' }) => {
  const [items, setItems] = useState<RecycleBinItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'rfq' | 'order'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'expiring_soon'>('newest');

  // Modal actions
  const [restoreCandidate, setRestoreCandidate] = useState<RecycleBinItem | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<RecycleBinItem | null>(null);
  const [isEmptyModalOpen, setIsEmptyModalOpen] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchRecycleBinItems();
      setItems(data);
    } catch (err) {
      console.error('Failed to load recycle bin:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('knr_recycle_bin_updated', handleUpdate);
    window.addEventListener('knr_enquiries_updated', handleUpdate);
    window.addEventListener('knr_orders_updated', handleUpdate);

    return () => {
      window.removeEventListener('knr_recycle_bin_updated', handleUpdate);
      window.removeEventListener('knr_enquiries_updated', handleUpdate);
      window.removeEventListener('knr_orders_updated', handleUpdate);
    };
  }, []);

  // Filtered and sorted items
  const filteredItems = useMemo(() => {
    return items
      .filter((item) => {
        if (typeFilter === 'rfq' && item.recordType === 'Confirmed Order') return false;
        if (typeFilter === 'order' && item.recordType !== 'Confirmed Order') return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return (
            item.referenceId.toLowerCase().includes(q) ||
            item.customerName.toLowerCase().includes(q) ||
            item.mobileNumber.toLowerCase().includes(q) ||
            (item.organisation && item.organisation.toLowerCase().includes(q))
          );
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime();
        }
        if (sortBy === 'oldest') {
          return new Date(a.deletedAt).getTime() - new Date(b.deletedAt).getTime();
        }
        if (sortBy === 'expiring_soon') {
          return a.daysRemaining - b.daysRemaining;
        }
        return 0;
      });
  }, [items, typeFilter, searchQuery, sortBy]);

  const urgentWarningCount = useMemo(() => {
    return items.filter((i) => i.isWarning).length;
  }, [items]);

  // Handle Restore
  const handleConfirmRestore = async () => {
    if (!restoreCandidate) return;
    setIsProcessing(true);
    try {
      await restoreRecycleBinItem(restoreCandidate, adminName);
      setActionSuccessMessage(`Record "${restoreCandidate.referenceId}" was successfully restored to active records.`);
      setRestoreCandidate(null);
      await loadData();
      setTimeout(() => setActionSuccessMessage(null), 4000);
    } catch (err) {
      alert(`Failed to restore record: ${err}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Permanent Delete
  const handleConfirmPermanentDelete = async () => {
    if (!deleteCandidate) return;
    setIsProcessing(true);
    try {
      await permanentlyDeleteRecycleBinItem(deleteCandidate);
      setActionSuccessMessage(`Record "${deleteCandidate.referenceId}" was permanently deleted.`);
      setDeleteCandidate(null);
      await loadData();
      setTimeout(() => setActionSuccessMessage(null), 4000);
    } catch (err) {
      alert(`Failed to permanently delete record: ${err}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Empty Recycle Bin
  const handleConfirmEmpty = async () => {
    setIsProcessing(true);
    try {
      const count = await emptyRecycleBin(adminName);
      setIsEmptyModalOpen(false);
      setActionSuccessMessage(`Recycle Bin emptied successfully. ${count} records permanently purged.`);
      await loadData();
      setTimeout(() => setActionSuccessMessage(null), 4000);
    } catch (err) {
      alert(`Failed to empty recycle bin: ${err}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold mb-1">
            <Trash2 className="w-3.5 h-3.5 text-[#F57C00]" />
            <span>30-Day Recovery Safe</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#111827] tracking-tight font-display">
            Recycle Bin
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1">
            Deleted enquiries and orders remain recoverable here for 30 days before permanent automated deletion
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-[#E2E8F0] hover:bg-slate-50 text-[#64748B] transition-colors cursor-pointer"
            title="Refresh Recycle Bin"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#F57C00]' : ''}`} />
          </button>

          {items.length > 0 && (
            <button
              onClick={() => setIsEmptyModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>Empty Recycle Bin</span>
            </button>
          )}
        </div>
      </div>

      {/* Success Notification Alert */}
      {actionSuccessMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-xs font-semibold animate-fadeIn shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {/* Urgent Expiry Warning Alert (when <= 5 days remaining) */}
      {urgentWarningCount > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3.5 text-amber-900 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-0.5">
            <span className="font-bold block">
              {urgentWarningCount} record{urgentWarningCount > 1 ? 's' : ''} expiring within 5 days!
            </span>
            <span className="text-amber-700 block">
              Records older than 30 days are automatically and permanently purged by the database cleanup schedule. Restore any necessary records before their remaining time expires.
            </span>
          </div>
        </div>
      )}

      {/* 2. Filters & Search Bar */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by RFQ/Order ID, customer, phone..."
            className="w-full bg-slate-50 border border-[#E2E8F0] rounded-xl pl-10 pr-4 py-2 text-xs text-[#111827] placeholder-slate-400 focus:outline-none focus:border-[#F57C00] focus:bg-white transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          {/* Record Type Filter */}
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-[#E2E8F0]">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                typeFilter === 'all'
                  ? 'bg-white text-[#F57C00] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({items.length})
            </button>
            <button
              onClick={() => setTypeFilter('rfq')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                typeFilter === 'rfq'
                  ? 'bg-white text-[#F57C00] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              RFQs
            </button>
            <button
              onClick={() => setTypeFilter('order')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                typeFilter === 'order'
                  ? 'bg-white text-[#F57C00] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Confirmed Orders
            </button>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-[#E2E8F0] text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-xs font-semibold text-slate-700 outline-none cursor-pointer"
            >
              <option value="newest">Newest Deleted</option>
              <option value="oldest">Oldest Deleted</option>
              <option value="expiring_soon">Expiring Soon (5 days)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Recycle Bin Records Table */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center text-slate-500">
            <div className="w-10 h-10 border-3 border-orange-500/20 border-t-[#F57C00] rounded-full animate-spin mx-auto mb-3" />
            <div className="text-xs font-bold text-[#111827]">Loading Recycle Bin Records...</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Checking 30-day retention store</div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 rounded-3xl bg-[#FFF3E0] text-[#F57C00] flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-[#111827]">Recycle Bin is Empty</h3>
            <p className="text-xs text-[#64748B] max-w-sm mx-auto mt-1">
              {searchQuery || typeFilter !== 'all'
                ? 'No deleted records matched your filter criteria.'
                : 'There are currently no deleted enquiries, RFQs, or confirmed orders in the 30-day recovery bin.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-[#E2E8F0] text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                  <th className="py-3.5 px-4">RFQ / Order ID</th>
                  <th className="py-3.5 px-4">Customer Name</th>
                  <th className="py-3.5 px-4">Mobile Number</th>
                  <th className="py-3.5 px-4">Organization</th>
                  <th className="py-3.5 px-4">Record Type</th>
                  <th className="py-3.5 px-4">Original Status</th>
                  <th className="py-3.5 px-4">Deleted Date</th>
                  <th className="py-3.5 px-4">Days Remaining</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-xs">
                {filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-[#FFF3E0]/20 transition-colors group"
                  >
                    {/* RFQ / Order ID */}
                    <td className="py-3 px-4 font-mono font-bold text-[#111827]">
                      {item.referenceId}
                    </td>

                    {/* Customer Name */}
                    <td className="py-3 px-4 font-bold text-[#111827]">
                      {item.customerName}
                    </td>

                    {/* Mobile Number */}
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {item.mobileNumber}
                    </td>

                    {/* Organization */}
                    <td className="py-3 px-4 text-slate-600 truncate max-w-[180px]">
                      {item.organisation || 'Gram Panchayat / Institutional'}
                    </td>

                    {/* Record Type Badge */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          item.recordType === 'Confirmed Order'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        }`}
                      >
                        {item.recordType === 'Confirmed Order' ? (
                          <PackageCheck className="w-3 h-3" />
                        ) : (
                          <FileText className="w-3 h-3" />
                        )}
                        <span>{item.recordType}</span>
                      </span>
                    </td>

                    {/* Original Status */}
                    <td className="py-3 px-4">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {item.originalStatus}
                      </span>
                    </td>

                    {/* Deleted Date (IST) */}
                    <td className="py-3 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                      {formatISTDateTime(item.deletedAt)}
                    </td>

                    {/* Days Remaining with 5-day warning badge */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          item.isWarning
                            ? 'bg-rose-50 text-rose-700 border border-rose-300 animate-pulse'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        <span>
                          {item.daysRemaining} {item.daysRemaining === 1 ? 'day' : 'days'} left
                        </span>
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Restore Button */}
                        <button
                          onClick={() => setRestoreCandidate(item)}
                          disabled={isProcessing}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-xs shadow-xs transition-colors cursor-pointer"
                          title="Restore record to active enquiries/orders"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Restore</span>
                        </button>

                        {/* Permanent Delete Button */}
                        <button
                          onClick={() => setDeleteCandidate(item)}
                          disabled={isProcessing}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Permanently delete from database (cannot be undone)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. Restore Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(restoreCandidate)}
        title="Restore Record"
        message={`Are you sure you want to restore "${restoreCandidate?.referenceId}" (${restoreCandidate?.customerName})? This will return the record to active status with its original RFQ ID, customer information, product items, and recalculate all active dashboard statistics.`}
        confirmText="Restore Record"
        cancelText="Cancel"
        isDestructive={false}
        onConfirm={handleConfirmRestore}
        onClose={() => setRestoreCandidate(null)}
      />

      {/* 5. Permanent Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteCandidate)}
        title="Permanently Delete Record"
        message={`Are you sure you want to permanently delete "${deleteCandidate?.referenceId}"? This will permanently remove the record and its exclusively associated line items from the database. This action CANNOT be undone.`}
        confirmText="Delete Permanently"
        cancelText="Cancel"
        isDestructive={true}
        onConfirm={handleConfirmPermanentDelete}
        onClose={() => setDeleteCandidate(null)}
      />

      {/* 6. Empty Recycle Bin Modal */}
      <ConfirmModal
        isOpen={isEmptyModalOpen}
        title="Empty Entire Recycle Bin"
        message={`Are you sure you want to permanently delete all ${items.length} records currently in the Recycle Bin? All associated RFQs, quotation items, communication logs, and confirmed orders will be permanently expunged. This action CANNOT be undone.`}
        confirmText="Empty Recycle Bin Forever"
        cancelText="Cancel"
        isDestructive={true}
        onConfirm={handleConfirmEmpty}
        onClose={() => setIsEmptyModalOpen(false)}
      />
    </div>
  );
};
