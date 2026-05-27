import { createClient } from "@supabase/supabase-js";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

const EMPTY_HINT =
  "Once you save a few appreciations in the categories above, we can reflect on what they say about your values and strengths.";

const DEFAULT_LABELS: Record<string, string> = {
  life: "Life",
  health: "Health",
  "family-friends": "Family & Friends",
  "love-happiness-joy": "Love Happiness & Joy",
  shelter: "Shelter",
  "food-drinks": "Food & Drinks",
  cherish: "Cherish",
  general: "General",
};

type EntryRow = {
  content?: string | null;
  date: string;
  section_key?: string | null;
  section_label?: string | null;
};

function rowsToLines(rows: EntryRow[]): string[] {
  return rows
    .map((row) => {
      const text = (row.content ?? "").trim();
      if (!text) return null;
      const key = row.section_key ?? "general";
      const label = row.section_label?.trim() || DEFAULT_LABELS[key] || key;
      return `- ${row.date} · ${label}: ${text}`;
    })
    .filter(Boolean) as string[];
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
  if (!supabaseUrl || !supabaseAnonKey) {
    res.status(500).json({ error: "Server not configured" });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY ?? process.env.VITE_OPENAI_API_KEY;
  if (!apiKey?.trim()) {
    res.status(503).json({
      error: "AI summary not configured",
      detail: "Set OPENAI_API_KEY on the server.",
    });
    return;
  }

  const anon = createClient(supabaseUrl, supabaseAnonKey);
  const { data: authData, error: authError } = await anon.auth.getUser(token);
  if (authError || !authData.user) {
    res.status(401).json({ error: "Invalid token" });
    return;
  }

  const bodyEntries = (req.body as { entries?: EntryRow[] } | undefined)?.entries;
  let lines: string[] = [];

  if (Array.isArray(bodyEntries) && bodyEntries.length > 0) {
    lines = rowsToLines(bodyEntries);
  }

  if (lines.length === 0 && supabaseServiceKey) {
    const service = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: rows, error: loadError } = await service
      .from("manifestation_gratitude_entries")
      .select("content, date, section_key, section_label")
      .eq("user_id", authData.user.id)
      .order("date", { ascending: false })
      .limit(200);

    if (loadError) {
      res.status(500).json({ error: loadError.message });
      return;
    }
    lines = rowsToLines((rows ?? []) as EntryRow[]);
  }

  if (lines.length === 0) {
    const { data: rows, error: loadError } = await anon
      .from("manifestation_gratitude_entries")
      .select("content, date, section_key, section_label")
      .eq("user_id", authData.user.id)
      .order("date", { ascending: false })
      .limit(200);

    if (loadError) {
      res.status(500).json({ error: loadError.message });
      return;
    }
    lines = rowsToLines((rows ?? []) as EntryRow[]);
  }

  if (lines.length === 0) {
    res.status(200).json({ summary: EMPTY_HINT, empty: true });
    return;
  }

  const prompt = `The user keeps an appreciation journal grouped by categories. Here are their entries (newest dates first):

${lines.join("\n")}

Write a warm, concise reflection (2–4 short paragraphs) that:
1. Summarizes themes in what they appreciate (without listing every item).
2. Gently describes what this may say about their character, priorities, or what they are nurturing in life.
3. Ends with one encouraging sentence.

Do not invent facts not supported by the entries. No medical or clinical claims.`;

  try {
    const response = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a supportive life coach reflecting on gratitude and appreciation journal entries. Be kind, specific, and grounded in what was written.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      res.status(503).json({ error: "AI request failed", detail: errText.slice(0, 200) });
      return;
    }

    const json = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const summary = json.choices?.[0]?.message?.content?.trim();
    if (!summary) {
      res.status(503).json({ error: "Empty AI response" });
      return;
    }

    res.status(200).json({ summary, empty: false });
  } catch {
    res.status(500).json({ error: "Failed to generate summary" });
  }
}
