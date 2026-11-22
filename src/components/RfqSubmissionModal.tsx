import React, { useState } from 'react';
import { CartItem, Language, EnquiryItem, CustomerEnquiry } from '../types';
import { submitRfqEnquiry } from '../services/enquiryService';
import {
  X,
  CheckCircle2,
  AlertCircle,
  FileText,
  Building,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Upload,
  ArrowRight,
  ArrowLeft,
  ShoppingCart,
  MessageCircle,
  Check,
  Info,
} from 'lucide-react';
import { getAssetUrl } from '../utils/assets';

interface RfqSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onClearCart: () => void;
  language: Language;
}

export const RfqSubmissionModal: React.FC<RfqSubmissionModalProps> = ({
  isOpen,
  onClose,
  items,
  onClearCart,
  language,
}) => {
  if (!isOpen) return null;

  const [step, setStep] = useState<'form' | 'success'>('form');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittedEnquiry, setSubmittedEnquiry] = useState<CustomerEnquiry | null>(null);

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [organisation, setOrganisation] = useState('');
  const [department, setDepartment] = useState('');
  const [gstin, setGstin] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('Ranga Reddy');
  const [state, setState] = useState('Telangana');
  const [pincode, setPincode] = useState('');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);

  // Subtotal & Estimates
  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const estimatedGst = Math.round(subtotal * 0.18);
  const indicativeTotal = subtotal + estimatedGst;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        alert('File size exceeds 10MB limit.');
        return;
      }
      setAttachmentFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (!customerName.trim()) {
      setErrorMessage('Full name is required.');
      return;
    }
    if (!mobileNumber.trim() || mobileNumber.replace(/[^0-9]/g, '').length < 10) {
      setErrorMessage('A valid 10-digit mobile number is required.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('A valid email address is required for official quotation delivery.');
      return;
    }
    if (!organisation.trim()) {
      setErrorMessage('Organization / Gram Panchayat / Business name is required.');
      return;
    }
    if (!address.trim() || !city.trim() || !pincode.trim()) {
      setErrorMessage('Complete delivery address (address, city/mandal, pincode) is required.');
      return;
    }

    if (items.length === 0) {
      setErrorMessage('Your quotation basket has no products. Please add items to request a quote.');
      return;
    }

    setIsSubmitting(true);

    try {
      const enquiryItems: EnquiryItem[] = items.map((it) => ({
        productId: it.product.id,
        productName: it.product.name,
        quantity: it.quantity,
        unit: it.product.unit,
        unitPrice: it.product.price,
        hsnCode: it.product.hsnCode || '',
        totalPrice: it.product.price * it.quantity,
      }));

      const fullDeliveryAddress = `${address}, ${city}, ${district}, ${state} - ${pincode}`;

      const res = await submitRfqEnquiry(
        {
          customerName: customerName.trim(),
          mobileNumber: mobileNumber.trim(),
          email: email.trim(),
          organisation: organisation.trim(),
          designation: department.trim() || 'Procurement Incharge',
          mandal: city.trim(),
          district: district.trim(),
          state: state.trim(),
          address: address.trim(),
          city: city.trim(),
          pincode: pincode.trim(),
          gstin: gstin.trim(),
          deliveryInstructions: deliveryInstructions.trim(),
          expectedDeliveryDate: expectedDeliveryDate,
          attachmentName: attachmentFile ? attachmentFile.name : undefined,
          notes: `${additionalNotes.trim() ? `${additionalNotes.trim()}\n` : ''}Delivery to: ${fullDeliveryAddress}`,
          source: 'rfq_modal_submission',
        },
        enquiryItems
      );

      setSubmittedEnquiry(res);
      onClearCart();
      setStep('success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(`Submission failed: ${msg}. Please call depot dispatch at +91 8886175855.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto print:hidden">
      {/* Backdrop */}
      <div
        onClick={() => {
          if (step !== 'success') onClose();
        }}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
      />

      <div className="min-h-full flex items-center justify-center p-3 sm:p-6">
        <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-[#E2E8F0] overflow-hidden animate-fadeIn my-8">
          {/* Header */}
          <div className="px-6 py-5 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FFF3E0] text-[#F57C00] flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-lg text-[#111827] font-display">
                  {step === 'form' ? 'Wholesale Request for Quotation (RFQ)' : 'Quotation Request Confirmed'}
                </h3>
                <p className="text-xs text-[#64748B]">
                  {step === 'form'
                    ? 'Submit institutional procurement details for formal GST proforma quotation'
                    : 'Your enquiry has been received and registered at Chevella Central Depot'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {step === 'form' ? (
            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
              {errorMessage && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800 text-xs font-semibold animate-fadeIn">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* 1. Selected Products Summary Accordion */}
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#111827] flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-[#F57C00]" />
                    <span>Quotation Basket ({items.length} Products Selected)</span>
                  </span>
                  <span className="text-[#64748B]">
                    Pricing: <strong className="text-[#F57C00] font-bold">Formal Quote</strong>
                  </span>
                </div>

                <div className="max-h-36 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {items.map((it) => (
                    <div
                      key={it.product.id}
                      className="flex items-center justify-between text-xs bg-white p-2.5 rounded-xl border border-slate-200"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={getAssetUrl(it.product.image)}
                          alt={it.product.name}
                          className="w-8 h-8 rounded-lg object-contain bg-slate-50 border border-slate-200 shrink-0"
                        />
                        <div className="truncate">
                          <span className="font-bold text-[#111827] block truncate">
                            {it.product.name}
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium">
                            Quantity: {it.quantity} {it.product.unit}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-[#F57C00] bg-orange-50 border border-orange-200/60 px-2 py-0.5 rounded shrink-0 ml-2">
                        Contact for Pricing
                      </span>
                    </div>
                  ))}
                </div>

                <div className="text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-xl flex items-center gap-2">
                  <Info className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Official Proforma Quotation: Our depot team will review your requested quantities and issue an official quotation including volume discounts, GST tax invoice, and transportation dispatch terms.
                  </span>
                </div>
              </div>

              {/* 2. Customer Information (Required) */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#F57C00] flex items-center gap-1.5">
                  <User className="w-4 h-4" />
                  <span>1. Contact & Organisation Information</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold text-[#111827] mb-1">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. K. Rajesh"
                      className="w-full bg-slate-50 border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-xs text-[#111827] focus:outline-none focus:border-[#F57C00] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#111827] mb-1">
                      Mobile Number (WhatsApp Enabled) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="w-full bg-slate-50 border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-xs text-[#111827] focus:outline-none focus:border-[#F57C00] focus:bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#111827] mb-1">
                      Official Email Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. sarpanch@telangana.gov.in"
                      className="w-full bg-slate-50 border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-xs text-[#111827] focus:outline-none focus:border-[#F57C00] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#111827] mb-1">
                      Organisation / Gram Panchayat <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={organisation}
                      onChange={(e) => setOrganisation(e.target.value)}
                      placeholder="e.g. Gram Panchayat Chevella"
                      className="w-full bg-slate-50 border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-xs text-[#111827] focus:outline-none focus:border-[#F57C00] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#111827] mb-1">
                      Department / Designation (Optional)
                    </label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="e.g. Sarpanch / Sanitary Inspector"
                      className="w-full bg-slate-50 border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-xs text-[#111827] focus:outline-none focus:border-[#F57C00] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#111827] mb-1">
                      Buyer GSTIN (Optional)
                    </label>
                    <input
                      type="text"
                      value={gstin}
                      onChange={(e) => setGstin(e.target.value.toUpperCase())}
                      placeholder="e.g. 36AAAAA0000A1Z5"
                      className="w-full bg-slate-50 border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-xs text-[#111827] focus:outline-none focus:border-[#F57C00] focus:bg-white font-mono uppercase"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Delivery Details (Required) */}
              <div className="space-y-4 pt-2 border-t border-[#E2E8F0]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#F57C00] flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  <span>2. Delivery & Site Address</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="sm:col-span-3">
                    <label className="block font-semibold text-[#111827] mb-1">
                      Site / Office Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="e.g. Panchayat Office Building, Main Road"
                      className="w-full bg-slate-50 border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-xs text-[#111827] focus:outline-none focus:border-[#F57C00] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#111827] mb-1">
                      Mandal / City <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Chevella"
                      className="w-full bg-slate-50 border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-xs text-[#111827] focus:outline-none focus:border-[#F57C00] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#111827] mb-1">
                      District <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      placeholder="e.g. Ranga Reddy"
                      className="w-full bg-slate-50 border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-xs text-[#111827] focus:outline-none focus:border-[#F57C00] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#111827] mb-1">
                      PIN Code <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      placeholder="e.g. 501503"
                      className="w-full bg-slate-50 border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-xs text-[#111827] focus:outline-none focus:border-[#F57C00] focus:bg-white font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold text-[#111827] mb-1">
                      Expected Delivery Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={expectedDeliveryDate}
                      onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                      className="w-full bg-slate-50 border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-xs text-[#111827] focus:outline-none focus:border-[#F57C00] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#111827] mb-1">
                      Upload BOQ / Tender Specifications (Optional)
                    </label>
                    <label className="w-full border border-dashed border-slate-300 rounded-xl px-3.5 py-2.5 flex items-center justify-between text-xs text-slate-500 hover:border-[#F57C00] cursor-pointer bg-slate-50">
                      <span className="truncate">
                        {attachmentFile ? attachmentFile.name : 'Select PDF / DOC (Max 10MB)'}
                      </span>
                      <Upload className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-[#111827] mb-1 text-xs">
                    Special Packaging, Grant Code or Delivery Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    placeholder="e.g. Grant 15th Finance Commission reference, specific delivery unloading requirements..."
                    className="w-full bg-slate-50 border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-xs text-[#111827] focus:outline-none focus:border-[#F57C00] focus:bg-white"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Continue Browsing Products
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-8 py-3 bg-[#F57C00] hover:bg-[#E06D00] text-white rounded-xl font-bold text-xs sm:text-sm shadow-md shadow-orange-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Submitting Quotation Request...</span>
                  ) : (
                    <>
                      <span>Submit RFQ Request</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* 4. SUCCESS CONFIRMATION SCREEN */
            <div className="p-6 sm:p-10 space-y-6 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="space-y-2 max-w-lg mx-auto">
                <h4 className="text-2xl font-black text-[#111827] tracking-tight font-display">
                  Quotation Request Received!
                </h4>
                <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                  Thank you for contacting KNR Enterprises. Your wholesale quotation request has been received. Our team will review your requirements and send you a formal quotation through WhatsApp and Email.
                </p>
              </div>

              {/* Reference ID Banner */}
              {submittedEnquiry && (
                <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl max-w-md mx-auto space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                    Enquiry Reference Number
                  </span>
                  <div className="font-mono text-xl font-black text-[#F57C00]">
                    {submittedEnquiry.enquiryNumber}
                  </div>
                  <span className="text-[11px] text-slate-500 block">
                    Customer: {submittedEnquiry.customerName} ({submittedEnquiry.organisation})
                  </span>
                </div>
              )}

              {/* Next Steps Card */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-xl mx-auto text-left text-xs">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <div className="font-bold text-[#111827] flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-[#FFF3E0] text-[#F57C00] font-mono font-bold flex items-center justify-center text-[10px]">
                      1
                    </span>
                    <span>Depot Review</span>
                  </div>
                  <p className="text-[#64748B] text-[11px]">
                    Warehouse inventory and batch assay specs are reviewed.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <div className="font-bold text-[#111827] flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-[#FFF3E0] text-[#F57C00] font-mono font-bold flex items-center justify-center text-[10px]">
                      2
                    </span>
                    <span>Formal Quotation</span>
                  </div>
                  <p className="text-[#64748B] text-[11px]">
                    Administrator prepares commercial quotation with GST and freight terms.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <div className="font-bold text-[#111827] flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-[#FFF3E0] text-[#F57C00] font-mono font-bold flex items-center justify-center text-[10px]">
                      3
                    </span>
                    <span>Direct Delivery</span>
                  </div>
                  <p className="text-[#64748B] text-[11px]">
                    Quotation sent directly to your WhatsApp ({mobileNumber}) and Email ({email}).
                  </p>
                </div>
              </div>

              {/* Direct WhatsApp Action */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <a
                  href={`https://wa.me/918886175855?text=${encodeURIComponent(`Hello KNR Enterprises, I have submitted wholesale RFQ reference: ${submittedEnquiry?.enquiryNumber || 'KNR-RFQ'}. Please confirm review.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Notify Depot on WhatsApp</span>
                </a>

                <button
                  onClick={onClose}
                  className="w-full sm:w-auto px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm rounded-xl transition-colors cursor-pointer"
                >
                  Return to Website
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

