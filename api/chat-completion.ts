/**
 * Server-side chat completion for the site AI chatbot.
 * Uses OPENAI_API_KEY from .env.local (no OpenAI project ID).
 */

import { getOpenAiApiKey, openAiAuthHeaders, OPENAI_CHAT_COMPLETIONS_URL } from './lib/openAiEnv.js';

type ChatMessage = { role: 'user' | 'assistant'; content: string };

export default async function handler(
  req: { method?: string; body?: { messages?: ChatMessage[] } },
  res: {
    status: (n: number) => { json: (o: unknown) => void };
    setHeader: (k: string, v: string) => void;
  }
) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).json({});
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = getOpenAiApiKey();
  if (!apiKey) {
    res.status(503).json({
      error: 'AI chat not configured',
      detail: 'Set OPENAI_API_KEY in .env.local (VITE_OPENAI_API_KEY also works).',
    });
    return;
  }

  const messages = req.body?.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'Missing or empty messages array' });
    return;
  }

  const valid = messages.every(
    (m) =>
      m &&
      typeof m === 'object' &&
      (m.role === 'user' || m.role === 'assistant') &&
      typeof m.content === 'string'
  );
  if (!valid) {
    res.status(400).json({ error: 'Each message must have role (user|assistant) and content string' });
    return;
  }

  try {
    const response = await fetch(OPENAI_CHAT_COMPLETIONS_URL, {
      method: 'POST',
      headers: openAiAuthHeaders(apiKey),
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        temperature: 0.7,
        max_tokens: 600,
      }),
    });

    if (response.status === 401) {
      res.status(503).json({
        error: 'Invalid OpenAI API key',
        detail: 'Check OPENAI_API_KEY on the server.',
      });
      return;
    }

    if (response.status === 429) {
      res.status(429).json({
        error: 'Too many requests',
        detail: 'Please wait a moment and try again.',
      });
      return;
    }

    if (!response.ok) {
      const errText = await response.text();
      console.error('OpenAI API error:', response.status, errText);
      res.status(502).json({ error: 'AI request failed', detail: errText });
      return;
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const reply =
      data.choices?.[0]?.message?.content?.trim() ?? null;

    if (!reply) {
      res.status(502).json({ error: 'Empty AI response' });
      return;
    }

    res.status(200).json({ reply });
  } catch (err) {
    console.error('Chat completion error:', err);
    res.status(500).json({
      error: 'Chat completion failed',
      detail: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}
