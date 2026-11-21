-- ============================================================================
-- KNR ENTERPRISES — PRODUCTION RLS SECURITY HARDENING
-- Migration: 20261121000000_secure_rls_policies.sql
-- ============================================================================

-- 1. Secure RFQ Notification Logs
-- Ensure guests cannot read or tamper with notification logs
DROP POLICY IF EXISTS "Allow public select on rfq_notification_logs" ON public.rfq_notification_logs;
DROP POLICY IF EXISTS "Allow public update on rfq_notification_logs" ON public.rfq_notification_logs;
DROP POLICY IF EXISTS "Admins can view notification logs" ON public.rfq_notification_logs;
DROP POLICY IF EXISTS "Admins can update notification logs" ON public.rfq_notification_logs;

CREATE POLICY "Admins can view notification logs" 
  ON public.rfq_notification_logs FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can update notification logs" 
  ON public.rfq_notification_logs FOR UPDATE TO authenticated USING (true);

-- 2. Secure RFQ Notification Settings
-- Ensure guests cannot read or alter admin email or WhatsApp phone numbers
DROP POLICY IF EXISTS "Allow public select on rfq_notification_settings" ON public.rfq_notification_settings;
DROP POLICY IF EXISTS "Allow public update on rfq_notification_settings" ON public.rfq_notification_settings;
DROP POLICY IF EXISTS "Allow public insert on rfq_notification_settings" ON public.rfq_notification_settings;
DROP POLICY IF EXISTS "Admins can view notification settings" ON public.rfq_notification_settings;
DROP POLICY IF EXISTS "Admins can update notification settings" ON public.rfq_notification_settings;
DROP POLICY IF EXISTS "Admins can insert notification settings" ON public.rfq_notification_settings;

CREATE POLICY "Admins can view notification settings" 
  ON public.rfq_notification_settings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can update notification settings" 
  ON public.rfq_notification_settings FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Admins can insert notification settings" 
  ON public.rfq_notification_settings FOR INSERT TO authenticated WITH CHECK (true);

-- 3. Secure Quotations
-- Ensure guests cannot browse or enumerate quotations
DROP POLICY IF EXISTS "Public can view valid quotation by quotation_number" ON public.quotations;

-- 4. Re-verify RLS is enabled on all sensitive tables
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enquiry_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.confirmed_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfq_notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfq_notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enquiry_status_history ENABLE ROW LEVEL SECURITY;

