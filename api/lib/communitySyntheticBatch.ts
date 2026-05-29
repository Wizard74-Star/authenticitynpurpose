import type { SupabaseClient } from "@supabase/supabase-js";
import {
  GUIDE_POST_CATALOG,
  GUIDE_REPLY_CATALOG,
  postDedupeKey,
  replyDedupeKey,
  type GuidePostSeed,
  type GuideReplySeed,
} from "./communitySyntheticCatalog.js";
import {
  generateRandomPosts,
  generateRandomRepliesForPosts,
  generateRandomRepliesOnExisting,
} from "./communitySyntheticGenerator.js";
import {
  getSyntheticTimestampRange,
  replyTimestampAfterPost,
  staggerTimestamps,
  toIso,
} from "./communitySyntheticTime.js";

export type ServiceClient = SupabaseClient<any>;

export type TitlePost = {
  id: string;
  title: string;
  created_at: string;
  createdMs: number;
  user_id: string;
};

export async function insertGuidePosts(
  service: ServiceClient,
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
    titleToPost.set((inserted.title as string).trim().toLowerCase(), {
      id: inserted.id as string,
      title: inserted.title as string,
      created_at: inserted.created_at as string,
      createdMs,
      user_id: inserted.user_id as string,
    });
    postsAdded += 1;
  }
  return postsAdded;
}

export async function insertGuideReplies(
  service: ServiceClient,
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

export type GuideBatchResult = {
  postsAdded: number;
  repliesAdded: number;
  message: string;
};

/** Add guide posts + replies (catalog + random). Used by admin and cron. */
export async function runGuideContentBatch(
  service: ServiceClient,
  postCount: number,
): Promise<GuideBatchResult> {
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

  // Include approved member posts for reply warmth on real threads
  const { data: memberPosts } = await service
    .from("connection_posts")
    .select("id, title, created_at, user_id")
    .eq("moderation_status", "approved")
    .eq("is_synthetic", false)
    .limit(40);

  for (const p of memberPosts ?? []) {
    const row = p as { id: string; title: string; created_at: string; user_id: string };
    const key = row.title.trim().toLowerCase();
    if (!titleToPost.has(key)) {
      titleToPost.set(key, {
        id: row.id,
        title: row.title,
        created_at: row.created_at,
        createdMs: new Date(row.created_at).getTime(),
        user_id: row.user_id,
      });
    }
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

  const postsAdded = await insertGuidePosts(service, postsToAdd, postTimes, maxMs, titleToPost);

  const newPostMeta = postsToAdd.map((p) => ({ title: p.title, userId: p.userId }));
  const addedPostTitles = new Set(postsToAdd.map((p) => p.title.trim().toLowerCase()));

  const catalogReplies = GUIDE_REPLY_CATALOG.filter((r) => {
    if (!addedPostTitles.has(r.postTitle.trim().toLowerCase())) return false;
    const key = replyDedupeKey(r.postTitle, r.userId, r.content);
    return !existingReplyKeys.has(key);
  });
  const repliesPerNewPost = 1 + Math.floor(Math.random() * 2);
  const repliesOnExistingCount = 2 + Math.floor(Math.random() * 3);
  const randomOnNew = generateRandomRepliesForPosts(newPostMeta, repliesPerNewPost, existingReplyKeys);
  const randomOnExisting = generateRandomRepliesOnExisting(
    existingForReplies,
    repliesOnExistingCount,
    existingReplyKeys,
  );
  const repliesToAdd = [...catalogReplies, ...randomOnNew, ...randomOnExisting];

  const repliesAdded = await insertGuideReplies(
    service,
    repliesToAdd,
    titleToPost,
    minMs,
    maxMs,
    existingReplyKeys,
  );

  const randomOnly = catalogPosts.length === 0;
  const message =
    postsAdded === 0 && repliesAdded === 0
      ? "No new guide content added."
      : randomOnly
        ? `Added ${postsAdded} random guide post(s) and ${repliesAdded} guide reply(ies).`
        : `Added ${postsAdded} guide post(s) and ${repliesAdded} guide reply(ies).`;

  return { postsAdded, repliesAdded, message };
}
