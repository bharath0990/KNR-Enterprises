-- ==============================================================================
-- KNR ENTERPRISES — INITIAL ADMIN USER SETUP
-- Run this in Supabase SQL Editor to grant admin privileges to your user
-- ==============================================================================
-- Option A: If you created an account in Supabase Auth Dashboard (e.g. admin@knrenterprises.in):
-- Replace 'admin@knrenterprises.in' with your email address
INSERT INTO public.admin_profiles (id, email, full_name, role, phone)
SELECT id,
    email,
    'Managing Director (Admin)',
    'super_admin',
    '+91 8886175855'
FROM auth.users
WHERE email = 'anishreddy057@gmail.com' ON CONFLICT (id) DO
UPDATE
SET role = 'super_admin',
    full_name = EXCLUDED.full_name;
-- Verify admin profile
SELECT *
FROM public.admin_profiles;