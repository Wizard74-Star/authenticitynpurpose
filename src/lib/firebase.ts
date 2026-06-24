import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, type Messaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

let app: FirebaseApp | null = null;
let messaging: Messaging | null = null;

function initFirebase(): FirebaseApp | null {
  if (getApps().length > 0) {
    return getApps()[0] as FirebaseApp;
  }
  if (!firebaseConfig.apiKey || firebaseConfig.apiKey === 'your_firebase_api_key') {
    return null;
  }
  app = initializeApp(firebaseConfig);
  return app;
}

function getMessagingInstance(): Messaging | null {
  if (!app) app = initFirebase();
  if (!app) return null;
  if (typeof window === 'undefined') return null;
  if (!messaging) {
    try {
      messaging = getMessaging(app);
    } catch {
      return null;
    }
  }
  return messaging;
}

export { app, messaging };

export async function requestNotificationPermission(): Promise<string | null> {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;

    const instance = getMessagingInstance();
    if (!instance) {
      console.warn('Firebase Messaging not available');
      return null;
    }

    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
    if (!vapidKey || vapidKey === 'your_vapid_key') {
      console.warn('VITE_FIREBASE_VAPID_KEY not set. Get it from Firebase Console → Project Settings → Cloud Messaging → Web Push certificates');
      return null;
    }

    if ('serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      } catch (e) {
        console.warn('Firebase messaging service worker registration failed:', e);
      }
    }

    const token = await getToken(instance, { vapidKey });
    if (token) {
      return token;
    }
    return null;
  } catch (error) {
    console.error('Error getting notification permission:', error);
    return null;
  }
}

/**
 * Subscribe to foreground messages. Returns unsubscribe function.
 * Call this in useEffect and clean up on unmount.
 */
export function onMessageListener(callback: (payload: any) => void): () => void {
  const instance = getMessagingInstance();
  if (!instance) return () => {};
  return onMessage(instance, callback);
}
