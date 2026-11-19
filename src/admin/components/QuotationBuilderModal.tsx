import React, { useState, useEffect, useMemo } from 'react';
import {
  CustomerEnquiry,
  Quotation,
  QuotationItem,
  QuotationStatus,
  ConfirmedOrder,
} from '../../types';
import {
  FileText,
  X,
  Plus,
  Trash2,
  Download,
  Send,
  MessageCircle,
  Mail,
  CheckCircle,
  Clock,
  Printer,
  Save,
  AlertCircle,
  Building,
  Truck,
  DollarSign,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';
import {
  generateQuotationNumber,
  numberToIndianWords,
  createQuotation,
  createRevisedQuotation,
  confirmOrder,
  logCommunication,
  updateQuotationStatus,
} from '../../services/quotationService';
import { downloadQuotationPdf } from '../../services/pdfService';
import { formatINR } from '../../services/productService';
import { useWebsiteSettings } from '../../context/WebsiteSettingsContext';

interface QuotationBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  enquiry: CustomerEnquiry;
  existingQuotation?: Quotation | null;
  onQuotationSaved?: (quotation: Quotation) => void;
  onOrderConfirmed?: (order: ConfirmedOrder) => void;
}

export const QuotationBuilderModal: React.FC<QuotationBuilderModalProps> = ({
  isOpen,
  onClose,
  enquiry,
  existingQuotation,
  onQuotationSaved,
  onOrderConfirmed,
}) => {
  const { settings } = useWebsiteSettings();

  // Quotation Meta
  const [quotationNumber, setQuotationNumber] = useState<string>('');
  const [version, setVersion] = useState<number>(1);
  const [taxType, setTaxType] = useState<'INTRA_STATE' | 'INTER_STATE'>('INTRA_STATE');
  const [quotationStatus, setQuotationStatus] = useState<QuotationStatus>('Draft');
  const [validityDate, setValidityDate] = useState<string>('');

  // Customer & Consignee Details
  const [customerName, setCustomerName] = useState<string>('');
  const [organisation, setOrganisation] = useState<string>('');
  const [mobileNumber, setMobileNumber] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [gstin, setGstin] = useState<string>('');
  const [deliveryAddress, setDeliveryAddress] = useState<string>('');
  const [placeOfSupply, setPlaceOfSupply] = useState<string>('Telangana (36)');

  // Commercial Terms
  const [paymentTerms, setPaymentTerms] = useState<string>(
    '100% advance against formal proforma / 30-day institutional credit for Gram Panchayats & Municipalities'
  );
  const [deliveryTerms, setDeliveryTerms] = useState<string>(
    'Immediate dispatch from Chevella Depot; 24-48 hours road freight delivery across Telangana'
  );
  const [warrantyTerms, setWarrantyTerms] = useState<string>(
    'Standard manufacturer BIS & ISO warranty. Formulations guaranteed fresh from factory batch.'
  );
  const [termsAndConditions, setTermsAndConditions] = useState<string>(
    '1. Rates quoted are firm for 15 days from issue date. 2. GST as applicable under Indian Tax Laws. 3. Subject to Chevella Depot / Telangana jurisdiction.'
  );
  const [notes, setNotes] = useState<string>('');

  // Line items
  const [items, setItems] = useState<QuotationItem[]>([]);

  // Additional Charges
  const [transportCharges, setTransportCharges] = useState<number>(0);
  const [packagingCharges, setPackagingCharges] = useState<number>(0);
  const [otherCharges, setOtherCharges] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);

  // Status flags
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize data
  useEffect(() => {
    if (!isOpen) return;

    if (existingQuotation) {
      setQuotationNumber(existingQuotation.quotationNumber);
      setVersion(existingQuotation.version || 1);
      setTaxType(existingQuotation.taxType || 'INTRA_STATE');
      setQuotationStatus(existingQuotation.status || 'Draft');
      setValidityDate(
        existingQuotation.validityDate
          ? existingQuotation.validityDate.slice(0, 10)
          : getDefaultValidityDate()
      );
      setCustomerName(existingQuotation.customerName || enquiry.customerName);
      setOrganisation(existingQuotation.organisation || enquiry.organisation || '');
      setMobileNumber(existingQuotation.mobileNumber || enquiry.mobileNumber);
      setEmail(existingQuotation.email || enquiry.email || '');
      setGstin(existingQuotation.gstin || enquiry.gstin || '');
      setDeliveryAddress(existingQuotation.deliveryAddress || enquiry.address || '');
      setPlaceOfSupply(existingQuotation.placeOfSupply || 'Telangana (36)');
      setPaymentTerms(existingQuotation.paymentTerms || paymentTerms);
      setDeliveryTerms(existingQuotation.deliveryTerms || deliveryTerms);
      setWarrantyTerms(existingQuotation.warrantyTerms || warrantyTerms);
      setTermsAndConditions(existingQuotation.termsAndConditions || termsAndConditions);
      setNotes(existingQuotation.notes || enquiry.notes || '');
      setTransportCharges(existingQuotation.transportCharges || 0);
      setPackagingCharges(existingQuotation.packagingCharges || 0);
      setOtherCharges(existingQuotation.otherCharges || 0);
      setDiscountAmount(existingQuotation.discountAmount || 0);
      setItems(existingQuotation.items || []);
    } else {
      setQuotationNumber(generateQuotationNumber());
      setVersion(1);
      setTaxType(
        enquiry.state && enquiry.state.toLowerCase() !== 'telangana'
          ? 'INTER_STATE'
          : 'INTRA_STATE'
      );
      setQuotationStatus('Draft');
      setValidityDate(getDefaultValidityDate());
      setCustomerName(enquiry.customerName);
      setOrganisation(enquiry.organisation || '');
      setMobileNumber(enquiry.mobileNumber);
      setEmail(enquiry.email || '');
      setGstin(enquiry.gstin || '');
      setDeliveryAddress(
        enquiry.address ||
          (enquiry.district
            ? `${enquiry.mandal || ''}, ${enquiry.district}, ${enquiry.state}`
            : 'Chevella Mandal, Telangana')
      );
      setPlaceOfSupply(
        enquiry.state && enquiry.state.toLowerCase() !== 'telangana'
          ? `${enquiry.state} (Inter-State)`
          : 'Telangana (36)'
      );
      setNotes(enquiry.notes || '');
      setTransportCharges(0);
      setPackagingCharges(0);
      setOtherCharges(0);
      setDiscountAmount(0);

      // Pre-fill items from enquiry
      if (enquiry.items && enquiry.items.length > 0) {
        const initialItems: QuotationItem[] = enquiry.items.map((it, idx) => {
          const qty = it.quantity || 1;
          const rate = it.unitPrice || 0;
          const taxableVal = qty * rate;
          const gstRate = 18;
          const gstAmt = (taxableVal * gstRate) / 100;

          return {
            id: `item-${Date.now()}-${idx}`,
            quotationId: '',
            productId: it.productId,
            productName: it.productName,
            sku: `KNR-${(idx + 1).toString().padStart(3, '0')}`,
            hsnCode: it.hsnCode || '3808.91',
            quantity: qty,
            unit: it.unit || 'Unit',
            unitPrice: rate,
            discountPercent: 0,
            taxableValue: taxableVal,
            gstRate: gstRate,
            cgstAmount: (taxableVal * 9) / 100,
            sgstAmount: (taxableVal * 9) / 100,
            igstAmount: 0,
            totalPrice: taxableVal + gstAmt,
          };
        });
        setItems(initialItems);
      } else {
        setItems([]);
      }
    }
  }, [isOpen, enquiry, existingQuotation]);

  function getDefaultValidityDate(): string {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().slice(0, 10);
  }

  // Recalculate line item totals
  const handleItemChange = (
    index: number,
    field: keyof QuotationItem,
    value: any
  ) => {
    setItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: value };

      const qty = Number(item.quantity) || 0;
      const rate = Number(item.unitPrice) || 0;
      const discPct = Number(item.discountPercent) || 0;
      const gstRate = Number(item.gstRate) || 18;

      const baseVal = qty * rate;
      const discountVal = (baseVal * discPct) / 100;
      const taxableVal = Math.max(0, baseVal - discountVal);
      const totalGst = (taxableVal * gstRate) / 100;

      item.taxableValue = Math.round(taxableVal * 100) / 100;

      if (taxType === 'INTRA_STATE') {
        item.cgstAmount = Math.round((totalGst / 2) * 100) / 100;
        item.sgstAmount = Math.round((totalGst / 2) * 100) / 100;
        item.igstAmount = 0;
      } else {
        item.cgstAmount = 0;
        item.sgstAmount = 0;
        item.igstAmount = Math.round(totalGst * 100) / 100;
      }

      item.totalPrice = Math.round((taxableVal + totalGst) * 100) / 100;
      updated[index] = item;
      return updated;
    });
  };

  const handleAddItem = () => {
    const newItem: QuotationItem = {
      id: `item-${Date.now()}`,
      quotationId: '',
      productName: '',
      sku: '',
      hsnCode: '3808.91',
      quantity: 1,
      unit: 'Kg',
      unitPrice: 0,
      discountPercent: 0,
      taxableValue: 0,
      gstRate: 18,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 0,
      totalPrice: 0,
    };
    setItems((prev) => [...prev, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Recalculate CGST/SGST vs IGST if taxType changes
  useEffect(() => {
    setItems((prev) =>
      prev.map((item) => {
        const taxableVal = item.taxableValue || 0;
        const gstRate = item.gstRate || 18;
        const totalGst = (taxableVal * gstRate) / 100;

        let cgst = 0;
        let sgst = 0;
        let igst = 0;

        if (taxType === 'INTRA_STATE') {
          cgst = Math.round((totalGst / 2) * 100) / 100;
          sgst = Math.round((totalGst / 2) * 100) / 100;
        } else {
          igst = Math.round(totalGst * 100) / 100;
        }

        return {
          ...item,
          cgstAmount: cgst,
          sgstAmount: sgst,
          igstAmount: igst,
        };
      })
    );
  }, [taxType]);

  // Aggregate Computations
  const calculations = useMemo(() => {
    const subtotal = items.reduce((acc, it) => acc + (it.taxableValue || 0), 0);
    const totalCgst = items.reduce((acc, it) => acc + (it.cgstAmount || 0), 0);
    const totalSgst = items.reduce((acc, it) => acc + (it.sgstAmount || 0), 0);
    const totalIgst = items.reduce((acc, it) => acc + (it.igstAmount || 0), 0);
    const totalGst = totalCgst + totalSgst + totalIgst;

    const extraCharges =
      Number(transportCharges || 0) +
      Number(packagingCharges || 0) +
      Number(otherCharges || 0);

    const grossTotal = subtotal + totalGst + extraCharges - Number(discountAmount || 0);
    const grandTotal = Math.max(0, Math.round(grossTotal));
    const amountInWords = numberToIndianWords(grandTotal);

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      totalCgst: Math.round(totalCgst * 100) / 100,
      totalSgst: Math.round(totalSgst * 100) / 100,
      totalIgst: Math.round(totalIgst * 100) / 100,
      totalGst: Math.round(totalGst * 100) / 100,
      extraCharges,
      grandTotal,
      amountInWords,
    };
  }, [items, transportCharges, packagingCharges, otherCharges, discountAmount]);

  // Build full Quotation object
  const buildQuotationPayload = (newStatus: QuotationStatus): Quotation => {
    return {
      id: existingQuotation?.id || `quot_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      quotationNumber: quotationNumber || generateQuotationNumber(),
      enquiryId: enquiry.id,
      customerName: customerName.trim(),
      mobileNumber: mobileNumber.trim(),
      email: email.trim(),
      organisation: organisation.trim(),
      gstin: gstin.trim(),
      deliveryAddress: deliveryAddress.trim(),
      placeOfSupply,
      taxType,
      subtotal: calculations.subtotal,
      discountAmount: Number(discountAmount) || 0,
      taxableValue: calculations.subtotal,
      cgstAmount: calculations.totalCgst,
      sgstAmount: calculations.totalSgst,
      igstAmount: calculations.totalIgst,
      totalGst: calculations.totalGst,
      transportCharges: Number(transportCharges) || 0,
      packagingCharges: Number(packagingCharges) || 0,
      otherCharges: Number(otherCharges) || 0,
      grandTotal: calculations.grandTotal,
      amountInWords: calculations.amountInWords,
      validityDate: validityDate || getDefaultValidityDate(),
      paymentTerms: paymentTerms.trim(),
      deliveryTerms: deliveryTerms.trim(),
      warrantyTerms: warrantyTerms.trim(),
      notes: notes.trim(),
      termsAndConditions: termsAndConditions.trim(),
      status: newStatus,
      version,
      createdBy: 'Administrator',
      createdAt: existingQuotation?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items: items.map((it) => ({ ...it })),
    };
  };

  // 1. Save Quotation Draft
  const handleSaveDraft = async () => {
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const payload = buildQuotationPayload('Draft');
      const saved = await createQuotation({
        enquiryId: payload.enquiryId,
        customerName: payload.customerName,
        mobileNumber: payload.mobileNumber,
        email: payload.email,
        organisation: payload.organisation,
        gstin: payload.gstin,
        deliveryAddress: payload.deliveryAddress,
        placeOfSupply: payload.placeOfSupply,
        taxType: payload.taxType,
        subtotal: payload.subtotal,
        discountAmount: payload.discountAmount,
        taxableValue: payload.taxableValue,
        cgstAmount: payload.cgstAmount,
        sgstAmount: payload.sgstAmount,
        igstAmount: payload.igstAmount,
        totalGst: payload.totalGst,
        transportCharges: payload.transportCharges,
        packagingCharges: payload.packagingCharges,
        otherCharges: payload.otherCharges,
        grandTotal: payload.grandTotal,
        validityDate: payload.validityDate,
        paymentTerms: payload.paymentTerms,
        deliveryTerms: payload.deliveryTerms,
        warrantyTerms: payload.warrantyTerms,
        notes: payload.notes,
        termsAndConditions: payload.termsAndConditions,
        status: 'Draft',
        items: items.map((it) => ({
          productId: it.productId,
          productName: it.productName,
          sku: it.sku,
          hsnCode: it.hsnCode,
          quantity: it.quantity,
          unit: it.unit,
          unitPrice: it.unitPrice,
          discountPercent: it.discountPercent,
          taxableValue: it.taxableValue,
          gstRate: it.gstRate,
          cgstAmount: it.cgstAmount,
          sgstAmount: it.sgstAmount,
          igstAmount: it.igstAmount,
          totalPrice: it.totalPrice,
          notes: it.notes,
        })),
      });

      setSuccessMessage(`Quotation ${saved.quotationNumber} saved as Draft!`);
      if (onQuotationSaved) onQuotationSaved(saved);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to save quotation');
    } finally {
      setIsSaving(false);
    }
  };

  // 2. Download Official PDF
  const handleDownloadPdf = () => {
    try {
      const payload = buildQuotationPayload(quotationStatus);
      downloadQuotationPdf(payload, items);
      setSuccessMessage(`Quotation PDF generated and download started.`);
    } catch (err: any) {
      setErrorMessage(`Failed to generate PDF: ${err?.message || err}`);
    }
  };

  // 3. Send via WhatsApp
  const handleSendWhatsApp = async () => {
    setIsSaving(true);
    try {
      const payload = buildQuotationPayload('Sent');
      const saved = await createQuotation({
        enquiryId: payload.enquiryId,
        customerName: payload.customerName,
        mobileNumber: payload.mobileNumber,
        email: payload.email,
        organisation: payload.organisation,
        gstin: payload.gstin,
        deliveryAddress: payload.deliveryAddress,
        placeOfSupply: payload.placeOfSupply,
        taxType: payload.taxType,
        subtotal: payload.subtotal,
        discountAmount: payload.discountAmount,
        taxableValue: payload.taxableValue,
        cgstAmount: payload.cgstAmount,
        sgstAmount: payload.sgstAmount,
        igstAmount: payload.igstAmount,
        totalGst: payload.totalGst,
        transportCharges: payload.transportCharges,
        packagingCharges: payload.packagingCharges,
        otherCharges: payload.otherCharges,
        grandTotal: payload.grandTotal,
        validityDate: payload.validityDate,
        paymentTerms: payload.paymentTerms,
        deliveryTerms: payload.deliveryTerms,
        warrantyTerms: payload.warrantyTerms,
        notes: payload.notes,
        termsAndConditions: payload.termsAndConditions,
        status: 'Sent',
        items: items.map((it) => ({
          productId: it.productId,
          productName: it.productName,
          sku: it.sku,
          hsnCode: it.hsnCode,
          quantity: it.quantity,
          unit: it.unit,
          unitPrice: it.unitPrice,
          discountPercent: it.discountPercent,
          taxableValue: it.taxableValue,
          gstRate: it.gstRate,
          cgstAmount: it.cgstAmount,
          sgstAmount: it.sgstAmount,
          igstAmount: it.igstAmount,
          totalPrice: it.totalPrice,
          notes: it.notes,
        })),
      });

      // Format WhatsApp Message
      const cleanPhone = mobileNumber.replace(/[^0-9]/g, '');
      const phone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;

      let msg = `*OFFICIAL QUOTATION — KNR ENTERPRISES*\n`;
      msg += `*Ref:* ${saved.quotationNumber} (Ver ${saved.version})\n`;
      msg += `*Date:* ${new Date().toLocaleDateString('en-IN')}\n`;
      msg += `*Billed To:* ${saved.customerName} (${saved.organisation || 'Gram Panchayat / Civic Department'})\n`;
      msg += `*Delivery Location:* ${saved.deliveryAddress}\n\n`;

      msg += `*QUOTED BULK SUPPLIES:*\n`;
      items.forEach((it, idx) => {
        msg += `${idx + 1}. *${it.productName}*\n`;
        msg += `   Qty: ${it.quantity} ${it.unit} @ ₹${it.unitPrice}/${it.unit} = ₹${it.totalPrice.toLocaleString('en-IN')}\n`;
      });

      msg += `\n*Taxable Subtotal:* ₹${saved.subtotal.toLocaleString('en-IN')}\n`;
      msg += `*GST (${saved.taxType === 'INTRA_STATE' ? 'CGST+SGST' : 'IGST'}):* ₹${saved.totalGst.toLocaleString('en-IN')}\n`;
      if (saved.transportCharges > 0) {
        msg += `*Depot Road Freight:* ₹${saved.transportCharges.toLocaleString('en-IN')}\n`;
      }
      msg += `*Grand Total Value:* *₹${saved.grandTotal.toLocaleString('en-IN')}*\n`;
      msg += `*Amount in Words:* ${saved.amountInWords}\n\n`;

      msg += `*Payment Terms:* ${saved.paymentTerms}\n`;
      msg += `*Delivery Timeline:* ${saved.deliveryTerms}\n`;
      msg += `*Validity:* Valid up to ${new Date(saved.validityDate).toLocaleDateString('en-IN')}\n\n`;

      msg += `Warm Regards,\n*K. Narendar Reddy*\nManaging Partner, KNR Enterprises\nChevella Logistics Depot, Telangana\nGSTIN: 36CUHPK5939D1ZG`;

      // Log communication
      await logCommunication({
        enquiryId: enquiry.id,
        quotationId: saved.id,
        channel: 'whatsapp',
        recipient: mobileNumber,
        subject: `Quotation ${saved.quotationNumber}`,
        messagePreview: msg.slice(0, 200),
        status: 'sent',
      });

      setQuotationStatus('Sent');
      if (onQuotationSaved) onQuotationSaved(saved);

      window.open(
        `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`,
        '_blank',
        'noopener,noreferrer'
      );
      setSuccessMessage('Quotation sent via WhatsApp and logged to communication history!');
    } catch (err: any) {
      setErrorMessage(`Failed to send WhatsApp: ${err?.message || err}`);
    } finally {
      setIsSaving(false);
    }
  };

  // 4. Send via Email
  const handleSendEmail = async () => {
    if (!email) {
      alert('Please enter a valid customer email address.');
      return;
    }
    setIsSaving(true);
    try {
      const payload = buildQuotationPayload('Sent');
      const saved = await createQuotation({
        enquiryId: payload.enquiryId,
        customerName: payload.customerName,
        mobileNumber: payload.mobileNumber,
        email: payload.email,
        organisation: payload.organisation,
        gstin: payload.gstin,
        deliveryAddress: payload.deliveryAddress,
        placeOfSupply: payload.placeOfSupply,
        taxType: payload.taxType,
        subtotal: payload.subtotal,
        discountAmount: payload.discountAmount,
        taxableValue: payload.taxableValue,
        cgstAmount: payload.cgstAmount,
        sgstAmount: payload.sgstAmount,
        igstAmount: payload.igstAmount,
        totalGst: payload.totalGst,
        transportCharges: payload.transportCharges,
        packagingCharges: payload.packagingCharges,
        otherCharges: payload.otherCharges,
        grandTotal: payload.grandTotal,
        validityDate: payload.validityDate,
        paymentTerms: payload.paymentTerms,
        deliveryTerms: payload.deliveryTerms,
        warrantyTerms: payload.warrantyTerms,
        notes: payload.notes,
        termsAndConditions: payload.termsAndConditions,
        status: 'Sent',
        items: items.map((it) => ({
          productId: it.productId,
          productName: it.productName,
          sku: it.sku,
          hsnCode: it.hsnCode,
          quantity: it.quantity,
          unit: it.unit,
          unitPrice: it.unitPrice,
          discountPercent: it.discountPercent,
          taxableValue: it.taxableValue,
          gstRate: it.gstRate,
          cgstAmount: it.cgstAmount,
          sgstAmount: it.sgstAmount,
          igstAmount: it.igstAmount,
          totalPrice: it.totalPrice,
          notes: it.notes,
        })),
      });

      const subject = `Official Quotation ${saved.quotationNumber} — KNR Enterprises`;
      let body = `Dear ${saved.customerName},\n\n`;
      body += `Thank you for your inquiry with KNR Enterprises. Please find our official formal quotation details below:\n\n`;
      body += `Quotation Number: ${saved.quotationNumber} (Version ${saved.version})\n`;
      body += `Quotation Date: ${new Date().toLocaleDateString('en-IN')}\n`;
      body += `Organisation: ${saved.organisation || 'N/A'}\n`;
      body += `Delivery Address: ${saved.deliveryAddress}\n\n`;

      body += `SUPPLIES SCHEDULE:\n`;
      items.forEach((it, idx) => {
        body += `${idx + 1}. ${it.productName} (HSN: ${it.hsnCode || '3808.91'}) — Qty: ${it.quantity} ${it.unit} @ ₹${it.unitPrice}/${it.unit} = ₹${it.totalPrice}\n`;
      });

      body += `\nTaxable Subtotal: ₹${saved.subtotal}\n`;
      body += `GST Breakdown: ₹${saved.totalGst} (${saved.taxType === 'INTRA_STATE' ? 'Intra-State CGST+SGST' : 'Inter-State IGST'})\n`;
      if (saved.transportCharges > 0) body += `Depot Road Freight: ₹${saved.transportCharges}\n`;
      body += `Total Quoted Value: ₹${saved.grandTotal}\n`;
      body += `(${saved.amountInWords})\n\n`;

      body += `Commercial Terms:\n`;
      body += `1. Payment: ${saved.paymentTerms}\n`;
      body += `2. Delivery: ${saved.deliveryTerms}\n`;
      body += `3. Validity: Valid until ${new Date(saved.validityDate).toLocaleDateString('en-IN')}\n\n`;

      body += `Please reply to confirm purchase order or release institutional sanction.\n\nWarm regards,\nK. Narendar Reddy\nManaging Partner, KNR Enterprises\nPhone: +91 8886175855 | GSTIN: 36CUHPK5939D1ZG`;

      await logCommunication({
        enquiryId: enquiry.id,
        quotationId: saved.id,
        channel: 'email',
        recipient: email,
        subject,
        messagePreview: body.slice(0, 200),
        status: 'sent',
      });

      setQuotationStatus('Sent');
      if (onQuotationSaved) onQuotationSaved(saved);

      window.location.href = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(
        subject
      )}&body=${encodeURIComponent(body)}`;
      setSuccessMessage('Quotation email dispatched and logged to communication history!');
    } catch (err: any) {
      setErrorMessage(`Failed to send email: ${err?.message || err}`);
    } finally {
      setIsSaving(false);
    }
  };

  // 5. Convert to Confirmed Order
  const handleConvertToOrder = async () => {
    if (!existingQuotation && !quotationNumber) {
      alert('Please save the quotation first before confirming the order.');
      return;
    }
    const ok = window.confirm(
      `Convert quotation "${quotationNumber}" into a Confirmed Order? This will mark the enquiry as Order Confirmed and generate an official Order Reference.`
    );
    if (!ok) return;

    setIsSaving(true);
    try {
      let quotId = existingQuotation?.id;
      if (!quotId) {
        const payload = buildQuotationPayload('Draft');
        const saved = await createQuotation({
          enquiryId: payload.enquiryId,
          customerName: payload.customerName,
          mobileNumber: payload.mobileNumber,
          email: payload.email,
          organisation: payload.organisation,
          gstin: payload.gstin,
          deliveryAddress: payload.deliveryAddress,
          placeOfSupply: payload.placeOfSupply,
          taxType: payload.taxType,
          subtotal: payload.subtotal,
          discountAmount: payload.discountAmount,
          taxableValue: payload.taxableValue,
          cgstAmount: payload.cgstAmount,
          sgstAmount: payload.sgstAmount,
          igstAmount: payload.igstAmount,
          totalGst: payload.totalGst,
          transportCharges: payload.transportCharges,
          packagingCharges: payload.packagingCharges,
          otherCharges: payload.otherCharges,
          grandTotal: payload.grandTotal,
          validityDate: payload.validityDate,
          paymentTerms: payload.paymentTerms,
          deliveryTerms: payload.deliveryTerms,
          warrantyTerms: payload.warrantyTerms,
          notes: payload.notes,
          termsAndConditions: payload.termsAndConditions,
          status: 'Draft',
          items: items.map((it) => ({
            productId: it.productId,
            productName: it.productName,
            sku: it.sku,
            hsnCode: it.hsnCode,
            quantity: it.quantity,
            unit: it.unit,
            unitPrice: it.unitPrice,
            discountPercent: it.discountPercent,
            taxableValue: it.taxableValue,
            gstRate: it.gstRate,
            cgstAmount: it.cgstAmount,
            sgstAmount: it.sgstAmount,
            igstAmount: it.igstAmount,
            totalPrice: it.totalPrice,
            notes: it.notes,
          })),
        });
        quotId = saved.id;
      }

      const order = await confirmOrder(
        quotId,
        `Confirmed quotation #${quotationNumber} with ${items.length} items. Total: ₹${calculations.grandTotal}`,
        notes
      );

      setQuotationStatus('Accepted');
      setSuccessMessage(`Order ${order.orderNumber} successfully confirmed!`);
      if (onOrderConfirmed) onOrderConfirmed(order);
    } catch (err: any) {
      setErrorMessage(`Failed to confirm order: ${err?.message || err}`);
    } finally {
      setIsSaving(false);
    }
  };

  // 6. Create Revised Quotation
  const handleCreateRevision = async () => {
    if (!existingQuotation) return;
    const ok = window.confirm(
      `Create revision for quotation "${quotationNumber}"?`
    );
    if (!ok) return;

    setIsSaving(true);
    try {
      const newRev = await createRevisedQuotation(existingQuotation.id, {
        customerName,
        mobileNumber,
        email,
        organisation,
        gstin,
        deliveryAddress,
        placeOfSupply,
        taxType,
        subtotal: calculations.subtotal,
        discountAmount,
        taxableValue: calculations.subtotal,
        cgstAmount: calculations.totalCgst,
        sgstAmount: calculations.totalSgst,
        igstAmount: calculations.totalIgst,
        totalGst: calculations.totalGst,
        transportCharges,
        packagingCharges,
        otherCharges,
        grandTotal: calculations.grandTotal,
        validityDate,
        paymentTerms,
        deliveryTerms,
        warrantyTerms,
        notes: `Revision of #${existingQuotation.quotationNumber}. ${notes}`,
        termsAndConditions,
        items: items.map((it) => ({
          productId: it.productId,
          productName: it.productName,
          sku: it.sku,
          hsnCode: it.hsnCode,
          quantity: it.quantity,
          unit: it.unit,
          unitPrice: it.unitPrice,
          discountPercent: it.discountPercent,
          taxableValue: it.taxableValue,
          gstRate: it.gstRate,
          cgstAmount: it.cgstAmount,
          sgstAmount: it.sgstAmount,
          igstAmount: it.igstAmount,
          totalPrice: it.totalPrice,
          notes: it.notes,
        })),
      });

      setVersion(newRev.version);
      setQuotationNumber(newRev.quotationNumber);
      setSuccessMessage(`Revision created successfully: #${newRev.quotationNumber}!`);
      if (onQuotationSaved) onQuotationSaved(newRev);
    } catch (err: any) {
      setErrorMessage(`Failed to create revision: ${err?.message || err}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div
        className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-4 max-h-[94vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* =====================================================================
            1. HEADER BAR
           ===================================================================== */}
        <div className="bg-gradient-to-r from-[#0D2B5B] to-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#F57C00] rounded-xl text-white shadow-md">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight font-display text-white">
                  Formal Wholesale Quotation Builder
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-orange-500/20 text-orange-300 border border-orange-400/30">
                  {quotationStatus}
                </span>
                <span className="text-xs text-slate-300 font-mono">
                  v{version}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Official quotation for Enquiry #{enquiry.enquiryNumber} &bull; {customerName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Download Vector PDF"
            >
              <Download className="w-3.5 h-3.5 text-[#F57C00]" />
              <span className="hidden sm:inline">PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Alerts & Messages */}
        {successMessage && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2.5 flex items-center gap-2 text-xs font-semibold text-emerald-800">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}
        {errorMessage && (
          <div className="bg-rose-50 border-b border-rose-200 px-6 py-2.5 flex items-center gap-2 text-xs font-semibold text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* =====================================================================
            2. SCROLLABLE FORM BODY
           ===================================================================== */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-xs text-[#111827]">
          {/* Metadata Row: Quotation #, Validity, Place of Supply */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-orange-50/40 border border-orange-200/60">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Quotation Reference #
              </label>
              <input
                type="text"
                value={quotationNumber}
                onChange={(e) => setQuotationNumber(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono font-bold text-slate-900 focus:outline-none focus:border-[#F57C00]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Quotation Validity Until
              </label>
              <input
                type="date"
                value={validityDate}
                onChange={(e) => setValidityDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-[#F57C00]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Place of Supply &amp; GST Type
              </label>
              <select
                value={taxType}
                onChange={(e) => setTaxType(e.target.value as any)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-[#F57C00]"
              >
                <option value="INTRA_STATE">
                  Intra-State: CGST (9%) + SGST (9%) [Telangana]
                </option>
                <option value="INTER_STATE">
                  Inter-State: IGST (18%) [Outside Telangana]
                </option>
              </select>
            </div>
          </div>

          {/* Customer & Consignee Information */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-[#F57C00]" />
                <span>Customer &amp; Billed To Information</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                  Customer / Officer Name *
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-semibold focus:outline-none focus:border-[#F57C00]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                  Organisation / Department
                </label>
                <input
                  type="text"
                  value={organisation}
                  onChange={(e) => setOrganisation(e.target.value)}
                  placeholder="e.g. Gram Panchayat Chevella"
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#F57C00]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                  Customer GSTIN
                </label>
                <input
                  type="text"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value.toUpperCase())}
                  placeholder="36XXXXX0000X1Z5"
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono uppercase focus:outline-none focus:border-[#F57C00]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                  Mobile / WhatsApp Number *
                </label>
                <input
                  type="tel"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-[#F57C00]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#F57C00]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                  Place of Supply
                </label>
                <input
                  type="text"
                  value={placeOfSupply}
                  onChange={(e) => setPlaceOfSupply(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#F57C00]"
                />
              </div>
            </div>

            <div className="pt-1">
              <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                Full Consignee Delivery Address
              </label>
              <input
                type="text"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="Street, Mandal, District, PIN Code"
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#F57C00]"
              />
            </div>
          </div>

          {/* =====================================================================
              LINE ITEMS TABLE WITH FULL IN-PLACE PRICING EDITING
             ===================================================================== */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[#F57C00]" />
                <span>Quotation Line Items &amp; Wholesale Rates</span>
              </span>
              <button
                type="button"
                onClick={handleAddItem}
                className="px-3 py-1.5 bg-[#F57C00] hover:bg-[#E06D00] text-white font-bold text-xs rounded-lg flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-xs">
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead className="bg-slate-100/80 text-[10px] font-black uppercase text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 w-8">#</th>
                    <th className="py-2.5 px-3 min-w-[180px]">Product / Description</th>
                    <th className="py-2.5 px-2 w-20">HSN</th>
                    <th className="py-2.5 px-2 w-20 text-center">Qty</th>
                    <th className="py-2.5 px-2 w-20">Unit</th>
                    <th className="py-2.5 px-2 w-24 text-right">Unit Rate (₹)</th>
                    <th className="py-2.5 px-2 w-16 text-center">Disc %</th>
                    <th className="py-2.5 px-2 w-16 text-center">GST %</th>
                    <th className="py-2.5 px-3 w-28 text-right">Line Total (₹)</th>
                    <th className="py-2.5 px-2 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-400">
                        No line items yet. Click &quot;Add Item&quot; to include supplies in this quote.
                      </td>
                    </tr>
                  ) : (
                    items.map((it, idx) => (
                      <tr key={it.id || idx} className="hover:bg-slate-50/60">
                        <td className="py-2 px-3 text-slate-400 font-mono text-[11px]">
                          {idx + 1}
                        </td>

                        {/* Product Name */}
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={it.productName}
                            onChange={(e) => handleItemChange(idx, 'productName', e.target.value)}
                            placeholder="Product name"
                            className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#F57C00]"
                          />
                        </td>

                        {/* HSN Code */}
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            value={it.hsnCode || ''}
                            onChange={(e) => handleItemChange(idx, 'hsnCode', e.target.value)}
                            placeholder="3808.91"
                            className="w-full bg-white border border-slate-200 rounded px-1.5 py-1 text-xs font-mono text-slate-700 text-center focus:outline-none focus:border-[#F57C00]"
                          />
                        </td>

                        {/* Quantity */}
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            min="1"
                            value={it.quantity}
                            onChange={(e) =>
                              handleItemChange(idx, 'quantity', parseFloat(e.target.value) || 0)
                            }
                            className="w-full bg-white border border-slate-200 rounded px-1.5 py-1 text-xs font-mono font-bold text-slate-900 text-center focus:outline-none focus:border-[#F57C00]"
                          />
                        </td>

                        {/* Unit */}
                        <td className="py-2 px-2">
                          <select
                            value={it.unit || 'Kg'}
                            onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded px-1 py-1 text-xs text-slate-800 focus:outline-none focus:border-[#F57C00]"
                          >
                            <option value="Kg">Kg</option>
                            <option value="Litre">Litre</option>
                            <option value="Bag (50 Kg)">Bag (50 Kg)</option>
                            <option value="Drum (200 L)">Drum (200 L)</option>
                            <option value="Unit">Unit</option>
                            <option value="Nos">Nos</option>
                            <option value="Ton">Ton</option>
                            <option value="Box">Box</option>
                          </select>
                        </td>

                        {/* Unit Price (Final confirmed wholesale rate) */}
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={it.unitPrice}
                            onChange={(e) =>
                              handleItemChange(idx, 'unitPrice', parseFloat(e.target.value) || 0)
                            }
                            className="w-full bg-white border border-slate-200 rounded px-1.5 py-1 text-xs font-mono font-bold text-slate-900 text-right focus:outline-none focus:border-[#F57C00]"
                          />
                        </td>

                        {/* Discount % */}
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={it.discountPercent || 0}
                            onChange={(e) =>
                              handleItemChange(
                                idx,
                                'discountPercent',
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-full bg-white border border-slate-200 rounded px-1 py-1 text-xs font-mono text-slate-700 text-center focus:outline-none focus:border-[#F57C00]"
                          />
                        </td>

                        {/* GST % */}
                        <td className="py-2 px-2">
                          <select
                            value={it.gstRate || 18}
                            onChange={(e) =>
                              handleItemChange(idx, 'gstRate', parseFloat(e.target.value) || 0)
                            }
                            className="w-full bg-white border border-slate-200 rounded px-1 py-1 text-xs font-mono text-slate-800 text-center focus:outline-none focus:border-[#F57C00]"
                          >
                            <option value={0}>0%</option>
                            <option value={5}>5%</option>
                            <option value={12}>12%</option>
                            <option value={18}>18%</option>
                            <option value={28}>28%</option>
                          </select>
                        </td>

                        {/* Line Total */}
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                          {formatINR(it.totalPrice || 0)}
                        </td>

                        {/* Delete */}
                        <td className="py-2 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1 text-rose-500 hover:text-rose-700 rounded transition-colors cursor-pointer"
                            title="Remove Line"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* =====================================================================
              3. COMMERCIAL CHARGES & FINAL FINANCIAL SUMMARY
             ===================================================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
            {/* Left Column: Commercial & Delivery Terms (7 cols) */}
            <div className="lg:col-span-7 space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-[#F57C00]" />
                <span>Commercial &amp; Depot Dispatch Terms</span>
              </span>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                  Payment Terms
                </label>
                <input
                  type="text"
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#F57C00]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                  Delivery &amp; Freight Terms
                </label>
                <input
                  type="text"
                  value={deliveryTerms}
                  onChange={(e) => setDeliveryTerms(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#F57C00]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                  Terms &amp; Conditions
                </label>
                <textarea
                  rows={2}
                  value={termsAndConditions}
                  onChange={(e) => setTermsAndConditions(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#F57C00]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                  Internal Remarks / Notes
                </label>
                <textarea
                  rows={1}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Rate negotiated for bulk 50 bags; depot handling included."
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#F57C00]"
                />
              </div>
            </div>

            {/* Right Column: Financial Calculations & Grand Total (5 cols) */}
            <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
              <div className="text-[11px] font-black uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1.5 flex items-center justify-between">
                <span>Summary Breakdown</span>
                <span className="font-mono text-slate-500">INR (₹)</span>
              </div>

              {/* Taxable Subtotal */}
              <div className="flex items-center justify-between text-xs py-0.5">
                <span className="text-slate-600">Taxable Subtotal:</span>
                <span className="font-mono font-bold text-slate-900">
                  {formatINR(calculations.subtotal)}
                </span>
              </div>

              {/* CGST / SGST or IGST */}
              {taxType === 'INTRA_STATE' ? (
                <>
                  <div className="flex items-center justify-between text-xs py-0.5">
                    <span className="text-slate-600">CGST (Central Tax 9%):</span>
                    <span className="font-mono text-slate-800">
                      {formatINR(calculations.totalCgst)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs py-0.5">
                    <span className="text-slate-600">SGST (Telangana Tax 9%):</span>
                    <span className="font-mono text-slate-800">
                      {formatINR(calculations.totalSgst)}
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-between text-xs py-0.5">
                  <span className="text-slate-600">IGST (Integrated Tax 18%):</span>
                  <span className="font-mono text-slate-800">
                    {formatINR(calculations.totalIgst)}
                  </span>
                </div>
              )}

              {/* Transport / Freight */}
              <div className="flex items-center justify-between text-xs py-0.5">
                <span className="text-slate-600">Depot Road Freight:</span>
                <div className="w-28">
                  <input
                    type="number"
                    min="0"
                    value={transportCharges}
                    onChange={(e) => setTransportCharges(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-200 rounded px-2 py-0.5 text-right font-mono text-xs font-bold focus:outline-none focus:border-[#F57C00]"
                  />
                </div>
              </div>

              {/* Packaging Charges */}
              <div className="flex items-center justify-between text-xs py-0.5">
                <span className="text-slate-600">Packaging &amp; Handling:</span>
                <div className="w-28">
                  <input
                    type="number"
                    min="0"
                    value={packagingCharges}
                    onChange={(e) => setPackagingCharges(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-200 rounded px-2 py-0.5 text-right font-mono text-xs focus:outline-none focus:border-[#F57C00]"
                  />
                </div>
              </div>

              {/* Discount */}
              <div className="flex items-center justify-between text-xs py-0.5">
                <span className="text-emerald-700 font-semibold">Special Bulk Discount:</span>
                <div className="w-28">
                  <input
                    type="number"
                    min="0"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-emerald-200 text-emerald-700 rounded px-2 py-0.5 text-right font-mono text-xs font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Grand Total */}
              <div className="border-t-2 border-slate-300 pt-2 flex items-baseline justify-between">
                <span className="text-sm font-black text-slate-900">Final Quoted Total:</span>
                <span className="text-lg font-black text-[#F57C00] font-mono">
                  {formatINR(calculations.grandTotal)}
                </span>
              </div>

              {/* Amount in words */}
              <div className="text-[10px] italic text-slate-500 bg-white p-2 rounded-lg border border-slate-200 leading-tight">
                <strong>In Words:</strong> {calculations.amountInWords}
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================================
            4. ACTION FOOTER BAR (Save, PDF, WhatsApp, Email, Convert)
           ===================================================================== */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Left Actions: Revision & Order Conversion */}
          <div className="flex items-center gap-2">
            {existingQuotation && (
              <button
                type="button"
                onClick={handleCreateRevision}
                disabled={isSaving}
                className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
              >
                Create Revision
              </button>
            )}

            <button
              type="button"
              onClick={handleConvertToOrder}
              disabled={isSaving || items.length === 0}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Confirm Order</span>
            </button>
          </div>

          {/* Right Actions: PDF, WhatsApp, Email, Save */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-[#F57C00]" />
              <span>Download PDF</span>
            </button>

            <button
              type="button"
              onClick={handleSendWhatsApp}
              disabled={isSaving}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Send via WhatsApp</span>
            </button>

            {email && (
              <button
                type="button"
                onClick={handleSendEmail}
                disabled={isSaving}
                className="px-3.5 py-2 bg-[#0D2B5B] hover:bg-[#071c3d] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Send via Email</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isSaving}
              className="px-4 py-2 bg-[#F57C00] hover:bg-[#E06D00] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
            >
              {isSaving ? (
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>Save Quotation</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
