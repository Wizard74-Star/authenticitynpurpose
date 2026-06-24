import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { requestNotificationPermission, onMessageListener } from '@/lib/firebase';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  loadInbox,
  addInboxNotification,
  markAllInboxRead,
  countUnreadInbox,
  INBOX_UPDATED_EVENT,
  type InboxNotification,
} from '@/lib/notificationInbox';
import { showNativeNotification } from '@/lib/showPushNotification';
import { useAuth } from '@/contexts/AuthContext';

type FcmPayload = {
  notification?: { title?: string; body?: string };
  data?: Record<string, string>;
};

type NotificationContextType = {
  permission: NotificationPermission;
  fcmToken: string | null;
  unreadCount: number;
  recentNotifications: InboxNotification[];
  requestPermission: () => Promise<string | null>;
  markNotificationsRead: () => void;
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [recentNotifications, setRecentNotifications] = useState<InboxNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const syncInboxState = useCallback((userId: string) => {
    const items = loadInbox(userId);
    setRecentNotifications(items);
    setUnreadCount(countUnreadInbox(userId));
  }, []);

  const handleIncomingPush = useCallback(
    (payload: FcmPayload, options?: { skipNative?: boolean }) => {
      const title = payload.notification?.title || 'To-Do Reminder';
      const body = payload.notification?.body || '';
      const data = payload.data ?? {};
      const url = data.url || (data.entity_type === 'manifestation_todo' ? '/#to-do' : '/');

      if (!options?.skipNative) {
        showNativeNotification(title, body, { ...data, url });
      }
      toast.info(title, { description: body || undefined });

      const uid = user?.id;
      if (uid) {
        const next = addInboxNotification(uid, {
          title,
          body,
          url,
          entityType: data.entity_type,
          entityId: data.entity_id,
        });
        setRecentNotifications(next);
        setUnreadCount(countUnreadInbox(uid));
      }
    },
    [user?.id]
  );

  const saveFCMToken = useCallback(async (token: string) => {
    if (!user) return;

    await supabase
      .from('reminder_preferences')
      .upsert(
        {
          user_id: user.id,
          fcm_token: token,
          push_enabled: true,
          goal_deadline_enabled: true,
          goal_deadline_timing: 24,
          habit_checkin_enabled: true,
          habit_checkin_time: '09:00:00',
          family_activity_enabled: true,
          family_activity_timing: 2,
          smart_reminders_enabled: true,
          email_enabled: false,
          email_address: user.email || '',
        },
        { onConflict: 'user_id' }
      );
  }, [user]);

  const requestPermission = useCallback(async (): Promise<string | null> => {
    const token = await requestNotificationPermission();
    if (token) {
      setFcmToken(token);
      setPermission('granted');
      await saveFCMToken(token);
      toast.success('Notifications enabled!');
      return token;
    }
    toast.error('Permission denied');
    return null;
  }, [saveFCMToken]);

  const markNotificationsRead = useCallback(() => {
    if (!user?.id) return;
    const next = markAllInboxRead(user.id);
    setRecentNotifications(next);
    setUnreadCount(0);
  }, [user?.id]);

  useEffect(() => {
    try {
      setPermission(typeof Notification !== 'undefined' ? Notification.permission : 'default');
    } catch {
      setPermission('default');
    }
  }, []);

  useEffect(() => {
    if (!user?.id) {
      setRecentNotifications([]);
      setUnreadCount(0);
      return;
    }
    syncInboxState(user.id);
  }, [user?.id, syncInboxState]);

  useEffect(() => {
    if (!user?.id) return;
    const onInboxUpdated = (event: Event) => {
      const detail = (event as CustomEvent<{ userId: string }>).detail;
      if (detail?.userId === user.id) {
        syncInboxState(user.id);
      }
    };
    window.addEventListener(INBOX_UPDATED_EVENT, onInboxUpdated);
    return () => window.removeEventListener(INBOX_UPDATED_EVENT, onInboxUpdated);
  }, [user?.id, syncInboxState]);

  useEffect(() => {
    if (!user || typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    void (async () => {
      const token = await requestNotificationPermission();
      if (token) {
        setFcmToken(token);
        await saveFCMToken(token);
      }
    })();
  }, [user, saveFCMToken]);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    try {
      unsubscribe = onMessageListener((payload) => handleIncomingPush(payload as FcmPayload));
    } catch (e) {
      console.warn('Notifications: foreground listener unavailable', e);
    }
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [handleIncomingPush]);

  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;

    const channel = new BroadcastChannel('ap-fcm-notifications');
    channel.onmessage = (event) => {
      if (event.data?.type === 'FCM_BACKGROUND') {
        handleIncomingPush(event.data.payload as FcmPayload, { skipNative: true });
      }
    };
    return () => channel.close();
  }, [handleIncomingPush]);

  // Fallback for browsers without BroadcastChannel (SW uses client.postMessage).
  useEffect(() => {
    if (typeof BroadcastChannel !== 'undefined' || !('serviceWorker' in navigator)) return;

    const onSwMessage = (event: MessageEvent) => {
      if (event.data?.type === 'FCM_BACKGROUND') {
        handleIncomingPush(event.data.payload as FcmPayload, { skipNative: true });
      }
    };

    navigator.serviceWorker.addEventListener('message', onSwMessage);
    return () => navigator.serviceWorker.removeEventListener('message', onSwMessage);
  }, [handleIncomingPush]);

  return (
    <NotificationContext.Provider
      value={{
        permission,
        fcmToken,
        unreadCount,
        recentNotifications,
        requestPermission,
        markNotificationsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
