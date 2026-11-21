// Follow Supabase Edge Functions standard for Deno runtime
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";

// Allowed origins for CORS and Origin Validation
const ALLOWED_ORIGIN_PATTERNS = [
  /^https?:\/\/localhost(:\d+)?$/,
  /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
  /^https:\/\/[a-z0-9-]+\.github\.io$/,
  /^https:\/\/(www\.)?knr-enterprises\.com$/,
  /^https:\/\/[a-z0-9-]+\.supabase\.co$/,
];

function getCorsHeaders(origin: string | null) {
  let isAllowed = false;
  if (origin) {
    isAllowed = ALLOWED_ORIGIN_PATTERNS.some((pattern) => pattern.test(origin));
  }
  const allowOrigin = isAllowed && origin ? origin : "*";

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

// In-Memory Rate Limiting: Max 15 requests per 5 minutes per IP
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 15;
const ipRequestHistory = new Map<string, number[]>();

function checkRateLimit(clientIp: string): boolean {
  const now = Date.now();
  const timestamps = ipRequestHistory.get(clientIp) || [];
  const validTimestamps = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

  if (validTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    ipRequestHistory.set(clientIp, validTimestamps);
    return false; // Rate limit exceeded
  }

  validTimestamps.push(now);
  ipRequestHistory.set(clientIp, validTimestamps);

  // Periodic cleanup if map grows
  if (ipRequestHistory.size > 2000) {
    for (const [ip, list] of ipRequestHistory.entries()) {
      const filtered = list.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
      if (filtered.length === 0) ipRequestHistory.delete(ip);
      else ipRequestHistory.set(ip, filtered);
    }
  }

  return true;
}

interface EnquiryItem {
  id?: string;
  productName: string;
  hsnCode?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
}

interface CustomerEnquiry {
  id: string;
  enquiryNumber: string;
  customerName: string;
  mobileNumber: string;
  email?: string;
  organisation?: string;
  designation?: string;
  gstin?: string;
  address?: string;
  city?: string;
  mandal?: string;
  district?: string;
  state?: string;
  pincode?: string;
  expectedDeliveryDate?: string;
  deliveryInstructions?: string;
  notes?: string;
  attachmentName?: string;
  attachmentUrl?: string;
  subtotal: number;
  estimatedGst: number;
  totalAmount: number;
  status: string;
  source: string;
  createdAt: string;
}

function formatRfqEmail(enquiry: CustomerEnquiry, items: EnquiryItem[]) {
  const subject = `NEW BULK RFQ RECEIVED — ${enquiry.enquiryNumber} — ${enquiry.customerName}`;
  const adminLink = `https://knr-enterprises.com/#admin/enquiries`;
  const formattedDate = new Date(enquiry.createdAt || Date.now()).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const fullAddress = [
    enquiry.address,
    enquiry.city || enquiry.mandal,
    enquiry.district,
    enquiry.state,
    enquiry.pincode ? `PIN: ${enquiry.pincode}` : "",
  ].filter(Boolean).join(", ");

  let itemsText = "";
  items.forEach((it, idx) => {
    itemsText += `${idx + 1}. ${it.productName}\n`;
    if (it.hsnCode) itemsText += `   HSN: ${it.hsnCode}\n`;
    itemsText += `   Quantity: ${it.quantity} ${it.unit}\n`;
    itemsText += `   Est. Unit Price: ₹${Number(it.unitPrice).toLocaleString("en-IN")} / ${it.unit}\n`;
    itemsText += `   Est. Line Total: ₹${Number(it.totalPrice).toLocaleString("en-IN")}\n\n`;
  });

  const textBody = `===============================================================
KNR ENTERPRISES — NEW WHOLESALE RFQ RECEIVED
===============================================================

Enquiry Reference : ${enquiry.enquiryNumber}
Submission Time   : ${formattedDate} (IST)
Status            : ${enquiry.status}

---------------------------------------------------------------
1. CUSTOMER INFORMATION
---------------------------------------------------------------
Customer Name : ${enquiry.customerName}
Mobile Number : ${enquiry.mobileNumber}
Email Address : ${enquiry.email || "Not provided"}
Organization  : ${enquiry.organisation || "Gram Panchayat / Wholesale Buyer"}
Department    : ${enquiry.designation || "Procurement Incharge"}
GSTIN         : ${enquiry.gstin || "Unregistered / Exempted Panchayat"}

---------------------------------------------------------------
2. DELIVERY LOCATION & CONFLICT INSTRUCTIONS
---------------------------------------------------------------
Delivery Address  : ${fullAddress || "Chevella Central Logistics Depot Hub"}
City / Mandal     : ${enquiry.city || enquiry.mandal || "Chevella"}
District & State  : ${enquiry.district || "Ranga Reddy"}, ${enquiry.state || "Telangana"}
PIN Code          : ${enquiry.pincode || "501503"}
Expected Delivery : ${enquiry.expectedDeliveryDate ? new Date(enquiry.expectedDeliveryDate).toLocaleDateString("en-IN") : "Standard Depot 24-48 Hours"}
Delivery Notes    : ${enquiry.deliveryInstructions || "Direct road freight truckload delivery."}

---------------------------------------------------------------
3. REQUESTED SUPPLIES & INDICATIVE PRICING
---------------------------------------------------------------
${itemsText || "General Wholesale Enquiry (Direct Bulk Consultation)\n"}
Indicative Subtotal   : ₹${Number(enquiry.subtotal || 0).toLocaleString("en-IN")}
Estimated GST (18%)   : ₹${Number(enquiry.estimatedGst || 0).toLocaleString("en-IN")}
Total Indicative Value: ₹${Number(enquiry.totalAmount || 0).toLocaleString("en-IN")}

* Note: Rates and totals are indicative estimates. A formal quotation
will confirm negotiated prices, batch assay, and road freight.

---------------------------------------------------------------
4. ADDITIONAL REQUIREMENTS & ATTACHMENTS
---------------------------------------------------------------
Requirements : ${enquiry.notes || "None specified"}
Uploaded BOQ : ${enquiry.attachmentName ? `${enquiry.attachmentName} (${enquiry.attachmentUrl || "Uploaded in portal"})` : "No file attached"}

---------------------------------------------------------------
OPEN IN SECURE ADMIN DASHBOARD:
${adminLink}
===============================================================`;

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; color: #111827; line-height: 1.5; border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden;">
      <div style="background-color: #0D2B5B; color: #FFFFFF; padding: 20px 24px; border-bottom: 4px solid #F57C00;">
        <h2 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 0.5px;">KNR ENTERPRISES — WHOLESALE RFQ NOTIFICATION</h2>
        <p style="margin: 4px 0 0; font-size: 13px; color: #E2E8F0;">Enquiry Ref: <strong style="color: #F57C00;">${enquiry.enquiryNumber}</strong> &bull; Received on ${formattedDate} (IST)</p>
      </div>

      <div style="padding: 24px; background-color: #FFFFFF;">
        <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
          <h3 style="margin: 0 0 10px; font-size: 13px; text-transform: uppercase; color: #F57C00; font-weight: 800;">1. Customer &amp; Organization Details</h3>
          <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
            <tr><td style="padding: 3px 0; color: #64748B; width: 35%;">Customer Name:</td><td style="font-weight: bold; color: #111827;">${enquiry.customerName}</td></tr>
            <tr><td style="padding: 3px 0; color: #64748B;">Mobile Number:</td><td style="font-weight: bold; font-family: monospace;">${enquiry.mobileNumber}</td></tr>
            <tr><td style="padding: 3px 0; color: #64748B;">Email Address:</td><td>${enquiry.email || "N/A"}</td></tr>
            <tr><td style="padding: 3px 0; color: #64748B;">Organization:</td><td>${enquiry.organisation || "Gram Panchayat / Wholesale Buyer"}</td></tr>
            <tr><td style="padding: 3px 0; color: #64748B;">Department / Role:</td><td>${enquiry.designation || "Procurement Incharge"}</td></tr>
            <tr><td style="padding: 3px 0; color: #64748B;">GSTIN:</td><td style="font-family: monospace;">${enquiry.gstin || "Unregistered / Exempt"}</td></tr>
          </table>
        </div>

        <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
          <h3 style="margin: 0 0 10px; font-size: 13px; text-transform: uppercase; color: #0D2B5B; font-weight: 800;">2. Consignee Delivery Location</h3>
          <p style="margin: 0 0 4px; font-size: 13px;"><strong>Delivery Address:</strong> ${fullAddress || "Chevella Central Logistics Depot"}</p>
          <p style="margin: 0 0 4px; font-size: 13px;"><strong>Expected Date:</strong> ${enquiry.expectedDeliveryDate ? new Date(enquiry.expectedDeliveryDate).toLocaleDateString("en-IN") : "Standard Highway 24-48 Hours"}</p>
          <p style="margin: 0; font-size: 13px; color: #64748B;"><strong>Instructions:</strong> ${enquiry.deliveryInstructions || "Direct road freight truckload delivery."}</p>
        </div>

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
            ${items.map((it) => `
              <tr style="border-bottom: 1px solid #E2E8F0;">
                <td style="padding: 8px;"><strong>${it.productName}</strong>${it.hsnCode ? `<div style="font-size: 10px; color: #64748B; font-family: monospace;">HSN: ${it.hsnCode}</div>` : ""}</td>
                <td style="padding: 8px; text-align: center; font-family: monospace;">${it.quantity} ${it.unit}</td>
                <td style="padding: 8px; text-align: right; font-family: monospace;">₹${Number(it.unitPrice).toLocaleString("en-IN")}</td>
                <td style="padding: 8px; text-align: right; font-family: monospace; font-weight: bold;">₹${Number(it.totalPrice).toLocaleString("en-IN")}</td>
              </tr>
            `).join("")}
          </tbody>
          <tfoot>
            <tr style="border-top: 2px solid #0D2B5B; font-weight: bold; background-color: #F8FAFC;">
              <td colspan="3" style="padding: 10px 8px; text-align: right;">Indicative Order Value:</td>
              <td style="padding: 10px 8px; text-align: right; color: #F57C00; font-size: 14px; font-family: monospace;">₹${Number(enquiry.totalAmount).toLocaleString("en-IN")}</td>
            </tr>
          </tfoot>
        </table>

        <div style="background-color: #FFFBEB; border: 1px solid #FDE68A; padding: 10px 14px; border-radius: 6px; font-size: 11px; color: #92400E; margin-bottom: 24px;">
          * Rates displayed are indicative wholesale estimates. Final confirmed pricing will be established in the official quotation.
        </div>

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

function formatRfqWhatsApp(enquiry: CustomerEnquiry, items: EnquiryItem[]) {
  const adminLink = `https://knr-enterprises.com/#admin/enquiries`;

  const productNamesAndSkus = items
    .map((it, idx) => `${idx + 1}. ${it.productName}${it.hsnCode ? ` (HSN: ${it.hsnCode})` : ""}`)
    .join("\n");

  const productQuantities = items
    .map((it) => `${it.productName}: ${it.quantity} ${it.unit}`)
    .join(", ");

  const fullAddress = [
    enquiry.address,
    enquiry.city || enquiry.mandal,
    enquiry.district,
  ].filter(Boolean).join(", ");

  let msg = `NEW BULK ORDER ENQUIRY — KNR ENTERPRISES\n`;
  msg += `Enquiry ID: ${enquiry.enquiryNumber}\n\n`;

  msg += `CUSTOMER DETAILS:\n`;
  msg += `Name: ${enquiry.customerName}\n`;
  msg += `Mobile: ${enquiry.mobileNumber}\n`;
  msg += `Email: ${enquiry.email || "Not provided"}\n`;
  msg += `Organization: ${enquiry.organisation || "Gram Panchayat / Wholesale Buyer"}\n\n`;

  msg += `DELIVERY DETAILS:\n`;
  msg += `Address: ${fullAddress || "Chevella Depot Delivery"}\n`;
  msg += `City: ${enquiry.city || enquiry.mandal || "Chevella"}\n`;
  msg += `District: ${enquiry.district || "Ranga Reddy"}\n`;
  msg += `State: ${enquiry.state || "Telangana"}\n`;
  msg += `PIN Code: ${enquiry.pincode || "501503"}\n\n`;

  msg += `ORDER DETAILS:\n`;
  msg += `Products: ${items.length} Product(s)\n`;
  msg += `Product-wise details:\n${productNamesAndSkus || "Wholesale Consultation Item"}\n`;
  msg += `Quantities: ${productQuantities || "As per custom RFQ"}\n`;
  msg += `Estimated Order Value: ₹${Number(enquiry.totalAmount).toLocaleString("en-IN")} (Indicative)\n\n`;

  msg += `Additional Requirements:\n`;
  msg += `${enquiry.notes || enquiry.deliveryInstructions || "Immediate dispatch requested from Chevella Depot."}\n\n`;

  msg += `Open Admin Dashboard:\n`;
  msg += `${adminLink}\n\n`;

  msg += `KNR Enterprises — New wholesale enquiry received.`;

  return msg;
}

serve(async (req) => {
  const origin = req.headers.get("origin") || req.headers.get("referer");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // 1. Rate Limiting Check
  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
                   req.headers.get("cf-connecting-ip") ||
                   req.headers.get("x-real-ip") ||
                   "unknown-client";

  if (!checkRateLimit(clientIp)) {
    return new Response(
      JSON.stringify({ error: "Rate limit exceeded. Please wait 5 minutes before submitting another request." }),
      { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // 2. Maximum Payload Size Check (Max 512 KB)
  const contentLength = Number(req.headers.get("content-length") || 0);
  if (contentLength > 512 * 1024) {
    return new Response(
      JSON.stringify({ error: "Payload too large. Maximum allowed size is 512 KB." }),
      { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const rawBody = await req.text();
    if (!rawBody || rawBody.length === 0) {
      return new Response(
        JSON.stringify({ error: "Empty request body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload = JSON.parse(rawBody);

    // 3. Admin-only Retry Authorization Check
    const isRetryAction = payload.action === "retry";
    const authHeader = req.headers.get("authorization");

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (isRetryAction) {
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return new Response(
          JSON.stringify({ error: "Unauthorized: Admin authentication token required to trigger manual retries." }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const token = authHeader.replace("Bearer ", "").trim();
      const { data: userData, error: authError } = await supabase.auth.getUser(token);
      if (authError || !userData?.user) {
        return new Response(
          JSON.stringify({ error: "Forbidden: Valid administrator credentials required." }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // 4. Server-Side Schema Validation
    const enquiry: CustomerEnquiry = payload.enquiry;
    const items: EnquiryItem[] = Array.isArray(payload.items) ? payload.items : [];

    if (!enquiry || typeof enquiry !== "object") {
      return new Response(
        JSON.stringify({ error: "Invalid payload: 'enquiry' object is required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!enquiry.enquiryNumber || typeof enquiry.enquiryNumber !== "string" || enquiry.enquiryNumber.length > 50) {
      return new Response(
        JSON.stringify({ error: "Invalid enquiry reference number." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!enquiry.customerName || typeof enquiry.customerName !== "string" || enquiry.customerName.trim().length < 2) {
      return new Response(
        JSON.stringify({ error: "Customer name must be at least 2 characters." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cleanMobile = String(enquiry.mobileNumber || "").replace(/[^0-9+]/g, "");
    if (cleanMobile.length < 10 || cleanMobile.length > 16) {
      return new Response(
        JSON.stringify({ error: "Invalid contact mobile number." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (items.length > 100) {
      return new Response(
        JSON.stringify({ error: "Exceeded maximum line items limit (100)." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const adminEmail = "knrenterprises679@gmail.com";
    const wa1Phone = "+918886175855";
    const wa2Phone = "+919666469679";

    const emailData = formatRfqEmail(enquiry, items);
    const whatsAppMessage = formatRfqWhatsApp(enquiry, items);

    // 5. Send Email via Resend
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    let emailResult = {
      channel: "email",
      recipient: adminEmail,
      recipientLabel: "Admin Notification Email",
      status: "failed",
      errorMessage: "",
      providerId: "",
    };

    if (resendApiKey) {
      try {
        const fromEmail = Deno.env.get("RESEND_FROM") || "KNR Wholesale <onboarding@resend.dev>";
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [adminEmail],
            subject: emailData.subject,
            html: emailData.htmlBody,
            text: emailData.textBody,
          }),
        });

        const resData = await res.json();
        if (res.ok) {
          emailResult.status = "sent";
          emailResult.providerId = resData.id;
        } else {
          emailResult.status = "failed";
          emailResult.errorMessage = `Resend API error: ${resData.message || res.statusText}`;
        }
      } catch (err: any) {
        emailResult.status = "failed";
        emailResult.errorMessage = `Resend request failed: ${err.message || String(err)}`;
      }
    } else {
      emailResult.status = "failed";
      emailResult.errorMessage = "Email delivery pending: RESEND_API_KEY secret is not configured in Supabase.";
    }

    // 6. WhatsApp Helpers (Meta Cloud API)
    const waToken = Deno.env.get("WHATSAPP_API_TOKEN");
    const waPhoneId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");

    async function sendWhatsAppMessage(rawNumber: string, label: string) {
      const cleanNumber = rawNumber.replace(/[^0-9]/g, "");
      const finalNumber = cleanNumber.startsWith("91") ? cleanNumber : `91${cleanNumber}`;

      const result = {
        channel: "whatsapp",
        recipient: rawNumber,
        recipientLabel: label,
        status: "failed",
        errorMessage: "",
        providerId: "",
      };

      if (waToken && waPhoneId) {
        try {
          const res = await fetch(`https://graph.facebook.com/v19.0/${waPhoneId}/messages`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${waToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              messaging_product: "whatsapp",
              recipient_type: "individual",
              to: finalNumber,
              type: "text",
              text: {
                preview_url: false,
                body: whatsAppMessage,
              },
            }),
          });

          const resData = await res.json();
          if (res.ok && resData.messages && resData.messages.length > 0) {
            result.status = "sent";
            result.providerId = resData.messages[0].id;
          } else {
            result.status = "failed";
            result.errorMessage = `WhatsApp API error: ${JSON.stringify(resData.error || resData)}`;
          }
        } catch (err: any) {
          result.status = "failed";
          result.errorMessage = `WhatsApp request error: ${err.message || String(err)}`;
        }
      } else {
        result.status = "failed";
        result.errorMessage = "WhatsApp delivery pending: WHATSAPP_API_TOKEN or WHATSAPP_PHONE_NUMBER_ID not configured in Supabase.";
      }

      return result;
    }

    // Run WhatsApp dispatches independently
    const [wa1Result, wa2Result] = await Promise.all([
      sendWhatsAppMessage(wa1Phone, `WhatsApp Recipient 1 (${wa1Phone})`),
      sendWhatsAppMessage(wa2Phone, `WhatsApp Recipient 2 (${wa2Phone})`),
    ]);

    // 7. Record logs in rfq_notification_logs table
    const logsToInsert = [
      {
        enquiry_id: enquiry.id || null,
        enquiry_number: enquiry.enquiryNumber,
        channel: emailResult.channel,
        recipient: emailResult.recipient,
        recipient_label: emailResult.recipientLabel,
        subject: emailData.subject,
        content: emailData.textBody,
        status: emailResult.status,
        error_message: emailResult.errorMessage || (emailResult.providerId ? `Provider ID: ${emailResult.providerId}` : null),
        retry_count: isRetryAction ? 1 : 0,
        last_attempt_at: new Date().toISOString(),
      },
      {
        enquiry_id: enquiry.id || null,
        enquiry_number: enquiry.enquiryNumber,
        channel: wa1Result.channel,
        recipient: wa1Result.recipient,
        recipient_label: wa1Result.recipientLabel,
        subject: `New Bulk RFQ ${enquiry.enquiryNumber}`,
        content: whatsAppMessage,
        status: wa1Result.status,
        error_message: wa1Result.errorMessage || (wa1Result.providerId ? `Meta Message ID: ${wa1Result.providerId}` : null),
        retry_count: isRetryAction ? 1 : 0,
        last_attempt_at: new Date().toISOString(),
      },
      {
        enquiry_id: enquiry.id || null,
        enquiry_number: enquiry.enquiryNumber,
        channel: wa2Result.channel,
        recipient: wa2Result.recipient,
        recipient_label: wa2Result.recipientLabel,
        subject: `New Bulk RFQ ${enquiry.enquiryNumber}`,
        content: whatsAppMessage,
        status: wa2Result.status,
        error_message: wa2Result.errorMessage || (wa2Result.providerId ? `Meta Message ID: ${wa2Result.providerId}` : null),
        retry_count: isRetryAction ? 1 : 0,
        last_attempt_at: new Date().toISOString(),
      },
    ];

    try {
      await supabase.from("rfq_notification_logs").insert(logsToInsert);
    } catch (dbErr) {
      console.error("Failed to insert notification logs into database:", dbErr);
    }

    return new Response(
      JSON.stringify({
        success: true,
        enquiryNumber: enquiry.enquiryNumber,
        email: emailResult,
        whatsapp1: wa1Result,
        whatsapp2: wa2Result,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
