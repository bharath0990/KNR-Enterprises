-- ==============================================================================
-- KNR ENTERPRISES — RECYCLE BIN & 30-DAY SOFT DELETION SYSTEM
-- Migration: 20261122000000_recycle_bin_and_soft_delete.sql
-- Adds soft deletion, restoration tracking, and 30-day automated cleanup
-- ==============================================================================

-- 1. Add soft-deletion and restoration tracking columns to enquiries
ALTER TABLE public.enquiries 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS deleted_by TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS deletion_reason TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS restored_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS restored_by TEXT DEFAULT NULL;

-- 2. Add soft-deletion and restoration tracking columns to confirmed_orders
ALTER TABLE public.confirmed_orders 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS deleted_by TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS deletion_reason TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS restored_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS restored_by TEXT DEFAULT NULL;

-- 3. Add soft-deletion and restoration tracking columns to quotations
ALTER TABLE public.quotations 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS deleted_by TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS deletion_reason TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS restored_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS restored_by TEXT DEFAULT NULL;

-- 4. Create indexes on deleted_at for fast active vs recycle-bin querying
CREATE INDEX IF NOT EXISTS idx_enquiries_deleted_at ON public.enquiries(deleted_at);
CREATE INDEX IF NOT EXISTS idx_confirmed_orders_deleted_at ON public.confirmed_orders(deleted_at);
CREATE INDEX IF NOT EXISTS idx_quotations_deleted_at ON public.quotations(deleted_at);

-- 5. Stored Procedure: 30-day automated cleanup
-- Permanently cleans up records that have been in the Recycle Bin for more than 30 days
-- Preserves shared customer profiles and product catalog records
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
    -- Delete exclusively associated child line items and logs for expired deleted enquiries
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

    -- Delete expired confirmed orders (associated exclusively)
    WITH del_orders AS (
        DELETE FROM public.confirmed_orders
        WHERE deleted_at IS NOT NULL AND deleted_at < cutoff_time
        RETURNING id
    )
    SELECT COUNT(*) INTO deleted_orders_count FROM del_orders;

    -- Delete expired quotation line items
    DELETE FROM public.quotation_items
    WHERE quotation_id IN (
        SELECT id FROM public.quotations WHERE deleted_at IS NOT NULL AND deleted_at < cutoff_time
    );

    -- Delete expired quotations
    WITH del_quots AS (
        DELETE FROM public.quotations
        WHERE deleted_at IS NOT NULL AND deleted_at < cutoff_time
        RETURNING id
    )
    SELECT COUNT(*) INTO deleted_quotations_count FROM del_quots;

    -- Delete expired enquiries
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

-- Grant execution to authenticated admin role and service_role
GRANT EXECUTE ON FUNCTION public.cleanup_expired_recycle_bin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_recycle_bin() TO service_role;
