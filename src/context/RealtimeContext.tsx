import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  AdminNotification,
  RealtimeConnectionStatus,
} from '../types';
import {
  getPersistedNotifications,
  getRealtimeStatus,
  initRealtimeSubscriptions,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearAllNotifications,
  addNotification as addNotifService,
} from '../services/realtimeService';

interface RealtimeContextType {
  connectionStatus: RealtimeConnectionStatus;
  lastSyncTime: Date;
  notifications: AdminNotification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  addNotification: (payload: Omit<AdminNotification, 'id' | 'timestamp' | 'read'>) => AdminNotification;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export const RealtimeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [connectionStatus, setConnectionStatus] = useState<RealtimeConnectionStatus>(() => {
    return getRealtimeStatus().status;
  });
  const [lastSyncTime, setLastSyncTime] = useState<Date>(() => {
    return getRealtimeStatus().lastSyncTime;
  });
  const [notifications, setNotifications] = useState<AdminNotification[]>(() => {
    return getPersistedNotifications();
  });

  useEffect(() => {
    // 1. Initialize Supabase Realtime channel
    const cleanup = initRealtimeSubscriptions();

    // 2. Listen for connection status updates
    const handleStatusChange = (e: Event) => {
      const custom = e as CustomEvent<{ status: RealtimeConnectionStatus; lastSyncTime: Date }>;
      if (custom.detail) {
        setConnectionStatus(custom.detail.status);
        setLastSyncTime(custom.detail.lastSyncTime);
      }
    };

    // 3. Listen for notifications updates
    const handleNotificationsChange = (e: Event) => {
      const custom = e as CustomEvent<AdminNotification[]>;
      if (custom.detail) {
        setNotifications([...custom.detail]);
      }
    };

    window.addEventListener('knr_realtime_status_changed', handleStatusChange);
    window.addEventListener('knr_notifications_updated', handleNotificationsChange);

    return () => {
      window.removeEventListener('knr_realtime_status_changed', handleStatusChange);
      window.removeEventListener('knr_notifications_updated', handleNotificationsChange);
      cleanup();
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <RealtimeContext.Provider
      value={{
        connectionStatus,
        lastSyncTime,
        notifications,
        unreadCount,
        markAsRead: markNotificationAsRead,
        markAllAsRead: markAllNotificationsAsRead,
        clearNotifications: clearAllNotifications,
        addNotification: addNotifService,
      }}
    >
      {children}
    </RealtimeContext.Provider>
  );
};

export const useRealtime = (): RealtimeContextType => {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
};

