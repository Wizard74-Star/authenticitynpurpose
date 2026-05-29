import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { welcomeApprovedMemberPost } from "./lib/communityGuideService.js";

type Req = {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
  body?: { post_id?: string };
};

type Res = {
  status: (n: number) => { json: (o: unknown) => void };
  setHeader: (k: string, v: string) => void;
};

type ServiceClient = SupabaseClient<any>;

async function isAdmin(service: ServiceClient, email: string | undefined): Promise<boolean> {
  const normalized = (email ?? "").trim().toLowerCase();
  if (!normalized) return false;
  const { data: rows } = await service.from("admins").select("email");
  return (rows ?? []).some((row: { email: string }) => row.email.trim().toLowerCase() === normalized);
}

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

  const postId = req.body?.post_id;
  if (!postId) {
    res.status(400).json({ error: "post_id is required" });
    return;
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
    res.status(500).json({ error: "Server not configured" });
    return;
  }

  const service = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const authHeader = req.headers?.authorization;
  const token = typeof authHeader === "string" && authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const cronSecret = process.env.CRON_SECRET;
  const isCron = Boolean(cronSecret && authHeader === `Bearer ${cronSecret}`);

  if (!isCron) {
    if (!token) {
      res.status(401).json({ error: "Missing Authorization token" });
      return;
    }
    const anon = createClient(supabaseUrl, supabaseAnonKey);
    const { data: authData, error: authError } = await anon.auth.getUser(token);
    if (authError || !authData.user) {
      res.status(401).json({ error: "Invalid token" });
      return;
    }
    if (!(await isAdmin(service, authData.user.email))) {
      res.status(403).json({ error: "Admin only" });
      return;
    }
  }

  const result = await welcomeApprovedMemberPost(service, postId);
  if ("error" in result && result.error) {
    res.status(500).json({ error: result.error });
    return;
  }
  res.status(200).json(result);
}
