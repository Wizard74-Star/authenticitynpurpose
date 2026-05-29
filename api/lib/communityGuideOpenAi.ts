import {
  pickInterestForPost,
  pickReactiveReply,
  pickWelcomeReply,
  type CommunitySystemInterest,
} from "./communityEngage.js";
import {
  getOpenAiApiKey,
  getOpenAiChatModel,
  openAiAuthHeaders,
  OPENAI_CHAT_COMPLETIONS_URL,
} from "./openAiEnv.js";
const MAX_REPLY_CHARS = 480;

export type GuideReplyMode = "welcome" | "reply";

export type GuideThreadContext = {
  mode: GuideReplyMode;
  postTitle: string;
  postBody: string;
  interests: string[];
  memberReply?: string;
  recentReplies?: { label: string; content: string }[];
  seed: number;
};

function openAiKey(): string | null {
  if (process.env.COMMUNITY_BOT_USE_TEMPLATES_ONLY === "true") return null;
  return getOpenAiApiKey();
}

function templateFallback(ctx: GuideThreadContext): string {
  const interest = pickInterestForPost(ctx.interests);
  if (ctx.mode === "welcome") {
    return pickWelcomeReply(interest, ctx.seed);
  }
  return pickReactiveReply(interest, ctx.seed);
}

function trimReply(text: string): string {
  const trimmed = text.trim().replace(/^["']|["']$/g, "");
  if (trimmed.length <= MAX_REPLY_CHARS) return trimmed;
  return `${trimmed.slice(0, MAX_REPLY_CHARS - 1).trim()}…`;
}

function buildPrompt(ctx: GuideThreadContext, interest: CommunitySystemInterest): string {
  const interestLine = ctx.interests.length ? ctx.interests.join(", ") : interest;
  const threadBlock =
    ctx.recentReplies && ctx.recentReplies.length > 0
      ? `\nRecent conversation:\n${ctx.recentReplies.map((r) => `- ${r.label}: ${r.content}`).join("\n")}`
      : "";

  if (ctx.mode === "welcome") {
    return `A new member started this thread on a supportive community board.

Title: ${ctx.postTitle}
Body: ${ctx.postBody}
Categories: ${interestLine}
${threadBlock}

Write one welcoming reply (2–4 sentences) that:
- Thanks them for posting and invites thoughtful conversation
- Matches the tone of the categories (especially ${interest})
- Ends with one gentle question when it fits naturally

Reply with only the message text, no quotes or labels.`;
  }

  return `On a supportive community board, a member just replied in this thread.

Original post title: ${ctx.postTitle}
Original post body: ${ctx.postBody}
Categories: ${interestLine}
${threadBlock}

New member reply to respond to:
"${ctx.memberReply ?? ""}"

Write one supportive reply (2–4 sentences) that:
- Responds directly to what they wrote (do not invent details)
- Stays warm, local-community minded, and non-judgmental
- Optionally asks one follow-up question

Reply with only the message text, no quotes or labels.`;
}

export async function generateGuideReplyText(ctx: GuideThreadContext): Promise<string> {
  const apiKey = openAiKey();
  const interest = pickInterestForPost(ctx.interests);

  if (!apiKey) {
    return templateFallback(ctx);
  }

  const model = getOpenAiChatModel("gpt-4o-mini");

  try {
    const response = await fetch(OPENAI_CHAT_COMPLETIONS_URL, {
      method: "POST",
      headers: openAiAuthHeaders(apiKey),
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: `You are a community guide on Authenticity & Purpose — a kind, positive connection board.
Topics include spiritual growth, healthy living, recovery, awakening, and quantum mysticism.
Never mention AI, bots, or automation. No politics, religious debate, harassment, or medical/clinical advice.
Keep replies concise, human, and grounded in what was actually written.`,
          },
          { role: "user", content: buildPrompt(ctx, interest) },
        ],
        temperature: 0.75,
        max_tokens: 180,
      }),
      signal: AbortSignal.timeout(20_000),
    });

    if (!response.ok) {
      console.error("communityGuideOpenAi: request failed", response.status);
      return templateFallback(ctx);
    }

    const json = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = json.choices?.[0]?.message?.content?.trim();
    if (!text) return templateFallback(ctx);
    return trimReply(text);
  } catch (e) {
    console.error("communityGuideOpenAi:", e instanceof Error ? e.message : e);
    return templateFallback(ctx);
  }
}
