import { CustomerEnquiry, EnquiryItem, EnquiryStatus } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { dispatchRfqNotifications } from './notificationService';

const ENQUIRIES_STORAGE_KEY = 'knr_admin_enquiries_store';

function mapDbEnquiry(row: Record<string, unknown>, items: EnquiryItem[] = []): CustomerEnquiry {
  return {
    id: String(row.id),
    enquiryNumber: String(row.enquiry_number || `KNR-RFQ-${row.id}`),
    customerName: String(row.customer_name || 'Customer'),
    mobileNumber: String(row.mobile_number || ''),
    email: row.email ? String(row.email) : undefined,
    organisation: row.organisation ? String(row.organisation) : undefined,
    designation: row.designation ? String(row.designation) : undefined,
    mandal: row.mandal ? String(row.mandal) : undefined,
    district: row.district ? String(row.district) : undefined,
    state: String(row.state || 'Telangana'),
    address: row.address ? String(row.address) : undefined,
    city: row.city ? String(row.city) : undefined,
    pincode: row.pincode ? String(row.pincode) : undefined,
    deliveryInstructions: row.delivery_instructions ? String(row.delivery_instructions) : undefined,
    expectedDeliveryDate: row.expected_delivery_date ? String(row.expected_delivery_date) : undefined,
    attachmentUrl: row.attachment_url ? String(row.attachment_url) : undefined,
    attachmentName: row.attachment_name ? String(row.attachment_name) : undefined,
    gstin: row.gstin ? String(row.gstin) : undefined,
    followUpDate: row.follow_up_date ? String(row.follow_up_date) : undefined,
    status: (row.status as EnquiryStatus) || 'New',
    notes: row.notes ? String(row.notes) : undefined,
    internalNotes: row.internal_notes ? String(row.internal_notes) : undefined,
    subtotal: Number(row.subtotal || 0),
    estimatedGst: Number(row.estimated_gst || 0),
    totalAmount: Number(row.total_amount || 0),
    source: String(row.source || 'website_rfq'),
    items: items,
    createdAt: String(row.created_at || new Date().toISOString()),
    updatedAt: row.updated_at ? String(row.updated_at) : undefined,
  };
}

function getInitialLocalEnquiries(): CustomerEnquiry[] {
  try {
    const saved = localStorage.getItem(ENQUIRIES_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // fallback
  }

  // Sample real-world historical procurement records for immediate demonstration
  const seeded: CustomerEnquiry[] = [
    {
      id: 'enq-001',
      enquiryNumber: 'KNR-RFQ-2026-1042',
      customerName: 'M. Ramachandra Rao',
      mobileNumber: '+91 9440123890',
      email: 'sarpanch.chevella@telangana.gov.in',
      organisation: 'Chevella Gram Panchayat',
      designation: 'Sarpanch',
      mandal: 'Chevella',
      district: 'Ranga Reddy',
      state: 'Telangana',
      status: 'Quotation Sent',
      notes: 'Need monsoon drain sanitation stock before end of week for 6 habitations.',
      internalNotes: 'Quotation emailed with 18% GST proforma estimate. Delivery arranged via pickup.',
      subtotal: 15650,
      estimatedGst: 2817,
      totalAmount: 18467,
      source: 'proforma_generator',
      items: [
        {
          productName: 'Commercial Bleaching Powder Grade 1 (33% Chlorine)',
          quantity: 10,
          unit: 'bag',
          unitPrice: 850,
          hsnCode: '2828.10.10',
          totalPrice: 8500,
        },
        {
          productName: 'Heavy-Duty HDPE Wheeled Garbage Bin (240L SBM)',
          quantity: 2,
          unit: 'unit',
          unitPrice: 2850,
          hsnCode: '3923.10.90',
          totalPrice: 5700,
        },
        {
          productName: 'Malathion 5% DP Vector Insecticide (Dusting Powder)',
          quantity: 1,
          unit: 'bag',
          unitPrice: 1450,
          hsnCode: '3808.91.99',
          totalPrice: 1450,
        },
      ],
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
    {
      id: 'enq-002',
      enquiryNumber: 'KNR-RFQ-2026-1041',
      customerName: 'Dr. K. Srinivasulu',
      mobileNumber: '+91 9848011223',
      email: 'sanitary.vikarabad@telangana.gov.in',
      organisation: 'Vikarabad Municipality',
      designation: 'Sanitary Inspector',
      mandal: 'Vikarabad Urban',
      district: 'Vikarabad',
      state: 'Telangana',
      status: 'New',
      notes: 'Emergency dengue containment drive. Require thermal fogger & 10L larvicide urgently.',
      internalNotes: 'Received via website tender basket. Need to call Siva for immediate truck loading.',
      subtotal: 30200,
      estimatedGst: 5436,
      totalAmount: 35636,
      source: 'cart_whatsapp',
      items: [
        {
          productName: 'Heavy Pulse-Jet Thermal Fogging Machine (Delta Fog)',
          quantity: 1,
          unit: 'unit',
          unitPrice: 26500,
          hsnCode: '8424.89.90',
          totalPrice: 26500,
        },
        {
          productName: 'Mosquito Larvicide Granules & Liquid (Temephos 50% EC)',
          quantity: 2,
          unit: 'can',
          unitPrice: 1850,
          hsnCode: '3808.91.99',
          totalPrice: 3700,
        },
      ],
      createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    },
    {
      id: 'enq-003',
      enquiryNumber: 'KNR-RFQ-2026-1039',
      customerName: 'N. Sudhakar Reddy',
      mobileNumber: '+91 9989045671',
      email: 'procurement@srisaiinfra.co.in',
      organisation: 'Sri Sai Civil Infra & EPC Works',
      designation: 'Project Director',
      mandal: 'Shankarpally',
      district: 'Ranga Reddy',
      state: 'Telangana',
      status: 'Completed',
      notes: 'Civic smart LED streetlight illumination tender execution.',
      internalNotes: 'Dispatched and paid via RTGS token. Delivered with invoice and warranty certificates.',
      subtotal: 29400,
      estimatedGst: 5292,
      totalAmount: 34692,
      source: 'website_rfq',
      items: [
        {
          productName: 'Civic Smart LED Street Light (60W / 120W IP66)',
          quantity: 12,
          unit: 'fixture',
          unitPrice: 2450,
          hsnCode: '9405.40.90',
          totalPrice: 29400,
        },
      ],
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
  ];

  try {
    localStorage.setItem(ENQUIRIES_STORAGE_KEY, JSON.stringify(seeded));
  } catch {
    // ignore
  }

  return seeded;
}

export async function fetchEnquiries(): Promise<CustomerEnquiry[]> {
  if (isSupabaseConfigured()) {
    try {
      const { data: enqData, error: enqError } = await supabase
        .from('enquiries')
        .select('*')
        .order('created_at', { ascending: false });

      if (!enqError && enqData && enqData.length > 0) {
        // Fetch items
        const { data: itemsData } = await supabase.from('enquiry_items').select('*');
        const itemsByEnquiry: Record<string, EnquiryItem[]> = {};

        if (itemsData) {
          itemsData.forEach((it) => {
            const eid = String(it.enquiry_id);
            if (!itemsByEnquiry[eid]) itemsByEnquiry[eid] = [];
            itemsByEnquiry[eid].push({
              id: String(it.id),
              enquiryId: eid,
              productId: it.product_id ? String(it.product_id) : undefined,
              productName: String(it.product_name),
              quantity: Number(it.quantity || 1),
              unit: String(it.unit || 'unit'),
              unitPrice: Number(it.unit_price || 0),
              hsnCode: it.hsn_code ? String(it.hsn_code) : undefined,
              totalPrice: Number(it.total_price || 0),
            });
          });
        }

        const mapped = enqData.map((row) => mapDbEnquiry(row, itemsByEnquiry[String(row.id)] || []));
        try {
          localStorage.setItem(ENQUIRIES_STORAGE_KEY, JSON.stringify(mapped));
        } catch {
          // ignore
        }
        return mapped;
      }
    } catch (err) {
      console.warn('Could not query Supabase enquiries, using local store:', err);
    }
  }

  return getInitialLocalEnquiries();
}

/**
 * Public submission handler: records an RFQ enquiry into the database
 */
export async function submitRfqEnquiry(
  customerDetails: {
    customerName: string;
    mobileNumber: string;
    email?: string;
    organisation?: string;
    designation?: string;
    mandal?: string;
    district?: string;
    state?: string;
    address?: string;
    city?: string;
    pincode?: string;
    deliveryInstructions?: string;
    expectedDeliveryDate?: string;
    attachmentUrl?: string;
    attachmentName?: string;
    gstin?: string;
    notes?: string;
    source?: string;
  },
  items: EnquiryItem[]
): Promise<CustomerEnquiry> {
  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const estimatedGst = Math.round(subtotal * 0.18);
  const totalAmount = subtotal + estimatedGst;

  const year = new Date().getFullYear();
  const randNum = Math.floor(10000 + Math.random() * 90000);
  const enquiryNumber = `KNR-RFQ-${year}-${randNum}`;

  const newEnquiry: CustomerEnquiry = {
    id: `enq-${Date.now()}`,
    enquiryNumber,
    customerName: customerDetails.customerName,
    mobileNumber: customerDetails.mobileNumber,
    email: customerDetails.email || '',
    organisation: customerDetails.organisation || '',
    designation: customerDetails.designation || '',
    mandal: customerDetails.mandal || '',
    district: customerDetails.district || '',
    state: customerDetails.state || 'Telangana',
    address: customerDetails.address || '',
    city: customerDetails.city || '',
    pincode: customerDetails.pincode || '',
    deliveryInstructions: customerDetails.deliveryInstructions || '',
    expectedDeliveryDate: customerDetails.expectedDeliveryDate || '',
    attachmentUrl: customerDetails.attachmentUrl || '',
    attachmentName: customerDetails.attachmentName || '',
    gstin: customerDetails.gstin || '',
    status: 'New',
    notes: customerDetails.notes || '',
    internalNotes: '',
    subtotal,
    estimatedGst,
    totalAmount,
    source: customerDetails.source || 'website_rfq',
    items,
    createdAt: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    try {
      const { data: insertedEnq, error: insertError } = await supabase
        .from('enquiries')
        .insert({
          enquiry_number: newEnquiry.enquiryNumber,
          customer_name: newEnquiry.customerName,
          mobile_number: newEnquiry.mobileNumber,
          email: newEnquiry.email,
          organisation: newEnquiry.organisation,
          designation: newEnquiry.designation,
          mandal: newEnquiry.mandal,
          district: newEnquiry.district,
          state: newEnquiry.state,
          address: newEnquiry.address,
          city: newEnquiry.city,
          pincode: newEnquiry.pincode,
          delivery_instructions: newEnquiry.deliveryInstructions,
          expected_delivery_date: newEnquiry.expectedDeliveryDate,
          attachment_url: newEnquiry.attachmentUrl,
          attachment_name: newEnquiry.attachmentName,
          gstin: newEnquiry.gstin,
          status: 'New',
          notes: newEnquiry.notes,
          subtotal: newEnquiry.subtotal,
          estimated_gst: newEnquiry.estimatedGst,
          total_amount: newEnquiry.totalAmount,
          source: newEnquiry.source,
        })
        .select()
        .single();

      if (!insertError && insertedEnq) {
        newEnquiry.id = String(insertedEnq.id);

        // Insert items
        if (items.length > 0) {
          const itemsPayload = items.map((it) => ({
            enquiry_id: insertedEnq.id,
            product_id: it.productId || null,
            product_name: it.productName,
            quantity: it.quantity,
            unit: it.unit,
            unit_price: it.unitPrice,
            hsn_code: it.hsnCode || null,
            total_price: it.totalPrice,
          }));

          await supabase.from('enquiry_items').insert(itemsPayload);
        }
      }
    } catch (err) {
      console.warn('Failed to insert enquiry to Supabase, saving locally:', err);
    }
  }

  // Update local store
  const current = getInitialLocalEnquiries();
  const updated = [newEnquiry, ...current];
  localStorage.setItem(ENQUIRIES_STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('knr_enquiries_updated', { detail: newEnquiry }));

  // Independent multi-channel notifications (Email, WhatsApp 1, WhatsApp 2)
  dispatchRfqNotifications(newEnquiry, items).catch((err) => {
    console.warn('Background RFQ notification dispatch warning:', err);
  });

  return newEnquiry;
}

/**
 * Update enquiry status or internal notes
 */
export async function updateEnquiryStatus(
  id: string,
  status: EnquiryStatus,
  internalNotes?: string
): Promise<CustomerEnquiry> {
  if (isSupabaseConfigured()) {
    try {
      const payload: Record<string, unknown> = { status };
      if (internalNotes !== undefined) payload.internal_notes = internalNotes;

      await supabase.from('enquiries').update(payload).eq('id', id);
    } catch (err) {
      console.warn('Failed to update enquiry status in Supabase:', err);
    }
  }

  const current = getInitialLocalEnquiries();
  const updated = current.map((e) =>
    e.id === id
      ? {
          ...e,
          status,
          internalNotes: internalNotes !== undefined ? internalNotes : e.internalNotes,
          updatedAt: new Date().toISOString(),
        }
      : e
  );
  localStorage.setItem(ENQUIRIES_STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('knr_enquiries_updated'));
  return updated.find((e) => e.id === id)!;
}

/**
 * Delete enquiry safely
 */
export async function deleteEnquiry(id: string): Promise<boolean> {
  if (isSupabaseConfigured()) {
    try {
      await supabase.from('enquiries').delete().eq('id', id);
    } catch (err) {
      console.warn('Failed to delete enquiry from Supabase:', err);
    }
  }

  const current = getInitialLocalEnquiries();
  const filtered = current.filter((e) => e.id !== id);
  localStorage.setItem(ENQUIRIES_STORAGE_KEY, JSON.stringify(filtered));
  window.dispatchEvent(new CustomEvent('knr_enquiries_updated'));
  return true;
}

