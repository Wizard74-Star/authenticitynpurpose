import { createClient } from "@supabase/supabase-js";
import { reactToMemberReply } from "./lib/communityGuideService.js";

type Req = {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
  body?: { post_id?: string; human_reply_id?: string };
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

  const postId = req.body?.post_id;
  const humanReplyId = req.body?.human_reply_id;
  if (!postId || !humanReplyId) {
    res.status(400).json({ error: "post_id and human_reply_id are required" });
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

  const service = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const result = await reactToMemberReply(service, {
    postId,
    humanReplyId,
    humanUserId: authData.user.id,
  });

  if ("error" in result && result.error) {
    const status = result.error.includes("not found") ? 404 : result.error.includes("Invalid") ? 400 : 500;
    res.status(status).json({ error: result.error });
    return;
  }
  if ("skipped" in result) {
    res.status(200).json(result);
    return;
  }
  res.status(200).json(result);
}
