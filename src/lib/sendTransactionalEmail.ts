import { supabase } from '@/lib/supabase';

/** Fire-and-forget API notification; fails silently in the client. */
export async function sendTransactionalEmail(body: {
  kind: string;
  payload?: Record<string, unknown>;
}): Promise<void> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) return;
    await fetch('/api/send-transactional-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(body),
    });
  } catch {
    // ignore
  }
}
