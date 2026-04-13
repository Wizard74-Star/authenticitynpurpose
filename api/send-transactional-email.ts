import { createClient } from '@supabase/supabase-js';
import { sendResendEmail, appBaseUrl } from './lib/resendEmail';
import { getSupabaseService } from './lib/supabaseService';
import { brandTransactionalHtml, escHtml } from './lib/brandEmailHtml';

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

function str(payload: Record<string, unknown>, k: string): string {
  return typeof payload[k] === 'string' ? payload[k] : '';
}

function stepListFromPayload(payload: Record<string, unknown>): string[] {
  const raw = str(payload, 'steps');
  if (!raw) return [];
  return raw.split('|').map((s) => s.trim()).filter(Boolean);
}

function bulletList(items: string[]): string {
  if (!items.length) return '';
  const lis = items.map((t) => `<li style="margin:6px 0;">${escHtml(t)}</li>`).join('');
  return `<ul style="margin:12px 0;padding-left:20px;color:#334155;">${lis}</ul>`;
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
    const html = brandTransactionalHtml({
      kicker: 'You are in',
      title: 'Welcome to Authenticity & Purpose',
      lead: 'This is a quiet corner of the internet built for real goals—not performative hustle, but the work of becoming who you mean to be.',
      blocks: [
        `<p>Your written plan, milestones, and to-dos now live together. Small, honest check-ins beat occasional heroics every time.</p>`,
        `<p>Whenever you are ready, open your dashboard and take one gentle step.</p>`,
      ],
      ctaLabel: 'Step into your dashboard',
      ctaPath: '/dashboard',
    });
    const r = await sendResendEmail({
      to,
      subject: 'Welcome — your path is yours to shape',
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

  let subject = 'Authenticity & Purpose';
  let html = '';

  switch (kind) {
    case 'manifestation_goal_created': {
      const title = str(payload, 'title') || 'Your goal';
      subject = `A new intention is alive: ${title}`;
      const desc = str(payload, 'description').slice(0, 400);
      html = brandTransactionalHtml({
        kicker: 'Goal created',
        title: 'You named something that matters',
        lead: `“${escHtml(title)}” is now part of your map—not because perfection is required, but because direction is.`,
        blocks: [
          desc ? `<p>${escHtml(desc)}</p>` : `<p>Give it a shape in the app when inspiration strikes: steps, dates, and gentle reminders will meet you there.</p>`,
          `<p>One clear goal, revisited kindly, changes more than a dozen forgotten resolutions.</p>`,
        ],
        ctaLabel: 'View this goal',
        ctaPath: '/dashboard',
      });
      break;
    }
    case 'manifestation_goal_deleted': {
      const title = str(payload, 'title') || 'Goal';
      subject = `Released: ${title}`;
      html = brandTransactionalHtml({
        kicker: 'Goal removed',
        title: 'You chose to let this one go',
        lead: `“${escHtml(title)}” is no longer on your list.`,
        blocks: [
          `<p>Ending a chapter with intention is its own kind of integrity. Space you clear today can hold what actually fits you next.</p>`,
        ],
        ctaLabel: 'Return to your dashboard',
        ctaPath: '/dashboard',
      });
      break;
    }
    case 'manifestation_goal_paused': {
      const title = str(payload, 'title') || 'Your goal';
      subject = `Resting for now: ${title}`;
      html = brandTransactionalHtml({
        kicker: 'Goal paused',
        title: 'A pause is not a failure',
        lead: `“${escHtml(title)}” is on hold. Scheduled nudges for this goal are paused so you can breathe without noise.`,
        blocks: [
          `<p>Seasons change. When you are ready to return, your work will still be there—no guilt, no catch-up script required.</p>`,
        ],
        ctaLabel: 'Open your dashboard',
        ctaPath: '/dashboard',
      });
      break;
    }
    case 'manifestation_goal_completed': {
      const title = str(payload, 'title') || 'Your goal';
      subject = `You did it — ${title}`;
      html = brandTransactionalHtml({
        kicker: 'Completion',
        title: 'Take this in',
        lead: `“${escHtml(title)}” is complete. That is not small.`,
        blocks: [
          `<p>Whether it took weeks or years, you stayed in relationship with something you cared about. That deserves a full breath of recognition.</p>`,
          `<p>Celebrate in whatever way actually lands for you—then, when you wish, ask what wants to grow next.</p>`,
        ],
        ctaLabel: 'Celebrate on your dashboard',
        ctaPath: '/dashboard',
      });
      break;
    }
    case 'manifestation_todo_completed': {
      const title = str(payload, 'title') || 'Task';
      subject = `Checked off: ${title}`;
      html = brandTransactionalHtml({
        kicker: 'To-do done',
        title: 'That is momentum',
        lead: `You finished “${escHtml(title)}.”`,
        blocks: [
          `<p>Every finished task is a vote for the life you are building—quiet, concrete, and real.</p>`,
        ],
        ctaLabel: 'See what is next',
        ctaPath: '/dashboard',
      });
      break;
    }
    case 'manifestation_todo_deleted': {
      const title = str(payload, 'title') || 'Task';
      subject = `To-do removed: ${title}`;
      html = brandTransactionalHtml({
        kicker: 'To-do removed',
        title: 'List edited, mind lighter',
        lead: `“${escHtml(title)}” was removed from your list.`,
        blocks: [
          `<p>Pruning what no longer serves you is part of staying honest with your energy.</p>`,
        ],
        ctaLabel: 'Back to your list',
        ctaPath: '/dashboard',
      });
      break;
    }
    case 'manifestation_step_completed': {
      const goalTitle = str(payload, 'goalTitle') || 'Your goal';
      const steps = stepListFromPayload(payload);
      subject =
        steps.length > 1
          ? `${steps.length} steps completed on “${goalTitle}”`
          : `Step complete — ${goalTitle}`;
      html = brandTransactionalHtml({
        kicker: 'Milestone',
        title: steps.length > 1 ? 'Steps worth honoring' : 'A step forward',
        lead:
          steps.length > 1
            ? `On “${escHtml(goalTitle)},” you closed these pieces:`
            : `On “${escHtml(goalTitle)},” you completed a meaningful step.`,
        blocks: [
          steps.length > 1 ? bulletList(steps) : `<p><strong>${escHtml(steps[0] ?? '')}</strong></p>`,
          `<p>Each checkbox is evidence that your bigger vision is not abstract—it is being lived in small, brave moves.</p>`,
        ],
        ctaLabel: 'View your goal',
        ctaPath: '/dashboard',
      });
      break;
    }
    case 'manifestation_step_deleted': {
      const goalTitle = str(payload, 'goalTitle') || 'Your goal';
      const steps = stepListFromPayload(payload);
      subject =
        steps.length > 1
          ? `Steps removed from “${goalTitle}”`
          : `Step removed — ${goalTitle}`;
      html = brandTransactionalHtml({
        kicker: 'Plan adjusted',
        title: 'You refined the path',
        lead:
          steps.length > 1
            ? `From “${escHtml(goalTitle)},” these items were removed:`
            : `From “${escHtml(goalTitle)},” a step was removed.`,
        blocks: [
          steps.length > 1 ? bulletList(steps) : `<p><strong>${escHtml(steps[0] ?? '')}</strong></p>`,
          `<p>Editing your plan is wisdom, not backtracking. The version that fits today is the right one.</p>`,
        ],
        ctaLabel: 'Review your goal',
        ctaPath: '/dashboard',
      });
      break;
    }
    default:
      res.status(400).json({ error: 'Unknown kind' });
      return;
  }

  const r = await sendResendEmail({ to, subject, html });
  if (!r.ok) {
    res.status(502).json({ error: r.error });
    return;
  }
  res.status(200).json({ ok: true });
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
