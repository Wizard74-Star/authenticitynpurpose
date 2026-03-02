import { createClient, type SupabaseClient } from '@supabase/supabase-js';

function normalizeEmail(email: string | undefined): string {
  if (!email || typeof email !== 'string') return '';
  return email.trim().toLowerCase();
}

async function isAdmin(
  supabaseService: SupabaseClient,
  email: string | undefined
): Promise<boolean> {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;
  const { data: rows, error } = await supabaseService
    .from('admins')
    .select('id, email');
  if (error) {
    console.error('Admins lookup error:', error);
    return false;
  }
  const list = (rows ?? []) as { id: string; email: string }[];
  return list.some((row) => normalizeEmail(row.email) === normalized);
}

function getAuthPayload(
  req: { method?: string; body?: unknown; query?: Record<string, string | string[] | undefined> }
): { id?: string; email?: string; password?: string; user_metadata?: Record<string, unknown>; action?: string } {
  const id =
    typeof req.query?.id === 'string'
      ? req.query.id
      : Array.isArray(req.query?.id)
        ? req.query.id[0]
        : undefined;
  if (req.method === 'GET' || req.method === 'DELETE') {
    return { id };
  }
  const body = req.body as Record<string, unknown> | undefined;
  return {
    id: (body?.id ?? id) as string | undefined,
    email: body?.email as string | undefined,
    password: body?.password as string | undefined,
    user_metadata: body?.user_metadata as Record<string, unknown> | undefined,
    action: body?.action as string | undefined,
  };
}

export default async function handler(
  req: {
    method?: string;
    headers?: Record<string, string | string[] | undefined>;
    body?: unknown;
    query?: Record<string, string | string[] | undefined>;
  },
  res: {
    status: (n: number) => { json: (o: unknown) => void };
    setHeader: (k: string, v: string) => void;
  }
) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).json({});
    return;
  }

  if (!['GET', 'POST', 'PATCH', 'DELETE'].includes(req.method ?? '')) {
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

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
    res.status(500).json({ error: 'Server not configured' });
    return;
  }

  const anonClient = createClient(supabaseUrl, supabaseAnonKey);
  const {
    data: { user: caller },
    error: userError,
  } = await anonClient.auth.getUser(token);
  if (userError || !caller) {
    res.status(401).json({ error: 'Invalid or missing token' });
    return;
  }

  const emailToCheck = (
    caller.email ??
    (caller.user_metadata?.email as string | undefined) ??
    ''
  ).trim() || undefined;
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const adminOk = await isAdmin(supabase, emailToCheck);
  if (!adminOk) {
    res.status(403).json({
      error: 'Admin access required',
      hint: emailToCheck
        ? `Add this email to public.admins: ${emailToCheck}`
        : 'Add your admin email to public.admins.',
    });
    return;
  }

  const { id, email, password, user_metadata, action } = getAuthPayload(req);

  try {
    if (req.method === 'GET') {
      if (!id) {
        res.status(400).json({ error: 'Missing user id (query id)' });
        return;
      }
      const { data: { user }, error } = await supabase.auth.admin.getUserById(id);
      if (error) {
        if (error.message?.toLowerCase().includes('not found')) {
          res.status(404).json({ error: 'User not found' });
          return;
        }
        res.status(500).json({ error: error.message });
        return;
      }
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('status, plan_name, stripe_subscription_id')
        .eq('user_id', id)
        .maybeSingle();
      const s = sub as { status: string; plan_name: string | null; stripe_subscription_id: string | null } | null;
      let access_type: 'paid' | 'trial' | 'invite_premium' | 'free' = 'free';
      if (s) {
        if (s.status === 'trialing') access_type = 'trial';
        else if (s.status === 'active') {
          access_type =
            (s.plan_name ?? '').toLowerCase() === 'lifetime' && !s.stripe_subscription_id
              ? 'invite_premium'
              : 'paid';
        }
      }
      res.status(200).json({
        user: {
          id: user.id,
          email: user.email ?? null,
          created_at: user.created_at ?? '',
          last_sign_in_at: user.last_sign_in_at ?? null,
          user_metadata: user.user_metadata ?? {},
          access_type,
        },
      });
      return;
    }

    if (req.method === 'POST') {
      const em = typeof email === 'string' ? email.trim().toLowerCase() : '';
      if (!em) {
        res.status(400).json({ error: 'Missing email' });
        return;
      }
      const pass = typeof password === 'string' && password.length >= 6 ? password : undefined;
      const { data: { user }, error } = await supabase.auth.admin.createUser({
        email: em,
        password: pass ?? undefined,
        email_confirm: true,
        user_metadata: user_metadata ?? undefined,
      });
      if (error) {
        res.status(400).json({ error: error.message });
        return;
      }
      res.status(201).json({
        user: {
          id: user.id,
          email: user.email ?? null,
          created_at: user.created_at ?? '',
        },
      });
      return;
    }

    if (req.method === 'PATCH') {
      if (!id) {
        res.status(400).json({ error: 'Missing user id (body id or query id)' });
        return;
      }
      if (action === 'upgrade_trial_to_premium') {
        const { data: sub, error: subError } = await supabase
          .from('subscriptions')
          .update({ status: 'active' })
          .eq('user_id', id)
          .eq('status', 'trialing')
          .select('id, status')
          .maybeSingle();
        if (subError) {
          res.status(500).json({ error: subError.message });
          return;
        }
        if (!sub) {
          res.status(404).json({ error: 'No trialing subscription found for this user' });
          return;
        }
        res.status(200).json({ success: true, subscription: { id: sub.id, status: sub.status } });
        return;
      }
      const updates: { email?: string; user_metadata?: Record<string, unknown> } = {};
      if (typeof email === 'string' && email.trim()) updates.email = email.trim().toLowerCase();
      if (user_metadata && typeof user_metadata === 'object') updates.user_metadata = user_metadata;
      if (Object.keys(updates).length === 0) {
        res.status(400).json({ error: 'No updates provided (email, user_metadata, or action)' });
        return;
      }
      const { data: { user }, error } = await supabase.auth.admin.updateUserById(id, updates);
      if (error) {
        res.status(400).json({ error: error.message });
        return;
      }
      res.status(200).json({
        user: {
          id: user.id,
          email: user.email ?? null,
          user_metadata: user.user_metadata ?? {},
        },
      });
      return;
    }

    if (req.method === 'DELETE') {
      if (!id) {
        res.status(400).json({ error: 'Missing user id (query id)' });
        return;
      }
      if (id === caller.id) {
        res.status(400).json({ error: 'Cannot delete your own account' });
        return;
      }
      const { error } = await supabase.auth.admin.deleteUser(id);
      if (error) {
        res.status(400).json({ error: error.message });
        return;
      }
      res.status(200).json({ success: true });
      return;
    }
  } catch (err) {
    console.error('Admin user error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}
