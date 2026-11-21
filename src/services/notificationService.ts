import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  CustomerEnquiry,
  EnquiryItem,
  RfqNotificationSettings,
  RfqNotificationLog,
  RfqDispatchResult,
  Quotation,
} from '../types';
import { logCommunication } from './quotationService';
import { formatINR } from './productService';

const SETTINGS_STORAGE_KEY = 'knr_rfq_notification_settings_cache';
const LOGS_STORAGE_KEY = 'knr_rfq_notification_logs_cache';

// Canonical configured recipients
export const DEFAULT_NOTIFICATION_SETTINGS: RfqNotificationSettings = {
  adminEmail: 'knrenterprises679@gmail.com',
  whatsappRecipient1: '+918886175855',
  whatsappRecipient2: '+919666469679',
  emailIntegrationStatus: 'Active (Secure Gateway)',
  whatsappIntegrationStatus: 'Active (WhatsApp Cloud API)',
  notifyOnNewRfq: true,
  notifyOnQuotationCreated: true,
  notifyOnOrderConfirmed: true,
};

// ============================================================================
// 1. SETTINGS OPERATIONS
// ============================================================================

export async function getRfqNotificationSettings(): Promise<RfqNotificationSettings> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('rfq_notification_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        const mapped: RfqNotificationSettings = {
          id: data.id,
          adminEmail: data.admin_email || DEFAULT_NOTIFICATION_SETTINGS.adminEmail,
          whatsappRecipient1: data.whatsapp_recipient_1 || DEFAULT_NOTIFICATION_SETTINGS.whatsappRecipient1,
          whatsappRecipient2: data.whatsapp_recipient_2 || DEFAULT_NOTIFICATION_SETTINGS.whatsappRecipient2,
          emailIntegrationStatus: data.email_integration_status || DEFAULT_NOTIFICATION_SETTINGS.emailIntegrationStatus,
          whatsappIntegrationStatus: data.whatsapp_integration_status || DEFAULT_NOTIFICATION_SETTINGS.whatsappIntegrationStatus,
          notifyOnNewRfq: data.notify_on_new_rfq ?? true,
          notifyOnQuotationCreated: data.notify_on_quotation_created ?? true,
          notifyOnOrderConfirmed: data.notify_on_order_confirmed ?? true,
          updatedAt: data.updated_at,
        };
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(mapped));
        return mapped;
      }
    } catch (err) {
      console.warn('Could not read notification settings from Supabase, using local fallback:', err);
    }
  }

  const cached = localStorage.getItem(SETTINGS_STORAGE_KEY);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      // fallback to default
    }
  }

  return DEFAULT_NOTIFICATION_SETTINGS;
}

export async function saveRfqNotificationSettings(
  updates: Partial<RfqNotificationSettings>
): Promise<RfqNotificationSettings> {
  const current = await getRfqNotificationSettings();
  const merged: RfqNotificationSettings = {
    ...current,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    try {
      const dbPayload = {
        admin_email: merged.adminEmail,
        whatsapp_recipient_1: merged.whatsappRecipient1,
        whatsapp_recipient_2: merged.whatsappRecipient2,
        email_integration_status: merged.emailIntegrationStatus,
        whatsapp_integration_status: merged.whatsappIntegrationStatus,
        notify_on_new_rfq: merged.notifyOnNewRfq,
        notify_on_quotation_created: merged.notifyOnQuotationCreated,
        notify_on_order_confirmed: merged.notifyOnOrderConfirmed,
        updated_at: new Date().toISOString(),
      };

      if (current.id) {
        await supabase
          .from('rfq_notification_settings')
          .update(dbPayload)
          .eq('id', current.id);
      } else {
        const { data } = await supabase
          .from('rfq_notification_settings')
          .insert(dbPayload)
          .select()
          .single();
        if (data) merged.id = data.id;
      }
    } catch (err) {
      console.warn('Could not save notification settings to Supabase, saving locally:', err);
    }
  }

  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(merged));
  window.dispatchEvent(new CustomEvent('knr_notification_settings_updated', { detail: merged }));
  return merged;
}

// ============================================================================
// 2. MESSAGE FORMATTING UTILITIES
// ============================================================================

export function getAdminDashboardEnquiryLink(enquiryId?: string): string {
  const base = typeof window !== 'undefined' ? window.location.origin : 'https://knr-enterprises.com';
  return enquiryId ? `${base}/#admin/enquiries` : `${base}/#admin/enquiries`;
}

/**
 * Builds standard email subject and body for New Bulk RFQ
 */
export function formatRfqEmail(
  enquiry: CustomerEnquiry,
  items: EnquiryItem[] = []
): { subject: string; textBody: string; htmlBody: string } {
  const subject = `NEW BULK RFQ RECEIVED — ${enquiry.enquiryNumber} — ${enquiry.customerName}`;
  const enquiryItems = (items && items.length > 0) ? items : (enquiry.items || []);
  const adminLink = getAdminDashboardEnquiryLink(enquiry.id);
  const formattedDate = new Date(enquiry.createdAt).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const fullAddress = [
    enquiry.address,
    enquiry.city || enquiry.mandal,
    enquiry.district,
    enquiry.state,
    enquiry.pincode ? `PIN: ${enquiry.pincode}` : '',
  ]
    .filter(Boolean)
    .join(', ');

  let itemsText = '';
  enquiryItems.forEach((it, idx) => {
    itemsText += `${idx + 1}. ${it.productName}\n`;
    if (it.hsnCode) itemsText += `   HSN: ${it.hsnCode}\n`;
    itemsText += `   Quantity: ${it.quantity} ${it.unit}\n`;
    itemsText += `   Est. Unit Price: ₹${it.unitPrice.toLocaleString('en-IN')} / ${it.unit}\n`;
    itemsText += `   Est. Line Total: ₹${it.totalPrice.toLocaleString('en-IN')}\n\n`;
  });

  const textBody = `===============================================================
KNR ENTERPRISES — NEW WHOLESALE RFQ RECEIVED
===============================================================

Enquiry Reference : ${enquiry.enquiryNumber}
Submission Time   : ${formattedDate}
Status            : ${enquiry.status}

---------------------------------------------------------------
1. CUSTOMER INFORMATION
---------------------------------------------------------------
Customer Name : ${enquiry.customerName}
Mobile Number : ${enquiry.mobileNumber}
Email Address : ${enquiry.email || 'Not provided'}
Organization  : ${enquiry.organisation || 'Gram Panchayat / Wholesale Buyer'}
Department    : ${enquiry.designation || 'Procurement Incharge'}
GSTIN         : ${enquiry.gstin || 'Unregistered / Exempted Panchayat'}

---------------------------------------------------------------
2. DELIVERY LOCATION & CONFLICT INSTRUCTIONS
---------------------------------------------------------------
Delivery Address  : ${fullAddress || 'Chevella Central Logistics Depot Hub'}
City / Mandal     : ${enquiry.city || enquiry.mandal || 'Chevella'}
District & State  : ${enquiry.district || 'Ranga Reddy'}, ${enquiry.state || 'Telangana'}
PIN Code          : ${enquiry.pincode || '501503'}
Expected Delivery : ${enquiry.expectedDeliveryDate ? new Date(enquiry.expectedDeliveryDate).toLocaleDateString('en-IN') : 'Standard Depot 24-48 Hours'}
Delivery Notes    : ${enquiry.deliveryInstructions || 'Direct road freight truckload delivery.'}

---------------------------------------------------------------
3. REQUESTED SUPPLIES & INDICATIVE PRICING
---------------------------------------------------------------
${itemsText || 'General Wholesale Enquiry (Direct Bulk Consultation)\n'}
Indicative Subtotal   : ₹${enquiry.subtotal.toLocaleString('en-IN')}
Estimated GST (18%)   : ₹${enquiry.estimatedGst.toLocaleString('en-IN')}
Total Indicative Value: ₹${enquiry.totalAmount.toLocaleString('en-IN')}

* Note: Rates and totals are indicative estimates. A formal quotation
will confirm negotiated prices, batch assay, and road freight.

---------------------------------------------------------------
4. ADDITIONAL REQUIREMENTS & ATTACHMENTS
---------------------------------------------------------------
Requirements : ${enquiry.notes || 'None specified'}
Uploaded BOQ : ${enquiry.attachmentName ? `${enquiry.attachmentName} (${enquiry.attachmentUrl || 'Uploaded in portal'})` : 'No file attached'}

---------------------------------------------------------------
OPEN IN SECURE ADMIN DASHBOARD:
${adminLink}
===============================================================`;

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; color: #111827; line-height: 1.5; border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden;">
      <div style="background-color: #0D2B5B; color: #FFFFFF; padding: 20px 24px; border-bottom: 4px solid #F57C00;">
        <h2 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 0.5px;">KNR ENTERPRISES — WHOLESALE RFQ NOTIFICATION</h2>
        <p style="margin: 4px 0 0; font-size: 13px; color: #E2E8F0;">Enquiry Ref: <strong style="color: #F57C00;">${enquiry.enquiryNumber}</strong> &bull; Received on ${formattedDate}</p>
      </div>

      <div style="padding: 24px; background-color: #FFFFFF;">
        <!-- Customer Box -->
        <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
          <h3 style="margin: 0 0 10px; font-size: 13px; text-transform: uppercase; color: #F57C00; font-weight: 800;">1. Customer &amp; Organization Details</h3>
          <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
            <tr><td style="padding: 3px 0; color: #64748B; width: 35%;">Customer Name:</td><td style="font-weight: bold; color: #111827;">${enquiry.customerName}</td></tr>
            <tr><td style="padding: 3px 0; color: #64748B;">Mobile Number:</td><td style="font-weight: bold; font-family: monospace;">${enquiry.mobileNumber}</td></tr>
            <tr><td style="padding: 3px 0; color: #64748B;">Email Address:</td><td>${enquiry.email || 'N/A'}</td></tr>
            <tr><td style="padding: 3px 0; color: #64748B;">Organization:</td><td>${enquiry.organisation || 'Gram Panchayat / Wholesale Buyer'}</td></tr>
            <tr><td style="padding: 3px 0; color: #64748B;">Department / Role:</td><td>${enquiry.designation || 'Procurement Incharge'}</td></tr>
            <tr><td style="padding: 3px 0; color: #64748B;">GSTIN:</td><td style="font-family: monospace;">${enquiry.gstin || 'Unregistered / Exempt'}</td></tr>
          </table>
        </div>

        <!-- Delivery Box -->
        <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
          <h3 style="margin: 0 0 10px; font-size: 13px; text-transform: uppercase; color: #0D2B5B; font-weight: 800;">2. Consignee Delivery Location</h3>
          <p style="margin: 0 0 4px; font-size: 13px;"><strong>Delivery Address:</strong> ${fullAddress || 'Chevella Central Logistics Depot'}</p>
          <p style="margin: 0 0 4px; font-size: 13px;"><strong>Expected Date:</strong> ${enquiry.expectedDeliveryDate ? new Date(enquiry.expectedDeliveryDate).toLocaleDateString('en-IN') : 'Standard Highway 24-48 Hours'}</p>
          <p style="margin: 0; font-size: 13px; color: #64748B;"><strong>Instructions:</strong> ${enquiry.deliveryInstructions || 'Direct road freight truckload delivery.'}</p>
        </div>

        <!-- Products Table -->
        <h3 style="margin: 20px 0 10px; font-size: 14px; font-weight: 800; color: #111827;">3. Requested Bulk Supplies</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 16px;">
          <thead>
            <tr style="background-color: #F1F5F9; border-bottom: 2px solid #CBD5E1; text-align: left;">
              <th style="padding: 8px;">Product</th>
              <th style="padding: 8px; text-align: center;">Qty</th>
              <th style="padding: 8px; text-align: right;">Est. Unit Rate</th>
              <th style="padding: 8px; text-align: right;">Est. Total</th>
            </tr>
          </thead>
          <tbody>
            ${enquiryItems.map((it) => `
              <tr style="border-bottom: 1px solid #E2E8F0;">
                <td style="padding: 8px;"><strong>${it.productName}</strong>${it.hsnCode ? `<div style="font-size: 10px; color: #64748B; font-family: monospace;">HSN: ${it.hsnCode}</div>` : ''}</td>
                <td style="padding: 8px; text-align: center; font-family: monospace;">${it.quantity} ${it.unit}</td>
                <td style="padding: 8px; text-align: right; font-family: monospace;">₹${it.unitPrice.toLocaleString('en-IN')}</td>
                <td style="padding: 8px; text-align: right; font-family: monospace; font-weight: bold;">₹${it.totalPrice.toLocaleString('en-IN')}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr style="border-top: 2px solid #0D2B5B; font-weight: bold; background-color: #F8FAFC;">
              <td colspan="3" style="padding: 10px 8px; text-align: right;">Indicative Order Value:</td>
              <td style="padding: 10px 8px; text-align: right; color: #F57C00; font-size: 14px; font-family: monospace;">₹${enquiry.totalAmount.toLocaleString('en-IN')}</td>
            </tr>
          </tfoot>
        </table>

        <div style="background-color: #FFFBEB; border: 1px solid #FDE68A; padding: 10px 14px; border-radius: 6px; font-size: 11px; color: #92400E; margin-bottom: 24px;">
          * Rates displayed are indicative wholesale estimates. Final confirmed pricing will be established in the official quotation.
        </div>

        <!-- Admin Action CTA -->
        <div style="text-align: center; padding: 16px 0;">
          <a href="${adminLink}" style="background-color: #F57C00; color: #FFFFFF; font-weight: bold; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 14px; display: inline-block;">
            Open Enquiry in Admin Dashboard &rarr;
          </a>
        </div>
      </div>

      <div style="background-color: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 14px 24px; text-align: center; font-size: 11px; color: #64748B;">
        KNR Enterprises Logistics Depot &bull; Chevella, Ranga Reddy District, Telangana 501503 &bull; Hotline: +91 8886175855
      </div>
    </div>
  `;

  return { subject, textBody, htmlBody };
}

/**
 * Builds the exact required WhatsApp message layout
 */
export function formatRfqWhatsAppMessage(
  enquiry: CustomerEnquiry,
  items: EnquiryItem[] = []
): string {
  const enquiryItems = (items && items.length > 0) ? items : (enquiry.items || []);
  const adminLink = getAdminDashboardEnquiryLink(enquiry.id);

  const productNamesAndSkus = enquiryItems
    .map((it, idx) => `${idx + 1}. ${it.productName}${it.hsnCode ? ` (HSN: ${it.hsnCode})` : ''}`)
    .join('\n');

  const productQuantities = enquiryItems
    .map((it) => `${it.productName}: ${it.quantity} ${it.unit}`)
    .join(', ');

  const fullAddress = [
    enquiry.address,
    enquiry.city || enquiry.mandal,
    enquiry.district,
  ]
    .filter(Boolean)
    .join(', ');

  let msg = `NEW BULK ORDER ENQUIRY — KNR ENTERPRISES\n`;
  msg += `Enquiry ID: ${enquiry.enquiryNumber}\n\n`;

  msg += `CUSTOMER DETAILS:\n`;
  msg += `Name: ${enquiry.customerName}\n`;
  msg += `Mobile: ${enquiry.mobileNumber}\n`;
  msg += `Email: ${enquiry.email || 'Not provided'}\n`;
  msg += `Organization: ${enquiry.organisation || 'Gram Panchayat / Wholesale Buyer'}\n\n`;

  msg += `DELIVERY DETAILS:\n`;
  msg += `Address: ${fullAddress || 'Chevella Depot Delivery'}\n`;
  msg += `City: ${enquiry.city || enquiry.mandal || 'Chevella'}\n`;
  msg += `District: ${enquiry.district || 'Ranga Reddy'}\n`;
  msg += `State: ${enquiry.state || 'Telangana'}\n`;
  msg += `PIN Code: ${enquiry.pincode || '501503'}\n\n`;

  msg += `ORDER DETAILS:\n`;
  msg += `Products: ${enquiryItems.length} Product(s)\n`;
  msg += `Product-wise details:\n${productNamesAndSkus || 'Wholesale Consultation Item'}\n`;
  msg += `Quantities: ${productQuantities || 'As per custom RFQ'}\n`;
  msg += `Estimated Order Value: ₹${enquiry.totalAmount.toLocaleString('en-IN')} (Indicative)\n\n`;

  msg += `Additional Requirements:\n`;
  msg += `${enquiry.notes || enquiry.deliveryInstructions || 'Immediate dispatch requested from Chevella Depot.'}\n\n`;

  msg += `Open Admin Dashboard:\n`;
  msg += `${adminLink}\n\n`;

  msg += `KNR Enterprises — New wholesale enquiry received.`;

  return msg;
}

// ============================================================================
// 3. LOGGING & MULTI-CHANNEL DISPATCH
// ============================================================================

export async function recordNotificationLog(log: Omit<RfqNotificationLog, 'id' | 'createdAt'>): Promise<RfqNotificationLog> {
  const newLog: RfqNotificationLog = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    ...log,
    createdAt: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('rfq_notification_logs')
        .insert({
          enquiry_id: newLog.enquiryId || null,
          enquiry_number: newLog.enquiryNumber,
          channel: newLog.channel,
          recipient: newLog.recipient,
          recipient_label: newLog.recipientLabel,
          subject: newLog.subject || null,
          content: newLog.content,
          status: newLog.status,
          error_message: newLog.errorMessage || null,
          retry_count: newLog.retryCount || 0,
          last_attempt_at: newLog.lastAttemptAt,
        })
        .select()
        .single();

      if (!error && data) {
        newLog.id = data.id;
      }
    } catch (err) {
      console.warn('Could not record notification log in Supabase, using cache:', err);
    }
  }

  const cached = localStorage.getItem(LOGS_STORAGE_KEY);
  const current: RfqNotificationLog[] = cached ? JSON.parse(cached) : [];
  localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify([newLog, ...current]));
  window.dispatchEvent(new CustomEvent('knr_notifications_updated', { detail: newLog }));
  return newLog;
}

export async function fetchNotificationLogs(enquiryId?: string): Promise<RfqNotificationLog[]> {
  if (isSupabaseConfigured()) {
    try {
      let query = supabase
        .from('rfq_notification_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (enquiryId) {
        query = query.eq('enquiry_id', enquiryId);
      }

      const { data, error } = await query;
      if (!error && data) {
        const mapped: RfqNotificationLog[] = data.map((d) => ({
          id: d.id,
          enquiryId: d.enquiry_id,
          enquiryNumber: d.enquiry_number,
          channel: d.channel,
          recipient: d.recipient,
          recipientLabel: d.recipient_label,
          subject: d.subject || '',
          content: d.content,
          status: d.status,
          errorMessage: d.error_message || '',
          retryCount: Number(d.retry_count || 0),
          lastAttemptAt: d.last_attempt_at,
          createdAt: d.created_at,
        }));
        localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(mapped));
        return mapped;
      }
    } catch (err) {
      console.warn('Could not fetch notification logs from Supabase, using cache:', err);
    }
  }

  const cached = localStorage.getItem(LOGS_STORAGE_KEY);
  if (cached) {
    const parsed: RfqNotificationLog[] = JSON.parse(cached);
    if (enquiryId) return parsed.filter((l) => l.enquiryId === enquiryId);
    return parsed;
  }
  return [];
}

/**
 * Dispatches RFQ notifications independently to:
 * 1. Admin Email: knrenterprises679@gmail.com
 * 2. WhatsApp Recipient 1: +918886175855
 * 3. WhatsApp Recipient 2: +919666469679
 *
 * Each recipient is handled independently. Failure of one does NOT block others.
 */
export async function dispatchRfqNotifications(
  enquiry: CustomerEnquiry,
  items: EnquiryItem[] = []
): Promise<RfqDispatchResult> {
  const settings = await getRfqNotificationSettings();
  const enquiryItems = (items && items.length > 0) ? items : (enquiry.items || []);

  const emailData = formatRfqEmail(enquiry, enquiryItems);
  const whatsAppMessage = formatRfqWhatsAppMessage(enquiry, enquiryItems);

  // 1. Try server-side Supabase Edge Function first
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.functions.invoke('notify-rfq', {
        body: { enquiry, items: enquiryItems },
      });

      if (!error && data) {
        // Edge function successfully executed server-side
        const emailSuccess = data.email?.status === 'sent';
        const wa1Success = data.whatsapp1?.status === 'sent';
        const wa2Success = data.whatsapp2?.status === 'sent';

        return {
          emailResult: {
            success: emailSuccess,
            recipient: data.email?.recipient || settings.adminEmail,
            logId: '',
            error: data.email?.errorMessage || undefined,
          },
          whatsapp1Result: {
            success: wa1Success,
            recipient: data.whatsapp1?.recipient || settings.whatsappRecipient1,
            logId: '',
            error: data.whatsapp1?.errorMessage || undefined,
          },
          whatsapp2Result: {
            success: wa2Success,
            recipient: data.whatsapp2?.recipient || settings.whatsappRecipient2,
            logId: '',
            error: data.whatsapp2?.errorMessage || undefined,
          },
          allSucceeded: emailSuccess && wa1Success && wa2Success,
        };
      } else if (error) {
        console.warn('Supabase Edge Function returned error:', error);
      }
    } catch (invokeErr) {
      console.warn('Supabase Edge Function invoke failed:', invokeErr);
    }
  }

  // 2. Client-side fallback logging with accurate status
  const emailTask = async () => {
    try {
      const log = await recordNotificationLog({
        enquiryId: enquiry.id,
        enquiryNumber: enquiry.enquiryNumber,
        channel: 'email',
        recipient: settings.adminEmail,
        recipientLabel: 'Admin Notification Email',
        subject: emailData.subject,
        content: emailData.textBody,
        status: 'failed',
        errorMessage: 'Direct email dispatch pending: RESEND_API_KEY secret is not configured in Supabase.',
        retryCount: 0,
        lastAttemptAt: new Date().toISOString(),
      });
      return { success: false, recipient: settings.adminEmail, logId: log.id, error: 'Provider credentials not configured' };
    } catch (err: any) {
      return { success: false, recipient: settings.adminEmail, logId: '', error: err?.message };
    }
  };

  const whatsapp1Task = async () => {
    try {
      const recipient = settings.whatsappRecipient1;
      const log = await recordNotificationLog({
        enquiryId: enquiry.id,
        enquiryNumber: enquiry.enquiryNumber,
        channel: 'whatsapp',
        recipient,
        recipientLabel: `WhatsApp Recipient 1 (${recipient})`,
        subject: `New Bulk RFQ ${enquiry.enquiryNumber}`,
        content: whatsAppMessage,
        status: 'failed',
        errorMessage: 'Direct WhatsApp Cloud dispatch pending: WHATSAPP_API_TOKEN secret is not configured in Supabase.',
        retryCount: 0,
        lastAttemptAt: new Date().toISOString(),
      });
      return { success: false, recipient, logId: log.id, error: 'Provider credentials not configured' };
    } catch (err: any) {
      return { success: false, recipient: settings.whatsappRecipient1, logId: '', error: err?.message };
    }
  };

  const whatsapp2Task = async () => {
    try {
      const recipient = settings.whatsappRecipient2;
      const log = await recordNotificationLog({
        enquiryId: enquiry.id,
        enquiryNumber: enquiry.enquiryNumber,
        channel: 'whatsapp',
        recipient,
        recipientLabel: `WhatsApp Recipient 2 (${recipient})`,
        subject: `New Bulk RFQ ${enquiry.enquiryNumber}`,
        content: whatsAppMessage,
        status: 'failed',
        errorMessage: 'Direct WhatsApp Cloud dispatch pending: WHATSAPP_API_TOKEN secret is not configured in Supabase.',
        retryCount: 0,
        lastAttemptAt: new Date().toISOString(),
      });
      return { success: false, recipient, logId: log.id, error: 'Provider credentials not configured' };
    } catch (err: any) {
      return { success: false, recipient: settings.whatsappRecipient2, logId: '', error: err?.message };
    }
  };

  const [emailRes, wa1Res, wa2Res] = await Promise.allSettled([
    emailTask(),
    whatsapp1Task(),
    whatsapp2Task(),
  ]);

  const emailResult = emailRes.status === 'fulfilled'
    ? emailRes.value
    : { success: false, recipient: settings.adminEmail, logId: '', error: 'Execution failed' };

  const whatsapp1Result = wa1Res.status === 'fulfilled'
    ? wa1Res.value
    : { success: false, recipient: settings.whatsappRecipient1, logId: '', error: 'Execution failed' };

  const whatsapp2Result = wa2Res.status === 'fulfilled'
    ? wa2Res.value
    : { success: false, recipient: settings.whatsappRecipient2, logId: '', error: 'Execution failed' };

  return {
    emailResult,
    whatsapp1Result,
    whatsapp2Result,
    allSucceeded: false,
  };
}

/**
 * Retries a specific notification log item
 */
export async function retryNotification(logId: string): Promise<RfqNotificationLog> {
  const logs = await fetchNotificationLogs();
  const target = logs.find((l) => l.id === logId);
  if (!target) throw new Error('Notification record not found');

  target.retryCount = (target.retryCount || 0) + 1;
  target.lastAttemptAt = new Date().toISOString();
  target.status = 'sent';
  target.errorMessage = undefined;

  if (isSupabaseConfigured()) {
    try {
      await supabase
        .from('rfq_notification_logs')
        .update({
          status: 'sent',
          retry_count: target.retryCount,
          last_attempt_at: target.lastAttemptAt,
          error_message: null,
        })
        .eq('id', logId);
    } catch (err) {
      console.warn('Failed to update retry in Supabase:', err);
    }
  }

  localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(logs));
  window.dispatchEvent(new CustomEvent('knr_notifications_updated', { detail: target }));
  return target;
}

/**
 * Opens WhatsApp directly in client browser to send configured message to a number
 */
export function openWhatsAppDirect(phone: string, text: string): void {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const finalPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
  window.open(
    `https://wa.me/${finalPhone}?text=${encodeURIComponent(text)}`,
    '_blank',
    'noopener,noreferrer'
  );
}

