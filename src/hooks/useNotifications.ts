import { useState, useEffect, useCallback, useRef } from 'react';
import { requestNotificationPermission, onMessageListener } from '@/lib/firebase';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  loadInbox,
  addInboxNotification,
  markAllInboxRead,
  countUnreadInbox,
  type InboxNotification,
} from '@/lib/notificationInbox';
import { showNativeNotification } from '@/lib/showPushNotification';

type FcmPayload = {
  notification?: { title?: string; body?: string };
  data?: Record<string, string>;
};

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [recentNotifications, setRecentNotifications] = useState<InboxNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const userIdRef = useRef<string | null>(null);

  const syncInboxState = useCallback((userId: string) => {
    const items = loadInbox(userId);
    setRecentNotifications(items);
    setUnreadCount(countUnreadInbox(userId));
  }, []);

  const handleIncomingPush = useCallback(
    (payload: FcmPayload) => {
      const title = payload.notification?.title || 'To-Do Reminder';
      const body = payload.notification?.body || '';
      const data = payload.data ?? {};
      const url = data.url || (data.entity_type === 'manifestation_todo' ? '/#to-do' : '/');

      showNativeNotification(title, body, { ...data, url });
      toast.info(title, { description: body || undefined });

      const uid = userIdRef.current;
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
    []
  );

  const saveFCMToken = useCallback(async (token: string) => {
    const { data: { user } } = await supabase.auth.getUser();
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
  }, []);

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
    const uid = userIdRef.current;
    if (!uid) return;
    const next = markAllInboxRead(uid);
    setRecentNotifications(next);
    setUnreadCount(0);
  }, []);

  useEffect(() => {
    try {
      setPermission(typeof Notification !== 'undefined' ? Notification.permission : 'default');
    } catch {
      setPermission('default');
    }

    void (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      userIdRef.current = user.id;
      syncInboxState(user.id);
    })();
  }, [syncInboxState]);

  useEffect(() => {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    void (async () => {
      const token = await requestNotificationPermission();
      if (token) {
        setFcmToken(token);
        await saveFCMToken(token);
      }
    })();
  }, [saveFCMToken]);

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
    if (!('serviceWorker' in navigator)) return;
    const onSwMessage = (event: MessageEvent) => {
      if (event.data?.type === 'FCM_BACKGROUND') {
        handleIncomingPush(event.data.payload as FcmPayload);
      }
    };
    navigator.serviceWorker.addEventListener('message', onSwMessage);
    return () => navigator.serviceWorker.removeEventListener('message', onSwMessage);
  }, [handleIncomingPush]);

  return {
    permission,
    fcmToken,
    unreadCount,
    recentNotifications,
    requestPermission,
    markNotificationsRead,
  };
}
