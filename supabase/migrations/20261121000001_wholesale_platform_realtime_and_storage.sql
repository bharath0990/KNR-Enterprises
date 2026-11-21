-- ============================================================================
-- KNR ENTERPRISES — WHOLESALE CATALOGUE, REALTIME & STORAGE HARDENING
-- Migration: 20261121000001_wholesale_platform_realtime_and_storage.sql
-- ============================================================================

-- 1. Collision-Safe RFQ Reference Generator (Format: KNR-RFQ-YYYYMMDD-XXXX)
CREATE SEQUENCE IF NOT EXISTS public.rfq_number_seq START WITH 1 INCREMENT BY 1;

CREATE OR REPLACE FUNCTION public.generate_rfq_reference()
RETURNS TEXT AS $$
DECLARE
    today_str TEXT;
    seq_val BIGINT;
BEGIN
    today_str := to_char(NOW() AT TIME ZONE 'Asia/Kolkata', 'YYYYMMDD');
    seq_val := nextval('public.rfq_number_seq');
    RETURN 'KNR-RFQ-' || today_str || '-' || lpad((seq_val % 10000)::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql VOLATILE;

ALTER TABLE public.enquiries ALTER COLUMN enquiry_number SET DEFAULT public.generate_rfq_reference();

-- 2. Product Wholesale Fields (Availability Status & Gallery)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS availability VARCHAR(50) DEFAULT 'Available';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS gallery_images JSONB DEFAULT '[]'::jsonb;

-- 3. Administrative Authorization & Role Sync
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        auth.role() = 'service_role' OR
        auth.role() = 'authenticated'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Enable Supabase Realtime for Core Catalogue & Enquiries
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'enquiries') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.enquiries;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'enquiry_items') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.enquiry_items;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'products') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'categories') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;
    END IF;
END $$;

-- 5. Supabase Storage Buckets & Policies for Product Images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('knr-products', 'knr-products', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif']),
    ('knr-media', 'knr-media', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'application/pdf'])
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public Access to Product Images" ON storage.objects;
CREATE POLICY "Public Access to Product Images" ON storage.objects
    FOR SELECT USING (bucket_id IN ('knr-products', 'knr-media'));

DROP POLICY IF EXISTS "Admins can upload images" ON storage.objects;
CREATE POLICY "Admins can upload images" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (bucket_id IN ('knr-products', 'knr-media'));

DROP POLICY IF EXISTS "Admins can update images" ON storage.objects;
CREATE POLICY "Admins can update images" ON storage.objects
    FOR UPDATE TO authenticated USING (bucket_id IN ('knr-products', 'knr-media'));

DROP POLICY IF EXISTS "Admins can delete images" ON storage.objects;
CREATE POLICY "Admins can delete images" ON storage.objects
    FOR DELETE TO authenticated USING (bucket_id IN ('knr-products', 'knr-media'));
