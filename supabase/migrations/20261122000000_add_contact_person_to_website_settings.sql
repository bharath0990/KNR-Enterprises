-- ==============================================================================
-- KNR ENTERPRISES — ADD CONTACT PERSON ATTRIBUTES TO WEBSITE_SETTINGS
-- Adds contact person name, mobile, whatsapp, display status and order
-- ==============================================================================

ALTER TABLE IF EXISTS public.website_settings
ADD COLUMN IF NOT EXISTS contact_person_name TEXT DEFAULT 'Harivardhan Reddy',
ADD COLUMN IF NOT EXISTS contact_person_phone TEXT DEFAULT '+91 9666469679',
ADD COLUMN IF NOT EXISTS contact_person_whatsapp TEXT DEFAULT '+91 9666469679',
ADD COLUMN IF NOT EXISTS show_contact_person BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS contact_person_order INT DEFAULT 1;

-- Ensure primary record has default values populated
UPDATE public.website_settings
SET
    contact_person_name = COALESCE(contact_person_name, 'Harivardhan Reddy'),
    contact_person_phone = COALESCE(contact_person_phone, '+91 9666469679'),
    contact_person_whatsapp = COALESCE(contact_person_whatsapp, '+91 9666469679'),
    show_contact_person = COALESCE(show_contact_person, true),
    contact_person_order = COALESCE(contact_person_order, 1)
WHERE id = 'primary';
