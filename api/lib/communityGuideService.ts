import type { SupabaseClient } from "@supabase/supabase-js";
import { generateGuideReplyText } from "./communityGuideOpenAi.js";

export const SEED_PERSONA_IDS = [
  "f47ac10b-58cc-4372-a567-0e02b2c3d601",
  "f47ac10b-58cc-4372-a567-0e02b2c3d602",
  "f47ac10b-58cc-4372-a567-0e02b2c3d603",
  "f47ac10b-58cc-4372-a567-0e02b2c3d604",
  "f47ac10b-58cc-4372-a567-0e02b2c3d605",
  "f47ac10b-58cc-4372-a567-0e02b2c3d606",
];

export type GuideEngageResult =
  | { ok: true; reply_id: string }
  | { skipped: true; reason: string }
  | { error: string };

type ServiceClient = SupabaseClient<any>;

const DEFAULT_REPLY_DELAY_MS = 2500;
const MAX_REPLY_DELAY_MS = 8000;

function guideReplyDelayMs(): number {
  const raw = process.env.COMMUNITY_BOT_REPLY_DELAY_MS;
  const n = raw ? parseInt(raw, 10) : DEFAULT_REPLY_DELAY_MS;
  if (!Number.isFinite(n) || n < 0) return DEFAULT_REPLY_DELAY_MS;
  return Math.min(n, MAX_REPLY_DELAY_MS);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isCommunityGuidesDisabled(): boolean {
  return process.env.COMMUNITY_BOT_REPLY_ENABLED === "false";
}

function pickPersona(seed: string, excludeUserId?: string): string {
  const base = SEED_PERSONA_IDS[Math.abs(seed.charCodeAt(0)) % SEED_PERSONA_IDS.length];
  if (!excludeUserId || base !== excludeUserId) return base;
  return SEED_PERSONA_IDS[(SEED_PERSONA_IDS.indexOf(base) + 1) % SEED_PERSONA_IDS.length];
}

async function isSeedAccount(service: ServiceClient, userId: string): Promise<boolean> {
  const { data } = await service.from("profiles").select("is_seed_account").eq("id", userId).maybeSingle();
  return Boolean(data?.is_seed_account);
}

async function loadThreadContext(
  service: ServiceClient,
  postId: string,
  limit = 8,
): Promise<{ label: string; content: string }[]> {
  const { data: rows } = await service
    .from("connection_replies")
    .select("content, is_synthetic")
    .eq("post_id", postId)
    .eq("moderation_status", "approved")
    .order("created_at", { ascending: true })
    .limit(limit);

  return (rows ?? [])
    .map((row) => {
      const r = row as { content: string; is_synthetic?: boolean };
      const text = (r.content ?? "").trim();
      if (!text) return null;
      return {
        label: r.is_synthetic ? "Community guide" : "Member",
        content: text,
      };
    })
    .filter(Boolean) as { label: string; content: string }[];
}

async function insertGuideReply(
  service: ServiceClient,
  postId: string,
  content: string,
  botUserId: string,
): Promise<GuideEngageResult> {
  const { data: inserted, error } = await service
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

  if (error) return { error: error.message };
  if (!inserted?.id) return { error: "Failed to insert guide reply" };
  return { ok: true, reply_id: inserted.id as string };
}

/** Guide reply after a real member comments on a thread. */
export async function reactToMemberReply(
  service: ServiceClient,
  opts: { postId: string; humanReplyId: string; humanUserId: string },
): Promise<GuideEngageResult> {
  if (isCommunityGuidesDisabled()) return { skipped: true, reason: "disabled" };

  if (await isSeedAccount(service, opts.humanUserId)) {
    return { skipped: true, reason: "seed_account" };
  }

  const { data: post } = await service
    .from("connection_posts")
    .select("id, title, body, interests, moderation_status, user_id, is_synthetic")
    .eq("id", opts.postId)
    .maybeSingle();

  if (!post || post.moderation_status !== "approved") {
    return { error: "Post not found or not approved" };
  }

  const { data: humanReply } = await service
    .from("connection_replies")
    .select("id, user_id, post_id, is_synthetic, created_at, content")
    .eq("id", opts.humanReplyId)
    .maybeSingle();

  if (
    !humanReply ||
    humanReply.post_id !== opts.postId ||
    humanReply.user_id !== opts.humanUserId ||
    humanReply.is_synthetic
  ) {
    return { error: "Invalid human reply" };
  }

  // One guide reply per member message (welcome replies must not block this).
  const { data: alreadyAfterHuman } = await service
    .from("connection_replies")
    .select("id")
    .eq("post_id", opts.postId)
    .eq("is_synthetic", true)
    .gt("created_at", humanReply.created_at as string)
    .limit(1);
  if ((alreadyAfterHuman ?? []).length > 0) {
    return { skipped: true, reason: "already_responded" };
  }

  const { count: syntheticCount } = await service
    .from("connection_replies")
    .select("id", { count: "exact", head: true })
    .eq("post_id", opts.postId)
    .eq("is_synthetic", true);
  if ((syntheticCount ?? 0) >= 12) {
    return { skipped: true, reason: "thread_cap" };
  }

  const interests = (post.interests as string[]) ?? [];
  const seed = opts.humanReplyId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const recentReplies = await loadThreadContext(service, opts.postId);
  const content = await generateGuideReplyText({
    mode: "reply",
    postTitle: (post.title as string) ?? "",
    postBody: (post.body as string) ?? "",
    interests,
    memberReply: (humanReply.content as string) ?? "",
    recentReplies,
    seed,
  });
  const botUserId = pickPersona(opts.humanReplyId, opts.humanUserId);

  const delayMs = guideReplyDelayMs();
  if (delayMs > 0) {
    await sleep(delayMs);
  }

  const { data: stillNeedReply } = await service
    .from("connection_replies")
    .select("id")
    .eq("post_id", opts.postId)
    .eq("is_synthetic", true)
    .gt("created_at", humanReply.created_at as string)
    .limit(1);
  if ((stillNeedReply ?? []).length > 0) {
    return { skipped: true, reason: "already_responded" };
  }

  return insertGuideReply(service, opts.postId, content, botUserId);
}

/** First guide welcome when a real member's post is approved. */
export async function welcomeApprovedMemberPost(
  service: ServiceClient,
  postId: string,
): Promise<GuideEngageResult> {
  if (isCommunityGuidesDisabled()) return { skipped: true, reason: "disabled" };

  const { data: post } = await service
    .from("connection_posts")
    .select("id, user_id, title, body, interests, moderation_status, is_synthetic")
    .eq("id", postId)
    .maybeSingle();

  if (!post || post.moderation_status !== "approved") {
    return { skipped: true, reason: "not_approved" };
  }
  if (post.is_synthetic) {
    return { skipped: true, reason: "synthetic_post" };
  }
  if (await isSeedAccount(service, post.user_id)) {
    return { skipped: true, reason: "seed_author" };
  }

  const { count: existingGuideReplies } = await service
    .from("connection_replies")
    .select("id", { count: "exact", head: true })
    .eq("post_id", postId)
    .eq("is_synthetic", true);
  if ((existingGuideReplies ?? 0) > 0) {
    return { skipped: true, reason: "already_welcomed" };
  }

  const interests = (post.interests as string[]) ?? [];
  const seed = postId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const content = await generateGuideReplyText({
    mode: "welcome",
    postTitle: (post.title as string) ?? "",
    postBody: (post.body as string) ?? "",
    interests,
    seed,
  });
  const botUserId = pickPersona(postId, post.user_id);

  return insertGuideReply(service, postId, content, botUserId);
}
