/**
 * Vercel Cron: Send due reminders via Firebase Cloud Messaging and/or Resend email.
 * Schedule: every minute (vercel.json crons).
 *
 * Env: SUPABASE_URL or VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 *      RESEND_API_KEY, RESEND_FROM_EMAIL (optional),
 *      FIREBASE_SERVICE_ACCOUNT_JSON (optional if email-only),
 *      CRON_SECRET (recommended).
 */
import { createClient } from '@supabase/supabase-js';
import * as admin from 'firebase-admin';
import { sendResendEmail, appBaseUrl } from './lib/resendEmail';

type Req = {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
};

type Res = {
  status: (code: number) => { json: (body: unknown) => void };
};

type ReminderRow = {
  id: string;
  user_id: string;
  message: string;
  type: string;
  entity_id: string;
  entity_type: string;
  channels: string[] | null;
};

type PrefRow = {
  user_id: string;
  fcm_token: string | null;
  push_enabled: boolean;
  email_enabled: boolean;
  email_address: string | null;
};

export default async function handler(req: Req, res: Res): Promise<void> {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const authHeader = req.headers?.['authorization'];
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const resendConfigured = Boolean(process.env.RESEND_API_KEY);

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase config');
    res.status(500).json({ error: 'Server configuration error' });
    return;
  }

  if (!serviceAccountJson && !resendConfigured) {
    console.error('Need FIREBASE_SERVICE_ACCOUNT_JSON and/or RESEND_API_KEY');
    res.status(500).json({ error: 'No push or email provider configured' });
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  let firebaseReady = false;
  if (serviceAccountJson) {
    if (!admin.apps.length) {
      try {
        const serviceAccount = JSON.parse(serviceAccountJson) as admin.ServiceAccount;
        admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
      } catch (e) {
        console.error('Firebase Admin init error:', e);
        res.status(500).json({ error: 'Firebase init failed' });
        return;
      }
    }
    firebaseReady = true;
  }

  const now = new Date().toISOString();

  const { data: reminders, error: remindersError } = await supabase
    .from('reminders')
    .select('id, user_id, message, type, entity_id, entity_type, channels')
    .eq('is_sent', false)
    .lte('reminder_time', now)
    .limit(100);

  if (remindersError) {
    console.error('Supabase reminders fetch error:', remindersError);
    res.status(500).json({ error: remindersError.message });
    return;
  }

  const list = (reminders ?? []) as ReminderRow[];

  if (!list.length) {
    res.status(200).json({ sent: 0, message: 'No due reminders' });
    return;
  }

  const userIds = [...new Set(list.map((r) => r.user_id))];
  const { data: prefRows } = await supabase
    .from('reminder_preferences')
    .select('user_id, fcm_token, push_enabled, email_enabled, email_address')
    .in('user_id', userIds);

  const prefByUser = new Map<string, PrefRow>();
  for (const p of (prefRows ?? []) as PrefRow[]) {
    prefByUser.set(p.user_id, p);
  }

  const emailByUserId = new Map<string, string>();
  await Promise.all(
    userIds.map(async (uid) => {
      const { data, error } = await supabase.auth.admin.getUserById(uid);
      if (!error && data.user?.email) emailByUserId.set(uid, data.user.email);
    })
  );

  let sent = 0;

  for (const reminder of list) {
    const prefs = prefByUser.get(reminder.user_id);
    const ch = reminder.channels ?? [];
    const wantsPush = ch.length === 0 || ch.includes('push');
    const wantsEmail = ch.length === 0 || ch.includes('email');

    const pushEnabled = prefs?.push_enabled !== false;
    const token = prefs?.fcm_token ?? null;
    // No reminder_preferences row yet → still send email (same default as transactional API).
    const emailEnabled = prefs == null ? true : prefs.email_enabled === true;
    const emailTo =
      emailEnabled && wantsEmail
        ? (prefs?.email_address?.trim() || emailByUserId.get(reminder.user_id) || '').trim()
        : '';

    let pushOk = false;
    let emailOk = false;

    const tryPush = firebaseReady && wantsPush && pushEnabled && Boolean(token);
    const tryEmail = resendConfigured && Boolean(emailTo);

    if (!tryPush && !tryEmail) {
      await supabase.from('reminders').update({ is_sent: true }).eq('id', reminder.id);
      continue;
    }

    if (tryPush && token) {
      try {
        await admin.messaging().send({
          token,
          notification: {
            title: 'Goal Reminder',
            body: reminder.message,
          },
          data: {
            type: reminder.type,
            entity_id: reminder.entity_id || '',
            entity_type: reminder.entity_type || '',
            url: '/',
          },
          webpush: {
            fcmOptions: { link: '/' },
          },
        });
        pushOk = true;
      } catch (e) {
        console.error('FCM send error for reminder', reminder.id, e);
      }
    }

    if (tryEmail && emailTo) {
      const base = appBaseUrl();
      const er = await sendResendEmail({
        to: emailTo,
        subject: 'Reminder — Authenticity & Purpose',
        html: `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;max-width:560px;margin:24px auto;">
<p style="font-size:16px;">${escapeHtml(reminder.message)}</p>
<p style="font-size:13px;color:#666;"><a href="${base}/dashboard">Open your dashboard</a></p>
</body></html>`,
      });
      if (er.ok) emailOk = true;
      else console.error('Resend error for reminder', reminder.id, er.error);
    }

    if (pushOk || emailOk) {
      await supabase.from('reminders').update({ is_sent: true }).eq('id', reminder.id);
      sent++;
    }
  }

  res.status(200).json({ sent, total: list.length });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
