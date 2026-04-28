import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, RefreshCw, AlertCircle } from "lucide-react";
import { TrialMetricsCards } from "./TrialMetricsCards";
import { TrialTimelineChart } from "./TrialTimelineChart";
import { TrialStatusChart } from "./TrialStatusChart";
import { TrialAbandonmentFunnel } from "./TrialAbandonmentFunnel";
import { CohortAnalysis } from "./CohortAnalysis";
import { ABTestingResults } from "./ABTestingResults";
import { PredictiveModeling } from "./PredictiveModeling";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

type CommunityModerationSnapshot = {
  postsTotal: number;
  postsPending: number;
  postsApproved: number;
  postsRemoved: number;
  repliesTotal: number;
  repliesPending: number;
  repliesApproved: number;
  repliesRemoved: number;
  usersRemoved: number;
};

type TrialMetrics = {
  totalTrials: number;
  activeTrials: number;
  expiredTrials: number;
  convertedTrials: number;
  conversionRate: number;
  avgTimeToConversion: number;
  canceledTrials: number;
  paidSubscribers: number;
  invitePremium: number;
};

type TrialTimelinePoint = {
  date: string;
  started: number;
  converted: number;
  inviteActivated: number;
};

/** Normalize DB value (bigint seconds or ISO string) to ISO date string YYYY-MM-DD */
function toDateStr(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v === "string") return v.includes("T") ? v.split("T")[0] : v;
  if (typeof v === "number") {
    const ms = v < 1e12 ? v * 1000 : v;
    return new Date(ms).toISOString().split("T")[0];
  }
  return null;
}

/** Normalize to timestamp (ms) for Date comparison */
function toTimeMs(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === "number") return v < 1e12 ? v * 1000 : v;
  if (typeof v === "string") return new Date(v).getTime();
  return null;
}

export function TrialAnalyticsDashboard() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<TrialMetrics | null>(null);
  const [timelineData, setTimelineData] = useState<TrialTimelinePoint[]>([]);
  const [subscriptions, setSubscriptions] = useState<Record<string, unknown>[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [communitySnapshot, setCommunitySnapshot] = useState<CommunityModerationSnapshot | null>(null);
  const lastTokenRef = useRef<string | null>(null);

  const fetchAnalytics = async () => {
    const token = session?.access_token ?? null;
    if (!token) {
      setError("Not signed in");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin-subscriptions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 403) {
        setError((data?.error as string) ?? "Admin access required");
        setMetrics(null);
        setTimelineData([]);
        setSubscriptions([]);
        toast.error("Admin access required");
        return;
      }
      if (!res.ok) {
        throw new Error((data?.error as string) || "Failed to load subscriptions");
      }
      const list = Array.isArray(data?.subscriptions) ? data.subscriptions : [];
      setSubscriptions(list);

      // Community moderation analytics (admin visibility)
      const [postsCountRes, postsPendingRes, postsApprovedRes, postsRemovedRes, repliesCountRes, repliesPendingRes, repliesApprovedRes, repliesRemovedRes, usersRemovedRes] =
        await Promise.all([
          supabase.from("connection_posts").select("id", { count: "exact", head: true }),
          supabase.from("connection_posts").select("id", { count: "exact", head: true }).eq("moderation_status", "pending"),
          supabase.from("connection_posts").select("id", { count: "exact", head: true }).eq("moderation_status", "approved"),
          supabase.from("connection_posts").select("id", { count: "exact", head: true }).eq("moderation_status", "removed"),
          supabase.from("connection_replies").select("id", { count: "exact", head: true }),
          supabase.from("connection_replies").select("id", { count: "exact", head: true }).eq("moderation_status", "pending"),
          supabase.from("connection_replies").select("id", { count: "exact", head: true }).eq("moderation_status", "approved"),
          supabase.from("connection_replies").select("id", { count: "exact", head: true }).eq("moderation_status", "removed"),
          supabase.from("connection_user_moderation").select("user_id", { count: "exact", head: true }).eq("is_removed", true),
        ]);

      const communityErrors = [
        postsCountRes.error,
        postsPendingRes.error,
        postsApprovedRes.error,
        postsRemovedRes.error,
        repliesCountRes.error,
        repliesPendingRes.error,
        repliesApprovedRes.error,
        repliesRemovedRes.error,
        usersRemovedRes.error,
      ].filter(Boolean);

      if (communityErrors.length) {
        setCommunitySnapshot(null);
      } else {
        setCommunitySnapshot({
          postsTotal: postsCountRes.count ?? 0,
          postsPending: postsPendingRes.count ?? 0,
          postsApproved: postsApprovedRes.count ?? 0,
          postsRemoved: postsRemovedRes.count ?? 0,
          repliesTotal: repliesCountRes.count ?? 0,
          repliesPending: repliesPendingRes.count ?? 0,
          repliesApproved: repliesApprovedRes.count ?? 0,
          repliesRemoved: repliesRemovedRes.count ?? 0,
          usersRemoved: usersRemovedRes.count ?? 0,
        });
      }

      const now = new Date();
      const nowMs = now.getTime();

      const totalTrials = list.filter((s) => s.trial_start != null).length;
      const activeTrials = list.filter((s) => {
        if (s.status !== "trialing") return false;
        const endMs = toTimeMs(s.trial_end);
        return endMs != null && endMs > nowMs;
      }).length;
      const expiredTrials = list.filter((s) => {
        if (s.status !== "trialing") return false;
        const endMs = toTimeMs(s.trial_end);
        return endMs != null && endMs <= nowMs;
      }).length;
      const convertedTrials = list.filter(
        (s) => s.trial_start != null && s.status === "active"
      ).length;
      const conversionRate =
        totalTrials > 0 ? (convertedTrials / totalTrials) * 100 : 0;

      const conversions = list.filter(
        (s) => s.trial_start != null && s.status === "active"
      );
      let avgTimeToConversion = 0;
      if (conversions.length > 0) {
        const totalDays = conversions.reduce((sum, s) => {
          const startMs = toTimeMs(s.trial_start) ?? 0;
          const endMs = toTimeMs(s.updated_at) ?? startMs;
          return sum + (endMs - startMs) / (1000 * 60 * 60 * 24);
        }, 0);
        avgTimeToConversion = Math.round(totalDays / conversions.length);
      }

      const timeline = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split("T")[0];
        const started = list.filter(
          (s) => toDateStr(s.trial_start) === dateStr
        ).length;
        const converted = list.filter(
          (s) =>
            s.trial_start != null &&
            s.status === "active" &&
            toDateStr(s.updated_at) === dateStr
        ).length;
        const inviteActivated = list.filter(
          (s) =>
            s.status === "active" &&
            String(s.plan_name || "").toLowerCase() === "lifetime" &&
            (toDateStr(s.updated_at) === dateStr || toDateStr(s.created_at) === dateStr)
        ).length;
        timeline.push({ date: dateStr, started, converted, inviteActivated });
      }

      const paidSubscribers = list.filter(
        (s) =>
          s.status === "active" &&
          (String(s.plan_name || "").toLowerCase() !== "lifetime" ||
            !!s.stripe_subscription_id)
      ).length;
      const invitePremium = list.filter(
        (s) =>
          s.status === "active" &&
          String(s.plan_name || "").toLowerCase() === "lifetime"
      ).length;

      setMetrics({
        totalTrials,
        activeTrials,
        expiredTrials,
        convertedTrials,
        conversionRate: parseFloat(conversionRate.toFixed(1)),
        avgTimeToConversion,
        canceledTrials: list.filter(
          (s) => s.status === "canceled" && s.trial_start != null
        ).length,
        paidSubscribers,
        invitePremium,
      });
      setTimelineData(timeline);
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Failed to load analytics";
      setError(message);
      setMetrics(null);
      setTimelineData([]);
      setSubscriptions([]);
      setCommunitySnapshot(null);
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = session?.access_token ?? null;
    if (!token) {
      setLoading(false);
      setError("Not signed in");
      return;
    }
    if (lastTokenRef.current === token) return;
    lastTokenRef.current = token;
    fetchAnalytics();
  }, [session?.access_token]);

  const exportReport = () => {
    if (!metrics) return;
    
    const report = {
      generatedAt: new Date().toISOString(),
      metrics,
      timelineData
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trial-analytics-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    toast.success("Report exported successfully");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[280px]">
        <p className="text-muted-foreground">Loading analytics…</p>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Analytics unavailable
          </CardTitle>
          <CardDescription>
            {error ||
              "Could not load trial analytics. This can happen if subscription data is not available or access is restricted."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={fetchAnalytics} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Trial Analytics Dashboard</h2>
        <div className="flex gap-2">
          <Button onClick={fetchAnalytics} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={exportReport}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      <TrialMetricsCards metrics={metrics} />

      {communitySnapshot && (
        <Card>
          <CardHeader>
            <CardTitle>Community Moderation Snapshot</CardTitle>
            <CardDescription>Live counts for community posts, replies, and moderation actions.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Posts</p>
                <p className="text-2xl font-semibold">{communitySnapshot.postsTotal}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Pending {communitySnapshot.postsPending} · Approved {communitySnapshot.postsApproved} · Removed {communitySnapshot.postsRemoved}
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Replies</p>
                <p className="text-2xl font-semibold">{communitySnapshot.repliesTotal}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Pending {communitySnapshot.repliesPending} · Approved {communitySnapshot.repliesApproved} · Removed {communitySnapshot.repliesRemoved}
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Removed Users</p>
                <p className="text-2xl font-semibold">{communitySnapshot.usersRemoved}</p>
                <p className="text-xs text-muted-foreground mt-1">Users blocked from community posting.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="funnel">Funnel Analysis</TabsTrigger>
          <TabsTrigger value="cohort">Cohort Analysis</TabsTrigger>
          <TabsTrigger value="abtesting">A/B Testing</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <TrialTimelineChart data={timelineData} />
            <TrialStatusChart metrics={metrics} />
          </div>
        </TabsContent>

        <TabsContent value="funnel">
          <TrialAbandonmentFunnel subscriptions={subscriptions} />
        </TabsContent>

        <TabsContent value="cohort">
          <CohortAnalysis subscriptions={subscriptions} />
        </TabsContent>

        <TabsContent value="abtesting">
          <ABTestingResults subscriptions={subscriptions} />
        </TabsContent>

        <TabsContent value="predictions">
          <PredictiveModeling subscriptions={subscriptions} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

