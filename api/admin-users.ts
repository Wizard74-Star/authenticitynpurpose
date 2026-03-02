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

export interface AdminUsersResponse {
  users: { id: string; email: string | null; created_at: string; last_sign_in_at: string | null }[];
  error?: string;
}

export default async function handler(
  req: { method?: string; headers?: Record<string, string | string[] | undefined> },
  res: { status: (n: number) => { json: (o: unknown) => void }; setHeader: (k: string, v: string) => void }
) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).json({});
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const authHeader = req.headers?.authorization;
  const token = typeof authHeader === 'string' && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
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
  const { data: { user }, error: userError } = await anonClient.auth.getUser(token);
  if (userError || !user) {
    res.status(401).json({ error: 'Invalid or missing token' });
    return;
  }

  const emailToCheck = (user.email ?? (user.user_metadata?.email as string | undefined) ?? '').trim() || undefined;
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const adminOk = await isAdmin(supabase, emailToCheck);
  if (!adminOk) {
    res.status(403).json({
      error: 'Admin access required',
      hint: emailToCheck
        ? `Add this email to public.admins in Supabase: ${emailToCheck}`
        : 'Your account has no email; add your admin email to public.admins.',
    });
    return;
  }

  try {
    const { data: { users }, error } = await supabase.auth.admin.listUsers({ perPage: 200 });
    if (error) {
      console.error('List users error:', error);
      res.status(500).json({ error: error.message, users: [] });
      return;
    }

    const { data: subs } = await supabase.from('subscriptions').select('user_id, status, plan_name, stripe_subscription_id');
    const subByUser = new Map<string, { status: string; plan_name: string | null; stripe_subscription_id: string | null }>();
    for (const row of subs ?? []) {
      const r = row as { user_id: string; status: string; plan_name: string | null; stripe_subscription_id: string | null };
      subByUser.set(r.user_id, {
        status: r.status,
        plan_name: r.plan_name ?? null,
        stripe_subscription_id: r.stripe_subscription_id ?? null,
      });
    }

    function accessType(
      s: { status: string; plan_name: string | null; stripe_subscription_id: string | null } | undefined
): 'paid' | 'trial' | 'invite_premium' | 'free' {
      if (!s) return 'free';
      if (s.status === 'trialing') return 'trial';
      if (s.status === 'active') {
        const plan = (s.plan_name ?? '').toLowerCase();
        if (plan === 'lifetime' && !s.stripe_subscription_id) return 'invite_premium';
        return 'paid';
      }
      return 'free';
    }

    const list = (users ?? []).map((u) => {
      const sub = subByUser.get(u.id);
      return {
        id: u.id,
        email: u.email ?? null,
        created_at: u.created_at ?? '',
        last_sign_in_at: u.last_sign_in_at ?? null,
        access_type: accessType(sub),
      };
    });
    res.status(200).json({ users: list });
  } catch (err) {
    console.error('Admin users error:', err);
    res.status(500).json({ error: 'Failed to list users', users: [] });
  }
}
