import { supabase } from '@/lib/supabase';

export type TransactionalEmailResult =
  | { ok: true; skipped?: boolean; reason?: string }
  | { ok: false; status: number; error: string };

/**
 * Calls the server Resend endpoint. In development, logs non-OK responses so failures are visible
 * (previously this failed silently).
 */
export async function sendTransactionalEmail(body: {
  kind: string;
  payload?: Record<string, unknown>;
}): Promise<TransactionalEmailResult> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) {
      return { ok: true, skipped: true, reason: 'no_session' };
    }

    const res = await fetch('/api/send-transactional-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(body),
    });

    let json: Record<string, unknown> = {};
    try {
      json = (await res.json()) as Record<string, unknown>;
    } catch {
      /* ignore */
    }

    if (!res.ok) {
      const err =
        typeof json.error === 'string'
          ? json.error
          : `HTTP ${res.status}`;
      if (import.meta.env.DEV) {
        console.warn('[sendTransactionalEmail]', body.kind, err, json);
      }
      return { ok: false, status: res.status, error: err };
    }

    if (json.skipped === true && import.meta.env.DEV) {
      console.info('[sendTransactionalEmail]', body.kind, 'skipped', json.reason ?? '');
    }

    return {
      ok: true,
      skipped: json.skipped === true,
      reason: typeof json.reason === 'string' ? json.reason : undefined,
    };
  } catch (e) {
    if (import.meta.env.DEV) {
      console.warn('[sendTransactionalEmail]', body.kind, e);
    }
    return {
      ok: false,
      status: 0,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}
