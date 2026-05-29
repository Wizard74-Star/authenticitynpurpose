import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { runGuideContentBatch } from "./lib/communitySyntheticBatch.js";

type ServiceClient = SupabaseClient<any>;

async function isAdmin(service: ServiceClient, email: string | undefined): Promise<boolean> {
  const normalized = (email ?? "").trim().toLowerCase();
  if (!normalized) return false;
  const { data: rows } = await service.from("admins").select("email");
  return (rows ?? []).some((row: { email: string }) => row.email.trim().toLowerCase() === normalized);
}

const DEFAULT_POST_COUNT = 3;
const MIN_POST_COUNT = 1;
const MAX_POST_COUNT = 50;

function parsePostCount(body: unknown): number {
  const raw = (body as { postCount?: unknown } | undefined)?.postCount;
  const n = typeof raw === "number" ? raw : typeof raw === "string" ? parseInt(raw, 10) : DEFAULT_POST_COUNT;
  if (!Number.isFinite(n)) return DEFAULT_POST_COUNT;
  return Math.min(MAX_POST_COUNT, Math.max(MIN_POST_COUNT, Math.floor(n)));
}

export default async function handler(
  req: {
    method?: string;
    headers?: Record<string, string | string[] | undefined>;
    body?: unknown;
  },
  res: { status: (n: number) => { json: (o: unknown) => void }; setHeader: (k: string, v: string) => void },
) {
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

  const token =
    typeof req.headers?.authorization === "string" && req.headers.authorization.startsWith("Bearer ")
      ? req.headers.authorization.slice(7)
      : null;
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

  const anon = createClient(supabaseUrl, supabaseAnonKey);
  const { data: authData, error: authError } = await anon.auth.getUser(token);
  if (authError || !authData.user) {
    res.status(401).json({ error: "Invalid token" });
    return;
  }

  const service = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  if (!(await isAdmin(service, authData.user.email))) {
    res.status(403).json({ error: "Admin only" });
    return;
  }

  const postCount = parsePostCount(req.body);

  try {
    const { postsAdded, repliesAdded, message } = await runGuideContentBatch(service, postCount);
    const displayMessage =
      postsAdded === 0 && repliesAdded === 0
        ? "Could not add new guide content this time. Try again."
        : message;
    res.status(200).json({ ok: true, postsAdded, repliesAdded, message: displayMessage });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Failed to add guide content" });
  }
}
