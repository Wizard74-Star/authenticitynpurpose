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

export async function sendResendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<{ ok: true; id?: string } | { ok: false; error: string }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    return { ok: false, error: 'RESEND_API_KEY not configured' };
  }
  const from =
    process.env.RESEND_FROM_EMAIL ||
    'Authenticity & Purpose <onboarding@resend.dev>';

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [opts.to],
      subject: opts.subject,
      html: opts.html,
      text: opts.text ?? stripHtml(opts.html),
    }),
  });

  const data = (await res.json()) as { id?: string; message?: string };
  if (!res.ok) {
    return { ok: false, error: data.message || res.statusText || 'Resend error' };
  }
  return { ok: true, id: data.id };
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
