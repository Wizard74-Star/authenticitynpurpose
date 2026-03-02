import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Target,
  Calendar as CalendarIcon,
  Check,
  Heart,
  BookOpen,
  Sparkles,
  Plus,
  Trash2,
  Clock,
  ListTodo,
  PenLine,
  CheckCircle2,
  Image as ImageIcon,
  DollarSign,
  SparklesIcon,
  Loader2,
  Pause,
  Play,
  CheckCircle,
  LogIn,
  ArrowRightLeft,
  CalendarDays,
  FolderInput,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Pencil,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { useManifestationDatabase } from '@/hooks/useManifestationDatabase';
import { useEvents } from '@/hooks/useEvents';
import { useReminders } from '@/hooks/useReminders';
import { EventDialog } from '@/components/EventDialog';
import { DayTimelineView } from '@/components/DayTimelineView';
import type { DayEventInput } from '@/lib/dayEventLayout';
import { TrialBanner } from '@/components/TrialBanner';
import type { CalendarEventData } from '@/hooks/useEvents';
import type { ManifestationGoal, ManifestationTodo, ManifestationGratitude, ManifestationJournalEntry } from '@/hooks/useManifestationDatabase';
import dashboardHeroImg from '@/assets/images/Life-is-in-Time-woman.jpg';
import { HeroFloatingCircles } from '@/components/HeroFloatingCircles';
import { useToast } from '@/hooks/use-toast';
import GoalDetailView from '@/components/GoalDetailView';
import { AddGoalDialog } from '@/components/AddGoalDialog';
import { DemoOnboardingModals } from '@/components/DemoOnboardingModals';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { GratitudeJournalSections } from '@/components/GratitudeJournalSections';
import { JournalEntryForm } from '@/components/JournalEntryForm';
import { BudgetSpentEditDialog } from '@/components/BudgetSpentEditDialog';
import type { DemoGoalGenerated } from '@/data/demoOnboardingMockData';
import { getDefaultImageForCategory } from '@/data/demoOnboardingMockData';
import { generateGoalsWithOpenAI, recommendImagesForGoals, generateTodosWithOpenAI, getActiveProvider } from '@/lib/openaiProgressAnalysis';
import demoHeroBg from '@/assets/images/Demo-bg.png';

function toISODate(d: Date): string {
  return d.toISOString().split('T')[0];
}

function isSameDay(a: Date, b: Date): boolean {
  return toISODate(a) === toISODate(b);
}

const timelineLabels: Record<string, string> = {
  '30': '30 Days',
  '60': '60 Days',
  '90': '90 Days',
  '1year': '1 Year',
  '5year': '5 Year Plan',
};

function generateRecommendations(timeline: string): string[] {
  if (timeline === '30') return ['Break into weekly milestones', 'Set daily check-ins'];
  if (timeline === '5year') return ['Create yearly milestones', 'Identify skills to develop'];
  return ['Review progress weekly', 'Celebrate small wins'];
}

export default function Dashboard() {
  const { toast } = useToast();
  const [dashboardHeroUrl, setDashboardHeroUrl] = useState(dashboardHeroImg);
  const [heroEditOpen, setHeroEditOpen] = useState(false);
  const [heroInputUrl, setHeroInputUrl] = useState('');
  const heroFileInputRef = React.useRef<HTMLInputElement>(null);
  const MAX_HERO_IMAGE_BYTES = 2 * 1024 * 1024; // 2MB for data URL in localStorage
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const selectedIso = toISODate(selectedDate);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEventData | undefined>();
  const [gratitudeDialogOpen, setGratitudeDialogOpen] = useState(false);
  const [journalDialogOpen, setJournalDialogOpen] = useState(false);
  const [budgetEditGoal, setBudgetEditGoal] = useState<ManifestationGoal | null>(null);
  const [slotClickTime, setSlotClickTime] = useState<string | undefined>();
  const [overviewNewTaskTitle, setOverviewNewTaskTitle] = useState('');
  const [overviewNewGratitude, setOverviewNewGratitude] = useState('');
  const [activeHomeSection, setActiveHomeSection] = useState<string>('goals');
  const tabsScrollRef = React.useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const homeSectionIds = ['goals', 'to-do', 'calendar', 'progress', 'gratitude', 'journal'] as const;
  const scrollToHomeSection = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveHomeSection(id);
  }, []);

  // On mobile: keep active tab visible by scrolling the tab bar when section changes (e.g. from scroll)
  useEffect(() => {
    const activeEl = document.getElementById(`tab-${activeHomeSection}`);
    const container = tabsScrollRef.current;
    if (activeEl && container) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }
  }, [activeHomeSection]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const id = entry.target.id;
          if (homeSectionIds.includes(id as typeof homeSectionIds[number])) {
            setActiveHomeSection(id);
            break;
          }
        }
      },
      { rootMargin: '-20% 0px -60% 0px', threshold: 0 }
    );
    homeSectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const {
    goals,
    todos,
    gratitudeEntries,
    journalEntries,
    totalPoints,
    streak,
    isMutating,
    addGoal,
    updateGoal,
    updateGoalProgress,
    deleteGoal,
    addTodo,
    toggleTodo,
    deleteTodo,
    updateTodo,
    addGratitudeForDate,
    updateGratitudeSectionByKey,
    deleteGratitudeBySection,
    updateGratitude,
    deleteGratitude,
    addJournalEntry,
    updateJournalEntry,
    deleteJournalEntry,
  } = useManifestationDatabase();

  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const selectedGoal = selectedGoalId ? goals.find((g) => g.id === selectedGoalId) : null;
  const activeGoals = useMemo(() => goals.filter((g) => g.status === 'active' || !g.status), [goals]);
  const [addGoalOpen, setAddGoalOpen] = useState(false);
  const [goalToDeleteId, setGoalToDeleteId] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDay, setNewTaskDay] = useState<'today' | 'tomorrow'>('today');
  const [newTaskTimeSlot, setNewTaskTimeSlot] = useState('');
  const [newTaskGroup, setNewTaskGroup] = useState('');

  const todayIso = toISODate(new Date());
  const tomorrowIso = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return toISODate(d);
  })();

  useEffect(() => {
    if (goals.length === 0 && !localStorage.getItem('goals_app_dashboard_onboarding_done')) {
      setOnboardingOpen(true);
    }
  }, [goals.length]);

  const handleOnboardingRecommended = async (generated: DemoGoalGenerated[]) => {
    try {
      for (const g of generated) {
        await addGoal({
          title: g.title,
          description: g.description,
          timeline: g.timeline as '30' | '60' | '90' | '1year' | '5year',
          progress: g.progress,
          imageUrl: g.image,
          priority: g.priority,
          recommendations: [],
          targetDate: g.targetDate,
          steps: (g.steps ?? []).map((s) => ({
            id: s.id,
            title: s.title,
            completed: s.completed ?? false,
            predictDate: s.predictDate,
            predictPrice: s.predictPrice,
          })),
          budget: g.budget ?? 0,
          spent: g.spent ?? 0,
        });
      }
      localStorage.setItem('goals_app_dashboard_onboarding_done', '1');
      setOnboardingOpen(false);
      toast({ title: 'Goals added', description: `${generated.length} goal${generated.length === 1 ? '' : 's'} added to your goals list.` });
      document.getElementById('dashboard-content')?.scrollIntoView({ behavior: 'smooth' });
    } catch (e) {
      toast({ title: 'Could not add goals', description: e instanceof Error ? e.message : 'Something went wrong.', variant: 'destructive' });
    }
  };

  const handleRecommendRequest = async (
    occupation: string,
    aspiration: string,
    description: string,
  ): Promise<DemoGoalGenerated[]> => {
    const result = await generateGoalsWithOpenAI(occupation, aspiration, description);
    if (!result || result.length === 0) return [];
    const images = await recommendImagesForGoals(result, aspiration);
    const id = () => `ai-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    return result.map((g, i) => ({
      id: id(),
      title: g.title,
      description: g.description,
      progress: 0,
      timeline: g.timeline,
      priority: g.priority,
      category: g.category,
      targetDate: g.targetDate,
      image: images[i] ?? getDefaultImageForCategory(g.category),
      budget: g.budget,
      spent: 0,
      steps: (g.steps ?? []).map((s, j) => ({
        id: `s${j}-${id()}`,
        title: s.title,
        completed: false,
        predictDate: s.predictDate,
        predictPrice: s.predictPrice,
      })),
    }));
  };

  const [aiTodosLoading, setAiTodosLoading] = useState<'today' | 'tomorrow' | null>(null);

  const handleAIGenerateTodos = async (day: 'today' | 'tomorrow') => {
    if (!getActiveProvider()) {
      toast({ title: 'AI not configured', description: 'Set VITE_OPENAI_API_KEY in .env to generate to-dos.', variant: 'destructive' });
      return;
    }
    setAiTodosLoading(day);
    try {
      const previousTodos = todos.map((t) => ({ title: t.title, completed: t.completed }));
      const generated = await generateTodosWithOpenAI(
        day,
        goals.map((g) => ({ title: g.title, progress: g.progress })),
        previousTodos,
      );
      if (generated && generated.length > 0) {
        const iso = day === 'today' ? todayIso : tomorrowIso;
        for (const item of generated) {
          addTodo({
            title: item.title,
            completed: false,
            points: 5,
            scheduledDate: iso,
            timeSlot: item.timeSlot ?? undefined,
            groupName: item.group?.trim() || undefined,
          });
        }
        toast({ title: 'To-dos added', description: `Generated ${generated.length} tasks for ${day}.` });
      } else {
        toast({ title: 'No suggestions', description: 'Could not generate to-dos. Try again.', variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: 'Failed', description: e instanceof Error ? e.message : 'Could not generate to-dos.', variant: 'destructive' });
    } finally {
      setAiTodosLoading(null);
    }
  };

  const todosToday = useMemo(() => todos.filter((t) => t.scheduledDate === todayIso), [todos, todayIso]);
  const todosTomorrow = useMemo(() => todos.filter((t) => t.scheduledDate === tomorrowIso), [todos, tomorrowIso]);

  /** Groups used on today's tasks only (for Move to group on Today tab) */
  const todayGroupsForMove = useMemo(() => {
    const names = new Set<string>();
    todosToday.forEach((t) => {
      const g = t.groupName?.trim();
      if (g) names.add(g);
    });
    return ['Other', ...Array.from(names).sort()];
  }, [todosToday]);

  /** Groups used on tomorrow's tasks only (for Move to group on Tomorrow tab) */
  const tomorrowGroupsForMove = useMemo(() => {
    const names = new Set<string>();
    todosTomorrow.forEach((t) => {
      const g = t.groupName?.trim();
      if (g) names.add(g);
    });
    return ['Other', ...Array.from(names).sort()];
  }, [todosTomorrow]);

  const { events, addEvent, updateEvent, deleteEvent } = useEvents();
  const { createReminder } = useReminders();

  const eventsOnDate = useMemo(
    () => events.filter((e) => isSameDay(e.startTime, selectedDate)),
    [events, selectedDate]
  );

  /** Completed to-dos whose completedAt falls on the selected date */
  const completedTodosOnDate = useMemo(
    () =>
      todos.filter((t) => {
        if (!t.completed || !t.completedAt) return false;
        return t.completedAt.split('T')[0] === selectedIso;
      }),
    [todos, selectedIso],
  );

  const dayEvents: DayEventInput[] = useMemo(() => {
    const dayStart = new Date(selectedIso + 'T00:00:00').getTime();
    const dayEnd = dayStart + 24 * 60 * 60 * 1000;

    // Regular calendar events
    const calendarItems: DayEventInput[] = eventsOnDate.map((e) => {
      const startMs = Math.max(e.startTime.getTime(), dayStart);
      const endMs = Math.min(e.endTime.getTime(), dayEnd);
      const startMinutes = ((new Date(startMs).getTime() - dayStart) / (60 * 1000)) | 0;
      const endMinutes = ((new Date(endMs).getTime() - dayStart) / (60 * 1000)) | 0;
      return {
        id: e.id,
        title: e.title,
        start: Math.max(0, startMinutes),
        end: Math.min(24 * 60, Math.max(endMinutes, startMinutes + 1)),
      };
    });

    // Completed to-dos rendered as 15-min activity markers
    const todoItems: DayEventInput[] = completedTodosOnDate.map((t) => {
      const doneAt = new Date(t.completedAt!);
      const startMinutes = doneAt.getHours() * 60 + doneAt.getMinutes();
      return {
        id: `todo-${t.id}`,
        title: `✓ ${t.title}`,
        start: Math.max(0, startMinutes),
        end: Math.min(24 * 60, startMinutes + 15),
      };
    });

    return [...calendarItems, ...todoItems];
  }, [eventsOnDate, completedTodosOnDate, selectedDate, selectedIso]);

  const eventColors = useMemo(() => {
    const colors: Record<string, string> = {};
    eventsOnDate.forEach((e) => { colors[e.id] = e.color; });
    // Completed to-dos get a green "done" color
    completedTodosOnDate.forEach((t) => { colors[`todo-${t.id}`] = '#16a34a'; });
    return colors;
  }, [eventsOnDate, completedTodosOnDate]);
  const todosOnDate = useMemo(
    () => todos.filter((t) => t.scheduledDate === selectedIso),
    [todos, selectedIso]
  );
  const gratitudeForDate = useMemo(
    () => gratitudeEntries.find((g) => g.date === selectedIso),
    [gratitudeEntries, selectedIso]
  );
  const journalForDate = useMemo(
    () => journalEntries.find((j) => j.date === selectedIso),
    [journalEntries, selectedIso]
  );

  const stats = {
    totalGoals: goals.length,
    scheduleToday: eventsOnDate.length,
    todosToday: todosOnDate.length,
  };

  const handleSaveEvent = async (
    data: Omit<CalendarEventData, 'id'>,
    options?: { reminderBefore?: number }
  ) => {
    try {
      if (editingEvent) {
        await updateEvent(editingEvent.id, data);
        toast({ title: 'Updated', description: 'Schedule updated.' });
      } else {
        const eventId = await addEvent(data);
        if (options?.reminderBefore && eventId) {
          const reminderTime = new Date(data.startTime.getTime() - options.reminderBefore * 60 * 1000);
          const label = options.reminderBefore === 15 ? '15 minutes' : options.reminderBefore === 60 ? '1 hour' : '1 day';
          await createReminder({
            type: 'event_reminder',
            entity_type: 'calendar_event',
            entity_id: eventId,
            reminder_time: reminderTime.toISOString(),
            message: `Your commitment "${data.title}" starts in ${label}`,
            channels: ['push'],
          });
        }
        toast({ title: 'Scheduled', description: 'Added to your day.' });
      }
      setEditingEvent(undefined);
      setEventDialogOpen(false);
    } catch {
      toast({ title: 'Error', description: 'Could not save.', variant: 'destructive' });
    }
  };

  const handleEventTimeUpdate = useCallback(
    async (id: string, newStartMinutes: number, newEndMinutes: number) => {
      // Ignore drag on to-do activity markers
      if (id.startsWith('todo-')) return;
      const dayStart = new Date(selectedIso + 'T00:00:00');
      const newStart = new Date(dayStart.getTime() + newStartMinutes * 60 * 1000);
      const newEnd = new Date(dayStart.getTime() + newEndMinutes * 60 * 1000);
      try {
        await updateEvent(id, { startTime: newStart, endTime: newEnd });
        toast({ title: 'Updated', description: 'Schedule time updated.' });
      } catch {
        toast({ title: 'Error', description: 'Could not update.', variant: 'destructive' });
      }
    },
    [selectedIso, updateEvent, toast],
  );

  const handleSlotClick = useCallback(
    (startMinutes: number) => {
      const h = Math.floor(startMinutes / 60);
      const m = startMinutes % 60;
      setSlotClickTime(
        `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
      );
      setEditingEvent(undefined);
      setEventDialogOpen(true);
    },
    [],
  );

  const openNewSchedule = () => {
    setEditingEvent(undefined);
    setSlotClickTime(undefined);
    setEventDialogOpen(true);
  };

  const dateLabel = selectedDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  if (selectedGoal && selectedGoalId) {
    return (
      <GoalDetailView
        goal={selectedGoal}
        onBack={() => setSelectedGoalId(null)}
        updateGoal={updateGoal}
        onDeleteGoal={deleteGoal}
        isMutating={isMutating}
      />
    );
  }

  return (
    <div className="min-h-screen landing relative" style={{ backgroundColor: 'var(--landing-bg)', color: 'var(--landing-text)' }}>
      {isMutating && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px]" aria-live="polite" aria-busy="true">
          <div className="rounded-2xl border-2 p-8 flex flex-col items-center gap-4 shadow-xl" style={{ backgroundColor: 'var(--landing-accent)', borderColor: 'var(--landing-border)' }}>
            <Loader2 className="h-12 w-12 animate-spin" style={{ color: 'var(--landing-primary)' }} />
            <p className="font-medium text-sm sm:text-base" style={{ color: 'var(--landing-text)' }}>Saving…</p>
          </div>
        </div>
      )}
      <div className={isMutating ? 'pointer-events-none select-none' : ''}>
      {/* Hero — Demo-style: same as Demo page */}
      <section
        id="hero"
        className="relative py-12 sm:py-20 md:py-28 px-4 min-h-[20rem] sm:min-h-[26rem] md:min-h-[28rem] flex items-center justify-center overflow-hidden"
      >
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${demoHeroBg})` }}
          aria-hidden
        />
        <div className="absolute inset-0" style={{ backgroundColor: 'var(--landing-accent)', opacity: 0.85 }} aria-hidden />
        <HeroFloatingCircles />
        <div className="relative z-10 max-w-6xl mx-auto text-center px-4 sm:px-6">
          <h1
            className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent animate-slide-up"
            style={{
              backgroundImage: 'linear-gradient(135deg, var(--landing-primary) 0%, var(--landing-primary-soft) 50%, #1a6b4f 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              animationDelay: '0.1s',
            }}
          >
            Your Dashboard
          </h1>
          <p
            className="text-lg sm:text-xl mb-4 font-bold max-w-2xl mx-auto bg-clip-text text-transparent animate-slide-up"
            style={{
              backgroundImage: 'linear-gradient(135deg, #4a5568 0%, #2d3748 50%, #1a1a1a 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              animationDelay: '0.25s',
            }}
          >
            Goals, steps, progress timeline, and daily to-dos — all in one place
          </p>
          <p className="text-xs sm:text-sm font-medium opacity-90 mb-6 sm:mb-8 animate-slide-up px-1" style={{ color: 'var(--landing-text)', animationDelay: '0.3s' }}>
            Click a goal to see details • Use AI to generate to-dos • Add gratitude
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <Button size="lg" variant="default" className="hero-cta-primary" onClick={() => setOnboardingOpen(true)}>
              <Sparkles className="h-5 w-5 mr-2" />
              Start guided setup
            </Button>
            <Button size="lg" variant="outline" onClick={() => document.getElementById('dashboard-content')?.scrollIntoView({ behavior: 'smooth' })} className="hero-cta-outline">
              Go to my goals
            </Button>
          </div>
        </div>
      </section>

      <DemoOnboardingModals
        open={onboardingOpen}
        onClose={() => setOnboardingOpen(false)}
        onCompleteWithOwnPlan={() => {
          localStorage.setItem('goals_app_dashboard_onboarding_done', '1');
          setOnboardingOpen(false);
        }}
        onCompleteWithRecommended={handleOnboardingRecommended}
        onRecommendRequest={handleRecommendRequest}
      />

      <AddGoalDialog
        open={addGoalOpen}
        onOpenChange={setAddGoalOpen}
        onAdd={async (g) => {
          await addGoal({
            ...g,
            progress: 0,
            recommendations: generateRecommendations(g.timeline),
          });
          setAddGoalOpen(false);
          toast({ title: 'Added', description: 'Goal created.' });
        }}
      />

      <AlertDialog open={goalToDeleteId != null} onOpenChange={(open) => !open && setGoalToDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete goal?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone. All steps and progress for this goal will be removed.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={async () => {
                if (goalToDeleteId) {
                  await deleteGoal(goalToDeleteId);
                  setGoalToDeleteId(null);
                  setSelectedGoalId(null);
                  toast({ title: 'Removed', description: 'Goal deleted.' });
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <EditTaskDialog
        task={editingTaskId ? todos.find((t) => t.id === editingTaskId) ?? null : null}
        todayIso={todayIso}
        tomorrowIso={tomorrowIso}
        open={editingTaskId != null}
        onOpenChange={(open) => !open && setEditingTaskId(null)}
        onSave={async (updates) => {
          if (!editingTaskId) return;
          await updateTodo(editingTaskId, updates);
          setEditingTaskId(null);
          toast({ title: 'Updated', description: 'Task updated.' });
        }}
      />

      {/* Banner section (same as Goals page) */}
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-8" style={{ backgroundColor: 'var(--landing-bg)' }}>
        <TrialBanner />
      </div>

      {/* Stats Bar */}
      <section className="py-4 sm:py-8 px-3 sm:px-4 border-t" style={{ backgroundColor: 'var(--landing-bg)', borderColor: 'var(--landing-border)' }}>
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 text-center">
          <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl border" style={{ backgroundColor: 'var(--landing-accent)', borderColor: 'var(--landing-border)' }}>
            <div className="text-xl sm:text-3xl font-bold mb-0.5 sm:mb-1" style={{ color: 'var(--landing-primary)' }}>{activeGoals.length}</div>
            <div className="text-xs sm:text-sm font-medium" style={{ color: 'var(--landing-text)' }}>Active Goals</div>
          </div>
          <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl border" style={{ backgroundColor: 'var(--landing-accent)', borderColor: 'var(--landing-border)' }}>
            <div className="text-xl sm:text-3xl font-bold mb-0.5 sm:mb-1" style={{ color: 'var(--landing-primary)' }}>{todos.filter((t) => t.completed).length}/{todos.length}</div>
            <div className="text-xs sm:text-sm font-medium" style={{ color: 'var(--landing-text)' }}>Tasks Done</div>
          </div>
          <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl border" style={{ backgroundColor: 'var(--landing-accent)', borderColor: 'var(--landing-border)' }}>
            <div className="text-xl sm:text-3xl font-bold mb-0.5 sm:mb-1" style={{ color: 'var(--landing-primary)' }}>{totalPoints}</div>
            <div className="text-xs sm:text-sm font-medium" style={{ color: 'var(--landing-text)' }}>Total Points</div>
          </div>
          <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl border" style={{ backgroundColor: 'var(--landing-accent)', borderColor: 'var(--landing-border)' }}>
            <div className="text-xl sm:text-3xl font-bold mb-0.5 sm:mb-1" style={{ color: 'var(--landing-primary)' }}>{streak} days</div>
            <div className="text-xs sm:text-sm font-medium" style={{ color: 'var(--landing-text)' }}>Current Streak</div>
          </div>
        </div>
      </section>

      {/* Main content: Goals, To Do List, Calendar, Progress, Gratitude — click tab to go to section */}
      <section id="dashboard-content" className="py-6 sm:py-12 px-3 sm:px-6 border-t" style={{ backgroundColor: 'var(--landing-bg)', borderColor: 'var(--landing-border)' }}>
        <div className="sticky top-14 sm:top-16 z-30 mb-6 sm:mb-10 -mx-3 sm:mx-0 px-2 sm:px-0">
          <div
            ref={tabsScrollRef}
            className="rounded-lg sm:rounded-xl border-2 p-2 flex gap-2 justify-start sm:justify-center overflow-x-auto overflow-y-hidden snap-x snap-mandatory scroll-smooth min-w-0 w-full [scrollbar-width:thin] [scrollbar-color:var(--landing-border)_transparent] sm:[&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[var(--landing-border)]"
            style={{ backgroundColor: 'var(--landing-accent)', borderColor: 'var(--landing-border)' }}
            role="tablist"
            aria-label="Dashboard sections"
          >
            {(['Goals', 'To Do List', 'Calendar', 'Progress', 'Gratitude', 'Journal'] as const).map((label, i) => {
              const id = homeSectionIds[i];
              const isActive = activeHomeSection === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={id}
                  id={`tab-${id}`}
                  onClick={() => scrollToHomeSection(id)}
                  className={`shrink-0 snap-start px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap min-h-[2.5rem] touch-manipulation first:ml-0 last:mr-0 ${isActive ? 'shadow-md' : 'opacity-90 hover:opacity-100'}`}
                  style={isActive ? { backgroundColor: 'var(--landing-primary)', color: 'white' } : { color: 'var(--landing-text)' }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="max-w-6xl mx-auto space-y-8 sm:space-y-12">
          {/* Goals */}
          <section id="goals" className="scroll-mt-24 sm:scroll-mt-28">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
              <div className="flex items-center gap-3">
                <Target className="h-7 w-7 sm:h-8 sm:w-8 shrink-0" style={{ color: 'var(--landing-primary)' }} />
                <h2 className="text-2xl sm:text-3xl font-bold truncate min-w-0" style={{ color: 'var(--landing-text)' }}>Active Goals</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" className="rounded-xl shrink-0" onClick={() => navigate('/goals')}>
                  View all goals
                </Button>
                <Button className="hero-cta-primary rounded-xl shrink-0" onClick={() => setAddGoalOpen(true)}>
                  <Plus className="h-5 w-5 mr-2" />
                  Add Goal
                </Button>
              </div>
            </div>
            {activeGoals.length === 0 ? (
              <Card className="overflow-hidden shadow-lg rounded-xl sm:rounded-2xl feature-card-shadow" style={{ borderColor: 'var(--landing-border)', backgroundColor: 'white' }}>
                <CardContent className="p-6 sm:p-8 text-center">
                  <Target className="h-10 w-10 mx-auto mb-3 opacity-50" style={{ color: 'var(--landing-primary)' }} />
                  <p className="font-medium text-sm sm:text-base" style={{ color: 'var(--landing-text)' }}>No active goals</p>
                  <p className="text-xs sm:text-sm mt-1 px-2" style={{ color: 'var(--landing-text)', opacity: 0.7 }}>Add a goal or resume one from the Goals page.</p>
                  <Button onClick={() => setAddGoalOpen(true)} className="mt-4 rounded-xl min-h-9 touch-manipulation" size="sm">Add goal</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {activeGoals.map((goal) => (
                  <Card
                    key={goal.id}
                    className="overflow-hidden shadow-lg hover:shadow-xl transition-all cursor-pointer feature-card-shadow"
                    style={{ borderColor: 'var(--landing-border)', backgroundColor: 'white' }}
                    onClick={() => setSelectedGoalId(goal.id)}
                  >
                    {goal.imageUrl && (
                      <div className="w-full h-32 sm:h-40 overflow-hidden">
                        <img src={goal.imageUrl} alt={goal.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <h3 className="text-base sm:text-lg font-semibold min-w-0 line-clamp-2" style={{ color: 'var(--landing-text)' }}>{goal.title}</h3>
                        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                          <span className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--landing-primary)' }}>{goal.progress}/10</span>
                          <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-8 sm:w-8 text-red-600 hover:text-red-700 hover:bg-red-50 touch-manipulation" onClick={(e) => { e.stopPropagation(); setGoalToDeleteId(goal.id); }} title="Delete goal">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm mb-3 opacity-90" style={{ color: 'var(--landing-text)' }}>{goal.description}</p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge variant="outline" style={{ borderColor: 'var(--landing-primary)', color: 'var(--landing-primary)' }}>{timelineLabels[goal.timeline] ?? goal.timeline}</Badge>
                        <Badge style={{ backgroundColor: goal.priority === 'high' ? 'rgba(220,38,38,0.12)' : 'var(--landing-accent)', color: goal.priority === 'high' ? '#dc2626' : 'var(--landing-primary)' }}>{goal.priority}</Badge>
                        {goal.status === 'paused' && <Badge variant="outline" className="border-amber-500 text-amber-700">Paused</Badge>}
                        {goal.status === 'completed' && <Badge className="bg-green-100 text-green-800 border-0">Completed</Badge>}
                      </div>
                      <div className="flex flex-wrap gap-1.5 mb-3 touch-manipulation" onClick={(e) => e.stopPropagation()}>
                        <Button variant="outline" size="sm" className="rounded-lg text-xs min-h-9" onClick={() => setSelectedGoalId(goal.id)} title="Open goal">
                          <LogIn className="h-3.5 w-3 mr-1" /> Enter
                        </Button>
                        {(goal.status === 'active' || !goal.status) && (
                          <>
                            <Button variant="outline" size="sm" className="rounded-lg text-xs min-h-9" onClick={() => updateGoal(goal.id, { status: 'paused' })} title="Pause goal">
                              <Pause className="h-3.5 w-3 mr-1" /> Pause
                            </Button>
                            <Button variant="outline" size="sm" className="rounded-lg text-xs min-h-9" onClick={() => updateGoal(goal.id, { status: 'completed', progress: 10 })} title="Mark complete">
                              <CheckCircle className="h-3.5 w-3 mr-1" /> Complete
                            </Button>
                          </>
                        )}
                        {goal.status === 'paused' && (
                          <Button variant="outline" size="sm" className="rounded-lg text-xs min-h-9" onClick={() => updateGoal(goal.id, { status: 'active' })} title="Resume goal">
                            <Play className="h-3.5 w-3 mr-1" /> Resume
                          </Button>
                        )}
                      </div>
                      {(goal.budget != null && goal.budget > 0) && (
                        <div className="flex flex-wrap items-center gap-4 mb-3 text-sm" style={{ color: 'var(--landing-text)' }}>
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4" style={{ color: 'var(--landing-primary)' }} />
                            <span><strong>Budget:</strong> {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(goal.budget)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4" style={{ color: 'var(--landing-primary)' }} />
                            <span><strong>Spent:</strong> {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(goal.spent ?? 0)}</span>
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={(e) => { e.stopPropagation(); setBudgetEditGoal(goal); }} title="Edit budget and spent">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                        <Slider value={[goal.progress]} onValueChange={(v) => updateGoalProgress(goal.id, v[0])} max={10} step={1} className="w-full" />
                        <Progress value={goal.progress * 10} className="h-2" style={{ backgroundColor: 'var(--landing-accent)' }} />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* To Do List */}
          <section id="to-do" className="scroll-mt-24 sm:scroll-mt-28">
            <Card className="shadow-lg feature-card-shadow" style={{ borderColor: 'var(--landing-border)', backgroundColor: 'white' }}>
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <CheckCircle2 className="h-6 w-6 sm:h-7 sm:w-7 shrink-0" style={{ color: 'var(--landing-primary)' }} />
                    <h3 className="text-xl sm:text-2xl font-semibold truncate" style={{ color: 'var(--landing-text)' }}>To-Do List</h3>
                    <Badge className="shrink-0 text-xs hidden sm:inline-flex" style={{ backgroundColor: 'var(--landing-accent)', color: 'var(--landing-primary)' }}>+5 pts</Badge>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button type="button" size="sm" variant="outline" onClick={() => handleAIGenerateTodos('today')} className="text-xs min-h-9 touch-manipulation" disabled={aiTodosLoading !== null}>
                      {aiTodosLoading === 'today' ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <SparklesIcon className="h-3 w-3 mr-1" />} AI: Today
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => handleAIGenerateTodos('tomorrow')} className="text-xs min-h-9 touch-manipulation" disabled={aiTodosLoading !== null}>
                      {aiTodosLoading === 'tomorrow' ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <SparklesIcon className="h-3 w-3 mr-1" />} AI: Tomorrow
                    </Button>
                  </div>
                </div>
                <Tabs defaultValue="today" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4" style={{ backgroundColor: 'var(--landing-accent)' }}>
                    <TabsTrigger value="today">Today</TabsTrigger>
                    <TabsTrigger value="tomorrow">Tomorrow</TabsTrigger>
                  </TabsList>
                  <TabsContent value="today" className="space-y-3 mt-0">
                    {(() => {
                      const NO_GROUP = '\u200bNo group';
                      const byGroup = todosToday.reduce<Record<string, typeof todosToday>>((acc, task) => {
                        const g = task.groupName?.trim() || NO_GROUP;
                        if (!acc[g]) acc[g] = [];
                        acc[g].push(task);
                        return acc;
                      }, {});
                      const order = Object.keys(byGroup).sort((a, b) => (a === NO_GROUP ? 1 : 0) - (b === NO_GROUP ? 1 : 0));
                      return order.map((groupLabel, index) => (
                        <div key={groupLabel} className="space-y-2">
                          <p className="text-sm font-semibold" style={{ color: 'var(--landing-primary)' }}>
                            {index + 1}. {groupLabel === NO_GROUP ? 'Other' : groupLabel}
                          </p>
                          {byGroup[groupLabel].map((task) => (
                            <div key={task.id} className={`flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl transition-all ${task.completed ? 'border-2' : ''}`} style={{ backgroundColor: task.completed ? 'var(--landing-accent)' : 'var(--landing-bg)', borderColor: task.completed ? 'var(--landing-primary)' : 'transparent' }}>
                              <button type="button" onClick={() => toggleTodo(task.id)} className={`w-7 h-7 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center shrink-0 touch-manipulation ${task.completed ? '' : 'border-gray-300'}`} style={task.completed ? { backgroundColor: 'var(--landing-primary)', borderColor: 'var(--landing-primary)' } : {}}>
                                {task.completed && <CheckCircle2 className="h-4 w-4 text-white" />}
                              </button>
                              <div className="flex-1 min-w-0 flex items-center gap-2 overflow-hidden">
                                {task.timeSlot && <span className="flex items-center gap-1 text-xs shrink-0 opacity-80" style={{ color: 'var(--landing-text)' }}><Clock className="h-3 w-3" /> {task.timeSlot}</span>}
                                <span className={`truncate ${task.completed ? 'line-through opacity-70' : ''}`} style={{ color: 'var(--landing-text)' }}>{task.title}</span>
                              </div>
                              <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-8 sm:w-8 touch-manipulation" onClick={(e) => e.stopPropagation()} title="Move task">
                                      <ArrowRightLeft className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                    <DropdownMenuItem
                                      disabled={task.scheduledDate === todayIso}
                                      onClick={async () => {
                                        await updateTodo(task.id, { scheduledDate: todayIso });
                                        toast({ title: 'Moved', description: 'Task moved to Today.' });
                                      }}
                                    >
                                      <CalendarDays className="h-4 w-4 mr-2" /> Move to Today
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      disabled={task.scheduledDate === tomorrowIso}
                                      onClick={async () => {
                                        await updateTodo(task.id, { scheduledDate: tomorrowIso });
                                        toast({ title: 'Moved', description: 'Task moved to Tomorrow.' });
                                      }}
                                    >
                                      <CalendarDays className="h-4 w-4 mr-2" /> Move to Tomorrow
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Groups (today)</DropdownMenuLabel>
                                    {todayGroupsForMove.map((groupLabel) => {
                                      const isOther = groupLabel === 'Other';
                                      const currentGroup = task.groupName?.trim() || null;
                                      const isCurrent = isOther ? !currentGroup : currentGroup === groupLabel;
                                      return (
                                        <DropdownMenuItem
                                          key={groupLabel}
                                          disabled={isCurrent}
                                          onClick={async () => {
                                            await updateTodo(task.id, { groupName: isOther ? null : groupLabel });
                                            toast({ title: 'Moved', description: `Task moved to ${groupLabel}.` });
                                          }}
                                        >
                                          <FolderInput className="h-4 w-4 mr-2" /> {groupLabel}
                                        </DropdownMenuItem>
                                      );
                                    })}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                                <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-8 sm:w-8 touch-manipulation" onClick={(e) => { e.stopPropagation(); setEditingTaskId(task.id); }} title="Edit task"><PenLine className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-8 sm:w-8 text-red-600 touch-manipulation" onClick={async (e) => { e.stopPropagation(); await deleteTodo(task.id); toast({ title: 'Removed', description: 'Task removed.' }); }} title="Delete task"><Trash2 className="h-4 w-4" /></Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ));
                    })()}
                  </TabsContent>
                  <TabsContent value="tomorrow" className="space-y-3 mt-0">
                    {(() => {
                      const NO_GROUP = '\u200bNo group';
                      const byGroup = todosTomorrow.reduce<Record<string, typeof todosTomorrow>>((acc, task) => {
                        const g = task.groupName?.trim() || NO_GROUP;
                        if (!acc[g]) acc[g] = [];
                        acc[g].push(task);
                        return acc;
                      }, {});
                      const order = Object.keys(byGroup).sort((a, b) => (a === NO_GROUP ? 1 : 0) - (b === NO_GROUP ? 1 : 0));
                      return order.map((groupLabel, index) => (
                        <div key={groupLabel} className="space-y-2">
                          <p className="text-sm font-semibold" style={{ color: 'var(--landing-primary)' }}>
                            {index + 1}. {groupLabel === NO_GROUP ? 'Other' : groupLabel}
                          </p>
                          {byGroup[groupLabel].map((task) => (
                            <div key={task.id} className={`flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl transition-all ${task.completed ? 'border-2' : ''}`} style={{ backgroundColor: task.completed ? 'var(--landing-accent)' : 'var(--landing-bg)', borderColor: task.completed ? 'var(--landing-primary)' : 'transparent' }}>
                              <button type="button" onClick={() => toggleTodo(task.id)} className={`w-7 h-7 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center shrink-0 touch-manipulation ${task.completed ? '' : 'border-gray-300'}`} style={task.completed ? { backgroundColor: 'var(--landing-primary)', borderColor: 'var(--landing-primary)' } : {}}>
                                {task.completed && <CheckCircle2 className="h-4 w-4 text-white" />}
                              </button>
                              <div className="flex-1 min-w-0 flex items-center gap-2 overflow-hidden">
                                {task.timeSlot && <span className="flex items-center gap-1 text-xs shrink-0 opacity-80" style={{ color: 'var(--landing-text)' }}><Clock className="h-3 w-3" /> {task.timeSlot}</span>}
                                <span className={`truncate ${task.completed ? 'line-through opacity-70' : ''}`} style={{ color: 'var(--landing-text)' }}>{task.title}</span>
                              </div>
                              <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-8 sm:w-8 touch-manipulation" onClick={(e) => e.stopPropagation()} title="Move task">
                                      <ArrowRightLeft className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                    <DropdownMenuItem
                                      disabled={task.scheduledDate === todayIso}
                                      onClick={async () => {
                                        await updateTodo(task.id, { scheduledDate: todayIso });
                                        toast({ title: 'Moved', description: 'Task moved to Today.' });
                                      }}
                                    >
                                      <CalendarDays className="h-4 w-4 mr-2" /> Move to Today
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      disabled={task.scheduledDate === tomorrowIso}
                                      onClick={async () => {
                                        await updateTodo(task.id, { scheduledDate: tomorrowIso });
                                        toast({ title: 'Moved', description: 'Task moved to Tomorrow.' });
                                      }}
                                    >
                                      <CalendarDays className="h-4 w-4 mr-2" /> Move to Tomorrow
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Groups (tomorrow)</DropdownMenuLabel>
                                    {tomorrowGroupsForMove.map((groupLabel) => {
                                      const isOther = groupLabel === 'Other';
                                      const currentGroup = task.groupName?.trim() || null;
                                      const isCurrent = isOther ? !currentGroup : currentGroup === groupLabel;
                                      return (
                                        <DropdownMenuItem
                                          key={groupLabel}
                                          disabled={isCurrent}
                                          onClick={async () => {
                                            await updateTodo(task.id, { groupName: isOther ? null : groupLabel });
                                            toast({ title: 'Moved', description: `Task moved to ${groupLabel}.` });
                                          }}
                                        >
                                          <FolderInput className="h-4 w-4 mr-2" /> {groupLabel}
                                        </DropdownMenuItem>
                                      );
                                    })}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                                <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-8 sm:w-8 touch-manipulation" onClick={(e) => { e.stopPropagation(); setEditingTaskId(task.id); }} title="Edit task"><PenLine className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-8 sm:w-8 text-red-600 touch-manipulation" onClick={async (e) => { e.stopPropagation(); await deleteTodo(task.id); toast({ title: 'Removed', description: 'Task removed.' }); }} title="Delete task"><Trash2 className="h-4 w-4" /></Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ));
                    })()}
                  </TabsContent>
                </Tabs>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const title = newTaskTitle.trim();
                    if (title) {
                      const iso = newTaskDay === 'today' ? todayIso : tomorrowIso;
                      addTodo({ title, completed: false, points: 5, scheduledDate: iso, timeSlot: newTaskTimeSlot.trim() || undefined, groupName: newTaskGroup.trim() || undefined });
                      setNewTaskTitle('');
                      setNewTaskTimeSlot('');
                      setNewTaskGroup('');
                      toast({ title: 'Added', description: `Task added for ${newTaskDay}.` });
                    }
                  }}
                  className="space-y-2 mt-4"
                >
                  <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
                    <Input placeholder="Add a task..." value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} className="flex-1 min-w-0 w-full sm:min-w-[140px]" style={{ borderColor: 'var(--landing-border)' }} />
                    <div className="flex flex-wrap gap-2">
                      <Input placeholder="Group" value={newTaskGroup} onChange={(e) => setNewTaskGroup(e.target.value)} className="w-full sm:w-[130px] min-w-0" style={{ borderColor: 'var(--landing-border)' }} title="Group: Studying, Exercise, Other, etc." />
                      <Select value={newTaskDay} onValueChange={(v: 'today' | 'tomorrow') => setNewTaskDay(v)}>
                        <SelectTrigger className="w-[100px] sm:w-[110px] shrink-0" style={{ borderColor: 'var(--landing-border)' }}><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="today">Today</SelectItem><SelectItem value="tomorrow">Tomorrow</SelectItem></SelectContent>
                      </Select>
                      <Input placeholder="Time" value={newTaskTimeSlot} onChange={(e) => setNewTaskTimeSlot(e.target.value)} className="w-[80px] sm:w-[100px] shrink-0" style={{ borderColor: 'var(--landing-border)' }} />
                      <Button type="submit" size="sm" className="hero-cta-primary min-h-9 touch-manipulation shrink-0" disabled={!newTaskTitle.trim()}><Plus className="h-4 w-4 mr-1" /> Add</Button>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          </section>

          {/* Calendar — day timeline */}
          <section id="calendar" className="scroll-mt-24 sm:scroll-mt-28">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <CalendarIcon className="h-7 w-7 sm:h-8 sm:w-8 shrink-0" style={{ color: 'var(--landing-primary)' }} />
                <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--landing-text)' }}>Calendar</h2>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="rounded-xl min-h-9 touch-manipulation" onClick={() => navigate('/calendar')}>
                  Full calendar
                </Button>
                <Button className="hero-cta-primary rounded-xl min-h-9 touch-manipulation" onClick={openNewSchedule}>
                  <Plus className="h-5 w-5 mr-2" />
                  Add event
                </Button>
              </div>
            </div>
            <Card className="shadow-lg feature-card-shadow overflow-hidden" style={{ borderColor: 'var(--landing-border)', backgroundColor: 'white' }}>
              <CardContent className="p-0">
                <div className="flex items-center justify-between px-3 sm:px-4 py-3 border-b" style={{ borderColor: 'var(--landing-border)' }}>
                  <Button variant="ghost" size="icon" className="h-10 w-10 sm:h-9 sm:w-9 touch-manipulation" onClick={() => setSelectedDate((d) => { const n = new Date(d); n.setDate(n.getDate() - 1); return n; })}><ChevronLeft className="h-5 w-5" /></Button>
                  <span className="font-semibold text-sm sm:text-base" style={{ color: 'var(--landing-text)' }}>{dateLabel}</span>
                  <Button variant="ghost" size="icon" className="h-10 w-10 sm:h-9 sm:w-9 touch-manipulation" onClick={() => setSelectedDate((d) => { const n = new Date(d); n.setDate(n.getDate() + 1); return n; })}><ChevronRight className="h-5 w-5" /></Button>
                </div>
                <DayTimelineView
                  events={dayEvents}
                  eventColors={eventColors}
                  onSlotClick={handleSlotClick}
                  onEventUpdate={handleEventTimeUpdate}
                  onEventClick={(id) => { const e = events.find((ev) => ev.id === id); if (e) setEditingEvent(e); setEventDialogOpen(true); }}
                  selectedEventId={editingEvent?.id}
                  maxHeight="min(320px, 50vh)"
                  emptyMessage="No events this day. Click a time slot or Add event to schedule."
                />
              </CardContent>
            </Card>
            <EventDialog
              open={eventDialogOpen}
              onOpenChange={setEventDialogOpen}
              selectedDate={selectedDate}
              selectedTime={slotClickTime}
              onSave={handleSaveEvent}
              event={editingEvent}
              goals={goals}
            />
          </section>

          {/* Progress — compact overview */}
          <section id="progress" className="scroll-mt-24 sm:scroll-mt-28">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <BarChart3 className="h-7 w-7 sm:h-8 sm:w-8 shrink-0" style={{ color: 'var(--landing-primary)' }} />
                <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--landing-text)' }}>Progress</h2>
              </div>
              <Button variant="outline" size="sm" className="rounded-xl min-h-9 touch-manipulation w-full sm:w-auto" onClick={() => navigate('/progress')}>
                View full progress
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              <Card className="p-3 sm:p-4 rounded-lg sm:rounded-xl border" style={{ backgroundColor: 'var(--landing-accent)', borderColor: 'var(--landing-border)' }}>
                <div className="text-xl sm:text-2xl font-bold mb-0.5 sm:mb-1" style={{ color: 'var(--landing-primary)' }}>{activeGoals.length}</div>
                <div className="text-xs sm:text-sm font-medium" style={{ color: 'var(--landing-text)' }}>Active Goals</div>
              </Card>
              <Card className="p-3 sm:p-4 rounded-lg sm:rounded-xl border" style={{ backgroundColor: 'var(--landing-accent)', borderColor: 'var(--landing-border)' }}>
                <div className="text-xl sm:text-2xl font-bold mb-0.5 sm:mb-1" style={{ color: 'var(--landing-primary)' }}>{todos.filter((t) => t.completed).length}/{todos.length}</div>
                <div className="text-xs sm:text-sm font-medium" style={{ color: 'var(--landing-text)' }}>Tasks Done</div>
              </Card>
              <Card className="p-3 sm:p-4 rounded-lg sm:rounded-xl border" style={{ backgroundColor: 'var(--landing-accent)', borderColor: 'var(--landing-border)' }}>
                <div className="text-xl sm:text-2xl font-bold mb-0.5 sm:mb-1" style={{ color: 'var(--landing-primary)' }}>{totalPoints}</div>
                <div className="text-xs sm:text-sm font-medium" style={{ color: 'var(--landing-text)' }}>Points</div>
              </Card>
              <Card className="p-3 sm:p-4 rounded-lg sm:rounded-xl border" style={{ backgroundColor: 'var(--landing-accent)', borderColor: 'var(--landing-border)' }}>
                <div className="text-xl sm:text-2xl font-bold mb-0.5 sm:mb-1" style={{ color: 'var(--landing-primary)' }}>{streak} days</div>
                <div className="text-xs sm:text-sm font-medium" style={{ color: 'var(--landing-text)' }}>Streak</div>
              </Card>
            </div>
          </section>

          {/* Gratitude */}
          <section id="gratitude" className="scroll-mt-24 sm:scroll-mt-28">
            <GratitudeJournalSections
              date={todayIso}
              entries={gratitudeEntries}
              onSaveSection={(date, sectionKey, sectionLabel, content) => {
                updateGratitudeSectionByKey(date, sectionKey, sectionLabel, content).then(() => {
                  if (content) toast({ title: 'Saved', description: 'Gratitude saved.' });
                });
              }}
              onRemoveCustomSection={(date, sectionKey) => deleteGratitudeBySection(date, sectionKey)}
              useLandingStyles
            />
          </section>

          {/* Journal — life journal (separate from gratitude) */}
          <section id="journal" className="scroll-mt-24 sm:scroll-mt-28">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <BookOpen className="h-7 w-7 sm:h-8 sm:w-8 shrink-0" style={{ color: 'var(--landing-primary)' }} />
                <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--landing-text)' }}>Journal</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" className="rounded-xl min-h-9 touch-manipulation" onClick={() => navigate('/journal')}>
                  Open Journal
                </Button>
                <Button
                  className="rounded-xl min-h-9 touch-manipulation hero-cta-primary"
                  onClick={() => setJournalDialogOpen(true)}
                >
                  <PenLine className="h-4 w-4 mr-2" />
                  {journalForDate ? 'Edit today\'s entry' : 'Write today\'s entry'}
                </Button>
              </div>
            </div>
            {journalForDate ? (
              <Card className="p-4 sm:p-6 rounded-lg sm:rounded-xl border" style={{ backgroundColor: 'var(--landing-accent)', borderColor: 'var(--landing-border)' }}>
                <p className="text-sm font-medium mb-1" style={{ color: 'var(--landing-text)', opacity: 0.8 }}>
                  {new Date(todayIso + 'T12:00:00').toLocaleDateString('en-US')}
                </p>
                {journalForDate.title && (
                  <h3 className="font-semibold mb-2" style={{ color: 'var(--landing-text)' }}>{journalForDate.title}</h3>
                )}
                <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--landing-text)' }}>
                  {journalForDate.content.length > 280 ? journalForDate.content.slice(0, 280) + '…' : journalForDate.content}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-3 text-sm"
                  style={{ color: 'var(--landing-primary)' }}
                  onClick={() => navigate('/journal')}
                >
                  View all entries →
                </Button>
              </Card>
            ) : (
              <Card className="p-6 sm:p-8 rounded-lg sm:rounded-xl border text-center" style={{ backgroundColor: 'var(--landing-accent)', borderColor: 'var(--landing-border)' }}>
                <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-60" style={{ color: 'var(--landing-primary)' }} />
                <p className="text-sm mb-4" style={{ color: 'var(--landing-text)', opacity: 0.9 }}>
                  Capture your day and reflect. Your journal is separate from gratitude—use it for thoughts, experiences, or anything you want to remember.
                </p>
                <Button
                  className="rounded-xl hero-cta-primary"
                  onClick={() => setJournalDialogOpen(true)}
                >
                  <PenLine className="h-4 w-4 mr-2" />
                  Write today&apos;s entry
                </Button>
              </Card>
            )}
          </section>
        </div>
      </section>

      <Dialog open={heroEditOpen} onOpenChange={setHeroEditOpen}>
        <DialogContent className="rounded-2xl max-w-sm" style={{ borderColor: 'var(--landing-border)' }}>
          <DialogHeader>
            <DialogTitle style={{ color: 'var(--landing-text)' }}>Home screen picture</DialogTitle>
          </DialogHeader>
          <p className="text-sm mb-3" style={{ color: 'var(--landing-text)', opacity: 0.9 }}>
            Use an image URL or upload a photo from your device. Leave blank to use the default.
          </p>
          <div className="space-y-3">
            <Label style={{ color: 'var(--landing-text)' }}>Image URL</Label>
            <Input
              value={heroInputUrl.startsWith('data:') || heroInputUrl === '[Uploaded image]' ? '' : heroInputUrl}
              onChange={(e) => setHeroInputUrl(e.target.value)}
              placeholder="https://... or upload below"
              className="rounded-xl border-[var(--landing-border)]"
            />
            <div className="relative">
              <Label style={{ color: 'var(--landing-text)' }}>Or upload from device</Label>
              <input
                ref={heroFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > MAX_HERO_IMAGE_BYTES) {
                    toast({ title: 'File too large', description: 'Please choose an image under 2MB.', variant: 'destructive' });
                    return;
                  }
                  const reader = new FileReader();
                  reader.onload = () => {
                    const dataUrl = reader.result as string;
                    setHeroInputUrl(dataUrl);
                    toast({ title: 'Image loaded', description: 'Click Save to set as home screen.' });
                  };
                  reader.readAsDataURL(file);
                  e.target.value = '';
                }}
              />
              <Button
                type="button"
                variant="outline"
                className="w-full mt-1.5 rounded-xl"
                style={{ borderColor: 'var(--landing-border)' }}
                onClick={() => heroFileInputRef.current?.click()}
              >
                <ImageIcon className="h-4 w-4 mr-2" />
                Choose image (max 2MB)
              </Button>
              {heroInputUrl.startsWith('data:') && (
                <p className="text-xs mt-1" style={{ color: 'var(--landing-primary)' }}>Image selected. Click Save to apply.</p>
              )}
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" onClick={() => setHeroEditOpen(false)} className="rounded-xl flex-1">Cancel</Button>
            <Button
              className="rounded-xl flex-1"
              onClick={() => {
                const urlToSave = heroInputUrl === '[Uploaded image]' ? dashboardHeroUrl : heroInputUrl;
                setDashboardHeroUrl(urlToSave.trim() || '');
                setHeroEditOpen(false);
                toast({ title: 'Saved', description: 'Home screen picture updated.' });
              }}
            >
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <JournalDialog
        open={journalDialogOpen}
        onOpenChange={setJournalDialogOpen}
        selectedIso={todayIso}
        existing={journalForDate}
        onSave={async (entry) => {
          if (journalForDate) {
            await updateJournalEntry(journalForDate.id, { date: entry.date, title: entry.title, content: entry.content, mood: entry.mood, imageUrl: entry.imageUrl });
            toast({ title: 'Saved', description: 'Journal entry updated.' });
          } else {
            await addJournalEntry({ date: entry.date, title: entry.title, content: entry.content, mood: entry.mood, imageUrl: entry.imageUrl });
            toast({ title: 'Saved', description: 'Journal entry added.' });
          }
          setJournalDialogOpen(false);
        }}
        onDelete={journalForDate ? async () => {
          await deleteJournalEntry(journalForDate.id);
          toast({ title: 'Removed', description: 'Journal entry removed.' });
          setJournalDialogOpen(false);
        } : undefined}
      />

      <BudgetSpentEditDialog
        goal={budgetEditGoal}
        onClose={() => setBudgetEditGoal(null)}
        onSave={async (budget, spent) => {
          if (!budgetEditGoal) return;
          await updateGoal(budgetEditGoal.id, { budget, spent });
          toast({ title: 'Saved', description: 'Budget and spent updated.' });
          setBudgetEditGoal(null);
        }}
      />
      </div>
    </div>
  );
}

function EditTaskDialog({
  task,
  todayIso,
  tomorrowIso,
  open,
  onOpenChange,
  onSave,
}: {
  task: ManifestationTodo | null;
  todayIso: string;
  tomorrowIso: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updates: { title: string; scheduledDate: string; timeSlot?: string | null; groupName?: string | null }) => void | Promise<void>;
}) {
  const [title, setTitle] = useState('');
  const [day, setDay] = useState<'today' | 'tomorrow'>('today');
  const [timeSlot, setTimeSlot] = useState('');
  const [groupName, setGroupName] = useState('');

  React.useEffect(() => {
    if (open && task) {
      setTitle(task.title);
      setDay(task.scheduledDate === tomorrowIso ? 'tomorrow' : 'today');
      setTimeSlot(task.timeSlot ?? '');
      setGroupName(task.groupName ?? '');
    }
  }, [open, task, tomorrowIso]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const scheduledDate = day === 'today' ? todayIso : tomorrowIso;
    onSave({
      title: title.trim(),
      scheduledDate,
      timeSlot: timeSlot.trim() || null,
      groupName: groupName.trim() || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl border-2 max-w-md" style={{ borderColor: 'var(--landing-border)' }}>
        <DialogHeader>
          <DialogTitle style={{ color: 'var(--landing-text)' }}>Edit task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div>
            <Label style={{ color: 'var(--landing-text)' }}>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1.5 rounded-xl" style={{ borderColor: 'var(--landing-border)' }} required />
          </div>
          <div>
            <Label style={{ color: 'var(--landing-text)' }}>Day</Label>
            <Select value={day} onValueChange={(v: 'today' | 'tomorrow') => setDay(v)}>
              <SelectTrigger className="mt-1.5 rounded-xl" style={{ borderColor: 'var(--landing-border)' }}><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="today">Today</SelectItem><SelectItem value="tomorrow">Tomorrow</SelectItem></SelectContent>
            </Select>
          </div>
          <div>
            <Label style={{ color: 'var(--landing-text)' }}>Time (optional)</Label>
            <Input value={timeSlot} onChange={(e) => setTimeSlot(e.target.value)} placeholder="e.g. 09:00" className="mt-1.5 rounded-xl" style={{ borderColor: 'var(--landing-border)' }} />
          </div>
          <div>
            <Label style={{ color: 'var(--landing-text)' }}>Group (optional)</Label>
            <Input value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="e.g. Studying, Exercise, Other" className="mt-1.5 rounded-xl" style={{ borderColor: 'var(--landing-border)' }} />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl flex-1">Cancel</Button>
            <Button type="submit" className="rounded-xl flex-1" disabled={!title.trim()}>Save</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function OverviewCard({
  title,
  count,
  set,
  icon,
  summary,
}: {
  title: string;
  count?: number;
  set?: boolean;
  icon: React.ReactNode;
  summary: string;
}) {
  return (
    <Card className="overflow-hidden shadow-lg rounded-2xl feature-card-shadow" style={{ borderColor: 'var(--landing-border)', backgroundColor: 'white' }}>
      <CardHeader className="pb-2 flex flex-row items-center gap-2" style={{ backgroundColor: 'var(--landing-accent)' }}>
        {icon}
        <CardTitle className="text-base font-semibold" style={{ color: 'var(--landing-text)' }}>
          {title}
          {(count !== undefined || set !== undefined) && (
            <span className="ml-2 text-sm font-normal opacity-80">
              {count !== undefined ? count : set ? 'Set' : ''}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3">
        <p className="text-xs truncate" style={{ color: 'var(--landing-text)', opacity: 0.8 }}>
          {summary}
        </p>
      </CardContent>
    </Card>
  );
}

function TasksTab({
  selectedIso,
  todosOnDate,
  addTodo,
  toggleTodo,
  deleteTodo,
  toast,
}: {
  selectedIso: string;
  todosOnDate: ManifestationTodo[];
  addTodo: (t: Omit<ManifestationTodo, 'id' | 'createdAt'>) => void | Promise<void>;
  toggleTodo: (id: string) => void | Promise<void>;
  deleteTodo: (id: string) => void | Promise<void>;
  toast: ReturnType<typeof useToast>['toast'];
}) {
  const [title, setTitle] = useState('');
  const [groupName, setGroupName] = useState('');
  const today = toISODate(new Date());

  const handleAdd = () => {
    if (!title.trim()) return;
    if (selectedIso < today) {
      toast({ title: 'Invalid date', description: 'Cannot add tasks to past dates.', variant: 'destructive' });
      return;
    }
    addTodo({
      title: title.trim(),
      completed: false,
      points: 5,
      scheduledDate: selectedIso,
      groupName: groupName.trim() || undefined,
    });
    setTitle('');
    setGroupName('');
    toast({ title: 'Added', description: 'To-Do added for this day.' });
  };

  return (
    <Card className="overflow-hidden shadow-lg rounded-2xl feature-card-shadow" style={{ borderColor: 'var(--landing-border)', backgroundColor: 'white' }}>
      <CardHeader style={{ backgroundColor: 'var(--landing-accent)' }}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <ListTodo className="h-7 w-7" style={{ color: 'var(--landing-primary)' }} />
            <CardTitle className="text-xl font-semibold" style={{ color: 'var(--landing-text)' }}>To-Do for {selectedIso}</CardTitle>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: 'var(--landing-primary)', color: 'white' }}>+5 pts each</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div className="flex flex-wrap gap-2">
          <Input
            placeholder="Add a task..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            className="rounded-xl border-[var(--landing-border)] flex-1 min-w-[140px]"
          />
          <Input
            placeholder="Group (e.g. Studying, Exercise)"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            className="rounded-xl border-[var(--landing-border)] w-[130px]"
            title="e.g. Studying, Exercise, Other"
          />
          <Button onClick={handleAdd} className="rounded-xl" disabled={!title.trim()}>
            <Plus className="h-4 w-4 mr-2" />
            Add
          </Button>
        </div>
        {(() => {
          const NO_GROUP = '\u200bNo group';
          const byGroup = todosOnDate.reduce<Record<string, typeof todosOnDate>>((acc, t) => {
            const g = t.groupName?.trim() || NO_GROUP;
            if (!acc[g]) acc[g] = [];
            acc[g].push(t);
            return acc;
          }, {});
          const order = Object.keys(byGroup).sort((a, b) => (a === NO_GROUP ? 1 : 0) - (b === NO_GROUP ? 1 : 0));
          return (
            <ul className="space-y-4">
              {order.map((groupLabel, index) => (
                <li key={groupLabel} className="space-y-2">
                  <p className="text-sm font-semibold" style={{ color: 'var(--landing-primary)' }}>
                    {index + 1}. {groupLabel === NO_GROUP ? 'Other' : groupLabel}
                  </p>
                  {byGroup[groupLabel].map((t) => (
                    <li
                      key={t.id}
                      className="flex items-center gap-3 p-3 rounded-xl border list-none"
                      style={{ borderColor: 'var(--landing-border)', backgroundColor: 'var(--landing-bg)' }}
                    >
                      <button
                        type="button"
                        onClick={() => toggleTodo(t.id)}
                        className="flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors"
                        style={{
                          borderColor: t.completed ? 'var(--landing-primary)' : 'var(--landing-border)',
                          backgroundColor: t.completed ? 'var(--landing-primary)' : 'transparent',
                        }}
                      >
                        {t.completed && <Check className="h-3.5 w-3.5 text-white" />}
                      </button>
                      <span className={`flex-1 ${t.completed ? 'line-through opacity-70' : ''}`} style={{ color: 'var(--landing-text)' }}>{t.title}</span>
                      <Button variant="ghost" size="icon" className="rounded-lg text-red-600" onClick={async () => { await deleteTodo(t.id); toast({ title: 'Removed', description: 'To-Do removed.' }); }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </li>
              ))}
            </ul>
          );
        })()}
        {todosOnDate.length === 0 && (
          <p className="text-sm py-4 text-center" style={{ color: 'var(--landing-text)', opacity: 0.7 }}>
            No To-Do for this day. Add one above.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function GratitudeDialog({
  open,
  onOpenChange,
  selectedIso,
  existing,
  onSave,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIso: string;
  existing: ManifestationGratitude | undefined;
  onSave: (content: string) => void | Promise<void>;
  onDelete?: () => void | Promise<void>;
}) {
  const [content, setContent] = useState(existing?.content ?? '');

  React.useEffect(() => {
    if (open) setContent(existing?.content ?? '');
  }, [open, existing]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl border-2 max-w-md" style={{ borderColor: 'var(--landing-border)' }}>
        <DialogHeader>
          <DialogTitle style={{ color: 'var(--landing-text)' }}>
            Gratitude for {new Date(selectedIso + 'T12:00:00').toLocaleDateString('en-US')}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <Textarea
            placeholder="What are you grateful for today?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            className="rounded-xl border-[var(--landing-border)]"
          />
          <div className="flex gap-2">
            {onDelete && (
              <Button variant="outline" className="rounded-xl text-red-600 border-red-200" onClick={onDelete}>
                Remove
              </Button>
            )}
            <Button className="rounded-xl ml-auto" onClick={() => content.trim() && onSave(content.trim())} disabled={!content.trim()}>
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function JournalDialog({
  open,
  onOpenChange,
  selectedIso,
  existing,
  onSave,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIso: string;
  existing: ManifestationJournalEntry | undefined;
  onSave: (entry: { date: string; title: string; content: string; mood: 'great' | 'good' | 'okay' | 'tough'; imageUrl?: string }) => void | Promise<void>;
  onDelete?: () => void | Promise<void>;
}) {
  const initialValues = React.useMemo(
    () => ({
      date: existing?.date ?? selectedIso,
      title: existing?.title ?? '',
      content: existing?.content ?? '',
      mood: (existing?.mood ?? 'good') as 'great' | 'good' | 'okay' | 'tough',
    }),
    [existing, selectedIso, open]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl border-2 max-w-md" style={{ borderColor: 'var(--landing-border)' }}>
        <DialogHeader>
          <DialogTitle style={{ color: 'var(--landing-text)' }}>
            {existing ? 'Edit Journal Entry' : 'New Journal Entry'}
          </DialogTitle>
        </DialogHeader>
        <div className="pt-2">
          <JournalEntryForm
            initialValues={initialValues}
            onSave={(values) => onSave({ ...values, imageUrl: undefined })}
            onCancel={() => onOpenChange(false)}
            onDelete={onDelete}
            showDelete={!!existing && !!onDelete}
            isEdit={!!existing}
            variant="dialog"
            lockDateToToday
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
