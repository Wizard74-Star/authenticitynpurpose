/**
 * GET /api/timezone
 * Returns the user's timezone inferred from their IP (e.g. "America/New_York").
 * Used so calendar and "today" use the correct date in the user's location.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Client IP: Vercel sets these; fallback for local dev
  const headerIp = (value: string | string[] | undefined): string => {
    if (typeof value === 'string') return value.split(',')[0]?.trim() ?? '';
    if (Array.isArray(value) && value[0]) return String(value[0]).trim();
    return '';
  };
  const ip =
    headerIp(req.headers['x-forwarded-for']) ||
    (typeof req.socket?.remoteAddress === 'string' ? req.socket.remoteAddress : '') ||
    headerIp(req.headers['x-real-ip']);
  const clientIp = ip.length > 0 ? ip : undefined;

  try {
    // ip-api.com: free, returns timezone from IP (e.g. "America/Los_Angeles")
    const url = clientIp
      ? `http://ip-api.com/json/${encodeURIComponent(clientIp)}?fields=timezone`
      : 'http://ip-api.com/json/?fields=timezone';
    const response = await fetch(url, { signal: AbortSignal.timeout(3000) });
    if (!response.ok) {
      return res.status(200).json({ timezone: null });
    }
    const data = (await response.json()) as { timezone?: string };
    const timezone = data?.timezone ?? null;
    res.setHeader('Cache-Control', 'private, max-age=3600');
    return res.status(200).json({ timezone });
  } catch {
    return res.status(200).json({ timezone: null });
  }
}
