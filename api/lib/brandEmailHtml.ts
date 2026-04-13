import { appBaseUrl } from './resendEmail';

export function escHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Rich layout for transactional product email (welcome, goals, to-dos). */
export function brandTransactionalHtml(opts: {
  kicker?: string;
  title: string;
  lead?: string;
  blocks: string[];
  ctaLabel?: string;
  ctaPath?: string;
}): string {
  const base = appBaseUrl();
  const path = opts.ctaPath ?? '/dashboard';
  const ctaHref = `${base}${path.startsWith('/') ? path : `/${path}`}`;
  const label = opts.ctaLabel ?? 'Open your dashboard';

  const kicker = opts.kicker
    ? `<p style="margin:0 0 12px;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#64748b;font-family:system-ui,-apple-system,sans-serif;">${escHtml(opts.kicker)}</p>`
    : '';

  const mainTitle = `<h1 style="margin:0 0 20px;font-size:26px;line-height:1.3;font-weight:600;color:#0f172a;font-family:Georgia,'Times New Roman',serif;">${escHtml(opts.title)}</h1>`;

  const lead = opts.lead
    ? `<p style="margin:0 0 24px;font-size:17px;line-height:1.6;color:#475569;font-family:Georgia,'Times New Roman',serif;">${opts.lead}</p>`
    : '';

  const blocks = opts.blocks
    .map(
      (b) =>
        `<div style="margin:0 0 18px;font-size:16px;line-height:1.65;color:#334155;font-family:system-ui,-apple-system,sans-serif;">${b}</div>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escHtml(opts.title)}</title>
</head>
<body style="margin:0;background:#e2e8f0;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#e2e8f0;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 12px 40px rgba(15,23,42,0.12);">
          <tr>
            <td style="padding:24px 36px;background:linear-gradient(135deg,#0f172a 0%,#1e40af 55%,#2563eb 100%);">
              <p style="margin:0;font-family:Georgia,serif;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:rgba(255,255,255,0.85);">Authenticity &amp; Purpose</p>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 36px 28px;">
              ${kicker}
              ${mainTitle}
              ${lead}
              ${blocks}
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin:28px 0 8px;">
                <tr>
                  <td style="border-radius:999px;background:linear-gradient(135deg,#1d4ed8,#2563eb);">
                    <a href="${ctaHref}" style="display:inline-block;padding:14px 28px;font-family:system-ui,-apple-system,sans-serif;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:999px;">${escHtml(label)}</a>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 0;font-size:13px;line-height:1.5;color:#94a3b8;font-family:system-ui,-apple-system,sans-serif;">
                You are building something that matters—one honest step at a time.<br />
                <a href="${base}" style="color:#3b82f6;text-decoration:none;">${escHtml(base.replace(/^https?:\/\//, ''))}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Scheduled reminder (cron) — same visual language, content from plain message. */
export function scheduledReminderEmailHtml(message: string): string {
  return brandTransactionalHtml({
    kicker: 'Gentle reminder',
    title: 'Something on your calendar',
    lead: undefined,
    blocks: [
      `<p style="margin:0;font-size:18px;line-height:1.6;color:#1e293b;font-family:Georgia,serif;">${escHtml(message)}</p>`,
      `<p style="margin:16px 0 0;font-size:15px;color:#64748b;">When you are ready, we will be right here with your goals and plan.</p>`,
    ],
    ctaLabel: 'Go to my dashboard',
    ctaPath: '/dashboard',
  });
}
