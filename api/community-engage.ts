import { createClient } from "@supabase/supabase-js";
import { pickInterestForPost, pickReactiveReply } from "./lib/communityEngage.js";

type Req = {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
  body?: { post_id?: string; human_reply_id?: string };
};

type Res = {
  status: (n: number) => { json: (o: unknown) => void };
  setHeader: (k: string, v: string) => void;
};

const SEED_PERSONA_IDS = [
  "f47ac10b-58cc-4372-a567-0e02b2c3d601",
  "f47ac10b-58cc-4372-a567-0e02b2c3d602",
  "f47ac10b-58cc-4372-a567-0e02b2c3d603",
  "f47ac10b-58cc-4372-a567-0e02b2c3d604",
  "f47ac10b-58cc-4372-a567-0e02b2c3d605",
  "f47ac10b-58cc-4372-a567-0e02b2c3d606",
];

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

  if (process.env.COMMUNITY_BOT_REPLY_ENABLED === "false") {
    res.status(200).json({ skipped: true, reason: "disabled" });
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

  const humanUserId = authData.user.id;
  const service = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: humanProfile } = await service
    .from("profiles")
    .select("is_seed_account")
    .eq("id", humanUserId)
    .maybeSingle();
  if (humanProfile?.is_seed_account) {
    res.status(200).json({ skipped: true, reason: "seed_account" });
    return;
  }

  const { data: post, error: postError } = await service
    .from("connection_posts")
    .select("id, interests, moderation_status")
    .eq("id", postId)
    .maybeSingle();
  if (postError || !post || post.moderation_status !== "approved") {
    res.status(404).json({ error: "Post not found or not approved" });
    return;
  }

  const { data: humanReply, error: replyError } = await service
    .from("connection_replies")
    .select("id, user_id, post_id, is_synthetic, created_at")
    .eq("id", humanReplyId)
    .maybeSingle();
  if (replyError || !humanReply || humanReply.post_id !== postId || humanReply.user_id !== humanUserId) {
    res.status(400).json({ error: "Invalid human reply" });
    return;
  }
  if (humanReply.is_synthetic) {
    res.status(200).json({ skipped: true, reason: "synthetic_reply" });
    return;
  }

  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const { data: recentSynthetic } = await service
    .from("connection_replies")
    .select("id")
    .eq("post_id", postId)
    .eq("is_synthetic", true)
    .gte("created_at", fiveMinutesAgo)
    .limit(1);
  if ((recentSynthetic ?? []).length > 0) {
    res.status(200).json({ skipped: true, reason: "rate_limited" });
    return;
  }

  const { count: syntheticCount } = await service
    .from("connection_replies")
    .select("id", { count: "exact", head: true })
    .eq("post_id", postId)
    .eq("is_synthetic", true);
  if ((syntheticCount ?? 0) >= 12) {
    res.status(200).json({ skipped: true, reason: "thread_cap" });
    return;
  }

  const interest = pickInterestForPost((post.interests as string[]) ?? []);
  const content = pickReactiveReply(interest, humanReplyId.split("").reduce((a, c) => a + c.charCodeAt(0), 0));

  const personaId = SEED_PERSONA_IDS[Math.abs(humanReplyId.charCodeAt(0)) % SEED_PERSONA_IDS.length];
  const botUserId = personaId === humanUserId
    ? SEED_PERSONA_IDS[(SEED_PERSONA_IDS.indexOf(personaId) + 1) % SEED_PERSONA_IDS.length]
    : personaId;

  const { data: inserted, error: insertError } = await service
    .from("connection_replies")
    .insert({
      post_id: postId,
      user_id: botUserId,
      content,
      moderation_status: "approved",
      is_synthetic: true,
    })
    .select("id")
    .single();

  if (insertError) {
    res.status(500).json({ error: insertError.message });
    return;
  }

  res.status(200).json({ ok: true, reply_id: inserted?.id });
}
