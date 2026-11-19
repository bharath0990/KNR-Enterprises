import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { AdminNotification, RealtimeConnectionStatus } from '../types';

const NOTIFICATIONS_STORAGE_KEY = 'knr_admin_notifications_v1';
const MAX_NOTIFICATIONS_HISTORY = 100;

// ============================================================================
// 1. NOTIFICATION PERSISTENCE & HELPERS
// ============================================================================

export function getPersistedNotifications(): AdminNotification[] {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('Error reading persisted notifications:', err);
    return [];
  }
}

export function saveNotifications(notifications: AdminNotification[]): void {
  try {
    const trimmed = notifications.slice(0, MAX_NOTIFICATIONS_HISTORY);
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(trimmed));
  } catch (err) {
    console.warn('Error saving notifications:', err);
  }
}

export function addNotification(
  payload: Omit<AdminNotification, 'id' | 'timestamp' | 'read'>
): AdminNotification {
  const current = getPersistedNotifications();
  
  // Deduplicate if an identical notification was received in the last 5 seconds
  const isDuplicate = current.some(
    (n) =>
      n.title === payload.title &&
      n.message === payload.message &&
      Date.now() - new Date(n.timestamp).getTime() < 5000
  );

  if (isDuplicate) {
    return current[0];
  }

  const newNotif: AdminNotification = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    read: false,
    ...payload,
  };

  const updated = [newNotif, ...current];
  saveNotifications(updated);

  // Dispatch custom window events
  window.dispatchEvent(
    new CustomEvent('knr_notifications_updated', { detail: updated })
  );

  return newNotif;
}

export function markNotificationAsRead(id: string): void {
  const current = getPersistedNotifications();
  const updated = current.map((n) => (n.id === id ? { ...n, read: true } : n));
  saveNotifications(updated);
  window.dispatchEvent(
    new CustomEvent('knr_notifications_updated', { detail: updated })
  );
}

export function markAllNotificationsAsRead(): void {
  const current = getPersistedNotifications();
  const updated = current.map((n) => ({ ...n, read: true }));
  saveNotifications(updated);
  window.dispatchEvent(
    new CustomEvent('knr_notifications_updated', { detail: updated })
  );
}

export function clearAllNotifications(): void {
  saveNotifications([]);
  window.dispatchEvent(
    new CustomEvent('knr_notifications_updated', { detail: [] })
  );
}

// ============================================================================
// 2. REALTIME CONNECTION STATE & SUBSCRIPTIONS
// ============================================================================

let realtimeChannel: ReturnType<typeof supabase.channel> | null = null;
let connectionStatus: RealtimeConnectionStatus = 'disconnected';
let lastSyncTime: Date = new Date();
let reconnectTimer: NodeJS.Timeout | null = null;

function setStatus(status: RealtimeConnectionStatus) {
  connectionStatus = status;
  if (status === 'connected') {
    lastSyncTime = new Date();
  }
  window.dispatchEvent(
    new CustomEvent('knr_realtime_status_changed', {
      detail: { status, lastSyncTime },
    })
  );
}

export function getRealtimeStatus(): {
  status: RealtimeConnectionStatus;
  lastSyncTime: Date;
} {
  return { status: connectionStatus, lastSyncTime };
}

/**
 * Initializes Supabase Realtime subscriptions across all relevant tables.
 * Safe to call multiple times (idempotent).
 */
export function initRealtimeSubscriptions(): () => void {
  if (!isSupabaseConfigured()) {
    setStatus('disconnected');
    return () => {};
  }

  if (realtimeChannel) {
    return () => cleanupRealtimeSubscriptions();
  }

  setStatus('connecting');

  try {
    const channel = supabase.channel('knr-admin-live-sync', {
      config: {
        broadcast: { ack: true },
        presence: { key: 'admin' },
      },
    });

    // 1. Enquiries Table (RFQs and Contact Form Submissions)
    channel.on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'enquiries' },
      (payload) => {
        const enq = payload.new as Record<string, any>;
        const customer = enq.customer_name || 'Customer';
        const isRfq = enq.source?.includes('cart') || enq.source?.includes('proforma');
        
        addNotification({
          title: isRfq ? 'New RFQ Order Received' : 'New Contact Enquiry',
          message: `${customer} submitted enquiry #${enq.enquiry_number || 'KNR'} (${enq.organisation || 'Gram Panchayat / Institutional'})`,
          type: isRfq ? 'rfq' : 'contact',
          referenceId: enq.id,
          referenceTab: 'enquiries',
          customerName: customer,
          amount: enq.total_amount ? Number(enq.total_amount) : undefined,
        });

        lastSyncTime = new Date();
        window.dispatchEvent(new CustomEvent('knr_enquiries_updated', { detail: payload }));
      }
    );

    channel.on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'enquiries' },
      (payload) => {
        const enq = payload.new as Record<string, any>;
        lastSyncTime = new Date();
        window.dispatchEvent(new CustomEvent('knr_enquiries_updated', { detail: payload }));

        if (payload.old && payload.old.status !== enq.status) {
          addNotification({
            title: 'Enquiry Status Updated',
            message: `Enquiry #${enq.enquiry_number} status changed to ${enq.status}`,
            type: 'status',
            referenceId: enq.id,
            referenceTab: 'enquiries',
            customerName: enq.customer_name,
          });
        }
      }
    );

    // 2. Products Table (Catalog and Availability)
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'products' },
      (payload) => {
        const prod = (payload.new || payload.old) as Record<string, any>;
        lastSyncTime = new Date();
        window.dispatchEvent(new CustomEvent('knr_products_updated', { detail: payload }));

        if (payload.eventType === 'INSERT') {
          addNotification({
            title: 'New Product Added',
            message: `Product "${prod.name}" has been published to the catalog.`,
            type: 'product',
            referenceId: prod.id,
            referenceTab: 'products',
          });
        } else if (payload.eventType === 'UPDATE' && payload.old) {
          if (payload.old.stock_quantity !== prod.stock_quantity) {
            addNotification({
              title: 'Product Stock Updated',
              message: `"${prod.name}" stock updated to ${prod.stock_quantity} ${prod.unit || 'units'}.`,
              type: 'inventory',
              referenceId: prod.id,
              referenceTab: 'inventory',
            });
          }
        }
      }
    );

    // 3. Categories Table
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'categories' },
      (payload) => {
        lastSyncTime = new Date();
        window.dispatchEvent(new CustomEvent('knr_categories_updated', { detail: payload }));
      }
    );

    // 4. Inventory Logs Table
    channel.on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'inventory_logs' },
      (payload) => {
        lastSyncTime = new Date();
        window.dispatchEvent(new CustomEvent('knr_inventory_updated', { detail: payload }));
      }
    );

    // 5. Website Settings Table
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'website_settings' },
      (payload) => {
        lastSyncTime = new Date();
        window.dispatchEvent(new CustomEvent('knr_settings_updated', { detail: payload }));
      }
    );

    // 6. Homepage Content Table
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'homepage_content' },
      (payload) => {
        lastSyncTime = new Date();
        window.dispatchEvent(new CustomEvent('knr_content_updated', { detail: payload }));
      }
    );

    // Subscribe to the channel and listen to status changes
    channel.subscribe((status, err) => {
      if (status === 'SUBSCRIBED') {
        setStatus('connected');
        // Reconcile missed updates after connecting
        window.dispatchEvent(new CustomEvent('knr_realtime_reconcile'));
      } else if (status === 'TIMED_OUT' || status === 'CHANNEL_ERROR') {
        setStatus('reconnecting');
        if (err) console.warn('Supabase Realtime subscription error:', err);
        scheduleReconnect();
      } else if (status === 'CLOSED') {
        setStatus('disconnected');
      }
    });

    realtimeChannel = channel;
  } catch (err) {
    console.error('Failed to initialize Supabase Realtime channel:', err);
    setStatus('disconnected');
  }

  // Handle browser online/offline events
  const handleOnline = () => {
    setStatus('reconnecting');
    scheduleReconnect();
  };

  const handleOffline = () => {
    setStatus('disconnected');
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
    cleanupRealtimeSubscriptions();
  };
}

function scheduleReconnect() {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  reconnectTimer = setTimeout(() => {
    cleanupRealtimeSubscriptions();
    initRealtimeSubscriptions();
  }, 4000);
}

export function cleanupRealtimeSubscriptions(): void {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (realtimeChannel) {
    try {
      supabase.removeChannel(realtimeChannel);
    } catch (err) {
      console.warn('Error removing realtime channel:', err);
    }
    realtimeChannel = null;
  }
  setStatus('disconnected');
}
