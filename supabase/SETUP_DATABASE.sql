-- ==============================================================================
-- KNR ENTERPRISES — COMPLETE ALL-IN-ONE SUPABASE DATABASE SETUP
-- Project: KNR - Enterprises (wslxpaxwwmgbhpcandld)
-- Generated for direct execution in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/wslxpaxwwmgbhpcandld/sql/new
-- ==============================================================================

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



-- ==============================================================================
-- KNR ENTERPRISES — SEED INITIAL PRODUCTION DATA
-- Migration: 20261119000001_seed_initial_data.sql
-- ==============================================================================

-- 1. SEED CATEGORIES
INSERT INTO public.categories (id, name, telugu_name, description, image, display_order, is_active)
VALUES
    ('Disinfectants & Chemicals', 'Bleaching Powder & Lime', 'బ్లీచింగ్ & లైమ్ పౌడర్', 'Industrial 33% chlorine & 90% hydrated lime sacks', 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80', 1, true),
    ('Pest & Vector Control', 'Vector & Mosquito Control', 'దోమల & కీటకాల నియంత్రణ', 'Malathion 5% DP, pulse thermal foggers & larvicides', 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80', 2, true),
    ('Waste Management', 'Commercial Dust Bins', 'మున్సిపల్ చెత్త డబ్బాలు', '240L SBM wheeled bins & 100L twin segregation units', 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=600&auto=format&fit=crop&q=80', 3, true),
    ('Municipal Infrastructure', 'Civic LED Street Lights', 'ఎల్ఈడీ వీధి దీపాలు', '60W/120W IP66 die-cast fixtures with surge protectors', 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=600&auto=format&fit=crop&q=80', 4, true),
    ('Civic Landscaping', 'Green Mat Turf', 'ఆర్టిఫిషియల్ గడ్డి & పార్కులు', '35mm dense UV weather-resistant landscape turf', 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&auto=format&fit=crop&q=80', 5, true),
    ('Sanitization Tools', 'Sanitization Tools & PPE', 'పారిశుద్ధ్య టూల్స్ & PPE', 'Battery sprayers, road brooms, gumboots & safety gear', 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=600&auto=format&fit=crop&q=80', 6, true)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    telugu_name = EXCLUDED.telugu_name,
    description = EXCLUDED.description,
    image = EXCLUDED.image,
    display_order = EXCLUDED.display_order;

-- 2. SEED PRODUCTS
INSERT INTO public.products (
    id, name, telugu_name, category_id, category, category_telugu,
    sku, hsn_code, price, original_price, discount_percent, gst_percent,
    unit, moq, moq_description, stock_quantity, low_stock_threshold,
    in_stock, badge, badge_color, image, rating, review_count,
    specifications, features, certifications, description, description_telugu,
    brand, is_featured, is_bestseller, is_active, view_count
) VALUES
(
    'bleaching-powder-grade1',
    'Commercial Bleaching Powder Grade 1 (33% Chlorine)',
    'కమర్షియల్ బ్లీచింగ్ పౌడర్ గ్రేడ్ 1 (33% క్లోరిన్)',
    'Disinfectants & Chemicals',
    'Disinfectants & Chemicals',
    'క్రిమిసంహారకాలు & రసాయనాలు',
    'KNR-BLC-001',
    '2828.10.10',
    850,
    1150,
    26,
    18.0,
    'bag',
    5,
    '5 Bags (125 kg)',
    250,
    20,
    true,
    'Disinfectants/Bulk Stock',
    'orange',
    'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=80',
    4.8,
    64,
    '["33% Min Available Chlorine content", "ISI marked / Municipal grade quality", "Heavy-duty HDPE laminated outer bag", "Tested against pathogen vector reservoirs"]'::jsonb,
    '["Guaranteed 33%+ chlorine potency", "Factory sealed 25kg sacks", "High alkalinity water neutralization"]'::jsonb,
    '["ISI Marked", "ISO 9001:2015", "Govt Lab Assay Certified"]'::jsonb,
    'Industrial Grade 1 Bleaching Powder with guaranteed 33%+ chlorine potency. Specifically formulated for open drain sanitation, public wells, overhead reservoir tanks, and high-pathogen rural drainage.',
    'గ్రామ పంచాయతీల కొరకు 33% క్లోరిన్ కలిగిన గ్రేడ్ 1 బ్లీచింగ్ పౌడర్.',
    'KNR Enterprises',
    true,
    true,
    true,
    1420
),
(
    'hdpe-wheeled-garbage-bin-240l',
    'Heavy-Duty HDPE Wheeled Garbage Bin (240L SBM)',
    'హెవీ-డ్యూటీ వీల్డ్ చెత్త డబ్బా (240 లీటర్లు SBM)',
    'Waste Management',
    'Waste Management',
    'వ్యర్థాల నిర్వహణ',
    'KNR-BIN-240',
    '3923.10.90',
    2850,
    3600,
    21,
    18.0,
    'unit',
    4,
    '4 Units (Immediate Dispatch)',
    120,
    15,
    true,
    'Waste Mgmt | SBM Std',
    'green',
    'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=800&auto=format&fit=crop&q=80',
    4.8,
    78,
    '["240-Litre nominal volumetric capacity", "UV-stabilized 100% virgin HDPE plastic", "Solid rubber wheels with galvanized steel axle", "Swachh Bharat green/blue colorfast pigments"]'::jsonb,
    '["Tractor tipper compatible reinforced rim", "Corrosion-proof galvanized axle", "UV-stabilized virgin polymer"]'::jsonb,
    '["Swachh Bharat Mission Norms", "EN 840 Certified"]'::jsonb,
    'Heavy-duty 240-Litre outdoor mobile dustbin compliant with Swachh Bharat Mission (SBM) norms. Built with thick reinforced ribs to withstand tractor tipper lifting and rough gravel terrain.',
    'స్వచ్ఛ భారత్ నిబంధనలకు అనుగుణంగా తయారు చేయబడిన 240 లీటర్ల చెత్త డబ్బా.',
    'KNR Enterprises',
    true,
    true,
    true,
    980
),
(
    'malathion-5dp-insecticide',
    'Malathion 5% DP Vector Insecticide (Dusting Powder)',
    'మలాథియాన్ 5% డిపి దోమల నియంత్రణ రసాయనం',
    'Pest & Vector Control',
    'Pest & Vector Control',
    'కీటకాలు & దోమల నియంత్రణ',
    'KNR-MAL-005',
    '3808.91.99',
    1450,
    1850,
    21,
    18.0,
    'bag',
    2,
    '2 Bags (50 kg)',
    85,
    10,
    true,
    'Pest Control | CIB Reg',
    'blue',
    'https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?w=800&auto=format&fit=crop&q=80',
    4.9,
    53,
    '["CIB & RC approved formulation for public health", "5% active ingredient dusting powder", "Effective against Anopheles, Culex & Aedes vectors", "Supplied with batch certificate of analysis"]'::jsonb,
    '["Rapid mosquito knockdown", "Long residual action in stagnant water", "Telangana Health Dept approved"]'::jsonb,
    '["CIB & RC Registered", "NVBDCP Standard"]'::jsonb,
    'Central Insecticides Board (CIB) registered dusting powder for rural vector abatement, stagnant water treatment, and open sewage mosquito control. Standard issue for Telangana municipal drives.',
    'దోమల నివారణకు సిఐబి రిజిస్టర్డ్ 5% డిపి పౌడర్.',
    'KNR Enterprises',
    true,
    false,
    true,
    760
),
(
    'sanitation-worker-safety-kit',
    'Sanitation Worker Complete Safety Kit (PPE Pro)',
    'పారిశుద్ధ్య కార్మికుల పూర్తి భద్రతా కిట్ (PPE)',
    'Sanitization Tools',
    'Sanitization Tools',
    'పారిశుద్ధ్య పరికరాలు & PPE',
    'KNR-PPE-001',
    '6211.42.00',
    890,
    1200,
    25,
    18.0,
    'set',
    5,
    '5 Sets',
    150,
    20,
    true,
    'Safety PPE | ISI Gumboots',
    'yellow',
    'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=800&auto=format&fit=crop&q=80',
    4.9,
    57,
    '["ISI standard waterproof PVC gumboots with non-skid sole", "High-visibility neon reflective safety jacket", "Heavy-duty nitrile chemical & sludge gloves", "Dual-cartridge dust & organic vapor respirator mask"]'::jsonb,
    '["Complete head-to-toe protection", "Heavy chemical nitrile gloves", "Class 2 reflective jacket"]'::jsonb,
    '["ISI Certified Gumboots", "EN 388 Glove Standards"]'::jsonb,
    'Comprehensive occupational safety bundle for Gram Panchayat and Municipal corporation safai karmacharis. Meets national occupational safety norms for solid waste handling and drain de-silting.',
    'సఫాయి కార్మికుల పూర్తి భద్రతా కిట్ (గమ్‌బూట్లు, జాకెట్, మాస్క్, గ్లౌజులు).',
    'KNR Enterprises',
    true,
    false,
    true,
    620
),
(
    'heavy-thermal-fogging-machine',
    'Heavy Pulse-Jet Thermal Fogging Machine (Delta Fog)',
    'థర్మల్ ఫాగింగ్ మిషన్ (పల్స్-జెట్ డెల్టా ఫాగ్)',
    'Pest & Vector Control',
    'Pest & Vector Control',
    'కీటకాలు & దోమల నియంత్రణ',
    'KNR-FOG-SS304',
    '8424.89.90',
    26500,
    32000,
    17,
    18.0,
    'unit',
    1,
    '1 Unit (Ready in Depot)',
    25,
    5,
    true,
    'Pest Control | Govt Spec',
    'red',
    'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&auto=format&fit=crop&q=80',
    4.9,
    29,
    '["High-yield pulse-jet thermal resonator", "Dual fuel/chemical stainless steel tanks (6L)", "Aerosol droplet spectrum: 5 to 30 microns", "Electronic push-button instant battery ignition"]'::jsonb,
    '["Stainless steel grade 304 construction", "Instant push-button start", "Covers up to 10 acres per hour"]'::jsonb,
    '["CE Certified", "NVBDCP Specification Compliant"]'::jsonb,
    'High-output pulse-jet thermal fogger designed specifically for village-wide mosquito containment and dengue/chikungunya prevention. Operates reliably on petrol and diesel carrier mix.',
    'గ్రామాలలో దోమల నివారణకు స్టెయిన్‌లెస్ స్టీల్ పల్స్-జెట్ ఫాగింగ్ మిషన్.',
    'KNR Enterprises',
    true,
    true,
    true,
    890
),
(
    'mosquito-larvicide-temephos',
    'Mosquito Larvicide Granules & Liquid (Temephos 50% EC)',
    'దోమల లార్వా నియంత్రణ ద్రావకం (టెమెఫాస్ 50% EC)',
    'Pest & Vector Control',
    'Pest & Vector Control',
    'కీటకాలు & దోమల నియంత్రణ',
    'KNR-TEM-50EC',
    '3808.91.99',
    1850,
    2350,
    21,
    18.0,
    'can',
    2,
    '2 Cans (10L)',
    60,
    10,
    true,
    'Pest Control | NVBDCP Std',
    'blue',
    'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=800&auto=format&fit=crop&q=80',
    4.8,
    39,
    '["WHO and NVBDCP recognized organophosphate larvicide", "Safe for potable water reservoirs at labeled dosages", "Rapid kill of 3rd and 4th instar larvae within 24 hours", "100% active shelf life sealed aluminium container"]'::jsonb,
    '["Controls larvae within 24 hours", "Safe at regulated doses in water tanks"]'::jsonb,
    '["WHO Assayed", "NVBDCP Approved"]'::jsonb,
    'National Vector Borne Disease Control Programme standard larvicide. Interrupts mosquito breeding cycles in puddles, water storage sumps, septic soak pits, and agricultural tanks.',
    'నీటి తొట్టెలు, డ్రైనేజీలలో దోమల లార్వా నివారణ మందు.',
    'KNR Enterprises',
    false,
    false,
    true,
    440
),
(
    'civic-led-street-light-60w-120w',
    'Civic Smart LED Street Light (60W / 120W IP66)',
    'స్మార్ట్ ఎల్ఈడీ వీధి దీపాలు (60W / 120W IP66)',
    'Municipal Infrastructure',
    'Municipal Infrastructure',
    'మున్సిపల్ మౌలిక వసతులు',
    'KNR-LED-60W',
    '9405.40.90',
    2450,
    3200,
    23,
    18.0,
    'fixture',
    6,
    '6 Fixtures',
    80,
    12,
    true,
    'Infrastructure | IP66 Rating',
    'cyan',
    'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800&auto=format&fit=crop&q=80',
    4.8,
    45,
    '["High-pressure die-cast aluminum housing", "140 Lumens per Watt high-efficacy Osram/Philips chips", "10kV built-in lightning surge protection", "BIS certified & Telangana rural electrification compliant"]'::jsonb,
    '["10kV surge protection against thunder", "IP66 waterproof rating", "Die-cast aluminium housing with 2-yr warranty"]'::jsonb,
    '["BIS Certified (IS 10322)", "LM79/LM80 Test Reports"]'::jsonb,
    'Engineered for Gram Panchayat village roads and municipal colonies. Tested to withstand extreme summer temperatures up to 50°C and rural voltage spikes between 140V to 300V.',
    'గ్రామ పంచాయతీ వీధులకు 10kV సర్జ్ ప్రొటెక్షన్ కలిగిన ఎల్ఈడీ లైట్లు.',
    'KNR Enterprises',
    true,
    false,
    true,
    670
),
(
    'battery-backpack-sprayer-16l',
    'Professional Battery Backpack Sprayer (16L 12V)',
    'బ్యాటరీ స్ప్రేయర్ (16 లీటర్ల సామర్థ్యం 12V)',
    'Sanitization Tools',
    'Sanitization Tools',
    'పారిశుద్ధ్య పరికరాలు & PPE',
    'KNR-SPR-16L',
    '8424.41.00',
    2750,
    3400,
    19,
    18.0,
    'unit',
    2,
    '2 Units',
    45,
    8,
    true,
    'Sanitization | 12V Battery',
    'teal',
    'https://images.unsplash.com/photo-1592417817098-8f3d6910985b?w=800&auto=format&fit=crop&q=80',
    4.8,
    62,
    '["12V 12Ah heavy-duty sealed lead-acid/lithium battery", "Telescopic stainless steel lance with 4 interchangeable nozzles", "Chemical-resistant Viton seals and diaphragm pump", "Full battery charge covers up to 35-40 full tanks"]'::jsonb,
    '["Runs 35+ tanks per single charge", "Stainless steel lance with 4 nozzles", "Viton chemical seals"]'::jsonb,
    '["ISO 9001 Certified"]'::jsonb,
    'High-pressure electric backpack knapsack sprayer for chemical disinfectant spraying in schools, gram panchayat offices, primary health centers (PHC), and community drainage ditches.',
    '16 లీటర్ల సామర్థ్యం గల బ్యాటరీ ఆధారిత స్ప్రేయర్.',
    'KNR Enterprises',
    false,
    true,
    true,
    580
),
(
    'hydrated-lime-powder-50kg',
    'Hydrated Lime Powder (Drain Sanitation 50kg)',
    'హైడ్రేటెడ్ లైమ్ పౌడర్ (సున్నం 50 కిలోలు)',
    'Disinfectants & Chemicals',
    'Disinfectants & Chemicals',
    'క్రిమిసంహారకాలు & రసాయనాలు',
    'KNR-LME-050',
    '2522.20.00',
    620,
    780,
    20,
    18.0,
    'bag',
    10,
    '10 Bags (500 kg)',
    300,
    30,
    true,
    'Disinfectants | Bulk Stock',
    'orange',
    'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=800&auto=format&fit=crop&q=80',
    4.7,
    42,
    '["90%+ Calcium Hydroxide Ca(OH)2 concentration", "Super fine 300-mesh pulverization for instant slurry dispersion", "Moisture-resistant poly woven sack packaging", "Immediate alkalinity adjustment and odor neutralizer"]'::jsonb,
    '["90%+ purity calcium hydroxide", "300-mesh fine powder", "Neutralizes drain odor instantly"]'::jsonb,
    '["IS 712 Specification Compliant"]'::jsonb,
    'High-purity calcium hydroxide for neutralizing open sewer stench, soil sanitization, and roadside whitewashing during village festivals, government VIP visits, and monsoon cleaning drives.',
    'డ్రైనేజీల దుర్వాసన మరియు క్రిమి నివారణకు ఉపయోగించే లైమ్ పౌడర్.',
    'KNR Enterprises',
    false,
    false,
    true,
    510
),
(
    'heavy-steel-street-sweeping-broom',
    'Heavy Steel Street Sweeping Broom & Scraper',
    'రోడ్ల క్లీనింగ్ స్టీల్ బ్రూమ్ & స్క్రాపర్',
    'Sanitization Tools',
    'Sanitization Tools',
    'పారిశుద్ధ్య పరికరాలు & PPE',
    'KNR-BRM-001',
    '9603.90.00',
    380,
    490,
    22,
    18.0,
    'broom',
    10,
    '10 Brooms Bundle',
    180,
    25,
    true,
    'Sanitization | Durable GI',
    'amber',
    'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=800&auto=format&fit=crop&q=80',
    4.6,
    48,
    '["Reinforced high-tensile galvanized flat steel bristles", "Solid heavy-gauge welded steel scraper head", "Ergonomic threaded socket for 5ft wooden/pipe handle", "Built for asphalt mud crusts, de-silting, and gravel sweeping"]'::jsonb,
    '["Galvanized flat steel bristles", "Hardened scraper front plate", "5ft handle socket"]'::jsonb,
    '["Municipal Sanitation Spec"]'::jsonb,
    'Tough road-sweeping broom designed for municipal sanitary workers. Removes hardened mud crusts, silt, and heavy construction debris without bending or bristle loss.',
    'మున్సిపల్ రోడ్ల క్లీనింగ్ కొరకు ప్రత్యేక స్టీల్ బ్రూమ్.',
    'KNR Enterprises',
    false,
    false,
    true,
    390
),
(
    'twin-wet-dry-community-dustbin',
    'Twin Wet & Dry Community Dustbin (100L x 2)',
    'ద్విముఖ తడి మరియు పొడి చెత్త డబ్బాలు (100L x 2)',
    'Waste Management',
    'Waste Management',
    'వ్యర్థాల నిర్వహణ',
    'KNR-TWN-100',
    '3923.10.90',
    6400,
    7900,
    19,
    18.0,
    'set',
    2,
    '2 Twin Sets',
    40,
    6,
    true,
    'Waste Mgmt | Segregation',
    'green',
    'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800&auto=format&fit=crop&q=80',
    4.8,
    37,
    '["Dual 100-Litre bins (Green: Biodegradable, Blue: Non-Biodegradable)", "Heavy powder-coated GI frame stand with base mounting brackets", "Swing-top swivel hood lids to prevent rain ingress", "Screen-printed Swachh Bharat & Segregation bilingual logos"]'::jsonb,
    '["Dual 100L green and blue segregation", "Heavy duty powder-coated GI stand", "Swivel hood against rain ingress"]'::jsonb,
    '["Swachh Bharat Norms Compliant"]'::jsonb,
    'Post-mounted dual waste segregation unit ideal for village bus stops, gram panchayat bhavans, PHC clinics, and weekly shandies (santalu) across rural Telangana.',
    'తడి మరియు పొడి చెత్త వేరుచేసే ద్విముఖ మున్సిపల్ డబ్బాలు.',
    'KNR Enterprises',
    true,
    false,
    true,
    430
),
(
    'high-density-artificial-turf-35mm',
    'High-Density Artificial Green Turf (35mm UV)',
    'ఆర్టిఫిషియల్ గ్రీన్ టర్ఫ్ (35మి.మీ UV ప్రొటెక్టెడ్)',
    'Civic Landscaping',
    'Civic Landscaping',
    'పౌర పచ్చదనం & పార్కులు',
    'KNR-TRF-35MM',
    '5703.30.00',
    48,
    65,
    26,
    18.0,
    'sq.ft',
    500,
    '500 Sq.Ft Roll',
    15000,
    1000,
    true,
    'Landscaping | 35mm Dense',
    'emerald',
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop&q=80',
    4.7,
    31,
    '["35mm four-tone natural look virgin polymer yarns", "Triple-layer latex backing with water drainage perforations", "UV-stabilized to withstand intense 45°C Deccan summers", "5-Year outdoor warranty against bald spots or color fading"]'::jsonb,
    '["35mm four-tone virgin polymer", "Triple latex perforated backing", "UV tested up to 50°C"]'::jsonb,
    '["UV 5000h Weather Resistance Certified"]'::jsonb,
    'Contractor-grade artificial landscape grass for municipal parks, roundabouts, gram panchayat open auditoriums, government school playgrounds, and township medians.',
    'మున్సిపల్ పార్కులు మరియు పాఠశాలలకు 35మి.మీ గ్రీన్ టర్ఫ్.',
    'KNR Enterprises',
    false,
    false,
    true,
    520
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    telugu_name = EXCLUDED.telugu_name,
    category = EXCLUDED.category,
    price = EXCLUDED.price,
    original_price = EXCLUDED.original_price,
    unit = EXCLUDED.unit,
    moq = EXCLUDED.moq,
    hsn_code = EXCLUDED.hsn_code,
    in_stock = EXCLUDED.in_stock,
    stock_quantity = EXCLUDED.stock_quantity,
    image = EXCLUDED.image,
    specifications = EXCLUDED.specifications,
    description = EXCLUDED.description;

-- 3. SEED TESTIMONIALS
INSERT INTO public.testimonials (name, role, location, verified_badge, quote, rating, avatar, display_order, is_active)
VALUES
(
    'M. Ramachandra Rao',
    'Sarpanch, Chevella Gram Panchayat',
    'Ranga Reddy District',
    'Verified Sarpanch',
    'KNR Enterprises has been our primary supplier for Swachh Bharat bleaching powder and 240L dustbins for over 3 years. Their 24-hour depot dispatch to our mandal during monsoon sanitation drives was flawless. Proper GST proforma made our panchayat audit effortless.',
    5,
    'MR',
    1,
    true
),
(
    'Dr. K. Srinivasulu',
    'Sanitary Inspector, Vikarabad Municipality',
    'Vikarabad Urban Dept',
    'Verified Municipality',
    'We procured commercial Delta thermal fogging machines and Malathion 5% DP for vector control across 12 municipal wards. The machine build quality (SS304) is exceptional and their team provided on-site operator training on delivery.',
    5,
    'KS',
    2,
    true
),
(
    'N. Sudhakar Reddy',
    'Project Director, Sri Sai Infra & Civil Works',
    'EPC Infrastructure Partner',
    'Verified Contractor',
    'As an EPC contractor executing urban civic illumination, sourcing 120W IP66 die-cast LED streetlights with 10kV surge protection at wholesale depot rates with instant GST invoices has given us a major advantage in municipal tenders.',
    5,
    'NS',
    3,
    true
);

-- 4. SEED FAQS
INSERT INTO public.faqs (category, question, question_telugu, answer, answer_telugu, tags, display_order, is_active)
VALUES
(
    'Bulk Orders & MOQ',
    'Do you supply in bulk for Gram Panchayats and Municipal Corporations?',
    'మీరు గ్రామ పంచాయతీలు మరియు మున్సిపాలిటీలకు హోల్‌సేల్‌గా సరఫరా చేస్తారా?',
    'Yes, absolutely. KNR Enterprises specializes in institutional, bulk, and depot-level supplies. We cater to Gram Panchayats, Municipal Councils (GHMC, HMDA peripheries), Townships, and EPC civil contractors with full truckload (FTL) and less-than-truckload (LTL) deliveries across all 33 Telangana districts.',
    'అవును, మేము తెలంగాణలోని అన్ని 33 జిల్లాల గ్రామ పంచాయతీలు మరియు మున్సిపాలిటీలకు బల్క్ మరియు డిపో స్థాయి సప్లైలను అందిస్తాము.',
    '["33 Districts Covered", "Panchayats & Municipalities"]'::jsonb,
    1,
    true
),
(
    'Tenders & Billing',
    'Do you provide official GST invoices for government audit compliance?',
    'ప్రభుత్వ ఆడిట్ నిబంధనల ప్రకారం అధికారిక GST ఇన్వాయిస్ అందిస్తారా?',
    'Yes. Every consignment is invoiced under GSTIN 36CUHPK5939D1ZG with correct HSN classification (e.g., 2828.10.10 for bleaching, 3923.10.90 for bins, 9405.40.90 for street lights). We provide formal GST-3B proforma invoices suitable for treasury token releases, Mandal Development Officer (MDO) sanction, and Gram Panchayat bank withdrawals.',
    'ఖచ్చితంగా. ప్రతి ఆర్డర్‌కు జీఎస్టీ 36CUHPK5939D1ZG మరియు సరైన HSN కోడ్‌తో కూడిన అధికారిక GST-3B ప్రొఫార్మా ఇన్వాయిస్ అందిస్తాము.',
    '["GST-3B Compliant", "MDO / Audit Approved"]'::jsonb,
    2,
    true
),
(
    'Delivery & Logistics',
    'Which areas do you deliver to and what are the transit timelines?',
    'మీరు ఏ ప్రాంతాలకు డెలివరీ చేస్తారు? డెలివరీ సమయం ఎంత?',
    'We deliver directly across all 33 districts of Telangana. For Ranga Reddy, Vikarabad, and Hyderabad HMDA peripheries, dispatches reach destinations in under 4 hours. For other districts (Nizamabad, Warangal, Khammam, Mahabubnagar, Adilabad, etc.), standard road delivery takes 24 to 48 hours.',
    'తెలంగాణలోని అన్ని 33 జిల్లాలకు డెలివరీ కలదు. రంగారెడ్డి, వికారాబాద్ జిల్లాలకు 4 గంటల్లో, ఇతర జిల్లాలకు 24-48 గంటల్లో డెలివరీ పూర్తవుతుంది.',
    '["Same-Day Local", "24-48h Statewide"]'::jsonb,
    3,
    true
),
(
    'Payments & Support',
    'What payment methods and credit terms are accepted for institutional orders?',
    'ప్రభుత్వ ఆర్డర్లకు ఎలాంటి చెల్లింపు పద్ధతులు అందుబాటులో ఉన్నాయి?',
    'We accept RTGS / NEFT, Panchayat Cheques, Treasury Challans, UPI, and authorized e-Procurement purchase orders. For verified regular Gram Panchayats and registered municipal vendors, standard delivery against token/MDO sanctioned sanction orders is facilitated.',
    'మేము RTGS / NEFT, పంచాయతీ చెక్కులు, ట్రెజరీ చలాన్లు మరియు UPI చెల్లింపులను స్వీకరిస్తాము.',
    '["NEFT / RTGS", "Gram Panchayat Cheque", "Treasury Challan"]'::jsonb,
    4,
    true
);

-- 5. SEED SERVICES
INSERT INTO public.services (id, title, telugu_title, sla, description, features, icon, color, display_order, is_active)
VALUES
(
    'swachh-bharat',
    'Gram Panchayat Swachh Bharat Bulk Fulfillment',
    'గ్రామ పంచాయతీ స్వచ్ఛ భారత్ బల్క్ సరఫరా',
    '24-48 Hr Statewide Dispatch',
    'Dedicated supply pipeline for village sanitation drives, public health drains, and Swachh Telangana initiatives. We furnish tested Grade 1 bleaching powder (33% Cl), hydrated lime, and 240L SBM wheeled waste bins directly to Mandal headquarters and Gram Panchayat bhavans.',
    '["Guaranteed minimum 33% available chlorine in factory-sealed bags", "Direct tractor/pickup truck unloading assistance", "Formal MDO & Panchayat Secretary sanction paperwork", "Bulk wholesale slab discounts on seasonal monsoon orders"]'::jsonb,
    'Truck',
    'orange',
    1,
    true
),
(
    'vector-epidemic-response',
    'Emergency Vector & Epidemic Response Supplies',
    'అత్యవసర సీజనల్ వ్యాధుల నియంత్రణ సామాగ్రి',
    '4-Hour Local Emergency Dispatch',
    'Rapid chemical and machinery deployment to curb seasonal malaria, dengue, and chikungunya outbreaks. We maintain ready-in-stock thermal pulse-jet fogging machines, Malathion 5% DP, and Temephos larvicides at our Chevella central highway yard for immediate dispatch.',
    '["On-call Sunday and emergency weekend dispatch service", "Pre-calibrated pulse-jet machines with on-site operator training", "Safe drinking water approved WHO/NVBDCP larvicides", "Immediate batch test certificate of analysis furnished"]'::jsonb,
    'ShieldAlert',
    'red',
    2,
    true
),
(
    'civic-illumination',
    'Civic Infrastructure & Public Illumination',
    'మున్సిపల్ మౌలిక వసతులు & వీధి దీపాలు',
    'BIS Certified / 2-Year Warranty',
    'Wholesale lighting and municipal civil works supply for Gram Panchayats, gated communities, and highway townships. High-efficacy IP66 die-cast LED streetlights with 10kV surge protection engineered specifically for high-voltage rural fluctuation environments.',
    '["High efficacy Osram/Philips LED chips delivering 140 lm/W", "High pressure die-cast aluminium housing with IP66 seal", "Pre-wired for rapid standard pole clamp installation", "Full replacement warranty support from Chevella hub"]'::jsonb,
    'Zap',
    'cyan',
    3,
    true
),
(
    'eprocurement-support',
    'e-Procurement & Audit Documentation Support',
    'ఈ-ప్రొక్యూర్మెంట్ & ఆడిట్ డాక్యుమెంటేషన్',
    '15-Minute Proforma Turnaround',
    'We assist Sarpanches, Panchayat Secretaries, and Civil Contractors with complete statutory tender packs. From instant GST-3B compliant proforma invoices to laboratory chemical assay certificates, we ensure 100% audit-cleared procurement records.',
    '["Instant PDF proforma estimate with HSN codes & tax breakdown", "Full vendor pack: GSTIN, PAN, Bank Details & Trade License", "Assay lab test certificates for chlorine potency & polymer density", "Treasury token and MDO approval format compatibility"]'::jsonb,
    'FileCheck2',
    'emerald',
    4,
    true
)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    telugu_title = EXCLUDED.telugu_title,
    sla = EXCLUDED.sla,
    description = EXCLUDED.description,
    features = EXCLUDED.features;

-- 6. SEED WEBSITE SETTINGS
INSERT INTO public.website_settings (
    id, website_name, tagline, logo_url, favicon_url,
    phone_primary, phone_secondary, whatsapp_number, official_email,
    gstin, depot_address, operating_hours,
    facebook_url, instagram_url, linkedin_url, youtube_url,
    default_language, announcement_banner_enabled, announcement_banner_text,
    maintenance_mode, maintenance_message
) VALUES (
    'primary',
    'KNR Enterprises',
    'Municipal & Industrial Wholesale Supplies',
    '/logo.png',
    '/favicon.ico',
    '+91 8886175855',
    '+91 9640195798',
    '+91 8886175855',
    'knrenterprises679@gmail.com',
    '36CUHPK5939D1ZG',
    'H.No: 1-77/6, Near HP Petrol Pump, Mdl & Vill Chevella, Ranga Reddy, Telangana 501503',
    'Mon - Sat: 8:30 AM - 7:30 PM (Sunday Emergency Dispatch Available)',
    'https://facebook.com',
    'https://instagram.com',
    'https://linkedin.com',
    'https://youtube.com',
    'en',
    true,
    'Monsoon Sanitation & Vector Control Supplies in Stock at Chevella Depot. Same-Day Highway Dispatch across Telangana.',
    false,
    'We are currently performing scheduled maintenance. For urgent orders, please call K. Narendar Reddy (+91 8886175855) or G. Siva (+91 9640195798).'
) ON CONFLICT (id) DO NOTHING;

-- 7. SEED HOMEPAGE CONTENT
INSERT INTO public.homepage_content (
    id, hero_heading, hero_subheading, hero_description,
    hero_badge, hero_banner_image,
    stat_depot_orders, stat_active_clients, stat_product_lines, stat_districts,
    show_hero, show_trust_strip, show_categories, show_featured_products,
    show_about_section, show_testimonials, show_faq_section,
    about_heading, about_description, about_image
) VALUES (
    'primary',
    'KNR Enterprises',
    'Quality Products. Trusted Partnership.',
    'Your one-stop destination for premium industrial products with unmatched quality and service.',
    'Building Stronger Tomorrow',
    '/hero-knr-products.jpg',
    '500+',
    '100+',
    '8+',
    '33',
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    'Building Trust Through Quality',
    'At KNR Enterprises, we are committed to deliver high-quality industrial products, innovative solutions and exceptional service to help your business grow.',
    '/building-knr-hq.jpg'
) ON CONFLICT (id) DO NOTHING;

-- 8. SEED INITIAL INVENTORY LOGS
INSERT INTO public.inventory_logs (product_id, previous_stock, new_stock, change_amount, change_type, notes, created_by)
VALUES
    ('bleaching-powder-grade1', 0, 250, 250, 'initial_stock', 'Initial depot stock count', 'System'),
    ('hdpe-wheeled-garbage-bin-240l', 0, 120, 120, 'initial_stock', 'Swachh Bharat truckload delivery received', 'System'),
    ('malathion-5dp-insecticide', 0, 85, 85, 'initial_stock', 'CIB registered batch assay received', 'System'),
    ('heavy-thermal-fogging-machine', 0, 25, 25, 'initial_stock', 'Pulse-jet SS304 units ready in warehouse', 'System');




-- ==============================================================================
-- 3. BOOTSTRAP ACTIVE ADMINISTRATORS
-- Linked directly to provisioned Supabase Auth user accounts
-- ==============================================================================
INSERT INTO public.admin_profiles (id, full_name, email, role, phone, is_active)
VALUES
    ('6dc1bd4f-ca4d-4652-8884-6c6fbbb339d2', 'Anish Reddy', 'anishreddy057@gmail.com', 'admin', '+91 8886175855', true),
    ('4ff69da0-8fe2-493b-85af-2e5d3496d92d', 'KNR Administrator', 'admin@knrenterprises.com', 'admin', '+91 8886175855', true),
    ('4dabc80b-c992-493c-80ff-067f29cd81ca', 'K. Narendar Reddy', 'knrenterprises679@gmail.com', 'admin', '+91 8886175855', true)
ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    is_active = true,
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email;

-- Catch-all dynamic linkage for any authenticated admin by email
INSERT INTO public.admin_profiles (id, full_name, email, role, phone, is_active)
SELECT 
    id, 
    COALESCE(raw_user_meta_data->>'full_name', 'Anish Reddy'), 
    email, 
    'admin', 
    '+91 8886175855', 
    true
FROM auth.users
WHERE email = 'anishreddy057@gmail.com'
ON CONFLICT (id) DO UPDATE SET 
    role = 'admin', 
    is_active = true;

-- ==============================================================================
-- 9. ENABLE SUPABASE REALTIME PUBLICATION
-- Enables Postgres Changes subscriptions for all relevant business tables
-- ==============================================================================
DO $$
BEGIN
    -- Ensure publication exists
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;

    -- Add tables to realtime publication if not already added
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

    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'inventory_logs') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory_logs;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'website_settings') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.website_settings;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'homepage_content') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.homepage_content;
    END IF;
END $$;

-- ==============================================================================
-- 10. WHOLESALE RFQ & QUOTATION SYSTEM MIGRATION
-- ==============================================================================
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

CREATE TABLE IF NOT EXISTS public.enquiry_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enquiry_id UUID NOT NULL REFERENCES public.enquiries(id) ON DELETE CASCADE,
    previous_status TEXT,
    new_status TEXT NOT NULL,
    notes TEXT DEFAULT '',
    updated_by TEXT DEFAULT 'Administrator',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

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

CREATE INDEX IF NOT EXISTS idx_quotations_enquiry_id ON public.quotations(enquiry_id);
CREATE INDEX IF NOT EXISTS idx_quotation_items_quotation_id ON public.quotation_items(quotation_id);
CREATE INDEX IF NOT EXISTS idx_enquiry_history_enquiry_id ON public.enquiry_status_history(enquiry_id);
CREATE INDEX IF NOT EXISTS idx_communication_logs_enquiry_id ON public.communication_logs(enquiry_id);
CREATE INDEX IF NOT EXISTS idx_confirmed_orders_quotation_id ON public.confirmed_orders(quotation_id);

ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enquiry_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.confirmed_orders ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins have full access to quotations') THEN
        CREATE POLICY "Admins have full access to quotations" ON public.quotations FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins have full access to quotation items') THEN
        CREATE POLICY "Admins have full access to quotation items" ON public.quotation_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins have full access to enquiry status history') THEN
        CREATE POLICY "Admins have full access to enquiry status history" ON public.enquiry_status_history FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins have full access to communication logs') THEN
        CREATE POLICY "Admins have full access to communication logs" ON public.communication_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins have full access to confirmed orders') THEN
        CREATE POLICY "Admins have full access to confirmed orders" ON public.confirmed_orders FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
END $$;

-- ============================================================================
-- 11. RFQ NOTIFICATION CONFIGURATION & MULTI-CHANNEL LOGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.rfq_notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_email TEXT NOT NULL DEFAULT 'knrenterprises679@gmail.com',
  whatsapp_recipient_1 VARCHAR(20) NOT NULL DEFAULT '+918886175855',
  whatsapp_recipient_2 VARCHAR(20) NOT NULL DEFAULT '+919666469679',
  email_integration_status VARCHAR(50) NOT NULL DEFAULT 'Active (Secure Gateway)',
  whatsapp_integration_status VARCHAR(50) NOT NULL DEFAULT 'Active (WhatsApp Cloud API)',
  notify_on_new_rfq BOOLEAN NOT NULL DEFAULT true,
  notify_on_quotation_created BOOLEAN NOT NULL DEFAULT true,
  notify_on_order_confirmed BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.rfq_notification_settings (
  admin_email,
  whatsapp_recipient_1,
  whatsapp_recipient_2,
  email_integration_status,
  whatsapp_integration_status,
  notify_on_new_rfq,
  notify_on_quotation_created,
  notify_on_order_confirmed
)
SELECT
  'knrenterprises679@gmail.com',
  '+918886175855',
  '+919666469679',
  'Active (Secure Gateway)',
  'Active (WhatsApp Cloud API)',
  true,
  true,
  true
WHERE NOT EXISTS (SELECT 1 FROM public.rfq_notification_settings);

CREATE TABLE IF NOT EXISTS public.rfq_notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enquiry_id UUID REFERENCES public.enquiries(id) ON DELETE CASCADE,
  enquiry_number VARCHAR(50) NOT NULL,
  channel VARCHAR(20) NOT NULL CHECK (channel IN ('email', 'whatsapp')),
  recipient TEXT NOT NULL,
  recipient_label VARCHAR(50) NOT NULL,
  subject TEXT,
  content TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed', 'simulated_sent', 'pending_retry')),
  error_message TEXT,
  retry_count INT NOT NULL DEFAULT 0,
  last_attempt_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rfq_notif_logs_enquiry_id ON public.rfq_notification_logs(enquiry_id);
CREATE INDEX IF NOT EXISTS idx_rfq_notif_logs_enquiry_num ON public.rfq_notification_logs(enquiry_number);
CREATE INDEX IF NOT EXISTS idx_rfq_notif_logs_status ON public.rfq_notification_logs(status);
CREATE INDEX IF NOT EXISTS idx_rfq_notif_logs_channel ON public.rfq_notification_logs(channel);

ALTER TABLE public.rfq_notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfq_notification_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins have full access to notification settings') THEN
        CREATE POLICY "Admins have full access to notification settings" ON public.rfq_notification_settings FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins have full access to notification logs') THEN
        CREATE POLICY "Admins have full access to notification logs" ON public.rfq_notification_logs FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- ==============================================================================
-- 20. RECYCLE BIN & 30-DAY SOFT DELETION SYSTEM
-- ==============================================================================
ALTER TABLE public.enquiries 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS deleted_by TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS deletion_reason TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS restored_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS restored_by TEXT DEFAULT NULL;

ALTER TABLE public.confirmed_orders 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS deleted_by TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS deletion_reason TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS restored_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS restored_by TEXT DEFAULT NULL;

ALTER TABLE public.quotations 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS deleted_by TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS deletion_reason TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS restored_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS restored_by TEXT DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_enquiries_deleted_at ON public.enquiries(deleted_at);
CREATE INDEX IF NOT EXISTS idx_confirmed_orders_deleted_at ON public.confirmed_orders(deleted_at);
CREATE INDEX IF NOT EXISTS idx_quotations_deleted_at ON public.quotations(deleted_at);

CREATE OR REPLACE FUNCTION public.cleanup_expired_recycle_bin()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_enquiries_count INT := 0;
    deleted_orders_count INT := 0;
    deleted_quotations_count INT := 0;
    cutoff_time TIMESTAMPTZ := NOW() - INTERVAL '30 days';
BEGIN
    DELETE FROM public.enquiry_items
    WHERE enquiry_id IN (
        SELECT id FROM public.enquiries WHERE deleted_at IS NOT NULL AND deleted_at < cutoff_time
    );

    DELETE FROM public.enquiry_status_history
    WHERE enquiry_id IN (
        SELECT id FROM public.enquiries WHERE deleted_at IS NOT NULL AND deleted_at < cutoff_time
    );

    DELETE FROM public.communication_logs
    WHERE enquiry_id IN (
        SELECT id FROM public.enquiries WHERE deleted_at IS NOT NULL AND deleted_at < cutoff_time
    );

    WITH del_orders AS (
        DELETE FROM public.confirmed_orders
        WHERE deleted_at IS NOT NULL AND deleted_at < cutoff_time
        RETURNING id
    )
    SELECT COUNT(*) INTO deleted_orders_count FROM del_orders;

    DELETE FROM public.quotation_items
    WHERE quotation_id IN (
        SELECT id FROM public.quotations WHERE deleted_at IS NOT NULL AND deleted_at < cutoff_time
    );

    WITH del_quots AS (
        DELETE FROM public.quotations
        WHERE deleted_at IS NOT NULL AND deleted_at < cutoff_time
        RETURNING id
    )
    SELECT COUNT(*) INTO deleted_quotations_count FROM del_quots;

    WITH del_enqs AS (
        DELETE FROM public.enquiries
        WHERE deleted_at IS NOT NULL AND deleted_at < cutoff_time
        RETURNING id
    )
    SELECT COUNT(*) INTO deleted_enquiries_count FROM del_enqs;

    RETURN jsonb_build_object(
        'success', true,
        'cutoff_time', cutoff_time,
        'deleted_enquiries', deleted_enquiries_count,
        'deleted_orders', deleted_orders_count,
        'deleted_quotations', deleted_quotations_count
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.cleanup_expired_recycle_bin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_recycle_bin() TO service_role;





