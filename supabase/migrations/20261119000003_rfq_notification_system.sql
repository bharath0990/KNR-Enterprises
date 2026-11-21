-- ============================================================================
-- KNR ENTERPRISES — RFQ NOTIFICATION CONFIGURATION & LOGS MIGRATION
-- Migration: 20261119000003_rfq_notification_system.sql
-- ============================================================================

-- 1. Notification Settings Table
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

-- Seed initial configuration row if empty
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

-- 2. RFQ Notification Logs Table (Stores independent delivery results)
CREATE TABLE IF NOT EXISTS public.rfq_notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enquiry_id UUID REFERENCES public.enquiries(id) ON DELETE CASCADE,
  enquiry_number VARCHAR(50) NOT NULL,
  channel VARCHAR(20) NOT NULL CHECK (channel IN ('email', 'whatsapp')),
  recipient TEXT NOT NULL,
  recipient_label VARCHAR(50) NOT NULL, -- e.g. 'Admin Email', 'WhatsApp Recipient 1 (+918886175855)', 'WhatsApp Recipient 2 (+919666469679)'
  subject TEXT,
  content TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed', 'simulated_sent', 'pending_retry')),
  error_message TEXT,
  retry_count INT NOT NULL DEFAULT 0,
  last_attempt_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_rfq_notif_logs_enquiry_id ON public.rfq_notification_logs(enquiry_id);
CREATE INDEX IF NOT EXISTS idx_rfq_notif_logs_enquiry_num ON public.rfq_notification_logs(enquiry_number);
CREATE INDEX IF NOT EXISTS idx_rfq_notif_logs_status ON public.rfq_notification_logs(status);
CREATE INDEX IF NOT EXISTS idx_rfq_notif_logs_channel ON public.rfq_notification_logs(channel);

-- Enable Row Level Security (RLS)
ALTER TABLE public.rfq_notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfq_notification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public select on rfq_notification_settings" 
  ON public.rfq_notification_settings FOR SELECT USING (true);
CREATE POLICY "Allow public update on rfq_notification_settings" 
  ON public.rfq_notification_settings FOR UPDATE USING (true);
CREATE POLICY "Allow public insert on rfq_notification_settings" 
  ON public.rfq_notification_settings FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public select on rfq_notification_logs" 
  ON public.rfq_notification_logs FOR SELECT USING (true);
CREATE POLICY "Allow public insert on rfq_notification_logs" 
  ON public.rfq_notification_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on rfq_notification_logs" 
  ON public.rfq_notification_logs FOR UPDATE USING (true);

-- Enable Realtime for notifications
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'rfq_notification_logs') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.rfq_notification_logs;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'rfq_notification_settings') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.rfq_notification_settings;
  END IF;
END $$;

