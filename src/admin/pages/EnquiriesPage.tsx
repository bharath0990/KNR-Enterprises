import React, { useState, useEffect, useMemo } from 'react';
import { CustomerEnquiry, EnquiryStatus } from '../../types';
import {
  ClipboardList,
  Search,
  Filter,
  Eye,
  MessageCircle,
  Mail,
  Printer,
  Trash2,
  CheckCircle,
  Clock,
  Send,
  CheckCheck,
  XCircle,
  Building,
  User,
  Phone,
  Calendar,
  Save,
  Download,
  X,
  FileText,
} from 'lucide-react';
import {
  fetchEnquiries,
  updateEnquiryStatus,
  deleteEnquiry,
} from '../../services/enquiryService';
import { formatINR } from '../../services/productService';
import { ConfirmModal } from '../components/ConfirmModal';

interface EnquiriesPageProps {
  initialSelectedEnquiry?: CustomerEnquiry | null;
}

const statusColorMap: Record<EnquiryStatus, { bg: string; text: string; border: string }> = {
  New: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  Contacted: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  'Quotation Sent': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  Approved: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  Rejected: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  Completed: { bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-300' },
};

export const EnquiriesPage: React.FC<EnquiriesPageProps> = ({ initialSelectedEnquiry }) => {
  const [enquiries, setEnquiries] = useState<CustomerEnquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | EnquiryStatus>('all');
  const [selectedEnquiry, setSelectedEnquiry] = useState<CustomerEnquiry | null>(initialSelectedEnquiry || null);

  // Status update in modal
  const [modalStatus, setModalStatus] = useState<EnquiryStatus>('New');
  const [modalNotes, setModalNotes] = useState<string>('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<CustomerEnquiry | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await fetchEnquiries();
      setEnquiries(res);
      if (initialSelectedEnquiry) {
        const found = res.find((e) => e.id === initialSelectedEnquiry.id);
        if (found) {
          setSelectedEnquiry(found);
          setModalStatus(found.status);
          setModalNotes(found.internalNotes || '');
        }
      }
    } catch (err) {
      console.error('Failed to load enquiries:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleUpdate = () => loadData();
    window.addEventListener('knr_enquiries_updated', handleUpdate);
    return () => window.removeEventListener('knr_enquiries_updated', handleUpdate);
  }, []);

  const handleOpenDetail = (enq: CustomerEnquiry) => {
    setSelectedEnquiry(enq);
    setModalStatus(enq.status);
    setModalNotes(enq.internalNotes || '');
  };

  const handleSaveStatus = async () => {
    if (!selectedEnquiry) return;
    setIsUpdatingStatus(true);
    try {
      const updated = await updateEnquiryStatus(selectedEnquiry.id, modalStatus, modalNotes);
      setSelectedEnquiry(updated);
      setEnquiries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    } catch (err) {
      alert(`Failed to update status: ${err}`);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleWhatsAppCustomer = (enq: CustomerEnquiry) => {
    const cleanPhone = enq.mobileNumber.replace(/[^0-9]/g, '');
    const phone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
    let text = `Hello ${enq.customerName},\nThis is K. Narendar Reddy from KNR Enterprises (Chevella Depot).\nRegarding your RFQ enquiry ref *${enq.enquiryNumber}* for ${enq.organisation || 'your requirements'}:\n`;
    if (enq.items && enq.items.length > 0) {
      enq.items.forEach((it, idx) => {
        text += `${idx + 1}. ${it.productName} (${it.quantity} ${it.unit}) @ ₹${it.unitPrice}\n`;
      });
      text += `Total Estimated Value: ₹${enq.totalAmount.toLocaleString('en-IN')} (incl. GST 18%)\n`;
    }
    text += `Please let us know your required dispatch timeline and mandal unloading location.`;

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  const handleEmailCustomer = (enq: CustomerEnquiry) => {
    if (!enq.email) return;
    const subject = `KNR Enterprises — Official Quotation for RFQ ${enq.enquiryNumber}`;
    let body = `Dear ${enq.customerName},\n\nThank you for reaching out to KNR Enterprises for institutional supplies.\n\nEnquiry Reference: ${enq.enquiryNumber}\nOrganisation: ${enq.organisation || 'N/A'}\nLocation: ${enq.mandal || ''}, ${enq.district || ''}\n\n`;
    if (enq.items && enq.items.length > 0) {
      body += `Requested Supplies:\n`;
      enq.items.forEach((it, idx) => {
        body += `${idx + 1}. ${it.productName} — Qty: ${it.quantity} ${it.unit} @ ₹${it.unitPrice} / ${it.unit} = ₹${it.totalPrice}\n`;
      });
      body += `\nSubtotal: ₹${enq.subtotal}\nEstimated GST (18%): ₹${enq.estimatedGst}\nTotal Quoted Amount: ₹${enq.totalAmount}\n\n`;
    }
    body += `We arrange 24-48 hour highway truckload dispatch across Telangana.\n\nWarm regards,\nK. Narendar Reddy\nManaging Partner, KNR Enterprises\nPhone: +91 8886175855\nGSTIN: 36CUHPK5939D1ZG`;

    window.location.href = `mailto:${enq.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handlePrintEnquiry = () => {
    window.print();
  };

  const handleConfirmDelete = async () => {
    if (!deleteCandidate) return;
    await deleteEnquiry(deleteCandidate.id);
    setEnquiries((prev) => prev.filter((e) => e.id !== deleteCandidate.id));
    if (selectedEnquiry?.id === deleteCandidate.id) {
      setSelectedEnquiry(null);
    }
    setDeleteCandidate(null);
  };

  // Filtered
  const filteredEnquiries = useMemo(() => {
    return enquiries.filter((e) => {
      if (statusFilter !== 'all' && e.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          e.enquiryNumber.toLowerCase().includes(query) ||
          e.customerName.toLowerCase().includes(query) ||
          e.mobileNumber.toLowerCase().includes(query) ||
          e.organisation?.toLowerCase().includes(query) ||
          e.district?.toLowerCase().includes(query) ||
          e.mandal?.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [enquiries, statusFilter, searchQuery]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Customer RFQ Enquiries
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review quotation requests, update institutional tender statuses, and communicate via WhatsApp/Email
          </p>
        </div>
      </div>

      {/* 2. Filters & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer, phone, panchayat, or RFQ #..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full sm:w-auto bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white"
          >
            <option value="all">All Enquiry Statuses ({enquiries.length})</option>
            <option value="New">New ({enquiries.filter((e) => e.status === 'New').length})</option>
            <option value="Contacted">Contacted ({enquiries.filter((e) => e.status === 'Contacted').length})</option>
            <option value="Quotation Sent">Quotation Sent ({enquiries.filter((e) => e.status === 'Quotation Sent').length})</option>
            <option value="Approved">Approved ({enquiries.filter((e) => e.status === 'Approved').length})</option>
            <option value="Rejected">Rejected ({enquiries.filter((e) => e.status === 'Rejected').length})</option>
            <option value="Completed">Completed ({enquiries.filter((e) => e.status === 'Completed').length})</option>
          </select>
        </div>
      </div>

      {/* 3. Enquiries Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">RFQ Number</th>
                <th className="py-3 px-4">Officer / Customer</th>
                <th className="py-3 px-4">Organisation / Location</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3 text-right">Quoted Value</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredEnquiries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <ClipboardList className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    No enquiries found matching your query.
                  </td>
                </tr>
              ) : (
                filteredEnquiries.map((enq) => {
                  const style = statusColorMap[enq.status] || statusColorMap.New;

                  return (
                    <tr
                      key={enq.id}
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                      onClick={() => handleOpenDetail(enq)}
                    >
                      {/* Enquiry Ref */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-mono font-bold text-blue-600 block">
                          {enq.enquiryNumber}
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                          {enq.source.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Customer Details */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{enq.customerName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {enq.mobileNumber}
                        </div>
                      </td>

                      {/* Organisation & Mandal */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-semibold text-slate-800 truncate">
                          {enq.organisation || 'Individual Buyer'}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {enq.mandal ? `${enq.mandal}, ` : ''}{enq.district || enq.state}
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {new Date(enq.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>

                      {/* Value */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="font-mono font-bold text-slate-900">
                          {formatINR(enq.totalAmount)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {enq.items?.length || 1} line item(s)
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${style.bg} ${style.text} ${style.border}`}
                        >
                          {enq.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleWhatsAppCustomer(enq)}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="Chat on WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>

                          {enq.email && (
                            <button
                              onClick={() => handleEmailCustomer(enq)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="Send Email"
                            >
                              <Mail className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenDetail(enq)}
                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="View Full Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setDeleteCandidate(enq)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Enquiry"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Detailed Enquiry Modal / Drawer */}
      {selectedEnquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div
            className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Bar */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 rounded-xl text-white">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-wide">
                    Enquiry Details: {selectedEnquiry.enquiryNumber}
                  </h3>
                  <p className="text-xs text-slate-300">
                    Logged on {new Date(selectedEnquiry.createdAt).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintEnquiry}
                  className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  title="Print / Save PDF"
                >
                  <Printer className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setSelectedEnquiry(null)}
                  className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700">
              {/* Customer Credentials Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Customer Information
                  </span>
                  <div className="font-bold text-sm text-slate-900">
                    {selectedEnquiry.customerName}
                  </div>
                  {selectedEnquiry.designation && (
                    <div className="text-slate-600">
                      {selectedEnquiry.designation}
                    </div>
                  )}
                  <div className="font-mono text-slate-700">
                    Phone: <strong>{selectedEnquiry.mobileNumber}</strong>
                  </div>
                  {selectedEnquiry.email && (
                    <div className="text-slate-600">
                      Email: {selectedEnquiry.email}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Department &amp; Mandal
                  </span>
                  <div className="font-bold text-sm text-slate-900">
                    {selectedEnquiry.organisation || 'Not specified'}
                  </div>
                  <div>
                    Mandal: {selectedEnquiry.mandal || 'Chevella / Central'}
                  </div>
                  <div>
                    District: {selectedEnquiry.district || 'Ranga Reddy'}, {selectedEnquiry.state}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Source: {selectedEnquiry.source}
                  </div>
                </div>
              </div>

              {/* Customer Notes */}
              {selectedEnquiry.notes && (
                <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block mb-1">
                    Customer Requirements / Notes
                  </span>
                  <p className="text-slate-800 leading-relaxed">
                    {selectedEnquiry.notes}
                  </p>
                </div>
              )}

              {/* Items Table */}
              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-2">
                  Requested Supplies &amp; Slabs
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">#</th>
                        <th className="py-2.5 px-3">Item Description</th>
                        <th className="py-2.5 px-3">HSN Code</th>
                        <th className="py-2.5 px-3 text-center">Qty</th>
                        <th className="py-2.5 px-3 text-right">Unit Rate</th>
                        <th className="py-2.5 px-3 text-right">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedEnquiry.items && selectedEnquiry.items.length > 0 ? (
                        selectedEnquiry.items.map((it, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="py-2 px-3 text-slate-400">{idx + 1}</td>
                            <td className="py-2 px-3 font-bold text-slate-800">
                              {it.productName}
                            </td>
                            <td className="py-2 px-3 font-mono text-slate-500">
                              {it.hsnCode || '3808.91'}
                            </td>
                            <td className="py-2 px-3 text-center font-mono">
                              {it.quantity} {it.unit}
                            </td>
                            <td className="py-2 px-3 text-right font-mono">
                              {formatINR(it.unitPrice)}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold">
                              {formatINR(it.totalPrice)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-4 text-center text-slate-400">
                            General Wholesale Enquiry
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot className="bg-slate-50/80 font-semibold border-t border-slate-200">
                      <tr>
                        <td colSpan={5} className="py-2 px-3 text-right text-slate-500">
                          Taxable Subtotal:
                        </td>
                        <td className="py-2 px-3 text-right font-mono">
                          {formatINR(selectedEnquiry.subtotal)}
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={5} className="py-2 px-3 text-right text-slate-500">
                          Estimated GST (18%):
                        </td>
                        <td className="py-2 px-3 text-right font-mono">
                          {formatINR(selectedEnquiry.estimatedGst)}
                        </td>
                      </tr>
                      <tr className="border-t border-slate-200 text-sm font-black text-slate-900">
                        <td colSpan={5} className="py-2.5 px-3 text-right">
                          Estimated Total Value:
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-blue-600">
                          {formatINR(selectedEnquiry.totalAmount)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Status Update & Internal Notes Form */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  Administrative Status &amp; Dispatch Tracking
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Enquiry Workflow Status
                    </label>
                    <select
                      value={modalStatus}
                      onChange={(e) => setModalStatus(e.target.value as EnquiryStatus)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                    >
                      <option value="New">New</option>
                      <option value="Contacted">Contacted</option>
                      <option value="Quotation Sent">Quotation Sent</option>
                      <option value="Approved">Approved</option>
                      <option value="Rejected">Rejected</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Internal Admin Notes
                    </label>
                    <input
                      type="text"
                      value={modalNotes}
                      onChange={(e) => setModalNotes(e.target.value)}
                      placeholder="e.g. Sent proforma via WhatsApp, dispatch scheduled for Tuesday"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleWhatsAppCustomer(selectedEnquiry)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp Customer</span>
                    </button>

                    {selectedEnquiry.email && (
                      <button
                        type="button"
                        onClick={() => handleEmailCustomer(selectedEnquiry)}
                        className="bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>Email Official Quote</span>
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={isUpdatingStatus}
                    onClick={handleSaveStatus}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isUpdatingStatus ? (
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Save className="w-3.5 h-3.5" />
                    )}
                    <span>Update Status</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={Boolean(deleteCandidate)}
        title="Delete Customer Enquiry"
        message={`Delete RFQ record "${deleteCandidate?.enquiryNumber}"? This will remove the inquiry record.`}
        confirmText="Delete Enquiry"
        cancelText="Cancel"
        isDestructive={true}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteCandidate(null)}
      />
    </div>
  );
};

