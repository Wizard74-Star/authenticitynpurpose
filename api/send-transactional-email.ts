import { createClient } from '@supabase/supabase-js';
import { sendResendEmail, emailShell, appBaseUrl } from './lib/resendEmail';
import { getSupabaseService } from './lib/supabaseService';

type Req = {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
  body?: { kind?: string; payload?: Record<string, unknown> } | string | null;
};

type Res = {
  status: (code: number) => { json: (body: unknown) => void };
  setHeader: (k: string, v: string) => void;
};

function cors(res: Res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

/**
 * If the user has never saved notification settings, no row exists — still send to their
 * login email so Resend isn’t a no-op. If a row exists, respect email_enabled.
 */
function resolveToEmail(
  prefs: { email_enabled?: boolean; email_address?: string | null } | null,
  userEmail: string | undefined
): string | null {
  const login = (userEmail ?? '').trim();
  if (!login) return null;
  if (prefs == null) return login;
  if (prefs.email_enabled !== true) return null;
  const addr = (prefs.email_address ?? '').trim();
  return addr || login;
}

export default async function handler(req: Req, res: Res): Promise<void> {
  cors(res);
  if (req.method === 'OPTIONS') {
    res.status(200).json({});
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const authHeader = req.headers?.authorization;
  const token =
    typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : null;
  if (!token) {
    res.status(401).json({ error: 'Missing Authorization token' });
    return;
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    res.status(500).json({ error: 'Server not configured' });
    return;
  }

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser();
  if (userError || !user) {
    res.status(401).json({ error: 'Invalid or missing token' });
    return;
  }

  const body = normalizeBody(req);
  const kind = body.kind;
  const payload = body.payload ?? {};
  if (!kind || typeof kind !== 'string') {
    res.status(400).json({ error: 'Missing kind' });
    return;
  }

  const service = getSupabaseService();
  const base = appBaseUrl();

  if (kind === 'welcome_once') {
    const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
    if (meta.welcome_email_sent === true) {
      res.status(200).json({ ok: true, skipped: true });
      return;
    }
    const to = user.email;
    if (!to) {
      res.status(400).json({ error: 'No email on account' });
      return;
    }
    const html = emailShell(
      'Welcome to Authenticity & Purpose',
      `<p>Thanks for joining. Your goals, plan, and to-dos are in one place—open the app anytime to stay aligned with what matters.</p>
       <p><a href="${base}/dashboard" style="color:#2563eb;">Go to your dashboard</a></p>`
    );
    const r = await sendResendEmail({
      to,
      subject: 'Welcome to Authenticity & Purpose',
      html,
    });
    if (!r.ok) {
      res.status(502).json({ error: r.error });
      return;
    }
    if (service) {
      await service.auth.admin.updateUserById(user.id, {
        user_metadata: { ...meta, welcome_email_sent: true },
      });
    } else {
      console.warn(
        'send-transactional-email: SUPABASE_SERVICE_ROLE_KEY missing; welcome may repeat until set.'
      );
    }
    res.status(200).json({ ok: true });
    return;
  }

  const { data: prefs } = await userClient
    .from('reminder_preferences')
    .select('email_enabled, email_address')
    .eq('user_id', user.id)
    .maybeSingle();

  const to = resolveToEmail(prefs, user.email ?? undefined);
  if (!to) {
    res.status(200).json({ ok: true, skipped: true, reason: 'email_disabled' });
    return;
  }

  const str = (k: string) => (typeof payload[k] === 'string' ? payload[k] : '') as string;

  let subject = 'Authenticity & Purpose';
  let inner = '';

  switch (kind) {
    case 'manifestation_goal_created':
      subject = `New goal: ${str('title') || 'Your goal'}`;
      inner = `<p>You created a goal: <strong>${esc(str('title'))}</strong>.</p>`;
      if (str('description')) inner += `<p>${esc(str('description').slice(0, 500))}</p>`;
      break;
    case 'manifestation_goal_updated':
      subject = `Goal updated: ${str('title') || 'Your goal'}`;
      inner = `<p>Your goal <strong>${esc(str('title'))}</strong> was updated.</p>`;
      break;
    case 'manifestation_goal_deleted':
      subject = `Goal removed: ${str('title') || 'Goal'}`;
      inner = `<p>The goal <strong>${esc(str('title'))}</strong> was removed from your account.</p>`;
      break;
    case 'manifestation_goal_progress': {
      const p = Number(payload.progress);
      subject = `Progress update: ${str('title') || 'Your goal'}`;
      inner = `<p><strong>${esc(str('title'))}</strong> is now at <strong>${Number.isFinite(p) ? p : '—'}/10</strong> on your progress scale.</p>`;
      break;
    }
    case 'manifestation_todo_created':
      subject = `New to-do: ${str('title') || 'Task'}`;
      inner = `<p>New to-do: <strong>${esc(str('title'))}</strong>.</p>`;
      if (str('scheduledDate')) inner += `<p>Scheduled: ${esc(str('scheduledDate'))}${str('timeSlot') ? ` at ${esc(str('timeSlot'))}` : ''}</p>`;
      break;
    case 'manifestation_todo_updated':
      subject = `To-do updated: ${str('title') || 'Task'}`;
      inner = `<p>To-do updated: <strong>${esc(str('title'))}</strong>.</p>`;
      break;
    case 'manifestation_todo_completed':
      subject = `Done: ${str('title') || 'Task'}`;
      inner = `<p>You completed: <strong>${esc(str('title'))}</strong>. Nice work.</p>`;
      break;
    case 'manifestation_todo_deleted':
      subject = `To-do removed: ${str('title') || 'Task'}`;
      inner = `<p>To-do removed: <strong>${esc(str('title'))}</strong>.</p>`;
      break;
    default:
      res.status(400).json({ error: 'Unknown kind' });
      return;
  }

  const r = await sendResendEmail({
    to,
    subject,
    html: emailShell(subject, inner + `<p><a href="${base}/dashboard" style="color:#2563eb;">View dashboard</a></p>`),
  });
  console.log('r', r);
  if (!r.ok) {
    res.status(502).json({ error: r.error });
    return;
  }
  res.status(200).json({ ok: true });
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Vercel usually parses JSON; tolerate string bodies or missing fields. */
function normalizeBody(req: Req): { kind?: string; payload?: Record<string, unknown> } {
  const raw = req.body;
  if (raw == null) return {};
  if (typeof raw === 'string') {
    try {
      const p = JSON.parse(raw) as { kind?: string; payload?: Record<string, unknown> };
      return p && typeof p === 'object' ? p : {};
    } catch {
      return {};
    }
  }
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    const o = raw as { kind?: unknown; payload?: unknown };
    const kind = typeof o.kind === 'string' ? o.kind : undefined;
    const payload =
      o.payload && typeof o.payload === 'object' && !Array.isArray(o.payload)
        ? (o.payload as Record<string, unknown>)
        : undefined;
    return { kind, payload };
  }
  return {};
}
