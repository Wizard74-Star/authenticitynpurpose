import { useCallback, useEffect, useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getGratitudeSectionLabel } from "@/data/gratitudeSections";
import type { ManifestationGratitude } from "@/hooks/useManifestationDatabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const EMPTY_HINT =
  "Once you save a few appreciations in the categories above, we can reflect on what they say about your values and strengths.";

const STORAGE_KEY_PREFIX = "appreciation-ai-summary:";

type StoredSummary = {
  summary: string;
  isEmptyHint: boolean;
};

function storageKey(userId: string) {
  return `${STORAGE_KEY_PREFIX}${userId}`;
}

function readStoredSummary(userId: string): StoredSummary | null {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredSummary;
    if (typeof parsed.summary !== "string") return null;
    return { summary: parsed.summary, isEmptyHint: Boolean(parsed.isEmptyHint) };
  } catch {
    return null;
  }
}

function writeStoredSummary(userId: string, data: StoredSummary) {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(data));
  } catch {
    /* quota / private mode */
  }
}

type AppreciationAiSummaryProps = {
  entries: ManifestationGratitude[];
  useLandingStyles?: boolean;
};

function buildPayload(entries: ManifestationGratitude[]) {
  return entries
    .filter((e) => (e.content ?? "").trim())
    .map((e) => {
      const sectionKey = (e.sectionKey ?? "general").trim() || "general";
      return {
        content: e.content.trim(),
        date: e.date,
        section_key: sectionKey,
        section_label:
          e.sectionLabel?.trim() ||
          (sectionKey.startsWith("custom-") ? sectionKey : getGratitudeSectionLabel(sectionKey)),
      };
    });
}

export function AppreciationAiSummary({
  entries,
  useLandingStyles = true,
}: AppreciationAiSummaryProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [isEmptyHint, setIsEmptyHint] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;

    const applySession = (id: string | undefined) => {
      if (cancelled) return;
      if (!id) {
        setSummary(null);
        setIsEmptyHint(false);
        return;
      }
      const stored = readStoredSummary(id);
      if (stored) {
        setSummary(stored.summary);
        setIsEmptyHint(stored.isEmptyHint);
        setError(null);
      } else {
        setSummary(null);
        setIsEmptyHint(false);
      }
    };

    void supabase.auth.getSession().then(({ data }) => {
      applySession(data.session?.user?.id);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session?.user?.id);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const loadSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    setIsEmptyHint(false);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        setError("Sign in to see your appreciation summary.");
        setSummary(null);
        return;
      }

      const payloadEntries = buildPayload(entries);

      const res = await fetch("/api/gratitude-appreciation-summary", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ entries: payloadEntries }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        summary?: string;
        error?: string;
        detail?: string;
        empty?: boolean;
      };
      if (!res.ok) {
        throw new Error(body.error ?? body.detail ?? "Could not generate summary");
      }

      const text = body.summary ?? null;
      const empty = body.empty === true || text === EMPTY_HINT;
      setIsEmptyHint(empty);
      setSummary(text);
      const uid = sessionData.session?.user?.id;
      if (text && uid) {
        writeStoredSummary(uid, { summary: text, isEmptyHint: empty });
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not load summary");
      setSummary(null);
      setIsEmptyHint(false);
    } finally {
      setLoading(false);
    }
  }, [entries]);

  const borderClass = useLandingStyles ? "border-[var(--landing-border)]" : "border-gray-200";
  const textClass = useLandingStyles ? "text-[var(--landing-text)]" : "text-gray-900";

  return (
    <Card
      className={`mt-4 shadow-md ${borderClass}`}
      style={useLandingStyles ? { borderColor: "var(--landing-border)", backgroundColor: "white" } : undefined}
    >
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles
              className="h-5 w-5 shrink-0"
              style={useLandingStyles ? { color: "var(--landing-primary)" } : undefined}
            />
            <CardTitle className={`text-lg ${textClass}`}>What your appreciations say about you</CardTitle>
          </div>
          <Button type="button" variant="outline" size="sm" disabled={loading} onClick={() => void loadSummary()}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
          </Button>
        </div>
        <CardDescription>
          An AI reflection based on everything you have saved in your appreciation categories. Click Refresh
          after you save changes to generate or update it.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading && !summary && (
          <p className={`text-sm flex items-center gap-2 ${textClass} opacity-80`}>
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating your summary…
          </p>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {!loading && !summary && !error && (
          <p className={`text-sm italic opacity-80 ${textClass}`}>
            Click Refresh to generate your appreciation reflection.
          </p>
        )}
        {summary && (
          <div
            className={`text-sm leading-relaxed whitespace-pre-wrap ${
              isEmptyHint ? "italic opacity-80" : "opacity-95"
            } ${textClass}`}
          >
            {summary}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
