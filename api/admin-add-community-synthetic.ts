import { createClient } from "@supabase/supabase-js";
import {
  GUIDE_POST_CATALOG,
  GUIDE_REPLY_CATALOG,
  postDedupeKey,
  replyDedupeKey,
} from "./lib/communitySyntheticCatalog";
import {
  generateRandomPosts,
  generateRandomRepliesForPosts,
  generateRandomRepliesOnExisting,
} from "./lib/communitySyntheticGenerator";
import { getSyntheticTimestampRange, replyTimestampAfterPost, staggerTimestamps, toIso } from "./lib/communitySyntheticTime";
import type { GuidePostSeed, GuideReplySeed } from "./lib/communitySyntheticCatalog";

async function isAdmin(service: ReturnType<typeof createClient>, email: string | undefined): Promise<boolean> {
  const normalized = (email ?? "").trim().toLowerCase();
  if (!normalized) return false;
  const { data: rows } = await service.from("admins").select("email");
  return (rows ?? []).some((row: { email: string }) => row.email.trim().toLowerCase() === normalized);
}

type TitlePost = { id: string; title: string; created_at: string; createdMs: number; user_id: string };

async function insertPosts(
  service: ReturnType<typeof createClient>,
  postsToAdd: GuidePostSeed[],
  postTimes: number[],
  maxMs: number,
  titleToPost: Map<string, TitlePost>,
): Promise<number> {
  let postsAdded = 0;
  for (let i = 0; i < postsToAdd.length; i++) {
    const seed = postsToAdd[i];
    const createdMs = postTimes[i] ?? maxMs;
    const { data: inserted, error } = await service
      .from("connection_posts")
      .insert({
        user_id: seed.userId,
        title: seed.title,
        body: seed.body,
        location: seed.location,
        location_tags: seed.locationTags,
        interests: seed.interests,
        moderation_status: "approved",
        is_synthetic: true,
        created_at: toIso(createdMs),
      })
      .select("id, title, created_at, user_id")
      .single();

    if (error || !inserted) {
      throw new Error(error?.message ?? "Failed to insert post");
    }
    titleToPost.set(inserted.title.trim().toLowerCase(), {
      id: inserted.id,
      title: inserted.title,
      created_at: inserted.created_at,
      createdMs,
      user_id: inserted.user_id,
    });
    postsAdded += 1;
  }
  return postsAdded;
}

async function insertReplies(
  service: ReturnType<typeof createClient>,
  repliesToAdd: GuideReplySeed[],
  titleToPost: Map<string, TitlePost>,
  minMs: number,
  maxMs: number,
  existingReplyKeys: Set<string>,
): Promise<number> {
  let repliesAdded = 0;
  const replyTimes = staggerTimestamps(repliesToAdd.length, minMs, maxMs);
  let replyTimeIndex = 0;

  for (const seed of repliesToAdd) {
    const post = titleToPost.get(seed.postTitle.trim().toLowerCase());
    if (!post) continue;

    const key = replyDedupeKey(seed.postTitle, seed.userId, seed.content);
    if (existingReplyKeys.has(key)) continue;

    let createdMs = replyTimes[replyTimeIndex] ?? replyTimestampAfterPost(post.createdMs, maxMs);
    replyTimeIndex += 1;
    if (createdMs <= post.createdMs) {
      createdMs = replyTimestampAfterPost(post.createdMs, maxMs);
    }
    if (createdMs > maxMs) createdMs = maxMs - 30_000;

    const { error } = await service.from("connection_replies").insert({
      post_id: post.id,
      user_id: seed.userId,
      content: seed.content,
      moderation_status: "approved",
      is_synthetic: true,
      created_at: toIso(createdMs),
    });

    if (error) throw new Error(error.message);
    existingReplyKeys.add(key);
    repliesAdded += 1;
  }

  return repliesAdded;
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
    const { data: existingPosts } = await service
      .from("connection_posts")
      .select("id, user_id, title, created_at")
      .eq("is_synthetic", true);

    const { data: existingReplies } = await service
      .from("connection_replies")
      .select("id, post_id, user_id, content, created_at")
      .eq("is_synthetic", true);

    const syntheticPostIds = Array.from(
      new Set((existingReplies ?? []).map((r: { post_id: string }) => r.post_id)),
    );
    const { data: replyPostRows } =
      syntheticPostIds.length > 0
        ? await service.from("connection_posts").select("id, title").in("id", syntheticPostIds)
        : { data: [] };

    const postIdToTitle = new Map(
      (replyPostRows ?? []).map((p: { id: string; title: string }) => [p.id, p.title] as const),
    );

    const existingPostKeys = new Set(
      (existingPosts ?? []).map((p: { user_id: string; title: string }) => postDedupeKey(p.user_id, p.title)),
    );

    const existingReplyKeys = new Set<string>();
    for (const row of existingReplies ?? []) {
      const r = row as { post_id: string; user_id: string; content: string };
      const title = postIdToTitle.get(r.post_id);
      if (!title) continue;
      existingReplyKeys.add(replyDedupeKey(title, r.user_id, r.content));
    }

    let lastMs: number | null = null;
    for (const p of existingPosts ?? []) {
      const t = new Date((p as { created_at: string }).created_at).getTime();
      if (!Number.isNaN(t)) lastMs = lastMs === null ? t : Math.max(lastMs, t);
    }
    for (const r of existingReplies ?? []) {
      const t = new Date((r as { created_at: string }).created_at).getTime();
      if (!Number.isNaN(t)) lastMs = lastMs === null ? t : Math.max(lastMs, t);
    }

    const titleToPost = new Map<string, TitlePost>();
    const existingForReplies: { title: string; userId: string }[] = [];
    for (const p of existingPosts ?? []) {
      const row = p as { id: string; title: string; created_at: string; user_id: string };
      titleToPost.set(row.title.trim().toLowerCase(), {
        id: row.id,
        title: row.title,
        created_at: row.created_at,
        createdMs: new Date(row.created_at).getTime(),
        user_id: row.user_id,
      });
      existingForReplies.push({ title: row.title, userId: row.user_id });
    }

    const catalogAvailable = GUIDE_POST_CATALOG.filter(
      (p) => !existingPostKeys.has(postDedupeKey(p.userId, p.title)),
    );
    const catalogPosts = catalogAvailable.slice(0, postCount);
    const randomNeeded = Math.max(0, postCount - catalogPosts.length);
    const randomPosts = generateRandomPosts(randomNeeded, existingPostKeys);
    const postsToAdd = [...catalogPosts, ...randomPosts];

    const { minMs, maxMs } = getSyntheticTimestampRange(lastMs);
    const postTimes = staggerTimestamps(postsToAdd.length, minMs, maxMs);

    let postsAdded = await insertPosts(service, postsToAdd, postTimes, maxMs, titleToPost);

    const newPostMeta = postsToAdd.map((p) => ({ title: p.title, userId: p.userId }));
    const addedPostTitles = new Set(postsToAdd.map((p) => p.title.trim().toLowerCase()));

    const catalogReplies = GUIDE_REPLY_CATALOG.filter((r) => {
      if (!addedPostTitles.has(r.postTitle.trim().toLowerCase())) return false;
      const key = replyDedupeKey(r.postTitle, r.userId, r.content);
      return !existingReplyKeys.has(key);
    });
    const repliesPerNewPost = 1 + Math.floor(Math.random() * 3);
    const repliesOnExistingCount = 1 + Math.floor(Math.random() * 4);
    const randomOnNew = generateRandomRepliesForPosts(newPostMeta, repliesPerNewPost, existingReplyKeys);
    const randomOnExisting = generateRandomRepliesOnExisting(
      existingForReplies,
      repliesOnExistingCount,
      existingReplyKeys,
    );
    const repliesToAdd = [...catalogReplies, ...randomOnNew, ...randomOnExisting];

    let repliesAdded = await insertReplies(service, repliesToAdd, titleToPost, minMs, maxMs, existingReplyKeys);

    const randomOnly = catalogPosts.length === 0;
    const message =
      postsAdded === 0 && repliesAdded === 0
        ? "Could not add new guide content this time. Try again."
        : randomOnly
          ? `Added ${postsAdded} new random guide post(s) and ${repliesAdded} guide reply(ies).`
          : `Added ${postsAdded} guide post(s) and ${repliesAdded} guide reply(ies).`;

    res.status(200).json({ ok: true, postsAdded, repliesAdded, message });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Failed to add guide content" });
  }
}
