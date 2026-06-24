/** Show a native OS/browser notification (foreground tab). */
export function showNativeNotification(
  title: string,
  body: string,
  data?: Record<string, string>
): void {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
  try {
    const notification = new Notification(title, {
      body,
      icon: '/Logo.jpg',
      badge: '/Logo.jpg',
      tag: data?.entity_id || `reminder-${Date.now()}`,
      data: data ?? {},
    });
    notification.onclick = () => {
      window.focus();
      const url = data?.url;
      if (url) {
        if (url.startsWith('http')) window.location.href = url;
        else window.location.assign(url);
      }
      notification.close();
    };
  } catch {
    /* ignore — e.g. unsupported context */
  }
}
