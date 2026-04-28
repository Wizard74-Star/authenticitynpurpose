import { createClient } from "@supabase/supabase-js";

type Req = {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
  body?: unknown;
};

type Res = {
  status: (n: number) => { json: (o: unknown) => void };
  setHeader: (k: string, v: string) => void;
};

export default async function handler(req: Req, res: Res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(200).json({});
    return;
  }
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const authHeader = req.headers?.authorization;
  const token = typeof authHeader === "string" && authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    res.status(401).json({ error: "Missing Authorization token" });
    return;
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
    res.status(500).json({ error: "Server not configured" });
    return;
  }

  const anonClient = createClient(supabaseUrl, supabaseAnonKey);
  const { data: authData, error: authError } = await anonClient.auth.getUser(token);
  if (authError || !authData.user) {
    res.status(401).json({ error: "Invalid or missing token" });
    return;
  }

  const ids = ((req.body as { ids?: unknown } | undefined)?.ids ?? []) as unknown[];
  const userIds = Array.from(new Set(ids.filter((id): id is string => typeof id === "string" && id.length > 0))).slice(0, 50);
  if (userIds.length === 0) {
    res.status(200).json({ users: [] });
    return;
  }

  const service = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    const users = await Promise.all(
      userIds.map(async (id) => {
        const { data, error } = await service.auth.admin.getUserById(id);
        if (error || !data.user) return null;
        const fullName = (data.user.user_metadata as { full_name?: string } | undefined)?.full_name ?? null;
        return { id, email: data.user.email ?? null, full_name: fullName };
      }),
    );
    res.status(200).json({ users: users.filter(Boolean) });
  } catch {
    res.status(500).json({ error: "Failed to load user details", users: [] });
  }
}
