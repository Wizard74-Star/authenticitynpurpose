/**
 * Timezone utilities: use user's timezone (from IP or browser) so "today" and
 * calendar dates are correct regardless of server or UTC.
 */

/** Get browser's timezone (e.g. "America/New_York"). */
export function getBrowserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Get "today" as YYYY-MM-DD in the given timezone (or browser timezone if not provided).
 * Use this instead of new Date().toISOString().slice(0, 10) which uses UTC.
 */
export function getTodayISO(timezone?: string | null): string {
  const tz = timezone || getBrowserTimezone();
  const parts = new Date().toLocaleDateString('en-CA', { timeZone: tz }).split('-');
  if (parts.length === 3) return parts.join('-');
  return new Date().toLocaleDateString('en-CA', { timeZone: tz });
}

/**
 * Parse a date-only string (YYYY-MM-DD) as that calendar day in the given timezone.
 * Returns a Date at noon in that timezone so getDate()/getMonth()/getFullYear() match the intended day.
 */
/** Parse YYYY-MM-DD as that calendar day (noon local) so getDate()/getMonth()/getFullYear() match. */
export function parseDateOnlyInTimezone(iso: string, _timezone?: string | null): Date {
  const [y, m, d] = iso.split('-').map(Number);
  if (y == null || m == null || d == null) return new Date(iso + 'T12:00:00');
  return new Date(y, (m ?? 1) - 1, d ?? 1, 12, 0, 0);
}

/**
 * Format a Date to YYYY-MM-DD in the given timezone (or browser).
 */
export function toISODateInTimezone(d: Date, timezone?: string | null): string {
  const tz = timezone || getBrowserTimezone();
  return new Date(d).toLocaleDateString('en-CA', { timeZone: tz });
}

let cachedTimezone: string | null | undefined = undefined;

/**
 * Fetch user timezone from IP via /api/timezone. Returns null if unavailable (use browser as fallback).
 */
export async function fetchTimezoneFromIP(): Promise<string | null> {
  if (cachedTimezone !== undefined) return cachedTimezone;
  try {
    const res = await fetch('/api/timezone', { credentials: 'same-origin' });
    const data = (await res.json()) as { timezone?: string | null };
    cachedTimezone = data?.timezone ?? null;
    return cachedTimezone;
  } catch {
    cachedTimezone = null;
    return null;
  }
}
