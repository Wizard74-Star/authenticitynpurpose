import type { GuidePostSeed, GuideReplySeed } from "./communitySyntheticCatalog";
import { SEED_PERSONA_IDS, postDedupeKey, replyDedupeKey } from "./communitySyntheticCatalog";

const PERSONA_IDS = Object.values(SEED_PERSONA_IDS);

const INTERESTS = ["Spiritual", "Healthy living", "Recovery", "Awakening", "Quantum mysticism"] as const;

const LOCATIONS: { label: string; tags: string[] }[] = [
  { label: "United States - Colorado", tags: ["United States - Colorado"] },
  { label: "United States - Texas", tags: ["United States - Texas"] },
  { label: "United States - Oregon", tags: ["United States - Oregon"] },
  { label: "United States - Florida", tags: ["United States - Florida"] },
  { label: "United States - California", tags: ["United States - California"] },
  { label: "United States - New York", tags: ["United States - New York"] },
  { label: "Canada", tags: ["Canada"] },
  { label: "United Kingdom", tags: ["United Kingdom"] },
  { label: "Australia", tags: ["Australia"] },
  { label: "United States - Tennessee", tags: ["United States - Tennessee"] },
];

const TITLE_STEMS: Record<(typeof INTERESTS)[number], string[]> = {
  Spiritual: [
    "Quiet moment worth sharing",
    "Gratitude in a busy week",
    "Faith without performance",
    "Sacred ordinary moments",
    "Prayer and presence",
    "Hope in small steps",
  ],
  "Healthy living": [
    "A habit that actually stuck",
    "Gentle wellness check-in",
    "Energy after small changes",
    "Rest as part of health",
    "Movement that feels kind",
    "Nourishing body and mind",
  ],
  Recovery: [
    "Another day choosing recovery",
    "Fellowship without comparison",
    "Progress I almost missed",
    "Accountability with kindness",
    "One win from this week",
    "Staying honest with myself",
  ],
  Awakening: [
    "Noticing what shifted inside",
    "Less noise, more truth",
    "Patterns I am releasing",
    "Listening before reacting",
    "A season of becoming",
    "Curiosity over certainty",
  ],
  "Quantum mysticism": [
    "Wonder without debate",
    "Connection beyond labels",
    "Mystery and humility",
    "Field notes on meaning",
    "Awe in daily life",
    "Questions I am sitting with",
  ],
};

const BODY_TEMPLATES: Record<(typeof INTERESTS)[number], string[]> = {
  Spiritual: [
    "I am learning to show up quietly for what matters. No debating beliefs here — just sharing what steadies me. What has helped you lately?",
    "Some days faith looks like breathing and being honest. Grateful for a space that feels respectful and warm.",
    "I have been protecting a little stillness each morning. It is not perfect, but it is real. Anyone else building a gentle rhythm?",
  ],
  "Healthy living": [
    "Small choices added up more than big resolutions for me. Sharing in case it encourages someone starting gentle.",
    "I am focusing on sleep, water, and short walks. Nothing flashy — just sustainable. What is working for you?",
    "Wellness for me is kind routines, not punishment. Happy to swap practical ideas here.",
  ],
  Recovery: [
    "Recovery taught me to celebrate quiet progress. This board feels like a place for honesty without scorekeeping.",
    "One day at a time is not a slogan for me — it is how I live. Grateful for people who understand the long road.",
    "If you are looking for encouragement without judgment, you are welcome here. What are you proud of this week?",
  ],
  Awakening: [
    "I am noticing old stories before they run the day. Still messy, still learning. Anyone else in that in-between season?",
    "Awakening has been less fireworks and more honesty for me. Curious how you practice self-compassion while growing.",
    "Less performing, more listening — to myself and others. Sharing in case it resonates.",
  ],
  "Quantum mysticism": [
    "I enjoy these ideas as invitations to wonder, not arguments to win. Meditation and reading have been enough for me.",
    "Holding mystery with humility has softened my heart. Happy to explore questions respectfully together.",
    "I like metaphors that remind me we are connected. Not looking to debate — just to learn alongside you.",
  ],
};

const REPLY_SNIPPETS = [
  "Thank you for sharing this — it really resonates.",
  "Grateful for your honesty. Cheering you on.",
  "This helped me today. Appreciate you posting it.",
  "Beautifully said. Would love to hear what practice supports you most.",
  "I needed this reminder. Thanks for keeping the tone kind here.",
  "Count me in for thoughtful conversation. You are not alone.",
  "Love the gentleness in this thread. Saving it for a hard day.",
  "Same here. Small steps still count.",
  "Sending encouragement as you keep showing up.",
  "Curious what book, habit, or practice sparked this for you?",
];

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function pickOtherPersona(exclude: string): string {
  const pool = PERSONA_IDS.filter((id) => id !== exclude);
  return pick(pool);
}

export const RANDOM_POSTS_PER_CLICK = 3;
export const RANDOM_REPLIES_PER_NEW_POST = 2;
export const RANDOM_REPLIES_ON_EXISTING_POSTS = 2;

export function generateRandomPosts(
  count: number,
  existingPostKeys: Set<string>,
): GuidePostSeed[] {
  const results: GuidePostSeed[] = [];
  let attempts = 0;
  const maxAttempts = count * 25;

  while (results.length < count && attempts < maxAttempts) {
    attempts += 1;
    const interest = pick(INTERESTS);
    const userId = pick(PERSONA_IDS);
    const stem = pick(TITLE_STEMS[interest]);
    const suffix = String(1000 + Math.floor(Math.random() * 9000));
    const title = `${stem} — ${suffix}`;
    const key = postDedupeKey(userId, title);
    if (existingPostKeys.has(key)) continue;

    const loc = pick(LOCATIONS);
    const body = pick(BODY_TEMPLATES[interest]);
    const extraInterest = Math.random() > 0.7 && interest !== "Spiritual" ? ["Spiritual"] : [];

    existingPostKeys.add(key);
    results.push({
      userId,
      title,
      body,
      location: loc.label,
      locationTags: loc.tags,
      interests: Array.from(new Set([interest, ...extraInterest])),
    });
  }

  return results;
}

export function generateRandomRepliesForPosts(
  posts: { title: string; userId: string }[],
  repliesPerPost: number,
  existingReplyKeys: Set<string>,
): GuideReplySeed[] {
  const results: GuideReplySeed[] = [];

  for (const post of posts) {
    let added = 0;
    let attempts = 0;
    while (added < repliesPerPost && attempts < repliesPerPost * 10) {
      attempts += 1;
      const userId = pickOtherPersona(post.userId);
      const content = pick(REPLY_SNIPPETS);
      const key = replyDedupeKey(post.title, userId, content);
      if (existingReplyKeys.has(key)) continue;
      existingReplyKeys.add(key);
      results.push({ postTitle: post.title, userId, content });
      added += 1;
    }
  }

  return results;
}

export function generateRandomRepliesOnExisting(
  existingPosts: { title: string; userId: string }[],
  count: number,
  existingReplyKeys: Set<string>,
): GuideReplySeed[] {
  if (!existingPosts.length || count <= 0) return [];

  const results: GuideReplySeed[] = [];
  let attempts = 0;
  while (results.length < count && attempts < count * 15) {
    attempts += 1;
    const post = pick(existingPosts);
    const userId = pickOtherPersona(post.userId);
    const content = `${pick(REPLY_SNIPPETS)} ${pick(REPLY_SNIPPETS)}`.slice(0, 280);
    const key = replyDedupeKey(post.title, userId, content);
    if (existingReplyKeys.has(key)) continue;
    existingReplyKeys.add(key);
    results.push({ postTitle: post.title, userId, content });
  }

  return results;
}
