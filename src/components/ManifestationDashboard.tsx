import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { TrialBanner } from './TrialBanner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Target, Calendar, Star, Heart, BookOpen, Award, Plus, Check, Trash2,
  ChevronRight, Flame, CalendarClock, Clock, Sparkles, ChevronLeft, Loader2,
} from 'lucide-react';
import { OfflineIndicator } from './OfflineIndicator';
import { PWAInstallPrompt } from './PWAInstallPrompt';
import { useManifestationDatabase } from '@/hooks/useManifestationDatabase';
import { useEvents } from '@/hooks/useEvents';
import { useReminders } from '@/hooks/useReminders';
import { EventDialog } from './EventDialog';
import type { CalendarEventData } from '@/hooks/useEvents';
import calendarHeroImg from '@/assets/images/Attach-goals-to-time.jpg';
import { useToast } from '@/hooks/use-toast';
import { HeroFloatingCircles } from '@/components/HeroFloatingCircles';

interface Goal {
  id: string;
  title: string;
  description: string;
  timeline: '30' | '60' | '90' | '1year' | '5year';
  progress: number;
  imageUrl?: string;
  priority: 'high' | 'medium' | 'low';
  createdAt: string;
  recommendations: string[];
  budget?: number;
  spent?: number;
}

interface TodoItem {
  id: string;
  title: string;
  completed: boolean;
  points: number;
  createdAt: string;
  scheduledDate?: string | null;
}

interface GratitudeEntry {
  id: string;
  content: string;
  date: string;
}

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  mood: 'great' | 'good' | 'okay' | 'tough';
  date: string;
}

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const ManifestationDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('timeline');

  const {
    goals,
    todos,
    gratitudeEntries,
    journalEntries,
    totalPoints,
    streak,
    isMutating,
    addGoal: addGoalDb,
    updateGoalProgress: updateGoalProgressDb,
    deleteGoal: deleteGoalDb,
    addTodo: addTodoDb,
    toggleTodo: toggleTodoDb,
    deleteTodo: deleteTodoDb,
    addGratitude: addGratitudeDb,
    addJournalEntry: addJournalEntryDb,
  } = useManifestationDatabase();

  const { events, loading: eventsLoading, addEvent, updateEvent, deleteEvent, setEventStatus, refresh: refreshEvents } = useEvents();
  const { createReminder } = useReminders();

  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEventData | undefined>();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string | undefined>();
  const [prefilledGoal, setPrefilledGoal] = useState<{ id: string; title: string } | undefined>();

  // Other dialogs
  const [showGoalDialog, setShowGoalDialog] = useState(false);
  const [showTodoDialog, setShowTodoDialog] = useState(false);
  const [showGratitudeDialog, setShowGratitudeDialog] = useState(false);
  const [showJournalDialog, setShowJournalDialog] = useState(false);

  const [newGoal, setNewGoal] = useState({ title: '', description: '', timeline: '30' as const, priority: 'medium' as const, imageUrl: '' });
  const goalImageInputRef = useRef<HTMLInputElement>(null);
  const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

  const GOALS_PER_PAGE = 6;
  const [goalsPage, setGoalsPage] = useState(1);
  const goalsTotalPages = Math.max(1, Math.ceil(goals.length / GOALS_PER_PAGE));
  const safeGoalsPage = Math.min(goalsPage, goalsTotalPages);
  const paginatedGoals = goals.slice((safeGoalsPage - 1) * GOALS_PER_PAGE, safeGoalsPage * GOALS_PER_PAGE);

  useEffect(() => {
    if (goalsPage > goalsTotalPages && goalsTotalPages >= 1) setGoalsPage(goalsTotalPages);
  }, [goalsTotalPages, goalsPage]);
  const [newTodo, setNewTodo] = useState({ title: '', scheduledDate: '' as string });
  const todayIso = new Date().toISOString().split('T')[0];

  type TodoFilter = 'today' | 'all' | 'draft' | 'day' | 'month' | 'year';
  const [todoFilter, setTodoFilter] = useState<TodoFilter>('today');
  const [todoDayDate, setTodoDayDate] = useState(todayIso);
  const [todoMonthDate, setTodoMonthDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [todoYearDate, setTodoYearDate] = useState(String(new Date().getFullYear()));
  const TODOS_PER_PAGE = 10;
  const [todosPage, setTodosPage] = useState(1);

  const draftTodos = todos.filter((t) => !t.scheduledDate || t.scheduledDate === '');
  const todayTodos = todos.filter((t) => t.scheduledDate === todayIso);
  const todosByFilter = (() => {
    if (todoFilter === 'today') return todayTodos;
    if (todoFilter === 'draft') return draftTodos;
    if (todoFilter === 'all') return [...todos].sort((a, b) => (b.scheduledDate ?? '').localeCompare(a.scheduledDate ?? ''));
    if (todoFilter === 'day') return todos.filter((t) => t.scheduledDate === todoDayDate);
    if (todoFilter === 'month') {
      const [y, m] = todoMonthDate.split('-');
      return todos.filter((t) => {
        if (!t.scheduledDate) return false;
        const [ty, tm] = t.scheduledDate.split('-');
        return ty === y && tm === m;
      });
    }
    if (todoFilter === 'year') {
      return todos.filter((t) => t.scheduledDate?.startsWith(todoYearDate));
    }
    return todayTodos;
  })();
  const todosTotalPages = Math.max(1, Math.ceil(todosByFilter.length / TODOS_PER_PAGE));
  const safeTodosPage = Math.min(todosPage, todosTotalPages);
  const paginatedTodos = todosByFilter.slice((safeTodosPage - 1) * TODOS_PER_PAGE, safeTodosPage * TODOS_PER_PAGE);

  useEffect(() => {
    if (todosPage > todosTotalPages && todosTotalPages >= 1) setTodosPage(todosTotalPages);
  }, [todosTotalPages, todosPage]);
  const [newGratitude, setNewGratitude] = useState('');
  const [newJournal, setNewJournal] = useState({ title: '', content: '', mood: 'good' as const, imageUrl: '' });

  const timelineLabels: Record<string, string> = {
    '30': '30 Days',
    '60': '60 Days',
    '90': '90 Days',
    '1year': '1 Year',
    '5year': '5 Year Plan',
  };

  const suggestedGoals = [
    { title: 'Reach Ideal Weight', description: 'Achieve and maintain my target healthy weight.', timeline: '90' as const, priority: 'high' as const, imageUrl: '', icon: '⚖️' },
    { title: 'Daily Exercise Routine', description: 'Work out at least 30 minutes every day.', timeline: '30' as const, priority: 'medium' as const, imageUrl: '', icon: '💪' },
    { title: 'Read 12 Books This Year', description: 'Read one book per month.', timeline: '1year' as const, priority: 'medium' as const, imageUrl: '', icon: '📚' },
    { title: 'Save Emergency Fund', description: 'Build a 3-6 month emergency fund.', timeline: '1year' as const, priority: 'high' as const, imageUrl: '', icon: '💰' },
  ];

  const generateRecommendations = (goal: Partial<Goal>): string[] => {
    const recs: string[] = [];
    if (goal.timeline === '30') {
      recs.push('Break this goal into weekly milestones');
      recs.push('Set daily check-in reminders');
    } else if (goal.timeline === '5year') {
      recs.push('Create yearly milestones');
      recs.push('Identify skills you need to develop');
    } else {
      recs.push('Review progress weekly');
      recs.push('Celebrate small wins');
    }
    return recs;
  };

  const addSuggestedGoal = (suggested: (typeof suggestedGoals)[0]) => {
    addGoalDb({
      title: suggested.title,
      description: suggested.description,
      timeline: suggested.timeline,
      priority: suggested.priority,
      imageUrl: suggested.imageUrl,
      progress: 0,
      recommendations: generateRecommendations({ timeline: suggested.timeline }),
    });
  };

  const addGoal = () => {
    if (!newGoal.title.trim()) return;
    addGoalDb({ ...newGoal, progress: 0, recommendations: generateRecommendations(newGoal) });
    setNewGoal({ title: '', description: '', timeline: '30', priority: 'medium', imageUrl: '' });
    setShowGoalDialog(false);
  };

  const handleGoalImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please choose an image file (e.g. JPG, PNG).', variant: 'destructive' });
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      toast({ title: 'File too large', description: 'Image must be under 5MB.', variant: 'destructive' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setNewGoal((g) => ({ ...g, imageUrl: reader.result as string }));
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const clearGoalImage = () => setNewGoal((g) => ({ ...g, imageUrl: '' }));

  const addTodo = () => {
    if (!newTodo.title.trim()) return;
    const today = new Date().toISOString().split('T')[0];
    if (newTodo.scheduledDate && newTodo.scheduledDate < today) {
      toast({ title: 'Invalid date', description: 'Scheduled date must be today or later.', variant: 'destructive' });
      return;
    }
    addTodoDb({
      title: newTodo.title,
      completed: false,
      points: 5,
      scheduledDate: newTodo.scheduledDate ? newTodo.scheduledDate : undefined,
    });
    setNewTodo({ title: '', scheduledDate: '' });
    setShowTodoDialog(false);
  };

  const addGratitude = () => {
    if (!newGratitude.trim()) return;
    addGratitudeDb(newGratitude);
    setNewGratitude('');
    setShowGratitudeDialog(false);
  };

  const addJournalEntry = () => {
    if (!newJournal.title.trim() || !newJournal.content.trim()) return;
    addJournalEntryDb({ ...newJournal, date: new Date().toISOString().split('T')[0] });
    setNewJournal({ title: '', content: '', mood: 'good', imageUrl: '' });
    setShowJournalDialog(false);
  };

  const handleSaveEvent = async (
    eventData: Omit<CalendarEventData, 'id'>,
    options?: { reminderBefore?: number }
  ) => {
    try {
      if (editingEvent) {
        await updateEvent(editingEvent.id, eventData);
        toast({ title: 'Updated', description: 'Commitment updated.' });
      } else {
        const eventId = await addEvent(eventData);
        if (options?.reminderBefore && eventId) {
          const reminderTime = new Date(eventData.startTime.getTime() - options.reminderBefore * 60 * 1000);
          const label = options.reminderBefore === 15 ? '15 minutes' : options.reminderBefore === 60 ? '1 hour' : '1 day';
          await createReminder({
            type: 'event_reminder',
            entity_type: 'calendar_event',
            entity_id: eventId,
            reminder_time: reminderTime.toISOString(),
            message: `Your commitment "${eventData.title}" starts in ${label}`,
            channels: ['push'],
          });
        }
        toast({ title: 'Scheduled', description: 'Your commitment is on the calendar.' });
      }
      setEditingEvent(undefined);
      setPrefilledGoal(undefined);
    } catch (e) {
      toast({ title: 'Error', description: 'Could not save. Please try again.', variant: 'destructive' });
    }
  };

  const handleCreateFromGoal = (goal: { id: string; title: string }) => {
    setPrefilledGoal(goal);
    setEditingEvent(undefined);
    setSelectedDate(new Date());
    setEventDialogOpen(true);
  };

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));

  const getEventsForDate = (day: number) =>
    events.filter((e) => {
      const d = new Date(e.startTime);
      return d.getDate() === day && d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
    });

  const getTodayEvents = () =>
    events.filter((e) => new Date(e.startTime).toDateString() === new Date().toDateString());

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const isToday = (day: number) =>
    day === new Date().getDate() &&
    currentDate.getMonth() === new Date().getMonth() &&
    currentDate.getFullYear() === new Date().getFullYear();

  const stats = {
    totalGoals: goals.length,
    completedGoals: goals.filter((g) => g.progress === 10).length,
    scheduledEvents: events.length,
    todayEvents: getTodayEvents().length,
    completedToday: getTodayEvents().filter((e) => e.status === 'completed').length,
  };

  return (
    <div className="min-h-screen landing relative" style={{ backgroundColor: 'var(--landing-bg)', color: 'var(--landing-text)' }}>
      {isMutating && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px]" aria-live="polite" aria-busy="true">
          <div className="rounded-2xl border-2 p-8 flex flex-col items-center gap-4 shadow-xl" style={{ backgroundColor: 'var(--landing-accent)', borderColor: 'var(--landing-primary)' }}>
            <Loader2 className="h-12 w-12 animate-spin" style={{ color: 'var(--landing-primary)' }} />
            <p className="font-medium text-sm sm:text-base" style={{ color: 'var(--landing-text)' }}>Saving…</p>
          </div>
        </div>
      )}
      <div className={isMutating ? 'pointer-events-none select-none' : ''}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <TrialBanner />

        {/* Hero — Time-Based Goals */}
        <section className="dashboard-hero relative rounded-3xl overflow-hidden mb-8 border-0 shadow-2xl" style={{ borderColor: 'var(--landing-border)' }}>
          <div className="absolute inset-0">
            <img src={calendarHeroImg} alt="Attach goals to time" className="w-full h-full object-cover" />
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(135deg, rgba(26,107,79,0.94) 0%, rgba(44,157,115,0.82) 50%, rgba(26,107,79,0.9) 100%)',
              }}
            />
          </div>
          <HeroFloatingCircles variant="dark" />
          <div className="relative z-10 p-8 sm:p-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-4 text-white/95" style={{ backgroundColor: 'rgba(255,255,255,0.25)' }}>
              <Sparkles className="h-3.5 w-3.5" />
              Step 1 — Calendar & Time-Based Goals
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight">
              Your life in time
            </h1>
            <p className="mt-3 text-lg text-white/90 max-w-xl">
              Goals without dates stay ideas. Schedule commitments. Turn plans into reality.
            </p>
            <div className="mt-6 flex flex-wrap gap-4">
              <div className="dashboard-timeline-badge bg-white/20 backdrop-blur-sm rounded-2xl px-5 py-3 text-center min-w-[100px]">
                <p className="text-2xl font-bold text-white">{stats.totalGoals}</p>
                <p className="text-xs text-white/80">Goals–Vision Board</p>
              </div>
              <div className="dashboard-timeline-badge bg-white/20 backdrop-blur-sm rounded-2xl px-5 py-3 text-center min-w-[100px]">
                <p className="text-2xl font-bold text-white">{stats.scheduledEvents}</p>
                <p className="text-xs text-white/80">Scheduled</p>
              </div>
              <div className="dashboard-timeline-badge bg-white/20 backdrop-blur-sm rounded-2xl px-5 py-3 text-center min-w-[100px]">
                <p className="text-2xl font-bold text-white">{stats.todayEvents}</p>
                <p className="text-xs text-white/80">Today</p>
              </div>
              <Button
                onClick={() => {
                  setPrefilledGoal(undefined);
                  setEditingEvent(undefined);
                  setSelectedDate(new Date());
                  setEventDialogOpen(true);
                }}
                className="ml-auto bg-white text-[var(--landing-primary)] font-semibold shadow-lg transition-all duration-200 hover:scale-105 hover:bg-gradient-to-r hover:from-[var(--landing-primary)] hover:to-[var(--landing-primary-soft)] hover:text-white hover:shadow-xl active:scale-[0.98]"
              >
                <Plus className="h-4 w-4 mr-2" />
                New commitment
              </Button>
            </div>
          </div>
        </section>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList
            className="grid w-full grid-cols-4 lg:grid-cols-6 gap-1 h-auto p-2 rounded-2xl mb-6 border shadow-sm"
            style={{ backgroundColor: 'var(--landing-accent)', borderColor: 'var(--landing-border)' }}
          >
            <TabsTrigger value="timeline" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow data-[state=active]:text-[var(--landing-primary)]">
              <CalendarClock className="h-4 w-4 mr-2" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="goals" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow data-[state=active]:text-[var(--landing-primary)]">
              <Target className="h-4 w-4 mr-2" />
              Goals–Vision Board
            </TabsTrigger>
            <TabsTrigger value="todos" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow data-[state=active]:text-[var(--landing-primary)]">
              <Check className="h-4 w-4 mr-2" />
              Tasks
            </TabsTrigger>
            <TabsTrigger value="gratitude" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow data-[state=active]:text-[var(--landing-primary)]">
              <Heart className="h-4 w-4 mr-2" />
              Appreciate
            </TabsTrigger>
            <TabsTrigger value="journal" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow data-[state=active]:text-[var(--landing-primary)]">
              <BookOpen className="h-4 w-4 mr-2" />
              Journal
            </TabsTrigger>
            <TabsTrigger value="feedback" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow data-[state=active]:text-[var(--landing-primary)]">
              <Sparkles className="h-4 w-4 mr-2" />
              Feedback
            </TabsTrigger>
          </TabsList>

          {/* Timeline Tab — Calendar backbone */}
          <TabsContent value="timeline" className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Calendar */}
              <div className="xl:col-span-2">
                <Card className="dashboard-card-organic border-0 shadow-xl overflow-hidden rounded-2xl" style={{ borderColor: 'var(--landing-border)' }}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2" style={{ backgroundColor: 'var(--landing-accent)' }}>
                    <CardTitle className="flex items-center gap-2" style={{ color: 'var(--landing-text)' }}>
                      <Calendar className="h-5 w-5" style={{ color: 'var(--landing-primary)' }} />
                      {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon" onClick={prevMonth} style={{ borderColor: 'var(--landing-border)' }}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={nextMonth} style={{ borderColor: 'var(--landing-border)' }}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {dayNames.map((d) => (
                        <div key={d} className="text-center text-xs font-semibold uppercase" style={{ color: 'var(--landing-text)', opacity: 0.7 }}>
                          {d}
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {Array.from({ length: firstDay }).map((_, i) => (
                        <div key={`e-${i}`} className="aspect-square rounded-xl" style={{ backgroundColor: 'rgba(0,0,0,0.02)' }} />
                      ))}
                      {Array.from({ length: daysInMonth }).map((_, i) => {
                        const day = i + 1;
                        const dayEvents = getEventsForDate(day);
                        const today = isToday(day);
                        return (
                          <div
                            key={day}
                            className="dashboard-calendar-cell aspect-square rounded-xl p-1.5 cursor-pointer transition-all hover:opacity-90 flex flex-col"
                            onClick={() => {
                              setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
                              setEditingEvent(undefined);
                              setPrefilledGoal(undefined);
                              setEventDialogOpen(true);
                            }}
                            style={{
                              backgroundColor: today ? 'var(--landing-primary)' : 'var(--landing-accent)',
                              color: today ? 'white' : 'var(--landing-text)',
                              outline: today ? '2px solid var(--landing-primary)' : undefined,
                            }}
                          >
                            <span className="text-sm font-bold">{day}</span>
                            <div className="flex-1 flex flex-col gap-0.5 overflow-hidden">
                              {dayEvents.slice(0, 2).map((ev) => (
                                <div
                                  key={ev.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingEvent(ev);
                                    setSelectedDate(new Date(ev.startTime));
                                    setEventDialogOpen(true);
                                  }}
                                  className="text-[10px] px-1.5 py-0.5 rounded truncate font-medium"
                                  style={{ backgroundColor: ev.color, color: 'white' }}
                                >
                                  {ev.title}
                                </div>
                              ))}
                              {dayEvents.length > 2 && <span className="text-[10px] opacity-70">+{dayEvents.length - 2}</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Today's commitments + Quick add */}
              <div className="space-y-6">
                <Card className="border-0 shadow-xl rounded-2xl overflow-hidden" style={{ borderColor: 'var(--landing-border)' }}>
                  <CardHeader style={{ backgroundColor: 'var(--landing-primary)', color: 'white' }}>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Today's commitments
                    </CardTitle>
                    <CardDescription className="text-white/85">
                      {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 max-h-[280px] overflow-y-auto">
                    {eventsLoading ? (
                      <div className="flex justify-center py-8">
                        <div className="h-8 w-8 rounded-full border-2 border-[var(--landing-primary)] border-t-transparent animate-spin" />
                      </div>
                    ) : getTodayEvents().length === 0 ? (
                      <div className="text-center py-8">
                        <CalendarClock className="h-12 w-12 mx-auto mb-3 opacity-40" style={{ color: 'var(--landing-primary)' }} />
                        <p className="text-sm" style={{ color: 'var(--landing-text)', opacity: 0.8 }}>No commitments today</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-3 font-bold hero-cta-outline"
                          style={{ borderColor: 'var(--landing-primary)', color: 'var(--landing-primary)' }}
                          onClick={() => {
                            setSelectedDate(new Date());
                            setEventDialogOpen(true);
                          }}
                        >
                          <Plus className="h-3.5 w-3.5 mr-1" />
                          Schedule one
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {getTodayEvents()
                          .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                          .map((ev) => (
                            <div
                              key={ev.id}
                              onClick={() => {
                                setEditingEvent(ev);
                                setSelectedDate(new Date(ev.startTime));
                                setEventDialogOpen(true);
                              }}
                              className="dashboard-commitment-pill p-3 rounded-xl cursor-pointer flex items-center gap-3"
                              style={{ backgroundColor: ev.color, color: 'white' }}
                            >
                              <div>
                                <p className="font-semibold text-sm">{ev.title}</p>
                                <p className="text-xs opacity-90">
                                  {new Date(ev.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} –{' '}
                                  {new Date(ev.endTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                                </p>
                              </div>
                              <Badge variant="secondary" className="ml-auto bg-white/30 text-white border-0">
                                {ev.status}
                              </Badge>
                            </div>
                          ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Schedule goals */}
                {goals.filter((g) => g.progress < 10).length > 0 && (
                  <Card className="border-0 shadow-lg rounded-2xl overflow-hidden" style={{ borderColor: 'var(--landing-border)' }}>
                    <CardHeader style={{ backgroundColor: 'var(--landing-accent)' }}>
                      <CardTitle className="flex items-center gap-2 text-base" style={{ color: 'var(--landing-text)' }}>
                        <Target className="h-4 w-4" style={{ color: 'var(--landing-primary)' }} />
                        Attach goals to time
                      </CardTitle>
                      <CardDescription>Click to schedule a commitment</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="flex flex-wrap gap-2">
                        {goals
                          .filter((g) => g.progress < 10)
                          .slice(0, 6)
                          .map((goal) => (
                            <Button
                              key={goal.id}
                              variant="outline"
                              size="sm"
                              onClick={() => handleCreateFromGoal({ id: goal.id, title: goal.title })}
                              className="rounded-full font-bold hero-cta-outline"
                              style={{ borderColor: 'var(--landing-primary)', color: 'var(--landing-primary)' }}
                            >
                              <Target className="h-3.5 w-3.5 mr-1.5" />
                              {goal.title}
                            </Button>
                          ))}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-2 font-bold hero-cta-outline"
                        style={{ borderColor: 'var(--landing-primary)', color: 'var(--landing-primary)' }}
                        onClick={() => navigate('/calendar')}
                      >
                        Full calendar <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Goals Tab — premium bento-style UI */}
          <TabsContent value="goals" className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--landing-primary)' }}>
                  Timeline & direction
                </p>
                <h3 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: 'var(--landing-text)' }}>
                  Your Goals–Vision Board
                </h3>
              </div>
              <Button
                onClick={() => setShowGoalDialog(true)}
                className="hero-cta-primary font-bold shadow-lg"
                style={{ backgroundColor: 'var(--landing-primary)', color: 'white' }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Goal
              </Button>
            </div>

            {/* Suggested — bento tiles */}
            <div>
              <p className="text-sm font-medium mb-3" style={{ color: 'var(--landing-text)', opacity: 0.85 }}>
                Quick add · click to add to your list
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {suggestedGoals.map((s, i) => {
                  const added = goals.some((g) => g.title === s.title);
                  return (
                    <button
                      key={i}
                      onClick={() => !added && addSuggestedGoal(s)}
                      disabled={added}
                      className={`goals-suggestion-tile relative rounded-2xl p-4 sm:p-5 text-left transition-all duration-300 overflow-hidden ${
                        added
                          ? 'opacity-60 cursor-not-allowed'
                          : 'hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]'
                      }`}
                      style={{
                        background: added
                          ? 'var(--landing-accent)'
                          : 'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, var(--landing-accent) 100%)',
                        border: '1px solid var(--landing-border)',
                        boxShadow: added ? 'none' : '0 4px 20px rgba(44, 157, 115, 0.08)',
                      }}
                    >
                      {!added && (
                        <div
                          className="absolute top-0 right-0 w-16 h-16 rounded-bl-full opacity-[0.06]"
                          style={{ background: 'var(--landing-primary)' }}
                          aria-hidden
                        />
                      )}
                      <span className="text-2xl sm:text-3xl block mb-2">{s.icon}</span>
                      <p className="font-semibold text-sm leading-tight pr-2" style={{ color: 'var(--landing-text)' }}>
                        {s.title}
                      </p>
                      {added ? (
                        <span className="inline-flex items-center gap-1 mt-2 text-xs font-medium" style={{ color: 'var(--landing-primary)' }}>
                          <Check className="h-3.5 w-3.5" /> Added
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 mt-2 text-xs font-medium opacity-70" style={{ color: 'var(--landing-primary)' }}>
                          + Add
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Your goals — premium cards with circular progress */}
            {goals.length > 0 ? (
              <div className="space-y-6">
                <div className="grid gap-5 sm:gap-6 md:grid-cols-2">
                  {paginatedGoals.map((goal) => (
                  <div
                    key={goal.id}
                    className="goals-goal-card group relative rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl"
                    style={{
                      background: 'linear-gradient(160deg, #ffffff 0%, var(--landing-accent) 100%)',
                      border: '1px solid var(--landing-border)',
                      boxShadow: '0 4px 24px rgba(44, 157, 115, 0.08)',
                    }}
                  >
                    {/* Image or default (title) */}
                    {goal.imageUrl ? (
                      <div className="w-full h-40 sm:h-44 relative bg-[var(--landing-border)]">
                        <img
                          src={goal.imageUrl}
                          alt=""
                          className="w-full h-full object-cover goal-card-img"
                          onError={(e) => {
                            e.currentTarget.classList.add('hidden');
                            const fallback = e.currentTarget.parentElement?.querySelector('.goal-card-img-fallback');
                            if (fallback) fallback.classList.remove('hidden');
                          }}
                        />
                        <div className="goal-card-img-fallback hidden absolute inset-0 flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, var(--landing-accent) 0%, rgba(44,157,115,0.2) 100%)' }}>
                          <span className="font-bold text-xl sm:text-2xl text-center line-clamp-2" style={{ color: 'var(--landing-text)' }}>{goal.title}</span>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="w-full h-32 sm:h-36 flex items-center justify-center p-4"
                        style={{ background: 'linear-gradient(135deg, rgba(44,157,115,0.12) 0%, var(--landing-accent) 100%)' }}
                      >
                        <span className="font-bold text-lg sm:text-xl text-center line-clamp-2" style={{ color: 'var(--landing-primary)' }}>
                          {goal.title}
                        </span>
                      </div>
                    )}
                    <div className="p-6 sm:p-7">
                      <div className="flex justify-between items-start gap-3">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-lg sm:text-xl leading-tight pr-8" style={{ color: 'var(--landing-text)' }}>
                            {goal.title}
                          </h4>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <span
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                              style={{ backgroundColor: 'rgba(44, 157, 115, 0.12)', color: 'var(--landing-primary)' }}
                            >
                              {timelineLabels[goal.timeline]}
                            </span>
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                goal.priority === 'high'
                                  ? 'bg-red-100 text-red-700'
                                  : goal.priority === 'medium'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {goal.priority}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0 rounded-full opacity-60 hover:opacity-100 hover:bg-red-100 hover:text-red-600 transition-colors"
                          onClick={() => deleteGoalDb(goal.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Circular progress + slider row */}
                      <div className="flex items-center gap-6 mt-6">
                        <div
                          className="relative shrink-0 w-16 h-16 rounded-full flex items-center justify-center"
                          style={{
                            background: `conic-gradient(var(--landing-primary) ${goal.progress * 36}deg, var(--landing-border) 0deg)`,
                          }}
                        >
                          <div
                            className="absolute inset-[5px] rounded-full flex items-center justify-center font-bold text-lg"
                            style={{ backgroundColor: 'var(--landing-accent)', color: 'var(--landing-primary)' }}
                          >
                            {goal.progress}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-xs font-semibold mb-1.5 opacity-90 tracking-wide"
                            style={{ color: '#1d4ed8' }}
                          >
                            Progress {goal.progress}/10 — update in goal detail
                          </p>
                          <Progress value={goal.progress * 10} variant="goal" className="h-2" />
                        </div>
                      </div>

                      {/* Budget progress */}
                      {goal.budget != null && goal.budget > 0 && (
                        <div className="mt-4 space-y-1">
                          <p className="text-xs font-medium opacity-75" style={{ color: 'var(--landing-text)' }}>
                            Budget — {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(goal.spent ?? 0)} / {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(goal.budget)} ({Math.min(100, Math.round(((goal.spent ?? 0) / goal.budget) * 100))}% used)
                          </p>
                          <Progress value={Math.min(100, ((goal.spent ?? 0) / goal.budget) * 100)} className="h-2" style={{ backgroundColor: 'var(--landing-accent)' }} />
                        </div>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-5 font-bold hero-cta-outline"
                        style={{ borderColor: 'var(--landing-primary)', color: 'var(--landing-primary)' }}
                        onClick={() => handleCreateFromGoal({ id: goal.id, title: goal.title })}
                      >
                        <CalendarClock className="h-4 w-4 mr-2" />
                        Schedule commitment
                      </Button>
                    </div>
                  </div>
                  ))}
                </div>
                {goals.length > GOALS_PER_PAGE && (
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="hero-cta-outline font-medium"
                      style={{ borderColor: 'var(--landing-primary)', color: 'var(--landing-primary)' }}
                      disabled={safeGoalsPage <= 1}
                      onClick={() => setGoalsPage((p) => Math.max(1, p - 1))}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <span className="px-3 py-1.5 text-sm font-medium" style={{ color: 'var(--landing-text)' }}>
                      {safeGoalsPage} of {goalsTotalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="hero-cta-outline font-medium"
                      style={{ borderColor: 'var(--landing-primary)', color: 'var(--landing-primary)' }}
                      disabled={safeGoalsPage >= goalsTotalPages}
                      onClick={() => setGoalsPage((p) => Math.min(goalsTotalPages, p + 1))}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              /* Empty state — inviting, special */
              <div
                className="relative rounded-3xl overflow-hidden py-16 sm:py-20 px-6 text-center"
                style={{
                  background: 'radial-gradient(ellipse 80% 70% at 50% 0%, rgba(44, 157, 115, 0.12) 0%, transparent 50%), var(--landing-accent)',
                  border: '1px dashed var(--landing-border)',
                }}
              >
                <div
                  className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6"
                  style={{ backgroundColor: 'rgba(44, 157, 115, 0.15)' }}
                >
                  <Target className="h-10 w-10" style={{ color: 'var(--landing-primary)' }} />
                </div>
                <h4 className="text-xl sm:text-2xl font-bold mb-2" style={{ color: 'var(--landing-text)' }}>
                  No goals yet
                </h4>
                <p className="text-sm max-w-sm mx-auto mb-8 opacity-80" style={{ color: 'var(--landing-text)' }}>
                  Add your first goal above or create a custom one. Your timeline starts here.
                </p>
                <Button
                  onClick={() => setShowGoalDialog(true)}
                  className="hero-cta-primary font-bold shadow-lg"
                  style={{ backgroundColor: 'var(--landing-primary)', color: 'white' }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Goal
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Todos Tab — organized by date, Today default, Draft section, pagination */}
          <TabsContent value="todos" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--landing-primary)' }}>
                  Tasks & schedule
                </p>
                <h3 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: 'var(--landing-text)' }}>
                  To-Do List
                </h3>
              </div>
              <Button
                onClick={() => setShowTodoDialog(true)}
                className="hero-cta-primary font-bold shadow-lg"
                style={{ backgroundColor: 'var(--landing-primary)', color: 'white' }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
            </div>

            {/* Filter pills + date pickers */}
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {(['today', 'all', 'draft', 'day', 'month', 'year'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => { setTodoFilter(f); setTodosPage(1); }}
                    className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                      todoFilter === f
                        ? 'text-white shadow-md'
                        : 'opacity-80 hover:opacity-100'
                    }`}
                    style={
                      todoFilter === f
                        ? { backgroundColor: 'var(--landing-primary)' }
                        : { backgroundColor: 'var(--landing-accent)', color: 'var(--landing-text)', border: '1px solid var(--landing-border)' }
                    }
                  >
                    {f === 'today' && 'Today'}
                    {f === 'all' && 'All'}
                    {f === 'draft' && 'Draft'}
                    {f === 'day' && 'Day'}
                    {f === 'month' && 'Month'}
                    {f === 'year' && 'Year'}
                  </button>
                ))}
              </div>
              {todoFilter === 'day' && (
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium shrink-0" style={{ color: 'var(--landing-text)' }}>Date</Label>
                  <Input type="date" value={todoDayDate} onChange={(e) => { setTodoDayDate(e.target.value); setTodosPage(1); }} className="max-w-[180px] border-[var(--landing-border)]" />
                </div>
              )}
              {todoFilter === 'month' && (
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium shrink-0" style={{ color: 'var(--landing-text)' }}>Month</Label>
                  <Input type="month" value={todoMonthDate} onChange={(e) => { setTodoMonthDate(e.target.value); setTodosPage(1); }} className="max-w-[180px] border-[var(--landing-border)]" />
                </div>
              )}
              {todoFilter === 'year' && (
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium shrink-0" style={{ color: 'var(--landing-text)' }}>Year</Label>
                  <Input type="number" min={2020} max={2030} value={todoYearDate} onChange={(e) => { setTodoYearDate(e.target.value); setTodosPage(1); }} className="max-w-[100px] border-[var(--landing-border)]" />
                </div>
              )}
            </div>

            {/* Task list — premium cards */}
            {todosByFilter.length > 0 ? (
              <div className="space-y-4">
                <div className="space-y-3">
                  {paginatedTodos.map((todo) => (
                    <div
                      key={todo.id}
                      className="flex items-center justify-between p-4 sm:p-5 rounded-2xl border transition-all duration-200 hover:shadow-md"
                      style={{
                        backgroundColor: todo.completed ? 'rgba(44, 157, 115, 0.08)' : 'var(--landing-accent)',
                        borderColor: 'var(--landing-border)',
                      }}
                    >
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <button
                          onClick={() => toggleTodoDb(todo.id)}
                          className="shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors"
                          style={{ borderColor: todo.completed ? 'var(--landing-primary)' : 'var(--landing-border)' }}
                        >
                          {todo.completed && <Check className="h-4 w-4" style={{ color: 'var(--landing-primary)' }} />}
                        </button>
                        <div className="min-w-0">
                          <span className={`block font-medium ${todo.completed ? 'line-through opacity-70' : ''}`} style={{ color: 'var(--landing-text)' }}>
                            {todo.title}
                          </span>
                          {todo.scheduledDate && (
                            <span className="text-xs mt-0.5 block" style={{ color: 'var(--landing-primary)', opacity: 0.9 }}>
                              {new Date(todo.scheduledDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            </span>
                          )}
                          {!todo.scheduledDate && <span className="text-xs mt-0.5 block opacity-70" style={{ color: 'var(--landing-text)' }}>Draft</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge className="font-medium" style={{ backgroundColor: 'rgba(44, 157, 115, 0.2)', color: 'var(--landing-primary)' }}>
                          +{todo.points} pts
                        </Badge>
                        <Button variant="ghost" size="icon" className="rounded-full opacity-60 hover:opacity-100 hover:bg-red-100 hover:text-red-600" onClick={() => deleteTodoDb(todo.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                {todosByFilter.length > TODOS_PER_PAGE && (
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="hero-cta-outline font-medium"
                      style={{ borderColor: 'var(--landing-primary)', color: 'var(--landing-primary)' }}
                      disabled={safeTodosPage <= 1}
                      onClick={() => setTodosPage((p) => Math.max(1, p - 1))}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <span className="px-3 py-1.5 text-sm font-medium" style={{ color: 'var(--landing-text)' }}>
                      {safeTodosPage} of {todosTotalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="hero-cta-outline font-medium"
                      style={{ borderColor: 'var(--landing-primary)', color: 'var(--landing-primary)' }}
                      disabled={safeTodosPage >= todosTotalPages}
                      onClick={() => setTodosPage((p) => Math.min(todosTotalPages, p + 1))}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div
                className="relative rounded-2xl overflow-hidden py-12 px-6 text-center"
                style={{
                  background: 'radial-gradient(ellipse 70% 60% at 50% 0%, rgba(44, 157, 115, 0.1) 0%, transparent 50%), var(--landing-accent)',
                  border: '1px dashed var(--landing-border)',
                }}
              >
                <Check className="h-14 w-14 mx-auto mb-4 opacity-40" style={{ color: 'var(--landing-primary)' }} />
                <h4 className="text-lg font-bold mb-2" style={{ color: 'var(--landing-text)' }}>
                  {todoFilter === 'today' && "No tasks for today"}
                  {todoFilter === 'draft' && 'No drafts'}
                  {todoFilter === 'all' && 'No tasks yet'}
                  {(todoFilter === 'day' || todoFilter === 'month' || todoFilter === 'year') && 'No tasks in this range'}
                </h4>
                <p className="text-sm opacity-80 mb-4 max-w-sm mx-auto" style={{ color: 'var(--landing-text)' }}>
                  {todoFilter === 'today' ? 'Add a task and schedule it for today, or switch to All / Draft.' : 'Add your first task or change the filter.'}
                </p>
                <Button onClick={() => setShowTodoDialog(true)} className="hero-cta-primary font-bold" style={{ backgroundColor: 'var(--landing-primary)', color: 'white' }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Task
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Gratitude Tab — premium UI */}
          <TabsContent value="gratitude" className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--landing-primary)' }}>
                  Mindfulness
                </p>
                <h3 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: 'var(--landing-text)' }}>
                  Appreciate
                </h3>
              </div>
              <Button
                onClick={() => setShowGratitudeDialog(true)}
                className="hero-cta-primary font-bold shadow-lg"
                style={{ backgroundColor: 'var(--landing-primary)', color: 'white' }}
              >
                <Heart className="h-4 w-4 mr-2" />
                Add appreciation
              </Button>
            </div>
            {gratitudeEntries.length > 0 ? (
              <div className="grid gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
                {gratitudeEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="group relative rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl"
                    style={{
                      background: 'linear-gradient(160deg, #ffffff 0%, var(--landing-accent) 100%)',
                      border: '1px solid var(--landing-border)',
                      boxShadow: '0 4px 24px rgba(44, 157, 115, 0.08)',
                    }}
                  >
                    <div className="p-6">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4" style={{ backgroundColor: 'rgba(44, 157, 115, 0.15)' }}>
                        <Heart className="h-6 w-6" style={{ color: 'var(--landing-primary)' }} />
                      </div>
                      <p className="text-base leading-relaxed mb-4" style={{ color: 'var(--landing-text)' }}>
                        {entry.content}
                      </p>
                      <p className="text-sm font-medium" style={{ color: 'var(--landing-primary)', opacity: 0.9 }}>
                        {new Date(entry.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                className="relative rounded-3xl overflow-hidden py-16 sm:py-20 px-6 text-center"
                style={{
                  background: 'radial-gradient(ellipse 80% 70% at 50% 0%, rgba(44, 157, 115, 0.12) 0%, transparent 50%), var(--landing-accent)',
                  border: '1px dashed var(--landing-border)',
                }}
              >
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6" style={{ backgroundColor: 'rgba(44, 157, 115, 0.15)' }}>
                  <Heart className="h-10 w-10" style={{ color: 'var(--landing-primary)' }} />
                </div>
                <h4 className="text-xl sm:text-2xl font-bold mb-2" style={{ color: 'var(--landing-text)' }}>
                  No appreciation entries yet
                </h4>
                <p className="text-sm max-w-sm mx-auto mb-8 opacity-80" style={{ color: 'var(--landing-text)' }}>
                  Capture what you appreciate. Small entries add up to an instant connection with feeling good.
                </p>
                <Button
                  onClick={() => setShowGratitudeDialog(true)}
                  className="hero-cta-primary font-bold shadow-lg"
                  style={{ backgroundColor: 'var(--landing-primary)', color: 'white' }}
                >
                  <Heart className="h-4 w-4 mr-2" />
                  Add Your First Entry
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Journal Tab — premium UI */}
          <TabsContent value="journal" className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--landing-primary)' }}>
                  Reflection
                </p>
                <h3 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: 'var(--landing-text)' }}>
                  Life Journal
                </h3>
              </div>
              <Button
                onClick={() => setShowJournalDialog(true)}
                className="hero-cta-primary font-bold shadow-lg"
                style={{ backgroundColor: 'var(--landing-primary)', color: 'white' }}
              >
                <BookOpen className="h-4 w-4 mr-2" />
                New Entry
              </Button>
            </div>
            {journalEntries.length > 0 ? (
              <div className="grid gap-6">
                {journalEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="group relative rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl"
                    style={{
                      background: 'linear-gradient(160deg, #ffffff 0%, var(--landing-accent) 100%)',
                      border: '1px solid var(--landing-border)',
                      boxShadow: '0 4px 24px rgba(44, 157, 115, 0.08)',
                    }}
                  >
                    <div className="p-6 sm:p-7">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold capitalize"
                          style={{ backgroundColor: 'rgba(44, 157, 115, 0.15)', color: 'var(--landing-primary)' }}
                        >
                          {entry.mood}
                        </span>
                        <span className="text-sm font-medium opacity-75" style={{ color: 'var(--landing-text)' }}>
                          {new Date(entry.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                      <h4 className="text-xl font-bold mb-3" style={{ color: 'var(--landing-text)' }}>
                        {entry.title}
                      </h4>
                      <p className="text-base leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--landing-text)', opacity: 0.9 }}>
                        {entry.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                className="relative rounded-3xl overflow-hidden py-16 sm:py-20 px-6 text-center"
                style={{
                  background: 'radial-gradient(ellipse 80% 70% at 50% 0%, rgba(44, 157, 115, 0.12) 0%, transparent 50%), var(--landing-accent)',
                  border: '1px dashed var(--landing-border)',
                }}
              >
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6" style={{ backgroundColor: 'rgba(44, 157, 115, 0.15)' }}>
                  <BookOpen className="h-10 w-10" style={{ color: 'var(--landing-primary)' }} />
                </div>
                <h4 className="text-xl sm:text-2xl font-bold mb-2" style={{ color: 'var(--landing-text)' }}>
                  No journal entries yet
                </h4>
                <p className="text-sm max-w-sm mx-auto mb-8 opacity-80" style={{ color: 'var(--landing-text)' }}>
                  Write about your day, your mood, and what matters. Your story stays private and yours.
                </p>
                <Button
                  onClick={() => setShowJournalDialog(true)}
                  className="hero-cta-primary font-bold shadow-lg"
                  style={{ backgroundColor: 'var(--landing-primary)', color: 'white' }}
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Write Your First Entry
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Feedback Tab — AI feedback + plan for tomorrow */}
          <TabsContent value="feedback" className="space-y-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--landing-primary)' }}>
                AI & planning
              </p>
              <h3 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: 'var(--landing-text)' }}>
                Feedback
              </h3>
              <p className="mt-2 text-sm opacity-85 max-w-2xl" style={{ color: 'var(--landing-text)' }}>
                You'll receive AI feedback on your actions so far and a plan for your actions the next day (To-Do List).
              </p>
            </div>

            {/* AI feedback on your actions so far */}
            <div
              className="rounded-2xl overflow-hidden transition-all duration-300"
              style={{
                background: 'linear-gradient(160deg, #ffffff 0%, var(--landing-accent) 100%)',
                border: '1px solid var(--landing-border)',
                boxShadow: '0 4px 24px rgba(44, 157, 115, 0.08)',
              }}
            >
              <div className="p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl" style={{ backgroundColor: 'rgba(44, 157, 115, 0.15)' }}>
                    <Sparkles className="h-6 w-6" style={{ color: 'var(--landing-primary)' }} />
                  </div>
                  <h4 className="text-xl font-bold" style={{ color: 'var(--landing-text)' }}>
                    AI feedback on your actions
                  </h4>
                </div>
                <p className="text-sm mb-4 opacity-85" style={{ color: 'var(--landing-text)' }}>
                  Based on your recent activity: {goals.filter((g) => g.progress > 0).length} goal(s) in progress, {todos.filter((t) => t.completed).length} task(s) completed, {gratitudeEntries.length} appreciation entries, {journalEntries.length} journal entries.
                </p>
                <div className="rounded-xl p-4 min-h-[100px]" style={{ backgroundColor: 'rgba(44, 157, 115, 0.08)', border: '1px solid var(--landing-border)' }}>
                  <p className="text-sm leading-relaxed italic opacity-90" style={{ color: 'var(--landing-text)' }}>
                    Keep going. Small steps add up. Consider scheduling one commitment for tomorrow to stay on track.
                  </p>
                </div>
              </div>
            </div>

            {/* Plan for tomorrow — To-Do List */}
            <div
              className="rounded-2xl overflow-hidden transition-all duration-300"
              style={{
                background: 'linear-gradient(160deg, #ffffff 0%, var(--landing-accent) 100%)',
                border: '1px solid var(--landing-border)',
                boxShadow: '0 4px 24px rgba(44, 157, 115, 0.08)',
              }}
            >
              <div className="p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl" style={{ backgroundColor: 'rgba(44, 157, 115, 0.15)' }}>
                      <CalendarClock className="h-6 w-6" style={{ color: 'var(--landing-primary)' }} />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold" style={{ color: 'var(--landing-text)' }}>
                        Your plan for tomorrow
                      </h4>
                      <p className="text-sm opacity-75" style={{ color: 'var(--landing-text)' }}>
                        To-Do List for the next day
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      setNewTodo((n) => ({ ...n, scheduledDate: tomorrow.toISOString().split('T')[0] }));
                      setShowTodoDialog(true);
                    }}
                    className="hero-cta-outline font-bold shrink-0"
                    style={{ borderColor: 'var(--landing-primary)', color: 'var(--landing-primary)' }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add task for tomorrow
                  </Button>
                </div>
                {(() => {
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  const tomorrowIso = tomorrow.toISOString().split('T')[0];
                  const tomorrowTodos = todos.filter((t) => t.scheduledDate === tomorrowIso);
                  return tomorrowTodos.length > 0 ? (
                    <div className="space-y-3">
                      {tomorrowTodos.map((todo) => (
                        <div
                          key={todo.id}
                          className="flex items-center justify-between p-4 rounded-xl border transition-all"
                          style={{ backgroundColor: 'var(--landing-accent)', borderColor: 'var(--landing-border)' }}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <button
                              onClick={() => toggleTodoDb(todo.id)}
                              className="shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center"
                              style={{ borderColor: todo.completed ? 'var(--landing-primary)' : 'var(--landing-border)' }}
                            >
                              {todo.completed && <Check className="h-4 w-4" style={{ color: 'var(--landing-primary)' }} />}
                            </button>
                            <span className={todo.completed ? 'line-through opacity-70' : 'font-medium'} style={{ color: 'var(--landing-text)' }}>
                              {todo.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge className="text-xs font-medium" style={{ backgroundColor: 'rgba(44, 157, 115, 0.2)', color: 'var(--landing-primary)' }}>
                              +{todo.points} pts
                            </Badge>
                            <Button variant="ghost" size="icon" className="rounded-full opacity-60 hover:opacity-100 hover:bg-red-100 hover:text-red-600" onClick={() => deleteTodoDb(todo.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl py-8 px-4 text-center border border-dashed" style={{ borderColor: 'var(--landing-border)', backgroundColor: 'rgba(44, 157, 115, 0.05)' }}>
                      <CalendarClock className="h-10 w-10 mx-auto mb-3 opacity-40" style={{ color: 'var(--landing-primary)' }} />
                      <p className="text-sm font-medium mb-3" style={{ color: 'var(--landing-text)' }}>No tasks scheduled for tomorrow</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="hero-cta-outline font-medium"
                        style={{ borderColor: 'var(--landing-primary)', color: 'var(--landing-primary)' }}
                        onClick={() => {
                          const tomorrow = new Date();
                          tomorrow.setDate(tomorrow.getDate() + 1);
                          setNewTodo((n) => ({ ...n, scheduledDate: tomorrow.toISOString().split('T')[0] }));
                          setShowTodoDialog(true);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add task for tomorrow
                      </Button>
                    </div>
                  );
                })()}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Event Dialog */}
        <EventDialog
          open={eventDialogOpen}
          onOpenChange={setEventDialogOpen}
          onSave={handleSaveEvent}
          event={editingEvent}
          selectedDate={selectedDate}
          selectedTime={selectedTime}
          prefilledGoal={prefilledGoal}
          goals={goals}
        />

        {/* Goal Dialog */}
        <Dialog open={showGoalDialog} onOpenChange={setShowGoalDialog}>
          <DialogContent className="landing sm:max-w-lg border-2 shadow-lg rounded-2xl" style={{ borderColor: 'var(--landing-primary)', backgroundColor: 'var(--landing-accent)' }}>
            <DialogHeader>
              <DialogTitle className="font-bold" style={{ color: 'var(--landing-text)' }}>Add New Goal</DialogTitle>
              <DialogDescription style={{ color: 'var(--landing-text)', opacity: 0.8 }}>What do you want to achieve?</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label className="text-sm font-medium" style={{ color: 'var(--landing-text)' }}>Goal Title</Label>
                <Input placeholder="e.g., Learn a new language" value={newGoal.title} onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })} className="mt-1.5 border-[var(--landing-border)] focus-visible:ring-[var(--landing-primary)]" />
              </div>
              <div>
                <Label className="text-sm font-medium" style={{ color: 'var(--landing-text)' }}>Description</Label>
                <Textarea placeholder="Describe your goal..." value={newGoal.description} onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })} className="mt-1.5 border-[var(--landing-border)] focus-visible:ring-[var(--landing-primary)]" />
              </div>
              <div>
                <Label className="text-sm font-medium" style={{ color: 'var(--landing-text)' }}>Timeline</Label>
                <Select value={newGoal.timeline} onValueChange={(v: any) => setNewGoal({ ...newGoal, timeline: v })}>
                  <SelectTrigger className="mt-1.5 border-[var(--landing-border)] focus-visible:ring-[var(--landing-primary)]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 Days</SelectItem>
                    <SelectItem value="60">60 Days</SelectItem>
                    <SelectItem value="90">90 Days</SelectItem>
                    <SelectItem value="1year">1 Year</SelectItem>
                    <SelectItem value="5year">5 Year Plan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium" style={{ color: 'var(--landing-text)' }}>Priority</Label>
                <Select value={newGoal.priority} onValueChange={(v: any) => setNewGoal({ ...newGoal, priority: v })}>
                  <SelectTrigger className="mt-1.5 border-[var(--landing-border)] focus-visible:ring-[var(--landing-primary)]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium" style={{ color: 'var(--landing-text)' }}>Image (optional)</Label>
                <p className="text-xs mt-0.5 mb-2 opacity-75" style={{ color: 'var(--landing-text)' }}>
                  Paste a URL or upload an image · max 5MB
                </p>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://..."
                    value={newGoal.imageUrl.startsWith('data:') ? '' : newGoal.imageUrl}
                    onChange={(e) => setNewGoal((g) => ({ ...g, imageUrl: e.target.value.trim() }))}
                    className="flex-1 border-[var(--landing-border)] focus-visible:ring-[var(--landing-primary)]"
                  />
                  <input
                    ref={goalImageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleGoalImageFile}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0 border-[var(--landing-border)] text-[var(--landing-primary)]"
                    onClick={() => goalImageInputRef.current?.click()}
                  >
                    Upload
                  </Button>
                  {newGoal.imageUrl && (
                    <Button type="button" variant="ghost" size="sm" onClick={clearGoalImage} className="shrink-0 text-red-600 hover:text-red-700">
                      Clear
                    </Button>
                  )}
                </div>
                {newGoal.imageUrl && (
                  <div className="mt-2 relative rounded-xl overflow-hidden border border-[var(--landing-border)] w-full max-h-32 bg-[var(--landing-border)]">
                    <img
                      src={newGoal.imageUrl}
                      alt="Preview"
                      className="w-full h-28 object-cover"
                      onError={() => setNewGoal((g) => ({ ...g, imageUrl: '' }))}
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowGoalDialog(false)} className="font-bold hero-cta-outline">Cancel</Button>
              <Button onClick={addGoal} className="font-bold text-white hero-cta-primary">
                <Plus className="h-4 w-4 mr-2" />
                Add Goal
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Todo Dialog — default schedule to today when opening */}
        <Dialog
          open={showTodoDialog}
          onOpenChange={(open) => {
            setShowTodoDialog(open);
            if (open) setNewTodo((n) => ({ ...n, scheduledDate: n.scheduledDate || new Date().toISOString().split('T')[0] }));
          }}
        >
          <DialogContent className="landing border-2 shadow-lg rounded-2xl sm:max-w-md" style={{ borderColor: 'var(--landing-primary)', backgroundColor: 'var(--landing-accent)' }}>
            <DialogHeader>
              <DialogTitle className="font-bold" style={{ color: 'var(--landing-text)' }}>Add New Task</DialogTitle>
              <DialogDescription style={{ color: 'var(--landing-text)', opacity: 0.8 }}>Schedule from today or leave as draft.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label className="text-sm font-medium" style={{ color: 'var(--landing-text)' }}>Task</Label>
                <Input
                  placeholder="e.g., Call the dentist"
                  value={newTodo.title}
                  onChange={(e) => setNewTodo((n) => ({ ...n, title: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && addTodo()}
                  className="mt-1.5 border-[var(--landing-border)] focus-visible:ring-[var(--landing-primary)]"
                />
              </div>
              <div>
                <Label className="text-sm font-medium" style={{ color: 'var(--landing-text)' }}>Schedule for (optional)</Label>
                <p className="text-xs mt-0.5 mb-1.5 opacity-75" style={{ color: 'var(--landing-text)' }}>Leave blank for Draft. Date must be today or later.</p>
                <Input
                  type="date"
                  min={todayIso}
                  value={newTodo.scheduledDate}
                  onChange={(e) => setNewTodo((n) => ({ ...n, scheduledDate: e.target.value }))}
                  className="border-[var(--landing-border)] focus-visible:ring-[var(--landing-primary)]"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowTodoDialog(false)} className="font-bold hero-cta-outline">Cancel</Button>
              <Button onClick={addTodo} className="font-bold text-white hero-cta-primary">
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Gratitude Dialog */}
        <Dialog open={showGratitudeDialog} onOpenChange={setShowGratitudeDialog}>
          <DialogContent className="landing border-2 shadow-lg rounded-2xl" style={{ borderColor: 'var(--landing-primary)', backgroundColor: 'var(--landing-accent)' }}>
            <DialogHeader>
              <DialogTitle className="font-bold" style={{ color: 'var(--landing-text)' }}>What Are You Grateful For?</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Textarea placeholder="I'm grateful for..." value={newGratitude} onChange={(e) => setNewGratitude(e.target.value)} rows={4} className="border-[var(--landing-border)] focus-visible:ring-[var(--landing-primary)]" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowGratitudeDialog(false)} className="font-bold hero-cta-outline">Cancel</Button>
              <Button onClick={addGratitude} className="font-bold text-white hero-cta-primary">
                <Plus className="h-4 w-4 mr-2" />
                Add Entry
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Journal Dialog */}
        <Dialog open={showJournalDialog} onOpenChange={setShowJournalDialog}>
          <DialogContent className="landing sm:max-w-lg border-2 shadow-lg rounded-2xl" style={{ borderColor: 'var(--landing-primary)', backgroundColor: 'var(--landing-accent)' }}>
            <DialogHeader>
              <DialogTitle className="font-bold" style={{ color: 'var(--landing-text)' }}>New Journal Entry</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label className="text-sm font-medium" style={{ color: 'var(--landing-text)' }}>Title</Label>
                <Input placeholder="e.g., A wonderful day" value={newJournal.title} onChange={(e) => setNewJournal({ ...newJournal, title: e.target.value })} className="mt-1.5 border-[var(--landing-border)] focus-visible:ring-[var(--landing-primary)]" />
              </div>
              <div>
                <Label className="text-sm font-medium" style={{ color: 'var(--landing-text)' }}>Mood</Label>
                <Select value={newJournal.mood} onValueChange={(v: any) => setNewJournal({ ...newJournal, mood: v })}>
                  <SelectTrigger className="mt-1.5 border-[var(--landing-border)] focus-visible:ring-[var(--landing-primary)]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="great">Great Day</SelectItem>
                    <SelectItem value="good">Good Day</SelectItem>
                    <SelectItem value="okay">Okay Day</SelectItem>
                    <SelectItem value="tough">Tough Day</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium" style={{ color: 'var(--landing-text)' }}>Your Entry</Label>
                <Textarea placeholder="Write about your day..." value={newJournal.content} onChange={(e) => setNewJournal({ ...newJournal, content: e.target.value })} rows={5} className="mt-1.5 border-[var(--landing-border)] focus-visible:ring-[var(--landing-primary)]" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowJournalDialog(false)} className="font-bold hero-cta-outline">Cancel</Button>
              <Button onClick={addJournalEntry} className="font-bold text-white hero-cta-primary">
                <Plus className="h-4 w-4 mr-2" />
                Add Entry
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <OfflineIndicator />
      <PWAInstallPrompt />
      </div>
    </div>
  );
};

export default ManifestationDashboard;
