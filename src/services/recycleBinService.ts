import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { RecycleBinItem, CustomerEnquiry, ConfirmedOrder } from '../types';
import { fetchEnquiries, restoreEnquiry, permanentlyDeleteEnquiry } from './enquiryService';
import { fetchConfirmedOrders, restoreConfirmedOrder, permanentDeleteConfirmedOrder } from './quotationService';

const RECYCLE_BIN_RETENTION_DAYS = 30;

export function calculateDaysRemaining(deletedAt: string): { daysRemaining: number; isWarning: boolean } {
  const deletedTime = new Date(deletedAt).getTime();
  const now = Date.now();
  const daysPassed = Math.floor((now - deletedTime) / (1000 * 60 * 60 * 24));
  const daysRemaining = Math.max(0, RECYCLE_BIN_RETENTION_DAYS - daysPassed);
  return {
    daysRemaining,
    isWarning: daysRemaining <= 5,
  };
}

/**
 * Fetch all soft-deleted items across enquiries, RFQs, and confirmed orders
 */
export async function fetchRecycleBinItems(): Promise<RecycleBinItem[]> {
  const items: RecycleBinItem[] = [];
  const processedOrderIds = new Set<string>();

  try {
    // 1. Fetch deleted enquiries
    const allEnquiries = await fetchEnquiries({ includeDeleted: true });
    const deletedEnquiries = allEnquiries.filter((e) => Boolean(e.deletedAt));

    // 2. Fetch deleted confirmed orders
    const allOrders = await fetchConfirmedOrders({ includeDeleted: true });
    const deletedOrders = allOrders.filter((o) => Boolean(o.deletedAt));

    // Map deleted enquiries
    for (const enq of deletedEnquiries) {
      const { daysRemaining, isWarning } = calculateDaysRemaining(enq.deletedAt!);
      
      // Check if this enquiry corresponds to a confirmed order
      const matchingOrder = deletedOrders.find(
        (o) => o.enquiryId === enq.id || o.orderNumber === enq.enquiryNumber
      );

      if (matchingOrder) {
        processedOrderIds.add(matchingOrder.id);
      }

      const recordType: 'Enquiry' | 'RFQ' | 'Confirmed Order' = 
        enq.status === 'Order Confirmed' || matchingOrder ? 'Confirmed Order' : 'RFQ';

      items.push({
        id: enq.id,
        referenceId: matchingOrder?.orderNumber || enq.enquiryNumber,
        customerName: enq.customerName,
        mobileNumber: enq.mobileNumber,
        email: enq.email,
        organisation: enq.organisation,
        recordType,
        originalStatus: enq.status,
        totalAmount: Number(enq.totalAmount || 0),
        deletedAt: enq.deletedAt!,
        deletedBy: enq.deletedBy || undefined,
        deletionReason: enq.deletionReason || undefined,
        daysRemaining,
        isWarning,
        rawEnquiry: enq,
        rawOrder: matchingOrder,
      });
    }

    // Map any standalone deleted confirmed orders not already paired
    for (const order of deletedOrders) {
      if (processedOrderIds.has(order.id)) continue;
      const { daysRemaining, isWarning } = calculateDaysRemaining(order.deletedAt!);

      items.push({
        id: order.id,
        referenceId: order.orderNumber,
        customerName: order.customerName,
        mobileNumber: order.mobileNumber,
        email: order.email,
        organisation: order.organisation,
        recordType: 'Confirmed Order',
        originalStatus: order.status || 'Confirmed',
        totalAmount: Number(order.totalAmount || 0),
        deletedAt: order.deletedAt!,
        deletedBy: order.deletedBy || undefined,
        deletionReason: order.deletionReason || undefined,
        daysRemaining,
        isWarning,
        rawOrder: order,
      });
    }
  } catch (err) {
    console.warn('Error fetching recycle bin items:', err);
  }

  // Sort by deletion date descending (most recently deleted first)
  return items.sort((a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime());
}

/**
 * Restore an individual item from the Recycle Bin
 */
export async function restoreRecycleBinItem(
  item: RecycleBinItem,
  adminName: string = 'Administrator'
): Promise<boolean> {
  let restored = false;

  // Restore raw enquiry if present
  if (item.rawEnquiry) {
    await restoreEnquiry(item.rawEnquiry.id, adminName);
    restored = true;
  }

  // Restore raw order if present
  if (item.rawOrder) {
    await restoreConfirmedOrder(item.rawOrder.id, adminName);
    restored = true;
  }

  // Standalone order with no rawEnquiry
  if (!item.rawEnquiry && item.recordType === 'Confirmed Order') {
    await restoreConfirmedOrder(item.id, adminName);
    restored = true;
  }

  // Trigger UI notifications
  window.dispatchEvent(new CustomEvent('knr_enquiries_updated'));
  window.dispatchEvent(new CustomEvent('knr_orders_updated'));
  window.dispatchEvent(new CustomEvent('knr_recycle_bin_updated'));

  return restored;
}

/**
 * Permanently delete a single item from the Recycle Bin (cannot be undone)
 */
export async function permanentlyDeleteRecycleBinItem(item: RecycleBinItem): Promise<boolean> {
  if (item.rawEnquiry) {
    await permanentlyDeleteEnquiry(item.rawEnquiry.id);
  }

  if (item.rawOrder) {
    await permanentDeleteConfirmedOrder(item.rawOrder.id);
  }

  if (!item.rawEnquiry && item.recordType === 'Confirmed Order') {
    await permanentDeleteConfirmedOrder(item.id);
  }

  window.dispatchEvent(new CustomEvent('knr_enquiries_updated'));
  window.dispatchEvent(new CustomEvent('knr_orders_updated'));
  window.dispatchEvent(new CustomEvent('knr_recycle_bin_updated'));

  return true;
}

/**
 * Empty the entire Recycle Bin permanently
 */
export async function emptyRecycleBin(adminName: string = 'Administrator'): Promise<number> {
  const items = await fetchRecycleBinItems();
  let deletedCount = 0;

  for (const item of items) {
    try {
      await permanentlyDeleteRecycleBinItem(item);
      deletedCount++;
    } catch (err) {
      console.warn(`Failed to permanently delete item ${item.referenceId}:`, err);
    }
  }

  // Trigger server-side cleanup stored procedure
  if (isSupabaseConfigured()) {
    try {
      await supabase.rpc('cleanup_expired_recycle_bin');
    } catch (err) {
      console.warn('RPC cleanup_expired_recycle_bin failed:', err);
    }
  }

  window.dispatchEvent(new CustomEvent('knr_enquiries_updated'));
  window.dispatchEvent(new CustomEvent('knr_orders_updated'));
  window.dispatchEvent(new CustomEvent('knr_recycle_bin_updated'));

  return deletedCount;
}

/**
 * Run automatic 30-day cleanup via Supabase RPC and local cleanup
 */
export async function triggerAutomatic30DayCleanup(): Promise<{ success: boolean; details?: unknown }> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.rpc('cleanup_expired_recycle_bin');
      if (error) throw error;
      return { success: true, details: data };
    } catch (err) {
      console.warn('Supabase automatic 30-day cleanup RPC failed:', err);
    }
  }

  // Fallback: local store cleanup for items older than 30 days
  const cutoff = Date.now() - RECYCLE_BIN_RETENTION_DAYS * 24 * 60 * 60 * 1000;
  try {
    const rawEnq = localStorage.getItem('knr_admin_enquiries_store');
    if (rawEnq) {
      const list: CustomerEnquiry[] = JSON.parse(rawEnq);
      const filtered = list.filter((e) => {
        if (!e.deletedAt) return true;
        return new Date(e.deletedAt).getTime() > cutoff;
      });
      localStorage.setItem('knr_admin_enquiries_store', JSON.stringify(filtered));
    }

    const rawOrd = localStorage.getItem('knr_confirmed_orders_store');
    if (rawOrd) {
      const list: ConfirmedOrder[] = JSON.parse(rawOrd);
      const filtered = list.filter((o) => {
        if (!o.deletedAt) return true;
        return new Date(o.deletedAt).getTime() > cutoff;
      });
      localStorage.setItem('knr_confirmed_orders_store', JSON.stringify(filtered));
    }
  } catch {
    // ignore
  }

  return { success: true };
}
