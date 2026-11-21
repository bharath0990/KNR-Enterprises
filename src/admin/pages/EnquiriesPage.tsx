import React, { useState, useEffect, useMemo } from 'react';
import {
  CustomerEnquiry,
  EnquiryStatus,
  Quotation,
  EnquiryStatusHistoryItem,
  CommunicationLogItem,
  ConfirmedOrder,
} from '../../types';
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
  Paperclip,
  Truck,
  MapPin,
  ExternalLink,
  Plus,
  History,
  AlertCircle,
} from 'lucide-react';
import {
  fetchEnquiries,
  updateEnquiryStatus,
  deleteEnquiry,
} from '../../services/enquiryService';
import {
  fetchQuotations,
  fetchQuotationByEnquiryId,
  fetchStatusHistory,
  fetchCommunicationLogs,
  addStatusHistory,
} from '../../services/quotationService';
import { downloadQuotationPdf } from '../../services/pdfService';
import { formatINR } from '../../services/productService';
import { formatISTDateTime, formatISTDate, formatRelativeTime } from '../../utils/date';
import { ConfirmModal } from '../components/ConfirmModal';
import { QuotationBuilderModal } from '../components/QuotationBuilderModal';

interface EnquiriesPageProps {
  initialSelectedEnquiry?: CustomerEnquiry | null;
}

const statusColorMap: Record<EnquiryStatus, { bg: string; text: string; border: string }> = {
  New: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  Contacted: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  'Quotation Preparing': { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  'Quotation Sent': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  Negotiation: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-300' },
  'Order Confirmed': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  Lost: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-300' },
  Approved: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  Rejected: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  Completed: { bg: 'bg-teal-50', text: 'text-teal-800', border: 'border-teal-200' },
};

export const EnquiriesPage: React.FC<EnquiriesPageProps> = ({ initialSelectedEnquiry }) => {
  const [enquiries, setEnquiries] = useState<CustomerEnquiry[]>([]);
  const [quotationsMap, setQuotationsMap] = useState<Record<string, Quotation>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | EnquiryStatus>('all');
  const [selectedEnquiry, setSelectedEnquiry] = useState<CustomerEnquiry | null>(
    initialSelectedEnquiry || null
  );

  // Status update in modal
  const [modalStatus, setModalStatus] = useState<EnquiryStatus>('New');
  const [modalNotes, setModalNotes] = useState<string>('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<CustomerEnquiry | null>(null);

  // Quotation Builder Modal State
  const [isQuotationModalOpen, setIsQuotationModalOpen] = useState(false);
  const [activeQuotation, setActiveQuotation] = useState<Quotation | null>(null);

  // Status History & Communication Logs for Selected Enquiry
  const [statusHistory, setStatusHistory] = useState<EnquiryStatusHistoryItem[]>([]);
  const [commLogs, setCommLogs] = useState<CommunicationLogItem[]>([]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [enqs, quots] = await Promise.all([
        fetchEnquiries(),
        fetchQuotations(),
      ]);
      setEnquiries(enqs);

      // Map enquiryId -> Quotation
      const qMap: Record<string, Quotation> = {};
      quots.forEach((q) => {
        if (q.enquiryId) {
          qMap[q.enquiryId] = q;
        }
      });
      setQuotationsMap(qMap);

      if (initialSelectedEnquiry) {
        const found = enqs.find((e) => e.id === initialSelectedEnquiry.id);
        if (found) {
          handleOpenDetail(found);
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
    window.addEventListener('knr_quotations_updated', handleUpdate);
    return () => {
      window.removeEventListener('knr_enquiries_updated', handleUpdate);
      window.removeEventListener('knr_quotations_updated', handleUpdate);
    };
  }, []);

  const handleOpenDetail = async (enq: CustomerEnquiry) => {
    setSelectedEnquiry(enq);
    setModalStatus(enq.status);
    setModalNotes(enq.internalNotes || '');

    // Fetch quotation, status history, and communication logs
    try {
      const [q, hist, logs] = await Promise.all([
        fetchQuotationByEnquiryId(enq.id),
        fetchStatusHistory(enq.id),
        fetchCommunicationLogs(enq.id),
      ]);
      setActiveQuotation(q);
      setStatusHistory(hist);
      setCommLogs(logs);
    } catch (err) {
      console.warn('Error loading enquiry relations:', err);
    }
  };

  const handleSaveStatus = async () => {
    if (!selectedEnquiry) return;
    setIsUpdatingStatus(true);
    try {
      const prevStatus = selectedEnquiry.status;
      const updated = await updateEnquiryStatus(selectedEnquiry.id, modalStatus, modalNotes);

      // Add to status history
      if (prevStatus !== modalStatus) {
        await addStatusHistory(
          selectedEnquiry.id,
          prevStatus,
          modalStatus,
          modalNotes || `Status updated to ${modalStatus}`
        );
        const refreshedHistory = await fetchStatusHistory(selectedEnquiry.id);
        setStatusHistory(refreshedHistory);
      }

      setSelectedEnquiry(updated);
      setEnquiries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    } catch (err) {
      alert(`Failed to update status: ${err}`);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleOpenQuotationBuilder = (enq: CustomerEnquiry) => {
    setSelectedEnquiry(enq);
    const existing = quotationsMap[enq.id] || null;
    setActiveQuotation(existing);
    setIsQuotationModalOpen(true);
  };

  const handleQuotationSaved = (q: Quotation) => {
    setActiveQuotation(q);
    setQuotationsMap((prev) => ({ ...prev, [q.enquiryId || '']: q }));
    if (selectedEnquiry) {
      // Refresh status history
      fetchStatusHistory(selectedEnquiry.id).then(setStatusHistory);
      fetchCommunicationLogs(selectedEnquiry.id).then(setCommLogs);
    }
  };

  const handleOrderConfirmed = (order: ConfirmedOrder) => {
    if (selectedEnquiry) {
      setSelectedEnquiry({ ...selectedEnquiry, status: 'Order Confirmed' });
      setEnquiries((prev) =>
        prev.map((e) => (e.id === selectedEnquiry.id ? { ...e, status: 'Order Confirmed' } : e))
      );
      fetchStatusHistory(selectedEnquiry.id).then(setStatusHistory);
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

  // Filtered enquiries
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
          e.mandal?.toLowerCase().includes(query) ||
          e.address?.toLowerCase().includes(query)
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
          <h1 className="text-2xl sm:text-3xl font-black text-[#111827] tracking-tight font-display">
            Customer RFQ Enquiries
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1">
            Review quotation requests, prepare formal wholesale quotations, and track dispatch status
          </p>
        </div>
      </div>

      {/* 2. Filters & Search Bar */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer, phone, panchayat, or RFQ #..."
            className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-[#111827] focus:outline-none focus:border-[#F57C00] focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full sm:w-auto bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs sm:text-sm text-[#111827] font-semibold focus:outline-none focus:border-[#F57C00] focus:bg-white"
          >
            <option value="all">All Enquiry Statuses ({enquiries.length})</option>
            <option value="New">New ({enquiries.filter((e) => e.status === 'New').length})</option>
            <option value="Contacted">Contacted ({enquiries.filter((e) => e.status === 'Contacted').length})</option>
            <option value="Quotation Preparing">Quotation Preparing ({enquiries.filter((e) => e.status === 'Quotation Preparing').length})</option>
            <option value="Quotation Sent">Quotation Sent ({enquiries.filter((e) => e.status === 'Quotation Sent').length})</option>
            <option value="Negotiation">Negotiation ({enquiries.filter((e) => e.status === 'Negotiation').length})</option>
            <option value="Order Confirmed">Order Confirmed ({enquiries.filter((e) => e.status === 'Order Confirmed').length})</option>
            <option value="Lost">Lost ({enquiries.filter((e) => e.status === 'Lost').length})</option>
            <option value="Approved">Approved ({enquiries.filter((e) => e.status === 'Approved').length})</option>
            <option value="Rejected">Rejected ({enquiries.filter((e) => e.status === 'Rejected').length})</option>
            <option value="Completed">Completed ({enquiries.filter((e) => e.status === 'Completed').length})</option>
          </select>
        </div>
      </div>

      {/* 3. Enquiries Table */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                <th className="py-3 px-4">RFQ Ref #</th>
                <th className="py-3 px-4">Customer / Officer</th>
                <th className="py-3 px-4">Organisation &amp; Location</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3 text-right">Quoted Value</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-center">Quotation</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredEnquiries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <ClipboardList className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    No records available yet.
                  </td>
                </tr>
              ) : (
                filteredEnquiries.map((enq) => {
                  const style = statusColorMap[enq.status] || statusColorMap.New;
                  const quot = quotationsMap[enq.id];

                  return (
                    <tr
                      key={enq.id}
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                      onClick={() => handleOpenDetail(enq)}
                    >
                      {/* Enquiry Ref */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-mono font-bold text-[#F57C00] block">
                          {enq.enquiryNumber}
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                          {enq.source.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Customer Details */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-[#111827]">{enq.customerName}</div>
                        <div className="text-[11px] text-[#64748B] font-mono">
                          {enq.mobileNumber}
                        </div>
                      </td>

                      {/* Organisation & Mandal */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-semibold text-slate-800 truncate">
                          {enq.organisation || 'Gram Panchayat / Wholesale Buyer'}
                        </div>
                        <div className="text-[11px] text-[#64748B] truncate">
                          {enq.mandal || enq.city ? `${enq.mandal || enq.city}, ` : ''}
                          {enq.district || enq.state}
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-3 font-mono text-[11px] text-[#64748B] whitespace-nowrap">
                        <span title={formatISTDateTime(enq.createdAt)}>
                          {formatISTDate(enq.createdAt)}
                        </span>
                      </td>

                      {/* Value */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="font-mono font-bold text-[#111827]">
                          {formatINR(quot ? quot.grandTotal : enq.totalAmount)}
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

                      {/* Quotation Status */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {quot ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-orange-50 text-[#F57C00] border border-orange-200">
                            <FileText className="w-3 h-3" />
                            <span>{quot.quotationNumber}</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">None</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td
                        className="py-3 px-4 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenQuotationBuilder(enq)}
                            className="p-1.5 text-[#F57C00] hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
                            title="Build / View Quotation"
                          >
                            <FileText className="w-4 h-4" />
                          </button>

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

      {/* =========================================================================
          4. DETAILED ENQUIRY MODAL / DRAWER
         ========================================================================= */}
      {selectedEnquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
          <div
            className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-4 max-h-[94vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Bar */}
            <div className="bg-[#0D2B5B] text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#F57C00] rounded-xl text-white shadow-md">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white tracking-wide font-display">
                      Enquiry #{selectedEnquiry.enquiryNumber}
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        statusColorMap[selectedEnquiry.status]?.bg || 'bg-slate-100'
                      } ${statusColorMap[selectedEnquiry.status]?.text || 'text-slate-800'} ${
                        statusColorMap[selectedEnquiry.status]?.border || 'border-slate-200'
                      }`}
                    >
                      {selectedEnquiry.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Logged on {formatISTDateTime(selectedEnquiry.createdAt)} &bull; Source: {selectedEnquiry.source}
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
            <div className="p-6 overflow-y-auto space-y-6 text-xs text-[#111827]">
              {/* Customer & Delivery Credentials Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                {/* Left: Customer Profile */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#F57C00] flex items-center gap-1">
                    <User className="w-3 h-3" />
                    <span>Customer Information</span>
                  </span>
                  <div className="font-bold text-sm text-[#111827]">
                    {selectedEnquiry.customerName}
                  </div>
                  {selectedEnquiry.designation && (
                    <div className="text-[#64748B]">{selectedEnquiry.designation}</div>
                  )}
                  <div className="font-mono text-[#111827]">
                    Phone: <strong>{selectedEnquiry.mobileNumber}</strong>
                  </div>
                  {selectedEnquiry.email && (
                    <div className="text-[#64748B]">Email: {selectedEnquiry.email}</div>
                  )}
                  {selectedEnquiry.gstin && (
                    <div className="font-mono text-xs text-slate-700">
                      GSTIN: <strong>{selectedEnquiry.gstin}</strong>
                    </div>
                  )}
                </div>

                {/* Right: Delivery & Consignee Location */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#0D2B5B] flex items-center gap-1">
                    <Truck className="w-3 h-3" />
                    <span>Delivery &amp; Consignee Details</span>
                  </span>
                  <div className="font-bold text-sm text-[#111827]">
                    {selectedEnquiry.organisation || 'Gram Panchayat / Wholesale Buyer'}
                  </div>
                  {selectedEnquiry.address && (
                    <div className="text-slate-700">{selectedEnquiry.address}</div>
                  )}
                  <div>
                    Mandal / City: {selectedEnquiry.mandal || selectedEnquiry.city || 'Chevella'}
                  </div>
                  <div>
                    District: {selectedEnquiry.district || 'Ranga Reddy'}, {selectedEnquiry.state}
                    {selectedEnquiry.pincode ? ` - ${selectedEnquiry.pincode}` : ''}
                  </div>
                  {selectedEnquiry.expectedDeliveryDate && (
                    <div className="text-slate-600 font-semibold pt-1">
                      Expected Delivery: {formatISTDate(selectedEnquiry.expectedDeliveryDate)}
                    </div>
                  )}
                </div>
              </div>

              {/* Delivery Instructions or Customer Notes */}
              {(selectedEnquiry.deliveryInstructions || selectedEnquiry.notes) && (
                <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                    Customer Requirements &amp; Dispatch Instructions
                  </span>
                  {selectedEnquiry.deliveryInstructions && (
                    <p className="text-slate-800">
                      <strong>Delivery Instructions:</strong> {selectedEnquiry.deliveryInstructions}
                    </p>
                  )}
                  {selectedEnquiry.notes && (
                    <p className="text-slate-800">
                      <strong>Remarks:</strong> {selectedEnquiry.notes}
                    </p>
                  )}
                </div>
              )}

              {/* Uploaded BOQ Document / Attachment */}
              {selectedEnquiry.attachmentUrl && (
                <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Paperclip className="w-4 h-4 text-blue-600" />
                    <div>
                      <div className="font-bold text-blue-900">
                        {selectedEnquiry.attachmentName || 'Customer BOQ / Specification Document'}
                      </div>
                      <div className="text-[10px] text-blue-700">Uploaded with RFQ submission</div>
                    </div>
                  </div>
                  <a
                    href={selectedEnquiry.attachmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs flex items-center gap-1 transition-colors"
                  >
                    <span>View / Download</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {/* =================================================================
                  FORMAL QUOTATION CARD (If already prepared)
                 ================================================================= */}
              {activeQuotation ? (
                <div className="p-4 rounded-xl bg-orange-50/50 border border-orange-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#F57C00]" />
                      <span className="font-bold text-slate-900 text-sm">
                        Formal Quotation: #{activeQuotation.quotationNumber}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-orange-100 text-[#F57C00] border border-orange-300">
                        {activeQuotation.status}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500">
                        v{activeQuotation.version}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          downloadQuotationPdf(
                            activeQuotation,
                            activeQuotation.items || []
                          )
                        }
                        className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 rounded-lg font-bold text-xs flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5 text-[#F57C00]" />
                        <span>Download PDF</span>
                      </button>

                      <button
                        onClick={() => setIsQuotationModalOpen(true)}
                        className="px-3 py-1.5 bg-[#F57C00] hover:bg-[#E06D00] text-white rounded-lg font-bold text-xs flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                      >
                        <span>Edit Quotation</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-orange-200/60 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Taxable Subtotal</span>
                      <span className="font-mono font-bold text-slate-900">
                        {formatINR(activeQuotation.subtotal)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">GST Value</span>
                      <span className="font-mono font-bold text-slate-900">
                        {formatINR(activeQuotation.totalGst)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Road Freight</span>
                      <span className="font-mono font-bold text-slate-900">
                        {formatINR(activeQuotation.transportCharges)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Final Quoted Total</span>
                      <span className="font-mono font-black text-[#F57C00]">
                        {formatINR(activeQuotation.grandTotal)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-orange-50/40 border border-dashed border-orange-300 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="font-bold text-slate-900">No Formal Quotation Created Yet</div>
                    <div className="text-[11px] text-[#64748B]">
                      Build a GST-compliant formal quotation with negotiable rates and downloadable PDF.
                    </div>
                  </div>
                  <button
                    onClick={() => handleOpenQuotationBuilder(selectedEnquiry)}
                    className="px-4 py-2 bg-[#F57C00] hover:bg-[#E06D00] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Formal Quotation</span>
                  </button>
                </div>
              )}

              {/* Items Table */}
              <div>
                <h4 className="font-bold text-[#111827] text-sm mb-2">
                  Customer Requested Supplies
                </h4>
                <div className="border border-[#E2E8F0] rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F8FAFC] text-[11px] font-bold uppercase text-[#64748B] border-b border-[#E2E8F0]">
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
                            <td className="py-2 px-3 font-bold text-[#111827]">
                              {it.productName}
                            </td>
                            <td className="py-2 px-3 font-mono text-[#64748B]">
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
                    <tfoot className="bg-[#F8FAFC] font-semibold border-t border-[#E2E8F0]">
                      <tr>
                        <td colSpan={5} className="py-2 px-3 text-right text-[#64748B]">
                          Taxable Subtotal:
                        </td>
                        <td className="py-2 px-3 text-right font-mono">
                          {formatINR(selectedEnquiry.subtotal)}
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={5} className="py-2 px-3 text-right text-[#64748B]">
                          Estimated GST (18%):
                        </td>
                        <td className="py-2 px-3 text-right font-mono">
                          {formatINR(selectedEnquiry.estimatedGst)}
                        </td>
                      </tr>
                      <tr className="border-t border-[#E2E8F0] text-sm font-black text-[#111827]">
                        <td colSpan={5} className="py-2.5 px-3 text-right">
                          Estimated Total Value:
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-[#F57C00]">
                          {formatINR(selectedEnquiry.totalAmount)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Status Update & Internal Notes Form */}
              <div className="p-4 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] space-y-3">
                <h4 className="font-bold text-[#111827] text-xs uppercase tracking-wider">
                  Administrative Workflow Status &amp; Notes
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Enquiry Workflow Status
                    </label>
                    <select
                      value={modalStatus}
                      onChange={(e) => setModalStatus(e.target.value as EnquiryStatus)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-[#111827] focus:outline-none focus:border-[#F57C00]"
                    >
                      <option value="New">New</option>
                      <option value="Contacted">Contacted</option>
                      <option value="Quotation Preparing">Quotation Preparing</option>
                      <option value="Quotation Sent">Quotation Sent</option>
                      <option value="Negotiation">Negotiation</option>
                      <option value="Order Confirmed">Order Confirmed</option>
                      <option value="Lost">Lost</option>
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
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-[#111827] focus:outline-none focus:border-[#F57C00]"
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
                        className="bg-[#0D2B5B] hover:bg-[#071c3d] text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
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
                    className="bg-[#F57C00] hover:bg-[#E06D00] text-white font-bold text-xs px-5 py-2 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
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

              {/* Status History & Communication Logs Timeline */}
              {(statusHistory.length > 0 || commLogs.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {/* Status History */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                      <History className="w-3.5 h-3.5" />
                      <span>Status History</span>
                    </span>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {statusHistory.map((h) => (
                        <div key={h.id} className="text-[11px] border-l-2 border-orange-400 pl-2">
                          <div className="font-bold text-slate-800">
                            {h.previousStatus ? `${h.previousStatus} → ` : ''}{h.newStatus}
                          </div>
                          {h.notes && <div className="text-slate-600">{h.notes}</div>}
                          <div className="text-[10px] text-slate-400">
                            {formatISTDateTime(h.createdAt)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Communication Logs */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Communications Dispatched</span>
                    </span>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {commLogs.map((c) => (
                        <div key={c.id} className="text-[11px] border-l-2 border-emerald-400 pl-2">
                          <div className="font-bold text-slate-800 uppercase text-[10px]">
                            {c.channel} &bull; {c.status}
                          </div>
                          {c.subject && <div className="font-semibold">{c.subject}</div>}
                          <div className="text-slate-600 line-clamp-2">{c.messagePreview}</div>
                          <div className="text-[10px] text-slate-400">
                            {formatISTDateTime(c.createdAt)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quotation Builder Modal */}
      {selectedEnquiry && isQuotationModalOpen && (
        <QuotationBuilderModal
          isOpen={isQuotationModalOpen}
          onClose={() => setIsQuotationModalOpen(false)}
          enquiry={selectedEnquiry}
          existingQuotation={activeQuotation}
          onQuotationSaved={handleQuotationSaved}
          onOrderConfirmed={handleOrderConfirmed}
        />
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
