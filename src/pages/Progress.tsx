import React, { useState, useMemo, useCallback } from 'react';
import { AuthenticatedLayout } from '@/components/AuthenticatedLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, TrendingUp, BarChart3, Bell, Sparkles, Loader2, ChevronRight, Flame, CheckCircle2, BookOpen, Heart, Calendar } from 'lucide-react';
import { HeroFloatingCircles } from '@/components/HeroFloatingCircles';
import { TrialBanner } from '@/components/TrialBanner';
import { useManifestationDatabase } from '@/hooks/useManifestationDatabase';
import { useEvents } from '@/hooks/useEvents';
import { useProgressAnalysis } from '@/hooks/useProgressAnalysis';
import progressHeroImg from '@/assets/images/Life-is-in-Time-man.jpg';
import { useToast } from '@/hooks/use-toast';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

function toISODate(d: Date): string {
  return d.toISOString().split('T')[0];
}

const Progress: React.FC = () => {
  const { toast } = useToast();
  const { goals, todos, gratitudeEntries, journalEntries, totalPoints, streak } = useManifestationDatabase();
  const { events } = useEvents();
  const { analyzeProgress, loading: aiLoading } = useProgressAnalysis();
  const [aiAnalysis, setAiAnalysis] = useState<{
    summary: string;
    insights: { category: string; message: string; priority: string }[];
    suggestedActions: string[];
    encouragement: string;
  } | null>(null);

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const metrics = useMemo(() => {
    const ev = Array.isArray(events) ? events : [];
    const completedEvents = ev.filter((e) => e?.status === 'completed');
    const plannedEvents = ev.filter((e) => e?.status === 'planned');
    const missedEvents = ev.filter((e) => e?.status === 'missed');
    const totalEvents = completedEvents.length + plannedEvents.length + missedEvents.length;
    const completionRate = totalEvents > 0 ? Math.round((completedEvents.length / totalEvents) * 100) : 0;

    const recentEvents = ev.filter((e) => {
      try {
        return e?.startTime != null && new Date(e.startTime) >= sevenDaysAgo;
      } catch {
        return false;
      }
    });
    const completedRecent = recentEvents.filter((e) => e.status === 'completed');
    const weeklyConsistency = recentEvents.length > 0 ? Math.round((completedRecent.length / recentEvents.length) * 100) : 0;

    const journals = Array.isArray(journalEntries) ? journalEntries : [];
    const gratitudes = Array.isArray(gratitudeEntries) ? gratitudeEntries : [];
    const journalThisMonth = journals.filter((j) => j?.date >= toISODate(thirtyDaysAgo)).length;
    const gratitudeThisMonth = gratitudes.filter((g) => g?.date >= toISODate(thirtyDaysAgo)).length;

    const todoList = Array.isArray(todos) ? todos : [];
    const todosCompleted = todoList.filter((t) => t?.completed).length;
    const totalTodos = todoList.length;
    const todoCompletionRate = totalTodos > 0 ? Math.round((todosCompleted / totalTodos) * 100) : 0;

    const goalsList = Array.isArray(goals) ? goals : [];
    const avgGoalProgress = goalsList.length > 0
      ? Math.round(goalsList.reduce((s, g) => s + (g?.progress ?? 0), 0) / goalsList.length * 10)
      : 0;

    return {
      completionRate,
      weeklyConsistency,
      journalThisMonth,
      gratitudeThisMonth,
      todoCompletionRate,
      avgGoalProgress,
      completedEvents: completedEvents.length,
      totalEvents,
      streak: Number(streak) || 0,
      totalPoints: Number(totalPoints) || 0,
    };
  }, [events, goals, todos, journalEntries, gratitudeEntries, streak, totalPoints]);

  const chartData = useMemo(() => {
    const result: { day: string; date: string; count: number; rate: number }[] = [];
    const now = new Date();
    const eventsList = Array.isArray(events) ? events : [];
    const todosList = Array.isArray(todos) ? todos : [];
    const journalList = Array.isArray(journalEntries) ? journalEntries : [];
    const gratitudeList = Array.isArray(gratitudeEntries) ? gratitudeEntries : [];
    for (let d = 6; d >= 0; d--) {
      const date = new Date(now);
      date.setDate(date.getDate() - d);
      const iso = toISODate(date);
      const dayLabel = date.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
      const todosDone = todosList.filter((t) => t.completed && t.completedAt && String(t.completedAt).startsWith(iso)).length;
      const journalCount = journalList.some((j) => j.date === iso) ? 1 : 0;
      const gratitudeCount = gratitudeList.some((g) => g.date === iso) ? 1 : 0;
      const eventsDone = eventsList.filter((e) => {
        try {
          const t = e?.startTime != null ? new Date(e.startTime) : null;
          return t && !Number.isNaN(t.getTime()) && t.toISOString().startsWith(iso) && e.status === 'completed';
        } catch {
          return false;
        }
      }).length;
      const count = todosDone + journalCount + gratitudeCount + eventsDone;
      const eventsThatDay = eventsList.filter((e) => {
        try {
          const t = e?.startTime != null ? new Date(e.startTime) : null;
          return t && !Number.isNaN(t.getTime()) && t.toISOString().startsWith(iso);
        } catch {
          return false;
        }
      }).length;
      const totalPossible = todosList.filter((t) => t.scheduledDate === iso).length + 1 + 1 + eventsThatDay;
      const rate = totalPossible > 0 ? Math.round((count / totalPossible) * 100) : (count > 0 ? 100 : 0);
      result.push({ day: dayLabel, date: iso, count, rate });
    }
    return result;
  }, [events, todos, journalEntries, gratitudeEntries]);

  const pieData = useMemo(() => {
    const ev = Array.isArray(events) ? events : [];
    const completed = ev.filter((e) => e?.status === 'completed').length;
    const planned = ev.filter((e) => e?.status === 'planned').length;
    const missed = ev.filter((e) => e?.status === 'missed').length;
    const data = [
      { name: 'Completed', value: completed, color: '#2c9d73' },
      { name: 'Planned', value: planned, color: '#3b82f6' },
      { name: 'Missed', value: missed, color: '#ef4444' },
    ].filter((d) => d.value > 0);
    return data.length ? data : [{ name: 'No events', value: 1, color: '#94a3b8' }];
  }, [events]);

  const handleGetAIInsights = useCallback(async () => {
    const input = {
      goals: (Array.isArray(goals) ? goals : []).map((g) => ({
        title: g?.title ?? '',
        progress: g?.progress ?? 0,
        timeline: g?.timeline ?? '30',
        description: g?.description ?? '',
      })),
      events: (Array.isArray(events) ? events : []).map((e) => ({
        title: e?.title ?? '',
        status: e?.status ?? 'planned',
        startTime: e?.startTime != null ? new Date(e.startTime).toISOString() : new Date().toISOString(),
      })),
      todos: (Array.isArray(todos) ? todos : []).map((t) => ({
        title: t?.title ?? '',
        completed: t?.completed ?? false,
        scheduledDate: t?.scheduledDate ?? null,
      })),
      journalCount: metrics.journalThisMonth,
      gratitudeCount: metrics.gratitudeThisMonth,
      streak: metrics.streak,
    };

    const result = await analyzeProgress(input);
    if (result) {
      setAiAnalysis(result);
      toast({ title: 'AI Insights Ready', description: 'Your progress analysis is ready.' });
    } else {
      toast({
        title: 'AI Analysis Unavailable',
        description: 'Check your OpenAI API key or try again later.',
        variant: 'destructive',
      });
    }
  }, [goals, events, todos, metrics, analyzeProgress, toast]);

  return (
    <AuthenticatedLayout>
      <div className="min-h-screen landing" style={{ backgroundColor: 'var(--landing-bg)', color: 'var(--landing-text)' }}>
        {/* Hero */}
        <section
          className="relative w-full overflow-hidden"
          style={{ minHeight: '240px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}
        >
          <div className="absolute inset-0">
            <img src={progressHeroImg} alt="" className="w-full h-full object-cover" />
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(160deg, rgba(15,23,42,0.75) 0%, rgba(26,107,79,0.82) 40%, rgba(44,157,115,0.78) 100%)',
              }}
            />
          </div>
          <HeroFloatingCircles variant="dark" />
          <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div className="mb-4 sm:mb-0">
                <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                  Your progress at a glance
                </h1>
                <p className="mt-3 text-sm sm:text-base text-white/90 max-w-2xl leading-relaxed">
                  See completion rate, weekly consistency, journal frequency, and goal activity. Get AI-powered insights to understand how you&apos;re doing and how to improve.
                </p>
              </div>
              <Button
                onClick={handleGetAIInsights}
                disabled={aiLoading}
                className="hero-cta-primary font-semibold rounded-xl shrink-0"
              >
                {aiLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Get AI insights
                  </>
                )}
              </Button>
            </div>
          </div>
        </section>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <TrialBanner />

          {/* Metrics cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 mb-8">
            {[
              { icon: CheckCircle2, label: 'Completion rate', value: `${metrics.completionRate}%`, sub: `${metrics.completedEvents}/${metrics.totalEvents} events` },
              { icon: TrendingUp, label: 'Weekly consistency', value: `${metrics.weeklyConsistency}%`, sub: 'Last 7 days' },
              { icon: BookOpen, label: 'Journal entries', value: String(metrics.journalThisMonth), sub: 'This month' },
              { icon: Flame, label: 'Streak', value: String(metrics.streak), sub: 'Days in a row' },
            ].map(({ icon: Icon, label, value, sub }) => (
              <Card
                key={label}
                className="rounded-2xl overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow"
                style={{ borderColor: 'var(--landing-border)' }}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--landing-accent)' }}>
                      <Icon className="h-5 w-5" style={{ color: 'var(--landing-primary)' }} />
                    </div>
                    <div>
                      <p className="text-xs font-medium opacity-70" style={{ color: 'var(--landing-text)' }}>{label}</p>
                      <p className="text-xl font-bold" style={{ color: 'var(--landing-primary)' }}>{value}</p>
                      <p className="text-[10px] opacity-60" style={{ color: 'var(--landing-text)' }}>{sub}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Secondary metrics */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            <Card className="rounded-2xl overflow-hidden border-0 shadow" style={{ borderColor: 'var(--landing-border)' }}>
              <CardContent className="p-4 flex items-center gap-3">
                <Heart className="h-8 w-8 text-pink-500" />
                <div>
                  <p className="text-xs font-medium opacity-70">Gratitude entries</p>
                  <p className="text-lg font-bold" style={{ color: 'var(--landing-text)' }}>{metrics.gratitudeThisMonth} this month</p>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-2xl overflow-hidden border-0 shadow" style={{ borderColor: 'var(--landing-border)' }}>
              <CardContent className="p-4 flex items-center gap-3">
                <Target className="h-8 w-8" style={{ color: 'var(--landing-primary)' }} />
                <div>
                  <p className="text-xs font-medium opacity-70">Avg goal progress</p>
                  <p className="text-lg font-bold" style={{ color: 'var(--landing-text)' }}>{metrics.avgGoalProgress}%</p>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-2xl overflow-hidden border-0 shadow col-span-2 md:col-span-1" style={{ borderColor: 'var(--landing-border)' }}>
              <CardContent className="p-4 flex items-center gap-3">
                <Calendar className="h-8 w-8" style={{ color: 'var(--landing-primary)' }} />
                <div>
                  <p className="text-xs font-medium opacity-70">To-do completion</p>
                  <p className="text-lg font-bold" style={{ color: 'var(--landing-text)' }}>{metrics.todoCompletionRate}%</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card className="rounded-2xl overflow-hidden border-0 shadow" style={{ borderColor: 'var(--landing-border)' }}>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2" style={{ color: 'var(--landing-text)' }}>
                  <BarChart3 className="h-5 w-5" style={{ color: 'var(--landing-primary)' }} />
                  Weekly completion by day
                </CardTitle>
              </CardHeader>
              <CardContent className="h-64 min-h-[200px]">
                <ResponsiveContainer width="100%" height={256}>
                  <BarChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--landing-border)" />
                    <XAxis dataKey="day" tick={{ fill: 'var(--landing-text)', fontSize: 11 }} />
                    <YAxis tick={{ fill: 'var(--landing-text)', fontSize: 12 }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: '1px solid var(--landing-border)' }}
                      formatter={(value: number, _name: string, props: unknown) => {
                        const payload = props && typeof props === 'object' && 'payload' in props ? (props as { payload?: { count?: number } }).payload : undefined;
                        const count = payload?.count ?? value;
                        return [`${Number(count)} completed (tasks, journal, gratitude, events)`, 'Progress'];
                      }}
                    />
                    <Bar dataKey="count" fill="var(--landing-primary)" radius={[4, 4, 0, 0]} name="Activity count" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="rounded-2xl overflow-hidden border-0 shadow" style={{ borderColor: 'var(--landing-border)' }}>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2" style={{ color: 'var(--landing-text)' }}>
                  <Target className="h-5 w-5" style={{ color: 'var(--landing-primary)' }} />
                  Event status distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="h-64 min-h-[200px]">
                <ResponsiveContainer width="100%" height={256}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: '1px solid var(--landing-border)' }}
                      formatter={(value: number, name: string) => [value, name]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* AI Insights */}
          {aiAnalysis && (
            <Card className="rounded-2xl overflow-hidden border-2 mb-8" style={{ borderColor: 'var(--landing-primary)', backgroundColor: 'var(--landing-accent)' }}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg" style={{ color: 'var(--landing-primary)' }}>
                  <Sparkles className="h-5 w-5" />
                  AI progress analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-relaxed" style={{ color: 'var(--landing-text)' }}>{aiAnalysis.summary}</p>
                <p className="text-sm font-medium italic" style={{ color: 'var(--landing-primary)' }}>{aiAnalysis.encouragement}</p>
                {aiAnalysis.insights && aiAnalysis.insights.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider opacity-70" style={{ color: 'var(--landing-text)' }}>Insights</p>
                    <ul className="space-y-1.5">
                      {aiAnalysis.insights.map((insight, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--landing-text)' }}>
                          <ChevronRight className="h-4 w-4 shrink-0 mt-0.5" style={{ color: 'var(--landing-primary)' }} />
                          {insight.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {aiAnalysis.suggestedActions && aiAnalysis.suggestedActions.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider opacity-70" style={{ color: 'var(--landing-text)' }}>Suggested actions</p>
                    <ul className="space-y-1">
                      {aiAnalysis.suggestedActions.map((action, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--landing-text)' }}>
                          <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ backgroundColor: 'var(--landing-primary)', color: 'white' }}>{i + 1}</span>
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <p className="text-xs flex items-center justify-center gap-2 mt-6 mb-4" style={{ color: 'var(--landing-text)', opacity: 0.7 }}>
            <Bell className="h-4 w-4" style={{ color: 'var(--landing-primary)' }} />
            Notifications (desktop and email) keep you accountable at your specified times.
          </p>
        </div>
      </div>
    </AuthenticatedLayout>
  );
};

export default Progress;
