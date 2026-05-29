/**
 * Server-side OpenAI API key from .env / .env.local (via Vercel dev or deploy).
 * Uses OPENAI_API_KEY only — no OpenAI project ID header or env var.
 */
export function getOpenAiApiKey(): string | null {
  const raw = process.env.OPENAI_API_KEY ?? process.env.VITE_OPENAI_API_KEY;
  if (!raw) return null;
  const trimmed = raw.trim().replace(/^["']|["']$/g, "");
  return trimmed.length > 0 ? trimmed : null;
}

export const OPENAI_CHAT_COMPLETIONS_URL = "https://api.openai.com/v1/chat/completions";

export function getOpenAiChatModel(defaultModel = "gpt-4o-mini"): string {
  const model = process.env.COMMUNITY_BOT_OPENAI_MODEL?.trim() || process.env.OPENAI_MODEL?.trim();
  return model || defaultModel;
}

/** Authorization header only — no OpenAI-Project header. */
export function openAiAuthHeaders(apiKey: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };
}
