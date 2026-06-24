export type InboxNotification = {
  id: string;
  title: string;
  body: string;
  url?: string;
  entityType?: string;
  entityId?: string;
  receivedAt: string;
  read: boolean;
};

const MAX_INBOX = 50;

function storageKey(userId: string): string {
  return `ap_notification_inbox_${userId}`;
}

export function loadInbox(userId: string): InboxNotification[] {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as InboxNotification[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistInbox(userId: string, items: InboxNotification[]): void {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(items.slice(0, MAX_INBOX)));
  } catch {
    /* quota / private mode */
  }
}

export function addInboxNotification(
  userId: string,
  item: Omit<InboxNotification, 'id' | 'receivedAt' | 'read'> & { id?: string; receivedAt?: string; read?: boolean }
): InboxNotification[] {
  const entry: InboxNotification = {
    id: item.id ?? crypto.randomUUID(),
    title: item.title,
    body: item.body,
    url: item.url,
    entityType: item.entityType,
    entityId: item.entityId,
    receivedAt: item.receivedAt ?? new Date().toISOString(),
    read: item.read ?? false,
  };
  const next = [entry, ...loadInbox(userId).filter((n) => n.id !== entry.id)].slice(0, MAX_INBOX);
  persistInbox(userId, next);
  return next;
}

export function markAllInboxRead(userId: string): InboxNotification[] {
  const next = loadInbox(userId).map((n) => ({ ...n, read: true }));
  persistInbox(userId, next);
  return next;
}

export function countUnreadInbox(userId: string): number {
  return loadInbox(userId).filter((n) => !n.read).length;
}
