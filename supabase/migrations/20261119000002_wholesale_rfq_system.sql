-- ==============================================================================
-- KNR ENTERPRISES — WHOLESALE RFQ & QUOTATION SYSTEM MIGRATION
-- Migration: 20261119000002_wholesale_rfq_system.sql
-- ==============================================================================

-- 1. Extend Enquiries Table with delivery, order details & updated pipeline statuses
ALTER TABLE public.enquiries 
    ADD COLUMN IF NOT EXISTS address TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS city TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS pincode TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS delivery_instructions TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS expected_delivery_date TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS attachment_url TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS attachment_name TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS gstin TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS follow_up_date DATE;

-- Update status check constraint on enquiries to support full 7-stage RFQ pipeline
ALTER TABLE public.enquiries DROP CONSTRAINT IF EXISTS enquiries_status_check;
ALTER TABLE public.enquiries ADD CONSTRAINT enquiries_status_check 
    CHECK (status IN (
        'New', 
        'Contacted', 
        'Quotation Preparing', 
        'Quotation Sent', 
        'Negotiation', 
        'Order Confirmed', 
        'Lost', 
        'Approved', 
        'Rejected', 
        'Completed'
    ));

-- 2. Quotations Table (Official Commercial B2B Quotations)
CREATE TABLE IF NOT EXISTS public.quotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_number TEXT UNIQUE NOT NULL,
    enquiry_id UUID REFERENCES public.enquiries(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    mobile_number TEXT NOT NULL,
    email TEXT DEFAULT '',
    organisation TEXT DEFAULT '',
    gstin TEXT DEFAULT '',
    delivery_address TEXT DEFAULT '',
    place_of_supply TEXT NOT NULL DEFAULT 'Telangana (36)',
    tax_type TEXT NOT NULL DEFAULT 'INTRA_STATE' CHECK (tax_type IN ('INTRA_STATE', 'INTER_STATE')),
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
    discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    taxable_value NUMERIC(12, 2) NOT NULL DEFAULT 0,
    cgst_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    sgst_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    igst_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total_gst NUMERIC(12, 2) NOT NULL DEFAULT 0,
    transport_charges NUMERIC(12, 2) NOT NULL DEFAULT 0,
    packaging_charges NUMERIC(12, 2) NOT NULL DEFAULT 0,
    other_charges NUMERIC(12, 2) NOT NULL DEFAULT 0,
    grand_total NUMERIC(12, 2) NOT NULL DEFAULT 0,
    amount_in_words TEXT DEFAULT '',
    validity_date DATE NOT NULL,
    payment_terms TEXT DEFAULT '100% advance against PO/Proforma or Net 30 for Gram Panchayats',
    delivery_terms TEXT DEFAULT 'Direct Highway Dispatch Ex-Chevella Depot to Project Site',
    warranty_terms TEXT DEFAULT 'Material strictly conforms to BIS standards and Telangana state lab assay parameters.',
    notes TEXT DEFAULT '',
    terms_and_conditions TEXT DEFAULT '1. Rates quoted are firm for 15 days from issue date. 2. Taxes as applicable under GST Law. 3. Subject to Chevella jurisdiction.',
    status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Sent', 'Revised', 'Accepted', 'Declined', 'Expired')),
    version INTEGER NOT NULL DEFAULT 1,
    created_by TEXT DEFAULT 'Administrator',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Quotation Line Items Table
CREATE TABLE IF NOT EXISTS public.quotation_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_id UUID NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
    product_id TEXT,
    product_name TEXT NOT NULL,
    sku TEXT DEFAULT '',
    hsn_code TEXT DEFAULT '',
    quantity NUMERIC(12, 2) NOT NULL DEFAULT 1,
    unit TEXT NOT NULL DEFAULT 'unit',
    unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    discount_percent NUMERIC(5, 2) NOT NULL DEFAULT 0,
    taxable_value NUMERIC(12, 2) NOT NULL DEFAULT 0,
    gst_rate NUMERIC(5, 2) NOT NULL DEFAULT 18,
    cgst_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    sgst_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    igst_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Enquiry Status History Table
CREATE TABLE IF NOT EXISTS public.enquiry_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enquiry_id UUID NOT NULL REFERENCES public.enquiries(id) ON DELETE CASCADE,
    previous_status TEXT,
    new_status TEXT NOT NULL,
    notes TEXT DEFAULT '',
    updated_by TEXT DEFAULT 'Administrator',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Communication Logs Table (WhatsApp, Email & Phone tracking)
CREATE TABLE IF NOT EXISTS public.communication_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enquiry_id UUID NOT NULL REFERENCES public.enquiries(id) ON DELETE CASCADE,
    quotation_id UUID REFERENCES public.quotations(id) ON DELETE SET NULL,
    channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'email', 'phone', 'in_person')),
    recipient TEXT NOT NULL,
    subject TEXT DEFAULT '',
    message_preview TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('not_shared', 'shared_manually', 'sent', 'delivered', 'failed')),
    error_details TEXT DEFAULT '',
    sent_by TEXT DEFAULT 'Administrator',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. Confirmed Orders Table (Converted from accepted quotations)
CREATE TABLE IF NOT EXISTS public.confirmed_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT UNIQUE NOT NULL,
    enquiry_id UUID REFERENCES public.enquiries(id) ON DELETE SET NULL,
    quotation_id UUID REFERENCES public.quotations(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    mobile_number TEXT NOT NULL,
    email TEXT DEFAULT '',
    organisation TEXT DEFAULT '',
    delivery_address TEXT DEFAULT '',
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    agreed_quantities_summary TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'Confirmed' CHECK (status IN ('Confirmed', 'Dispatched', 'Completed', 'Cancelled')),
    created_by TEXT DEFAULT 'Administrator',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_quotations_enquiry_id ON public.quotations(enquiry_id);
CREATE INDEX IF NOT EXISTS idx_quotation_items_quotation_id ON public.quotation_items(quotation_id);
CREATE INDEX IF NOT EXISTS idx_enquiry_history_enquiry_id ON public.enquiry_status_history(enquiry_id);
CREATE INDEX IF NOT EXISTS idx_communication_logs_enquiry_id ON public.communication_logs(enquiry_id);
CREATE INDEX IF NOT EXISTS idx_confirmed_orders_quotation_id ON public.confirmed_orders(quotation_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enquiry_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.confirmed_orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Quotations: Admins have full access
CREATE POLICY "Admins have full access to quotations" 
ON public.quotations FOR ALL 
TO authenticated 
USING (true) WITH CHECK (true);

-- Quotation Items: Admins have full access
CREATE POLICY "Admins have full access to quotation items" 
ON public.quotation_items FOR ALL 
TO authenticated 
USING (true) WITH CHECK (true);

-- Status History: Admins have full access
CREATE POLICY "Admins have full access to enquiry status history" 
ON public.enquiry_status_history FOR ALL 
TO authenticated 
USING (true) WITH CHECK (true);

-- Communication Logs: Admins have full access
CREATE POLICY "Admins have full access to communication logs" 
ON public.communication_logs FOR ALL 
TO authenticated 
USING (true) WITH CHECK (true);

-- Confirmed Orders: Admins have full access
CREATE POLICY "Admins have full access to confirmed orders" 
ON public.confirmed_orders FOR ALL 
TO authenticated 
USING (true) WITH CHECK (true);

-- Allow public lookup of confirmed quotation by quotation_number (read-only verification)
CREATE POLICY "Public can view valid quotation by quotation_number" 
ON public.quotations FOR SELECT 
TO anon 
USING (status IN ('Sent', 'Accepted'));

-- Enable Supabase Realtime publication for newly created RFQ tables
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'quotations') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.quotations;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'quotation_items') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.quotation_items;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'communication_logs') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.communication_logs;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'confirmed_orders') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.confirmed_orders;
    END IF;
END $$;

