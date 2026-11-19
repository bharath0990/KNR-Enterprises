-- ==============================================================================
-- KNR ENTERPRISES — COMPLETE PRODUCTION SUPABASE DATABASE SCHEMA
-- Migration: 20261119000000_knr_enterprises_schema.sql
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. ADMIN PROFILES TABLE
-- Stores authenticated administrators authorized to manage KNR Enterprises
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.admin_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL DEFAULT 'Depot Administrator',
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'manager')),
    avatar_url TEXT,
    phone TEXT DEFAULT '+91 8886175855',
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 2. CATEGORIES TABLE
-- Product categories with bilingual names, ordering, and active status
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    telugu_name TEXT NOT NULL DEFAULT '',
    description TEXT DEFAULT '',
    image TEXT DEFAULT '',
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 3. PRODUCTS TABLE
-- Wholesale & municipal product catalog with pricing, stock, specs, and status
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    telugu_name TEXT NOT NULL DEFAULT '',
    category_id TEXT REFERENCES public.categories(id) ON UPDATE CASCADE ON DELETE SET NULL,
    category TEXT NOT NULL,
    category_telugu TEXT NOT NULL DEFAULT '',
    sku TEXT,
    hsn_code TEXT NOT NULL DEFAULT '3808.91',
    price NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (price >= 0),
    original_price NUMERIC(12, 2) DEFAULT 0 CHECK (original_price >= 0),
    discount_percent INTEGER DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100),
    gst_percent NUMERIC(5, 2) DEFAULT 18.0 CHECK (gst_percent >= 0),
    unit TEXT NOT NULL DEFAULT 'unit',
    moq INTEGER NOT NULL DEFAULT 1 CHECK (moq >= 1),
    moq_description TEXT DEFAULT '1 Unit',
    stock_quantity INTEGER NOT NULL DEFAULT 100 CHECK (stock_quantity >= 0),
    low_stock_threshold INTEGER DEFAULT 10 CHECK (low_stock_threshold >= 0),
    in_stock BOOLEAN NOT NULL DEFAULT true,
    badge TEXT DEFAULT '',
    badge_color TEXT DEFAULT 'orange',
    image TEXT NOT NULL,
    rating NUMERIC(3, 2) DEFAULT 4.8 CHECK (rating >= 0 AND rating <= 5),
    review_count INTEGER DEFAULT 0 CHECK (review_count >= 0),
    specifications JSONB NOT NULL DEFAULT '[]'::jsonb,
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    certifications JSONB NOT NULL DEFAULT '[]'::jsonb,
    description TEXT NOT NULL DEFAULT '',
    description_telugu TEXT DEFAULT '',
    brand TEXT DEFAULT 'KNR Enterprises',
    is_featured BOOLEAN NOT NULL DEFAULT false,
    is_bestseller BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    view_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 4. PRODUCT IMAGES TABLE (Multi-image Gallery)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 5. INVENTORY LOGS TABLE
-- Tracks stock mutations, manual adjustments, audit receipts
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.inventory_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    previous_stock INTEGER NOT NULL,
    new_stock INTEGER NOT NULL,
    change_amount INTEGER NOT NULL,
    change_type TEXT NOT NULL CHECK (change_type IN ('manual_adjustment', 'shipment_received', 'damaged', 'audit_correction', 'initial_stock')),
    notes TEXT DEFAULT '',
    created_by TEXT DEFAULT 'Depot Admin',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 6. CUSTOMER ENQUIRIES / RFQ TABLE
-- Institutional RFQ enquiries from Gram Panchayats, Municipalities, Contractors
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.enquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enquiry_number TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    mobile_number TEXT NOT NULL,
    email TEXT DEFAULT '',
    organisation TEXT DEFAULT '',
    designation TEXT DEFAULT '',
    mandal TEXT DEFAULT '',
    district TEXT DEFAULT '',
    state TEXT NOT NULL DEFAULT 'Telangana',
    status TEXT NOT NULL DEFAULT 'New' CHECK (status IN ('New', 'Contacted', 'Quotation Sent', 'Approved', 'Rejected', 'Completed')),
    notes TEXT DEFAULT '',
    internal_notes TEXT DEFAULT '',
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
    estimated_gst NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    source TEXT NOT NULL DEFAULT 'website_rfq',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 7. ENQUIRY ITEMS TABLE
-- Line items associated with each RFQ enquiry
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.enquiry_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enquiry_id UUID NOT NULL REFERENCES public.enquiries(id) ON DELETE CASCADE,
    product_id TEXT,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity >= 1),
    unit TEXT NOT NULL DEFAULT 'unit',
    unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    hsn_code TEXT DEFAULT '',
    total_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 8. TESTIMONIALS TABLE
-- Customer reviews from Sarpanches, Municipal Inspectors, EPC Contractors
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.testimonials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    location TEXT NOT NULL,
    verified_badge TEXT DEFAULT 'Verified Official',
    quote TEXT NOT NULL,
    rating INTEGER NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
    avatar TEXT DEFAULT '',
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 9. FAQS TABLE
-- Knowledge base items with bilingual Telugu/English Q&A and tags
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.faqs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL,
    question TEXT NOT NULL,
    question_telugu TEXT DEFAULT '',
    answer TEXT NOT NULL,
    answer_telugu TEXT DEFAULT '',
    tags JSONB NOT NULL DEFAULT '[]'::jsonb,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 10. SERVICES TABLE
-- Logistics & procurement offerings with SLAs and features
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.services (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    telugu_title TEXT DEFAULT '',
    sla TEXT NOT NULL DEFAULT '24-48 Hr Statewide Dispatch',
    description TEXT NOT NULL,
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    icon TEXT DEFAULT 'Truck',
    color TEXT DEFAULT 'orange',
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 11. WEBSITE SETTINGS TABLE
-- Master configuration for branding, contact info, maintenance mode, GSTIN
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.website_settings (
    id TEXT PRIMARY KEY DEFAULT 'primary',
    website_name TEXT NOT NULL DEFAULT 'KNR Enterprises',
    tagline TEXT NOT NULL DEFAULT 'Municipal & Industrial Wholesale Supplies',
    logo_url TEXT DEFAULT '',
    favicon_url TEXT DEFAULT '',
    phone_primary TEXT NOT NULL DEFAULT '+91 8886175855',
    phone_secondary TEXT DEFAULT '+91 9640195798',
    whatsapp_number TEXT NOT NULL DEFAULT '+91 8886175855',
    official_email TEXT NOT NULL DEFAULT 'knrenterprises679@gmail.com',
    gstin TEXT NOT NULL DEFAULT '36CUHPK5939D1ZG',
    depot_address TEXT NOT NULL DEFAULT 'H.No: 1-77/6, Near HP Petrol Pump, Mdl & Vill Chevella, Ranga Reddy, Telangana 501503',
    operating_hours TEXT DEFAULT 'Mon - Sat: 8:30 AM - 7:30 PM',
    facebook_url TEXT DEFAULT 'https://facebook.com',
    instagram_url TEXT DEFAULT 'https://instagram.com',
    linkedin_url TEXT DEFAULT 'https://linkedin.com',
    youtube_url TEXT DEFAULT 'https://youtube.com',
    default_language TEXT NOT NULL DEFAULT 'en' CHECK (default_language IN ('en', 'te')),
    announcement_banner_enabled BOOLEAN NOT NULL DEFAULT false,
    announcement_banner_text TEXT DEFAULT '',
    maintenance_mode BOOLEAN NOT NULL DEFAULT false,
    maintenance_message TEXT DEFAULT 'We are currently performing scheduled system updates. For urgent wholesale orders, please call depot dispatch directly at +91 8886175855.',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 12. HOMEPAGE CONTENT TABLE
-- Editable hero banners, headings, stats, and section visibility toggles
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.homepage_content (
    id TEXT PRIMARY KEY DEFAULT 'primary',
    hero_heading TEXT NOT NULL DEFAULT 'KNR Enterprises',
    hero_subheading TEXT NOT NULL DEFAULT 'Quality Products. Trusted Partnership.',
    hero_description TEXT NOT NULL DEFAULT 'Your one-stop destination for premium industrial products with unmatched quality and service.',
    hero_badge TEXT DEFAULT 'Building Stronger Tomorrow',
    hero_banner_image TEXT DEFAULT '/hero-knr-products.jpg',
    stat_depot_orders TEXT NOT NULL DEFAULT '500+',
    stat_active_clients TEXT NOT NULL DEFAULT '100+',
    stat_product_lines TEXT NOT NULL DEFAULT '8+',
    stat_districts TEXT NOT NULL DEFAULT '33',
    show_hero BOOLEAN NOT NULL DEFAULT true,
    show_trust_strip BOOLEAN NOT NULL DEFAULT true,
    show_categories BOOLEAN NOT NULL DEFAULT true,
    show_featured_products BOOLEAN NOT NULL DEFAULT true,
    show_about_section BOOLEAN NOT NULL DEFAULT true,
    show_testimonials BOOLEAN NOT NULL DEFAULT true,
    show_faq_section BOOLEAN NOT NULL DEFAULT true,
    about_heading TEXT NOT NULL DEFAULT 'Building Trust Through Quality',
    about_description TEXT NOT NULL DEFAULT 'At KNR Enterprises, we are committed to deliver high-quality industrial products, innovative solutions and exceptional service to help your business grow.',
    about_image TEXT DEFAULT '/building-knr-hq.jpg',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- AUTOMATIC TIMESTAMPS TRIGGER FUNCTION
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
DO $$
BEGIN
    DROP TRIGGER IF EXISTS trigger_admin_profiles_updated ON public.admin_profiles;
    CREATE TRIGGER trigger_admin_profiles_updated BEFORE UPDATE ON public.admin_profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

    DROP TRIGGER IF EXISTS trigger_categories_updated ON public.categories;
    CREATE TRIGGER trigger_categories_updated BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

    DROP TRIGGER IF EXISTS trigger_products_updated ON public.products;
    CREATE TRIGGER trigger_products_updated BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

    DROP TRIGGER IF EXISTS trigger_enquiries_updated ON public.enquiries;
    CREATE TRIGGER trigger_enquiries_updated BEFORE UPDATE ON public.enquiries FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

    DROP TRIGGER IF EXISTS trigger_testimonials_updated ON public.testimonials;
    CREATE TRIGGER trigger_testimonials_updated BEFORE UPDATE ON public.testimonials FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

    DROP TRIGGER IF EXISTS trigger_faqs_updated ON public.faqs;
    CREATE TRIGGER trigger_faqs_updated BEFORE UPDATE ON public.faqs FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

    DROP TRIGGER IF EXISTS trigger_services_updated ON public.services;
    CREATE TRIGGER trigger_services_updated BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

    DROP TRIGGER IF EXISTS trigger_website_settings_updated ON public.website_settings;
    CREATE TRIGGER trigger_website_settings_updated BEFORE UPDATE ON public.website_settings FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

    DROP TRIGGER IF EXISTS trigger_homepage_content_updated ON public.homepage_content;
    CREATE TRIGGER trigger_homepage_content_updated BEFORE UPDATE ON public.homepage_content FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
END $$;

-- ==============================================================================
-- INDEXES FOR FAST FILTERING, SEARCH & SORTING
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_in_stock ON public.products(in_stock);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON public.products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_price ON public.products(price);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_enquiries_status ON public.enquiries(status);
CREATE INDEX IF NOT EXISTS idx_enquiries_created_at ON public.enquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_product ON public.inventory_logs(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_created_at ON public.inventory_logs(created_at DESC);

-- ==============================================================================
-- HELPER FUNCTION TO CHECK IF CURRENT CALLER IS AN AUTHORIZED ADMIN
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admin_profiles
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enquiry_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homepage_content ENABLE ROW LEVEL SECURITY;

-- 1. admin_profiles
DROP POLICY IF EXISTS "Admins can view their own profile" ON public.admin_profiles;
CREATE POLICY "Admins can view their own profile" ON public.admin_profiles
    FOR SELECT TO authenticated USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Admins can update their own profile" ON public.admin_profiles;
CREATE POLICY "Admins can update their own profile" ON public.admin_profiles
    FOR UPDATE TO authenticated USING (auth.uid() = id);

-- 2. categories (Public can read active categories, Admins can read all and modify)
DROP POLICY IF EXISTS "Public can view active categories" ON public.categories;
CREATE POLICY "Public can view active categories" ON public.categories
    FOR SELECT USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "Admins full access on categories" ON public.categories;
CREATE POLICY "Admins full access on categories" ON public.categories
    FOR ALL TO authenticated USING (public.is_admin());

-- 3. products (Public can read active products, Admins can read all and modify)
DROP POLICY IF EXISTS "Public can view active products" ON public.products;
CREATE POLICY "Public can view active products" ON public.products
    FOR SELECT USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "Admins full access on products" ON public.products;
CREATE POLICY "Admins full access on products" ON public.products
    FOR ALL TO authenticated USING (public.is_admin());

-- 4. product_images
DROP POLICY IF EXISTS "Public can view product images" ON public.product_images;
CREATE POLICY "Public can view product images" ON public.product_images
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins full access on product images" ON public.product_images;
CREATE POLICY "Admins full access on product images" ON public.product_images
    FOR ALL TO authenticated USING (public.is_admin());

-- 5. inventory_logs (Admins only)
DROP POLICY IF EXISTS "Admins can view inventory logs" ON public.inventory_logs;
CREATE POLICY "Admins can view inventory logs" ON public.inventory_logs
    FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can insert inventory logs" ON public.inventory_logs;
CREATE POLICY "Admins can insert inventory logs" ON public.inventory_logs
    FOR INSERT TO authenticated WITH CHECK (public.is_admin());

-- 6. enquiries (Public can insert RFQs, Admins can view/update/delete)
DROP POLICY IF EXISTS "Public can submit enquiries" ON public.enquiries;
CREATE POLICY "Public can submit enquiries" ON public.enquiries
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins full access on enquiries" ON public.enquiries;
CREATE POLICY "Admins full access on enquiries" ON public.enquiries
    FOR ALL TO authenticated USING (public.is_admin());

-- 7. enquiry_items (Public can insert items, Admins can view/update/delete)
DROP POLICY IF EXISTS "Public can insert enquiry items" ON public.enquiry_items;
CREATE POLICY "Public can insert enquiry items" ON public.enquiry_items
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins full access on enquiry items" ON public.enquiry_items;
CREATE POLICY "Admins full access on enquiry items" ON public.enquiry_items
    FOR ALL TO authenticated USING (public.is_admin());

-- 8. testimonials (Public can view active, Admins manage all)
DROP POLICY IF EXISTS "Public can view active testimonials" ON public.testimonials;
CREATE POLICY "Public can view active testimonials" ON public.testimonials
    FOR SELECT USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "Admins full access on testimonials" ON public.testimonials;
CREATE POLICY "Admins full access on testimonials" ON public.testimonials
    FOR ALL TO authenticated USING (public.is_admin());

-- 9. faqs (Public can view active, Admins manage all)
DROP POLICY IF EXISTS "Public can view active faqs" ON public.faqs;
CREATE POLICY "Public can view active faqs" ON public.faqs
    FOR SELECT USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "Admins full access on faqs" ON public.faqs;
CREATE POLICY "Admins full access on faqs" ON public.faqs
    FOR ALL TO authenticated USING (public.is_admin());

-- 10. services (Public can view active, Admins manage all)
DROP POLICY IF EXISTS "Public can view active services" ON public.services;
CREATE POLICY "Public can view active services" ON public.services
    FOR SELECT USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "Admins full access on services" ON public.services;
CREATE POLICY "Admins full access on services" ON public.services
    FOR ALL TO authenticated USING (public.is_admin());

-- 11. website_settings (Public can view settings, Admins can modify)
DROP POLICY IF EXISTS "Public can view website settings" ON public.website_settings;
CREATE POLICY "Public can view website settings" ON public.website_settings
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can update website settings" ON public.website_settings;
CREATE POLICY "Admins can update website settings" ON public.website_settings
    FOR ALL TO authenticated USING (public.is_admin());

-- 12. homepage_content (Public can view homepage content, Admins can modify)
DROP POLICY IF EXISTS "Public can view homepage content" ON public.homepage_content;
CREATE POLICY "Public can view homepage content" ON public.homepage_content
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can update homepage content" ON public.homepage_content;
CREATE POLICY "Admins can update homepage content" ON public.homepage_content
    FOR ALL TO authenticated USING (public.is_admin());

-- ==============================================================================
-- STORAGE BUCKETS SETUP
-- Product Images & Media Storage with Public Read + Admin Write
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('knr-products', 'knr-products', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']),
    ('knr-media', 'knr-media', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
DROP POLICY IF EXISTS "Public Access to Product Images" ON storage.objects;
CREATE POLICY "Public Access to Product Images" ON storage.objects
    FOR SELECT USING (bucket_id IN ('knr-products', 'knr-media'));

DROP POLICY IF EXISTS "Admins can upload images" ON storage.objects;
CREATE POLICY "Admins can upload images" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (bucket_id IN ('knr-products', 'knr-media') AND public.is_admin());

DROP POLICY IF EXISTS "Admins can update images" ON storage.objects;
CREATE POLICY "Admins can update images" ON storage.objects
    FOR UPDATE TO authenticated USING (bucket_id IN ('knr-products', 'knr-media') AND public.is_admin());

DROP POLICY IF EXISTS "Admins can delete images" ON storage.objects;
CREATE POLICY "Admins can delete images" ON storage.objects
    FOR DELETE TO authenticated USING (bucket_id IN ('knr-products', 'knr-media') AND public.is_admin());

