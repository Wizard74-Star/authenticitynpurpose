/**
 * Vercel Cron: Keep community board warm with guide posts/replies until organic traffic grows.
 * Schedule: twice daily (see vercel.json).
 *
 * Env: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, CRON_SECRET (recommended),
 *      COMMUNITY_GUIDE_CRON_ENABLED=false to disable,
 *      COMMUNITY_BOT_REPLY_ENABLED=false also disables welcome/reply helpers.
 */
import { createClient } from "@supabase/supabase-js";
import { welcomeApprovedMemberPost } from "./lib/communityGuideService.js";
import { runGuideContentBatch } from "./lib/communitySyntheticBatch.js";

type Req = {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
};

type Res = {
  status: (code: number) => { json: (body: unknown) => void };
};

const CRON_POST_COUNT = 2;
const MIN_HOURS_BETWEEN_BATCH = 6;
const MAX_MEMBER_WELCOMES_PER_RUN = 5;

export default async function handler(req: Req, res: Res): Promise<void> {
  if (req.method !== "GET" && req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const authHeader = req.headers?.["authorization"];
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  if (process.env.COMMUNITY_GUIDE_CRON_ENABLED === "false") {
    res.status(200).json({ skipped: true, reason: "cron_disabled" });
    return;
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceKey) {
    res.status(500).json({ error: "Server not configured" });
    return;
  }

  const service = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    const cutoff = new Date(Date.now() - MIN_HOURS_BETWEEN_BATCH * 60 * 60 * 1000).toISOString();
    const { data: recentSynthetic } = await service
      .from("connection_posts")
      .select("created_at")
      .eq("is_synthetic", true)
      .gte("created_at", cutoff)
      .order("created_at", { ascending: false })
      .limit(1);

    let batch = { postsAdded: 0, repliesAdded: 0, message: "Skipped batch (recent guide activity)." };
    if (!(recentSynthetic ?? []).length) {
      batch = await runGuideContentBatch(service, CRON_POST_COUNT);
    }

    const { data: memberPosts } = await service
      .from("connection_posts")
      .select("id")
      .eq("moderation_status", "approved")
      .eq("is_synthetic", false)
      .order("created_at", { ascending: false })
      .limit(30);

    let welcomes = 0;
    for (const row of memberPosts ?? []) {
      if (welcomes >= MAX_MEMBER_WELCOMES_PER_RUN) break;
      const postId = (row as { id: string }).id;
      const { count } = await service
        .from("connection_replies")
        .select("id", { count: "exact", head: true })
        .eq("post_id", postId);
      if ((count ?? 0) > 0) continue;

      const welcome = await welcomeApprovedMemberPost(service, postId);
      if ("ok" in welcome && welcome.ok) welcomes += 1;
    }

    res.status(200).json({
      ok: true,
      batch,
      memberWelcomes: welcomes,
    });
  } catch (error: unknown) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Cron failed",
    });
  }
}
