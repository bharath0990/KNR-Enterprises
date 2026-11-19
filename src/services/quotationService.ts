import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  Quotation,
  QuotationItem,
  QuotationStatus,
  EnquiryStatusHistoryItem,
  CommunicationLogItem,
  ConfirmedOrder,
} from '../types';

const QUOTATIONS_STORAGE_KEY = 'knr_quotations_cache';
const QUOTATION_ITEMS_STORAGE_KEY = 'knr_quotation_items_cache';
const STATUS_HISTORY_STORAGE_KEY = 'knr_status_history_cache';
const COMM_LOGS_STORAGE_KEY = 'knr_comm_logs_cache';
const ORDERS_STORAGE_KEY = 'knr_orders_cache';

// ============================================================================
// 1. NUMBER TO INDIAN RUPEE WORDS UTILITY
// ============================================================================

export function numberToIndianWords(num: number): string {
  const n = Math.round(Math.abs(num));
  if (n === 0) return 'Rupees Zero Only';

  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const tens = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
  ];

  function convertTwoDigits(val: number): string {
    if (val === 0) return '';
    if (val < 20) return ones[val];
    const t = Math.floor(val / 10);
    const o = val % 10;
    return `${tens[t]}${o > 0 ? ` ${ones[o]}` : ''}`;
  }

  function convertThreeDigits(val: number): string {
    const h = Math.floor(val / 100);
    const rem = val % 100;
    let res = '';
    if (h > 0) res += `${ones[h]} Hundred`;
    if (rem > 0) {
      if (res) res += ' and ';
      res += convertTwoDigits(rem);
    }
    return res;
  }

  // Indian format: Crores (10^7), Lakhs (10^5), Thousands (10^3), Remainder
  const crore = Math.floor(n / 10000000);
  let rem = n % 10000000;
  const lakh = Math.floor(rem / 100000);
  rem = rem % 100000;
  const thousand = Math.floor(rem / 1000);
  const hundred = rem % 1000;

  let str = '';
  if (crore > 0) str += `${convertTwoDigits(crore)} Crore `;
  if (lakh > 0) str += `${convertTwoDigits(lakh)} Lakh `;
  if (thousand > 0) str += `${convertTwoDigits(thousand)} Thousand `;
  if (hundred > 0) str += `${convertThreeDigits(hundred)}`;

  return `Rupees ${str.trim()} Only`;
}

// ============================================================================
// 2. QUOTATION NUMBER GENERATOR
// ============================================================================

export function generateQuotationNumber(index: number = 1): string {
  const year = new Date().getFullYear();
  const seq = String(index).padStart(4, '0');
  return `KNR-QUOT-${year}-${seq}`;
}

// ============================================================================
// 3. QUOTATION SERVICE OPERATIONS
// ============================================================================

export async function fetchQuotations(enquiryId?: string): Promise<Quotation[]> {
  if (isSupabaseConfigured()) {
    try {
      let query = supabase
        .from('quotations')
        .select('*')
        .order('created_at', { ascending: false });

      if (enquiryId) {
        query = query.eq('enquiry_id', enquiryId);
      }

      const { data, error } = await query;
      if (error) throw error;

      if (data && data.length > 0) {
        const formatted: Quotation[] = data.map(mapDbToQuotation);
        localStorage.setItem(QUOTATIONS_STORAGE_KEY, JSON.stringify(formatted));
        return formatted;
      }
    } catch (err) {
      console.warn('Could not fetch quotations from Supabase, using cache:', err);
    }
  }

  const cached = localStorage.getItem(QUOTATIONS_STORAGE_KEY);
  if (cached) {
    const parsed: Quotation[] = JSON.parse(cached);
    if (enquiryId) return parsed.filter((q) => q.enquiryId === enquiryId);
    return parsed;
  }
  return [];
}

export async function fetchQuotationById(id: string): Promise<Quotation | null> {
  const all = await fetchQuotations();
  return all.find((q) => q.id === id || q.quotationNumber === id) || null;
}

export async function fetchQuotationByEnquiryId(enquiryId: string): Promise<Quotation | null> {
  const quots = await fetchQuotations(enquiryId);
  return quots.length > 0 ? quots[0] : null;
}

export async function fetchQuotationItems(quotationId: string): Promise<QuotationItem[]> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('quotation_items')
        .select('*')
        .eq('quotation_id', quotationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (data) {
        return data.map((d) => ({
          id: d.id,
          quotationId: d.quotation_id,
          productId: d.product_id,
          productName: d.product_name,
          sku: d.sku || '',
          hsnCode: d.hsn_code || '',
          quantity: Number(d.quantity || 1),
          unit: d.unit || 'unit',
          unitPrice: Number(d.unit_price || 0),
          discountPercent: Number(d.discount_percent || 0),
          taxableValue: Number(d.taxable_value || 0),
          gstRate: Number(d.gst_rate || 18),
          cgstAmount: Number(d.cgst_amount || 0),
          sgstAmount: Number(d.sgst_amount || 0),
          igstAmount: Number(d.igst_amount || 0),
          totalPrice: Number(d.total_price || 0),
          notes: d.notes || '',
        }));
      }
    } catch (err) {
      console.warn('Could not fetch quotation items from Supabase, using cache:', err);
    }
  }

  const cached = localStorage.getItem(QUOTATION_ITEMS_STORAGE_KEY);
  if (cached) {
    const parsed: QuotationItem[] = JSON.parse(cached);
    return parsed.filter((i) => i.quotationId === quotationId);
  }
  return [];
}

export interface CreateQuotationPayload {
  enquiryId?: string;
  customerName: string;
  mobileNumber: string;
  email: string;
  organisation: string;
  gstin?: string;
  deliveryAddress: string;
  placeOfSupply?: string;
  taxType?: 'INTRA_STATE' | 'INTER_STATE';
  subtotal: number;
  discountAmount?: number;
  taxableValue: number;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  totalGst: number;
  transportCharges?: number;
  packagingCharges?: number;
  otherCharges?: number;
  grandTotal: number;
  validityDate: string;
  paymentTerms?: string;
  deliveryTerms?: string;
  warrantyTerms?: string;
  notes?: string;
  termsAndConditions?: string;
  status?: QuotationStatus;
  items: Array<{
    productId?: string;
    productName: string;
    sku?: string;
    hsnCode?: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    discountPercent?: number;
    taxableValue: number;
    gstRate?: number;
    cgstAmount?: number;
    sgstAmount?: number;
    igstAmount?: number;
    totalPrice: number;
    notes?: string;
  }>;
}

export async function createQuotation(payload: CreateQuotationPayload): Promise<Quotation> {
  const existing = await fetchQuotations();
  const nextSeq = existing.length + 1;
  const quotNumber = generateQuotationNumber(nextSeq);
  const inWords = numberToIndianWords(payload.grandTotal);

  const newQuotation: Quotation = {
    id: `quot_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    quotationNumber: quotNumber,
    enquiryId: payload.enquiryId,
    customerName: payload.customerName,
    mobileNumber: payload.mobileNumber,
    email: payload.email || '',
    organisation: payload.organisation || 'Gram Panchayat / Institutional',
    gstin: payload.gstin || '',
    deliveryAddress: payload.deliveryAddress || 'Chevella Mandal, Telangana',
    placeOfSupply: payload.placeOfSupply || 'Telangana (36)',
    taxType: payload.taxType || 'INTRA_STATE',
    subtotal: payload.subtotal,
    discountAmount: payload.discountAmount || 0,
    taxableValue: payload.taxableValue,
    cgstAmount: payload.cgstAmount || 0,
    sgstAmount: payload.sgstAmount || 0,
    igstAmount: payload.igstAmount || 0,
    totalGst: payload.totalGst,
    transportCharges: payload.transportCharges || 0,
    packagingCharges: payload.packagingCharges || 0,
    otherCharges: payload.otherCharges || 0,
    grandTotal: payload.grandTotal,
    amountInWords: inWords,
    validityDate: payload.validityDate,
    paymentTerms: payload.paymentTerms || '100% advance against PO/Proforma or Net 30 for Gram Panchayats',
    deliveryTerms: payload.deliveryTerms || 'Direct Highway Dispatch Ex-Chevella Depot to Project Site',
    warrantyTerms: payload.warrantyTerms || 'Material strictly conforms to BIS standards and Telangana state lab assay parameters.',
    notes: payload.notes || '',
    termsAndConditions: payload.termsAndConditions || '1. Rates quoted are firm for 15 days from issue date. 2. Taxes as applicable under GST Law. 3. Subject to Chevella jurisdiction.',
    status: payload.status || 'Draft',
    version: 1,
    createdBy: 'Administrator',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    try {
      const { data: dbQuot, error: quotErr } = await supabase
        .from('quotations')
        .insert({
          quotation_number: newQuotation.quotationNumber,
          enquiry_id: newQuotation.enquiryId || null,
          customer_name: newQuotation.customerName,
          mobile_number: newQuotation.mobileNumber,
          email: newQuotation.email,
          organisation: newQuotation.organisation,
          gstin: newQuotation.gstin,
          delivery_address: newQuotation.deliveryAddress,
          place_of_supply: newQuotation.placeOfSupply,
          tax_type: newQuotation.taxType,
          subtotal: newQuotation.subtotal,
          discount_amount: newQuotation.discountAmount,
          taxable_value: newQuotation.taxableValue,
          cgst_amount: newQuotation.cgstAmount,
          sgst_amount: newQuotation.sgstAmount,
          igst_amount: newQuotation.igstAmount,
          total_gst: newQuotation.totalGst,
          transport_charges: newQuotation.transportCharges,
          packaging_charges: newQuotation.packagingCharges,
          other_charges: newQuotation.otherCharges,
          grand_total: newQuotation.grandTotal,
          amount_in_words: inWords,
          validity_date: newQuotation.validityDate,
          payment_terms: newQuotation.paymentTerms,
          delivery_terms: newQuotation.deliveryTerms,
          warranty_terms: newQuotation.warrantyTerms,
          notes: newQuotation.notes,
          terms_and_conditions: newQuotation.termsAndConditions,
          status: newQuotation.status,
          version: newQuotation.version,
          created_by: newQuotation.createdBy,
        })
        .select()
        .single();

      if (quotErr) throw quotErr;
      if (dbQuot) {
        newQuotation.id = dbQuot.id;

        // Insert items
        if (payload.items.length > 0) {
          const dbItems = payload.items.map((it) => ({
            quotation_id: dbQuot.id,
            product_id: it.productId || null,
            product_name: it.productName,
            sku: it.sku || '',
            hsn_code: it.hsnCode || '',
            quantity: it.quantity,
            unit: it.unit,
            unit_price: it.unitPrice,
            discount_percent: it.discountPercent || 0,
            taxable_value: it.taxableValue,
            gst_rate: it.gstRate || 18,
            cgst_amount: it.cgstAmount || 0,
            sgst_amount: it.sgstAmount || 0,
            igst_amount: it.igstAmount || 0,
            total_price: it.totalPrice,
            notes: it.notes || '',
          }));

          await supabase.from('quotation_items').insert(dbItems);
        }
      }
    } catch (err) {
      console.warn('Could not insert quotation into Supabase, saving locally:', err);
    }
  }

  // Update local cache
  const updatedList = [newQuotation, ...existing];
  localStorage.setItem(QUOTATIONS_STORAGE_KEY, JSON.stringify(updatedList));

  // Update enquiry status to 'Quotation Preparing' or 'Quotation Sent' if linked
  if (payload.enquiryId) {
    addStatusHistory(
      payload.enquiryId,
      'Contacted',
      newQuotation.status === 'Sent' ? 'Quotation Sent' : 'Quotation Preparing',
      `Official Quotation #${newQuotation.quotationNumber} generated (Total: ₹${newQuotation.grandTotal.toLocaleString('en-IN')})`
    ).catch(console.warn);
  }

  window.dispatchEvent(new CustomEvent('knr_quotations_updated'));
  return newQuotation;
}

export async function updateQuotationStatus(
  id: string,
  status: QuotationStatus
): Promise<Quotation> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('quotations')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      if (data) {
        const mapped = mapDbToQuotation(data);
        window.dispatchEvent(new CustomEvent('knr_quotations_updated'));
        return mapped;
      }
    } catch (err) {
      console.warn('Could not update quotation status in Supabase:', err);
    }
  }

  const existing = await fetchQuotations();
  const target = existing.find((q) => q.id === id);
  if (!target) throw new Error('Quotation not found');
  target.status = status;
  target.updatedAt = new Date().toISOString();
  localStorage.setItem(QUOTATIONS_STORAGE_KEY, JSON.stringify(existing));
  window.dispatchEvent(new CustomEvent('knr_quotations_updated'));
  return target;
}

export async function createRevisedQuotation(
  originalId: string,
  updates: Partial<CreateQuotationPayload>
): Promise<Quotation> {
  const original = await fetchQuotationById(originalId);
  if (!original) throw new Error('Original quotation not found');

  // Mark original as Revised
  await updateQuotationStatus(originalId, 'Revised');

  const items = await fetchQuotationItems(originalId);

  // Generate new revision with incremented version
  return createQuotation({
    enquiryId: original.enquiryId,
    customerName: updates.customerName || original.customerName,
    mobileNumber: updates.mobileNumber || original.mobileNumber,
    email: updates.email || original.email,
    organisation: updates.organisation || original.organisation,
    gstin: updates.gstin || original.gstin,
    deliveryAddress: updates.deliveryAddress || original.deliveryAddress,
    placeOfSupply: updates.placeOfSupply || original.placeOfSupply,
    taxType: updates.taxType || original.taxType,
    subtotal: updates.subtotal !== undefined ? updates.subtotal : original.subtotal,
    discountAmount: updates.discountAmount !== undefined ? updates.discountAmount : original.discountAmount,
    taxableValue: updates.taxableValue !== undefined ? updates.taxableValue : original.taxableValue,
    cgstAmount: updates.cgstAmount !== undefined ? updates.cgstAmount : original.cgstAmount,
    sgstAmount: updates.sgstAmount !== undefined ? updates.sgstAmount : original.sgstAmount,
    igstAmount: updates.igstAmount !== undefined ? updates.igstAmount : original.igstAmount,
    totalGst: updates.totalGst !== undefined ? updates.totalGst : original.totalGst,
    transportCharges: updates.transportCharges !== undefined ? updates.transportCharges : original.transportCharges,
    packagingCharges: updates.packagingCharges !== undefined ? updates.packagingCharges : original.packagingCharges,
    otherCharges: updates.otherCharges !== undefined ? updates.otherCharges : original.otherCharges,
    grandTotal: updates.grandTotal !== undefined ? updates.grandTotal : original.grandTotal,
    validityDate: updates.validityDate || original.validityDate,
    paymentTerms: updates.paymentTerms || original.paymentTerms,
    deliveryTerms: updates.deliveryTerms || original.deliveryTerms,
    warrantyTerms: updates.warrantyTerms || original.warrantyTerms,
    notes: updates.notes || `Revised quotation replacing #${original.quotationNumber}`,
    termsAndConditions: updates.termsAndConditions || original.termsAndConditions,
    status: 'Draft',
    items: updates.items || items.map((it) => ({
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
}

// ============================================================================
// 4. ENQUIRY STATUS HISTORY
// ============================================================================

export async function fetchStatusHistory(enquiryId: string): Promise<EnquiryStatusHistoryItem[]> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('enquiry_status_history')
        .select('*')
        .eq('enquiry_id', enquiryId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        return data.map((d) => ({
          id: d.id,
          enquiryId: d.enquiry_id,
          previousStatus: d.previous_status,
          newStatus: d.new_status,
          notes: d.notes,
          updatedBy: d.updated_by,
          createdAt: d.created_at,
        }));
      }
    } catch (err) {
      console.warn('Could not fetch status history from Supabase:', err);
    }
  }

  const cached = localStorage.getItem(STATUS_HISTORY_STORAGE_KEY);
  if (cached) {
    const parsed: EnquiryStatusHistoryItem[] = JSON.parse(cached);
    return parsed.filter((h) => h.enquiryId === enquiryId);
  }
  return [];
}

export async function addStatusHistory(
  enquiryId: string,
  prev: string,
  next: string,
  notes: string = '',
  user: string = 'Administrator'
): Promise<void> {
  const item: EnquiryStatusHistoryItem = {
    id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    enquiryId,
    previousStatus: prev,
    newStatus: next,
    notes,
    updatedBy: user,
    createdAt: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    try {
      await supabase.from('enquiry_status_history').insert({
        enquiry_id: enquiryId,
        previous_status: prev,
        new_status: next,
        notes,
        updated_by: user,
      });
    } catch (err) {
      console.warn('Could not save status history in Supabase:', err);
    }
  }

  const cached = localStorage.getItem(STATUS_HISTORY_STORAGE_KEY);
  const current: EnquiryStatusHistoryItem[] = cached ? JSON.parse(cached) : [];
  localStorage.setItem(STATUS_HISTORY_STORAGE_KEY, JSON.stringify([item, ...current]));
}

// ============================================================================
// 5. COMMUNICATION LOGS (WhatsApp, Email & Phone)
// ============================================================================

export interface LogCommunicationPayload {
  enquiryId: string;
  quotationId?: string;
  channel: 'whatsapp' | 'email' | 'phone' | 'in_person';
  recipient: string;
  subject?: string;
  messagePreview?: string;
  status: 'not_shared' | 'shared_manually' | 'sent' | 'delivered' | 'failed';
  errorDetails?: string;
  sentBy?: string;
}

export async function fetchCommunicationLogs(enquiryId: string): Promise<CommunicationLogItem[]> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('communication_logs')
        .select('*')
        .eq('enquiry_id', enquiryId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        return data.map((d) => ({
          id: d.id,
          enquiryId: d.enquiry_id,
          quotationId: d.quotation_id,
          channel: d.channel,
          recipient: d.recipient,
          subject: d.subject || '',
          messagePreview: d.message_preview || '',
          status: d.status,
          errorDetails: d.error_details || '',
          sentBy: d.sent_by || 'Administrator',
          createdAt: d.created_at,
        }));
      }
    } catch (err) {
      console.warn('Could not fetch communication logs from Supabase:', err);
    }
  }

  const cached = localStorage.getItem(COMM_LOGS_STORAGE_KEY);
  if (cached) {
    const parsed: CommunicationLogItem[] = JSON.parse(cached);
    return parsed.filter((c) => c.enquiryId === enquiryId);
  }
  return [];
}

export async function logCommunication(payload: LogCommunicationPayload): Promise<CommunicationLogItem> {
  const item: CommunicationLogItem = {
    id: `comm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    enquiryId: payload.enquiryId,
    quotationId: payload.quotationId,
    channel: payload.channel,
    recipient: payload.recipient,
    subject: payload.subject || '',
    messagePreview: payload.messagePreview || '',
    status: payload.status,
    errorDetails: payload.errorDetails || '',
    sentBy: payload.sentBy || 'Administrator',
    createdAt: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    try {
      await supabase.from('communication_logs').insert({
        enquiry_id: payload.enquiryId,
        quotation_id: payload.quotationId || null,
        channel: payload.channel,
        recipient: payload.recipient,
        subject: payload.subject || '',
        message_preview: payload.messagePreview || '',
        status: payload.status,
        error_details: payload.errorDetails || '',
        sent_by: item.sentBy,
      });
    } catch (err) {
      console.warn('Could not log communication to Supabase:', err);
    }
  }

  const cached = localStorage.getItem(COMM_LOGS_STORAGE_KEY);
  const current: CommunicationLogItem[] = cached ? JSON.parse(cached) : [];
  localStorage.setItem(COMM_LOGS_STORAGE_KEY, JSON.stringify([item, ...current]));
  window.dispatchEvent(new CustomEvent('knr_communication_logged', { detail: item }));
  return item;
}

// ============================================================================
// 6. CONFIRMED ORDERS (Converted from accepted quotations)
// ============================================================================

export async function confirmOrder(
  quotationId: string,
  agreedSummary: string = '',
  notes: string = ''
): Promise<ConfirmedOrder> {
  const quot = await fetchQuotationById(quotationId);
  if (!quot) throw new Error('Quotation not found');

  // Mark quotation as Accepted
  await updateQuotationStatus(quotationId, 'Accepted');

  const year = new Date().getFullYear();
  const orderNumber = `KNR-ORD-${year}-${Math.floor(1000 + Math.random() * 9000)}`;

  const newOrder: ConfirmedOrder = {
    id: `ord_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    orderNumber,
    enquiryId: quot.enquiryId,
    quotationId: quot.id,
    customerName: quot.customerName,
    mobileNumber: quot.mobileNumber,
    email: quot.email,
    organisation: quot.organisation,
    deliveryAddress: quot.deliveryAddress,
    totalAmount: quot.grandTotal,
    agreedQuantitiesSummary: agreedSummary || `Confirmed based on Quotation #${quot.quotationNumber}`,
    status: 'Confirmed',
    createdBy: 'Administrator',
    createdAt: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    try {
      await supabase.from('confirmed_orders').insert({
        order_number: newOrder.orderNumber,
        enquiry_id: newOrder.enquiryId || null,
        quotation_id: newOrder.quotationId || null,
        customer_name: newOrder.customerName,
        mobile_number: newOrder.mobileNumber,
        email: newOrder.email,
        organisation: newOrder.organisation,
        delivery_address: newOrder.deliveryAddress,
        total_amount: newOrder.totalAmount,
        agreed_quantities_summary: newOrder.agreedQuantitiesSummary,
        status: newOrder.status,
        created_by: newOrder.createdBy,
      });

      if (quot.enquiryId) {
        await supabase
          .from('enquiries')
          .update({ status: 'Order Confirmed', updated_at: new Date().toISOString() })
          .eq('id', quot.enquiryId);
      }
    } catch (err) {
      console.warn('Could not save confirmed order to Supabase:', err);
    }
  }

  if (quot.enquiryId) {
    addStatusHistory(
      quot.enquiryId,
      'Negotiation',
      'Order Confirmed',
      `Customer accepted quotation #${quot.quotationNumber}. Generated Confirmed Order Reference #${orderNumber}`
    ).catch(console.warn);
  }

  const cached = localStorage.getItem(ORDERS_STORAGE_KEY);
  const current: ConfirmedOrder[] = cached ? JSON.parse(cached) : [];
  localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify([newOrder, ...current]));
  window.dispatchEvent(new CustomEvent('knr_order_confirmed', { detail: newOrder }));
  return newOrder;
}

export async function fetchConfirmedOrders(): Promise<ConfirmedOrder[]> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('confirmed_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        return data.map((d) => ({
          id: d.id,
          orderNumber: d.order_number,
          enquiryId: d.enquiry_id,
          quotationId: d.quotation_id,
          customerName: d.customer_name,
          mobileNumber: d.mobile_number,
          email: d.email,
          organisation: d.organisation,
          deliveryAddress: d.delivery_address,
          totalAmount: Number(d.total_amount || 0),
          agreedQuantitiesSummary: d.agreed_quantities_summary,
          status: d.status,
          createdBy: d.created_by,
          createdAt: d.created_at,
        }));
      }
    } catch (err) {
      console.warn('Could not fetch confirmed orders from Supabase:', err);
    }
  }

  const cached = localStorage.getItem(ORDERS_STORAGE_KEY);
  return cached ? JSON.parse(cached) : [];
}

// Helper DB mapper
function mapDbToQuotation(row: any): Quotation {
  return {
    id: row.id,
    quotationNumber: row.quotation_number,
    enquiryId: row.enquiry_id || undefined,
    customerName: row.customer_name,
    mobileNumber: row.mobile_number,
    email: row.email || '',
    organisation: row.organisation || '',
    gstin: row.gstin || '',
    deliveryAddress: row.delivery_address || '',
    placeOfSupply: row.place_of_supply || 'Telangana (36)',
    taxType: row.tax_type || 'INTRA_STATE',
    subtotal: Number(row.subtotal || 0),
    discountAmount: Number(row.discount_amount || 0),
    taxableValue: Number(row.taxable_value || 0),
    cgstAmount: Number(row.cgst_amount || 0),
    sgstAmount: Number(row.sgst_amount || 0),
    igstAmount: Number(row.igst_amount || 0),
    totalGst: Number(row.total_gst || 0),
    transportCharges: Number(row.transport_charges || 0),
    packagingCharges: Number(row.packaging_charges || 0),
    otherCharges: Number(row.other_charges || 0),
    grandTotal: Number(row.grand_total || 0),
    amountInWords: row.amount_in_words || '',
    validityDate: row.validity_date,
    paymentTerms: row.payment_terms || '',
    deliveryTerms: row.delivery_terms || '',
    warrantyTerms: row.warranty_terms || '',
    notes: row.notes || '',
    termsAndConditions: row.terms_and_conditions || '',
    status: row.status,
    version: Number(row.version || 1),
    createdBy: row.created_by || 'Administrator',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
