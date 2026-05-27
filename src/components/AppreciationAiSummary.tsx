import { useCallback, useEffect, useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getGratitudeSectionLabel } from "@/data/gratitudeSections";
import type { ManifestationGratitude } from "@/hooks/useManifestationDatabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const EMPTY_HINT =
  "Once you save a few appreciations in the categories above, we can reflect on what they say about your values and strengths.";

type AppreciationAiSummaryProps = {
  refreshKey: string;
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
  refreshKey,
  entries,
  useLandingStyles = true,
}: AppreciationAiSummaryProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [isEmptyHint, setIsEmptyHint] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not load summary");
      setSummary(null);
      setIsEmptyHint(false);
    } finally {
      setLoading(false);
    }
  }, [entries]);

  useEffect(() => {
    void loadSummary();
  }, [refreshKey, loadSummary]);

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
          An AI reflection based on everything you have saved in your appreciation categories.
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
