export function appBaseUrl(): string {
  const raw =
    process.env.PUBLIC_APP_URL ||
    process.env.VITE_APP_URL ||
    'https://authenticitynpurpose.com';
  return raw.replace(/\/$/, '');
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Resend REST errors: { message }, or { message, name }, or { errors: [{ message }] } */
function formatResendErrorPayload(data: unknown): string {
  if (!data || typeof data !== 'object') return 'Resend error';
  const o = data as Record<string, unknown>;
  if (typeof o.message === 'string' && o.message.trim()) return o.message.trim();
  if (Array.isArray(o.errors)) {
    const parts = o.errors
      .map((e) => (e && typeof e === 'object' && typeof (e as { message?: string }).message === 'string' ? (e as { message: string }).message : null))
      .filter(Boolean);
    if (parts.length) return parts.join('; ');
  }
  try {
    return JSON.stringify(data).slice(0, 300);
  } catch {
    return 'Resend error';
  }
}

export async function sendResendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<{ ok: true; id?: string } | { ok: false; error: string }> {
  const key = (process.env.RESEND_API_KEY ?? '').trim();
  if (!key) {
    return { ok: false, error: 'RESEND_API_KEY not configured' };
  }

  let from = (process.env.RESEND_FROM_EMAIL ?? '').trim();
  if (!from) {
    from = 'onboarding@resend.dev';
  }
  // Resend expects either "email@domain.com" or "Name <email@domain.com>"
  if (!from.includes('@')) {
    return {
      ok: false,
      error: 'RESEND_FROM_EMAIL must be a valid sender like Name <you@yourdomain.com> or onboarding@resend.dev',
    };
  }

  const to = opts.to.trim();
  if (!to || !to.includes('@')) {
    return { ok: false, error: 'Invalid recipient address' };
  }

  const payload: Record<string, unknown> = {
    from,
    to: [to],
    subject: opts.subject.slice(0, 998),
    html: opts.html,
    text: opts.text ?? stripHtml(opts.html),
  };
  const replyTo = (process.env.RESEND_REPLY_TO ?? '').trim();
  if (replyTo) payload.reply_to = replyTo;

  let res: Response;
  try {
    res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[resend] fetch failed:', msg);
    return { ok: false, error: `Resend request failed: ${msg}` };
  }

  const rawText = await res.text();
  let data: unknown = {};
  if (rawText) {
    try {
      data = JSON.parse(rawText) as unknown;
    } catch {
      data = { message: rawText.slice(0, 500) };
    }
  }

  if (!res.ok) {
    const err = formatResendErrorPayload(data);
    console.error('[resend]', res.status, err, rawText.slice(0, 500));
    return { ok: false, error: err || `HTTP ${res.status}` };
  }

  const id = typeof (data as { id?: string }).id === 'string' ? (data as { id: string }).id : undefined;
  return { ok: true, id };
}

export function emailShell(title: string, bodyHtml: string): string {
  const base = appBaseUrl();
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8" /></head>
<body style="font-family:system-ui,-apple-system,sans-serif;line-height:1.5;color:#1a1a1a;max-width:560px;margin:0 auto;padding:24px;">
  <h1 style="font-size:20px;margin:0 0 16px;">${escapeHtml(title)}</h1>
  <div style="margin-bottom:24px;">${bodyHtml}</div>
  <p style="font-size:13px;color:#666;margin:0;">
    <a href="${base}" style="color:#2563eb;">Open Authenticity &amp; Purpose</a>
  </p>
</body></html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
