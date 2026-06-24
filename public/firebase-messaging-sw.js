// Firebase Cloud Messaging - Service Worker
// Must be at /firebase-messaging-sw.js (public folder root)
// Config must match src/lib/firebase.ts / VITE_FIREBASE_* env vars.

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyBKPp94QUqKIVy44XAS3TRhet60WqTORPA',
  authDomain: 'authenticity-and-purpose.firebaseapp.com',
  projectId: 'authenticity-and-purpose',
  storageBucket: 'authenticity-and-purpose.firebasestorage.app',
  messagingSenderId: '691066501651',
  appId: '1:691066501651:web:acc097b0b3d444b7fb1de6',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification?.title || 'To-Do Reminder';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a reminder!',
    icon: '/Logo.jpg',
    badge: '/Logo.jpg',
    tag: payload.data?.entity_id || payload.data?.tag || 'todo-reminder',
    data: payload.data || {},
    requireInteraction: false,
    actions: [{ action: 'open', title: 'Open' }],
  };

  self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
    for (const client of clientList) {
      client.postMessage({ type: 'FCM_BACKGROUND', payload });
    }
  });

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/#to-do';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.navigate(urlToOpen).then((c) => c && c.focus());
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
