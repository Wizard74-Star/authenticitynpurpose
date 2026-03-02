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
    data: { user },
    error: userError,
  } = await anonClient.auth.getUser(token);
  if (userError || !user) {
    res.status(401).json({ error: 'Invalid or missing token' });
    return;
  }

  const emailToCheck = (
    user.email ??
    (user.user_metadata?.email as string | undefined) ??
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
        ? `Add this email to public.admins in Supabase: ${emailToCheck}`
        : 'Your account has no email; add your admin email to public.admins.',
    });
    return;
  }

  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*');
    if (error) {
      console.error('Admin subscriptions error:', error);
      res.status(500).json({ error: error.message, subscriptions: [] });
      return;
    }
    res.status(200).json({ subscriptions: data ?? [] });
  } catch (err) {
    console.error('Admin subscriptions error:', err);
    res.status(500).json({ error: 'Failed to list subscriptions', subscriptions: [] });
  }
}
