import { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Plus,
  Calendar as CalendarIcon,
  List,
  Download,
  Upload,
  Target,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Clock,
  ListTodo,
  Heart,
  BookOpen,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import { AuthenticatedLayout } from '@/components/AuthenticatedLayout';
import { useEvents } from '@/hooks/useEvents';
import { useReminders } from '@/hooks/useReminders';
import { useManifestationDatabase } from '@/hooks/useManifestationDatabase';
import { EventDialog } from '@/components/EventDialog';
import { exportToICS, parseICS, downloadICS } from '@/lib/icsUtils';
import { assignEventLanes } from '@/lib/timelineLanes';
import { useToast } from '@/hooks/use-toast';
import type { CalendarEventData } from '@/hooks/useEvents';
import type { ManifestationGoal, ManifestationTodo } from '@/hooks/useManifestationDatabase';

import calendarImg from '@/assets/images/Attach-goals-to-time.jpg';
import { HeroFloatingCircles } from '@/components/HeroFloatingCircles';
import { TrialBanner } from '@/components/TrialBanner';
import { useTimezone } from '@/contexts/TimezoneContext';

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function Calendar() {
  const navigate = useNavigate();
  const { todayISO, toISODate } = useTimezone();
  const { events, loading, addEvent, updateEvent, deleteEvent, refresh } = useEvents();
  const { createReminder } = useReminders();
  const { goals, todos, gratitudeEntries, journalEntries } = useManifestationDatabase();
  const [viewMode, setViewMode] = useState<'month' | 'day'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dayModalDate, setDayModalDate] = useState<Date | null>(null);
  const [editingEvent, setEditingEvent] = useState<CalendarEventData | undefined>();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string | undefined>();
  const [prefilledGoal, setPrefilledGoal] = useState<{ id: string; title: string } | undefined>();
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Check URL for create-from-goal
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const goalId = params.get('goalId');
    const goalTitle = params.get('goalTitle');
    if (goalId && goalTitle) {
      setPrefilledGoal({ id: goalId, title: decodeURIComponent(goalTitle) });
      setDialogOpen(true);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

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
          const reminderTime = new Date(
            eventData.startTime.getTime() - options.reminderBefore * 60 * 1000
          );
          const label =
            options.reminderBefore === 15
              ? '15 minutes'
              : options.reminderBefore === 60
              ? '1 hour'
              : '1 day';
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

  const handleDateClick = (date: Date) => {
    setDayModalDate(date);
  };

  const openNewScheduleForDay = (date: Date) => {
    setDayModalDate(null);
    setSelectedDate(date);
    setSelectedTime(undefined);
    setEditingEvent(undefined);
    setPrefilledGoal(undefined);
    setDialogOpen(true);
  };

  const handleTimeSlotClick = (time: string) => {
    setSelectedTime(time);
    setSelectedDate(currentDate);
    setEditingEvent(undefined);
    setPrefilledGoal(undefined);
    setDialogOpen(true);
  };

  const handleEventClick = (event: CalendarEventData) => {
    setEditingEvent(event);
    setSelectedDate(new Date(event.startTime));
    setPrefilledGoal(undefined);
    setDialogOpen(true);
  };

  const handleNewEvent = () => {
    setEditingEvent(undefined);
    setSelectedDate(currentDate);
    setSelectedTime(undefined);
    setPrefilledGoal(undefined);
    setDialogOpen(true);
  };

  const handleCreateFromGoal = (goal: { id: string; title: string }) => {
    setPrefilledGoal(goal);
    setEditingEvent(undefined);
    setSelectedDate(new Date());
    setDialogOpen(true);
  };

  const handleExportAll = () => {
    const icsContent = exportToICS(events);
    downloadICS(icsContent, 'goals-calendar.ics');
    toast({ title: 'Exported', description: `${events.length} events exported.` });
  };

  const handleExportRange = () => {
    if (!exportStartDate || !exportEndDate) {
      toast({ title: 'Error', description: 'Select start and end dates.', variant: 'destructive' });
      return;
    }
    const icsContent = exportToICS(events, exportStartDate, exportEndDate);
    downloadICS(icsContent, `goals-${exportStartDate}-to-${exportEndDate}.ics`);
    setExportDialogOpen(false);
    toast({ title: 'Exported', description: 'Date range exported.' });
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const icsContent = ev.target?.result as string;
        const imported = parseICS(icsContent);
        for (const evt of imported) {
          await addEvent({
            title: evt.title,
            description: evt.description,
            startTime: evt.startTime,
            endTime: evt.endTime,
            color: evt.color || '#2c9d73',
            location: evt.location,
            status: 'planned',
          });
        }
        toast({ title: 'Imported', description: `${imported.length} events added.` });
        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch {
        toast({ title: 'Import failed', description: 'Could not parse file.', variant: 'destructive' });
      }
    };
    reader.readAsText(file);
  };

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));

  const getEventsForDate = (day: number) =>
    events.filter((e) => {
      const d = new Date(e.startTime);
      return (
        d.getDate() === day &&
        d.getMonth() === currentDate.getMonth() &&
        d.getFullYear() === currentDate.getFullYear()
      );
    });

  const getDayIso = (day: number) =>
    toISODate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));

  /** Goal steps with predictDate on this day (for calendar display) */
  const getStepsForDayIso = (dayIso: string) =>
    goals.flatMap((g) =>
      (g.steps ?? [])
        .filter((s) => s.predictDate === dayIso)
        .map((s) => ({ step: s, goalTitle: g.title }))
    );

  const getDayStats = (day: number) => {
    const dayIso = getDayIso(day);
    const dayEvents = getEventsForDate(day);
    const dayTodos = todos.filter((t) => t.scheduledDate === dayIso);
    const gratitude = gratitudeEntries.find((g) => g.date === dayIso);
    const journal = journalEntries.find((j) => j.date === dayIso);
    const daySteps = getStepsForDayIso(dayIso);
    return { dayEvents, dayTodos, gratitude, journal, daySteps };
  };

  const getEventsForDay = () =>
    events.filter((e) => new Date(e.startTime).toDateString() === currentDate.toDateString());

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const isToday = (day: number) => getDayIso(day) === todayISO;

  const formatHour = (h: number) => (h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`);

  return (
    <AuthenticatedLayout>
      <div className="min-h-screen landing" style={{ backgroundColor: 'var(--landing-bg)', color: 'var(--landing-text)' }}>
        {/* Hero — light green overlay like Dashboard */}
        <section
          className="relative w-full overflow-hidden"
          style={{ minHeight: '240px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}
        >
          <div className="absolute inset-0">
            <img src={calendarImg} alt="" className="w-full h-full object-cover" />
            <div
              className="absolute inset-0"
              style={{ backgroundColor: 'var(--landing-accent)', opacity: 0.9 }}
              aria-hidden
            />
          </div>
          <HeroFloatingCircles />
          <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div className="mb-4 sm:mb-0 space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => navigate(-1)}
                    className="rounded-xl hover:bg-[var(--landing-hover-bg)]"
                    style={{ color: 'var(--landing-text)' }}
                  >
                    Back
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/')}
                    className="rounded-xl"
                    style={{ borderColor: 'var(--landing-primary)', color: 'var(--landing-primary)' }}
                  >
                    Home
                  </Button>
                </div>
                <div>
                  <h1
                    className="text-3xl sm:text-4xl font-bold tracking-tight bg-clip-text text-transparent"
                    style={{
                      backgroundImage: 'linear-gradient(135deg, var(--landing-primary) 0%, var(--landing-primary-soft) 50%, #1a6b4f 100%)',
                      WebkitBackgroundClip: 'text',
                    }}
                  >
                    Your life in time
                  </h1>
                  <p className="mt-3 text-sm sm:text-base max-w-2xl leading-relaxed opacity-90" style={{ color: 'var(--landing-text)' }}>
                    View your month or day at a glance. Each day shows schedule count, to-dos, appreciation, and journal—click a day for a quick overview. Add events, or import and export .ics to sync with other calendars.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 shrink-0">
                <input ref={fileInputRef} type="file" accept=".ics" onChange={handleImport} className="hidden" />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="hero-cta-outline font-semibold rounded-xl"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setExportDialogOpen(true)}
                  className="hero-cta-outline font-semibold rounded-xl"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button
                  onClick={handleNewEvent}
                  className="hero-cta-primary font-semibold rounded-xl"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New commitment
                </Button>
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <TrialBanner />
          {/* View toggle + Month nav */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 mt-6">
            <div className="flex items-center gap-2">
              <div
                className="inline-flex rounded-xl p-1"
                style={{ backgroundColor: 'var(--landing-accent)' }}
              >
                <button
                  onClick={() => setViewMode('month')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    viewMode === 'month' ? 'text-white shadow' : ''
                  }`}
                  style={viewMode === 'month' ? { backgroundColor: 'var(--landing-primary)' } : { color: 'var(--landing-text)' }}
                >
                  <CalendarIcon className="h-4 w-4 inline mr-2" />
                  Month
                </button>
                <button
                  onClick={() => setViewMode('day')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    viewMode === 'day' ? 'text-white shadow' : ''
                  }`}
                  style={viewMode === 'day' ? { backgroundColor: 'var(--landing-primary)' } : { color: 'var(--landing-text)' }}
                >
                  <List className="h-4 w-4 inline mr-2" />
                  Day
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={prevMonth} style={{ borderColor: 'var(--landing-border)' }}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-xl font-bold min-w-[200px] text-center" style={{ color: 'var(--landing-text)' }}>
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <Button variant="outline" size="icon" onClick={nextMonth} style={{ borderColor: 'var(--landing-border)' }}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24" style={{ color: 'var(--landing-primary)' }}>
              <div className="h-10 w-10 rounded-full border-2 border-current border-t-transparent animate-spin" />
            </div>
          ) : viewMode === 'month' ? (
            /* Month grid — bento-style */
            <div
              className="rounded-2xl overflow-hidden border"
              style={{ borderColor: 'var(--landing-border)', backgroundColor: 'white', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}
            >
              <div className="grid grid-cols-7 border-b" style={{ borderColor: 'var(--landing-border)' }}>
                {dayNames.map((d) => (
                  <div
                    key={d}
                    className="py-3 text-center text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--landing-text)', opacity: 0.7 }}
                  >
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`e-${i}`} className="min-h-[100px] sm:min-h-[120px] p-2" style={{ backgroundColor: 'rgba(0,0,0,0.02)' }} />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const { dayEvents, dayTodos, gratitude, journal, daySteps } = getDayStats(day);
                  const today = isToday(day);

                  return (
                    <div
                      key={day}
                      onClick={() => handleDateClick(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
                      className="min-h-[100px] sm:min-h-[120px] p-2 cursor-pointer transition-all hover:opacity-95"
                      style={{
                        backgroundColor: today ? 'var(--landing-accent)' : 'white',
                        borderRight: (day + firstDay) % 7 !== 0 ? '1px solid var(--landing-border)' : undefined,
                        borderBottom: '1px solid var(--landing-border)',
                        outline: today ? '2px solid var(--landing-primary)' : undefined,
                        outlineOffset: '-2px',
                      }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className="text-sm font-bold"
                          style={{ color: today ? 'var(--landing-primary)' : 'var(--landing-text)' }}
                        >
                          {day}
                        </span>
                        <div className="flex items-center gap-0.5 flex-wrap justify-end">
                          {dayEvents.length > 0 && (
                            <span className="text-[10px] font-semibold px-1 rounded" style={{ backgroundColor: 'var(--landing-primary)', color: 'white' }} title="Scheduled">
                              {dayEvents.length}
                            </span>
                          )}
                          {dayTodos.length > 0 && (
                            <span className="text-[10px] font-semibold px-1 rounded bg-amber-100 text-amber-800" title="To-Do">
                              {dayTodos.length}
                            </span>
                          )}
                          {daySteps.length > 0 && (
                            <span className="text-[10px] font-semibold px-1 rounded bg-emerald-100 text-emerald-800 flex items-center gap-0.5" title="Goal steps due">
                              <Target className="h-3 w-3" /> {daySteps.length}
                            </span>
                          )}
                          {gratitude && <Heart className="h-3 w-3 text-pink-500" title="Appreciate set" />}
                          {journal && <BookOpen className="h-3 w-3 text-blue-500" title="Journal set" />}
                        </div>
                      </div>
                      <div className="space-y-1">
                        {dayEvents.slice(0, 2).map((ev) => (
                          <div
                            key={ev.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEventClick(ev);
                            }}
                            className="text-xs px-2 py-1 rounded-lg truncate text-white font-medium"
                            style={{ backgroundColor: ev.color }}
                          >
                            {ev.title}
                            {ev.goalId && <Target className="h-3 w-3 inline ml-1 opacity-80" />}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-xs" style={{ color: 'var(--landing-text)', opacity: 0.7 }}>
                            +{dayEvents.length - 2} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Day view — summary (To-Dos, Gratitude, Goal steps) + timeline */
            <div
              className="rounded-2xl overflow-hidden border"
              style={{ borderColor: 'var(--landing-border)', backgroundColor: 'white', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}
            >
              <div className="p-6 border-b" style={{ borderColor: 'var(--landing-border)' }}>
                <h3 className="text-lg font-bold" style={{ color: 'var(--landing-text)' }}>
                  {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </h3>
              </div>
              {(() => {
                const dayIso = toISODate(currentDate);
                const dayTodos = todos.filter((t) => t.scheduledDate === dayIso);
                const dayGratitude = gratitudeEntries.find((g) => g.date === dayIso);
                const dayJournal = journalEntries.find((j) => j.date === dayIso);
                const daySteps = getStepsForDayIso(dayIso);
                const hasSummary = dayTodos.length > 0 || dayGratitude || dayJournal || daySteps.length > 0;
                if (!hasSummary) return null;
                return (
                  <div className="p-4 border-b space-y-3" style={{ borderColor: 'var(--landing-border)', backgroundColor: 'var(--landing-accent)' }}>
                    {dayTodos.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1.5" style={{ color: 'var(--landing-primary)' }}>
                          <ListTodo className="h-3.5 w-3.5" /> To-Dos ({dayTodos.length})
                        </h4>
                        <ul className="text-sm space-y-1" style={{ color: 'var(--landing-text)' }}>
                          {dayTodos.map((t) => (
                            <li key={t.id}>{t.title}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {dayGratitude && (
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1.5" style={{ color: 'var(--landing-text)' }}>
                          <Heart className="h-3.5 w-3.5 text-pink-500" /> Appreciate
                        </h4>
                        <p className="text-sm line-clamp-2" style={{ color: 'var(--landing-text)' }}>{dayGratitude.content || '—'}</p>
                      </div>
                    )}
                    {daySteps.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1.5" style={{ color: 'var(--landing-primary)' }}>
                          <Target className="h-3.5 w-3.5" /> Goal steps due ({daySteps.length})
                        </h4>
                        <ul className="text-sm space-y-1" style={{ color: 'var(--landing-text)' }}>
                          {daySteps.map(({ step, goalTitle }) => (
                            <li key={step.id}>{step.title} · {goalTitle}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })()}
              <div className="max-h-[500px] overflow-y-auto">
                {Array.from({ length: 24 }).map((hour) => {
                  const hourEvents = getEventsForDay().filter((e) => new Date(e.startTime).getHours() === hour);
                  const timeStr = `${hour.toString().padStart(2, '0')}:00`;

                  return (
                    <div
                      key={hour}
                      className="flex gap-4 border-b p-3 hover:bg-opacity-50 transition-colors"
                      style={{ borderColor: 'var(--landing-border)' }}
                    >
                      <div className="w-20 flex-shrink-0 flex items-center gap-2">
                        <Clock className="h-4 w-4" style={{ color: 'var(--landing-primary)', opacity: 0.8 }} />
                        <span className="text-sm font-medium" style={{ color: 'var(--landing-text)' }}>
                          {formatHour(hour)}
                        </span>
                      </div>
                      <div className="flex-1 min-h-[48px]">
                        {hourEvents.length > 0 ? (
                          <div className="space-y-2">
                            {hourEvents.map((ev) => (
                              <div
                                key={ev.id}
                                onClick={() => handleEventClick(ev)}
                                className="p-3 rounded-xl cursor-pointer text-white font-medium transition-all hover:opacity-90"
                                style={{ backgroundColor: ev.color }}
                              >
                                <div className="flex items-center gap-2">
                                  {ev.title}
                                  {ev.goalId && <Target className="h-4 w-4 opacity-90" />}
                                </div>
                                <div className="text-sm opacity-90 mt-0.5">
                                  {new Date(ev.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} –{' '}
                                  {new Date(ev.endTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <button
                            onClick={() => handleTimeSlotClick(timeStr)}
                            className="w-full h-12 rounded-xl flex items-center justify-center text-sm transition-colors hover:bg-opacity-50"
                            style={{ backgroundColor: 'var(--landing-accent)', color: 'var(--landing-text)' }}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Create from goal — goals without events */}
          {goals.length > 0 && (
            <div className="mt-8 rounded-2xl p-6 border" style={{ borderColor: 'var(--landing-border)', backgroundColor: 'var(--landing-accent)' }}>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--landing-text)' }}>
                <Target className="h-5 w-5" style={{ color: 'var(--landing-primary)' }} />
                Schedule your goals
              </h3>
              <p className="text-sm mb-4" style={{ color: 'var(--landing-text)', opacity: 0.85 }}>
                When will you work on this? Attach goals to dates.
              </p>
              <div className="flex flex-wrap gap-2">
                {goals.filter((g) => g.progress < 10).slice(0, 8).map((goal) => (
                  <Button
                    key={goal.id}
                    variant="outline"
                    size="sm"
                    onClick={() => handleCreateFromGoal({ id: goal.id, title: goal.title })}
                    className="rounded-full border-[var(--landing-primary)]"
                    style={{ color: 'var(--landing-primary)' }}
                  >
                    <Target className="h-3.5 w-3.5 mr-1.5" />
                    {goal.title}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Day overview modal — To-Dos, Gratitude, Journal, Goal steps, Events */}
        {dayModalDate && (
          <DayOverviewModal
            date={dayModalDate}
            events={events}
            todos={todos}
            goals={goals}
            gratitudeEntries={gratitudeEntries}
            journalEntries={journalEntries}
            onClose={() => setDayModalDate(null)}
            onNewSchedule={() => openNewScheduleForDay(dayModalDate)}
            onEventClick={(ev) => {
              setDayModalDate(null);
              setEditingEvent(ev);
              setSelectedDate(new Date(ev.startTime));
              setPrefilledGoal(undefined);
              setDialogOpen(true);
            }}
          />
        )}

        <EventDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSave={handleSaveEvent}
          event={editingEvent}
          selectedDate={selectedDate}
          selectedTime={selectedTime}
          prefilledGoal={prefilledGoal}
          goals={goals}
        />

        {/* Export dialog */}
        {exportDialogOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setExportDialogOpen(false)}>
            <div
              className="rounded-2xl p-6 w-full max-w-sm shadow-2xl"
              style={{ backgroundColor: 'var(--landing-accent)', border: '1px solid var(--landing-border)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--landing-text)' }}>
                Export calendar
              </h3>
              <Button onClick={handleExportAll} className="w-full mb-4" style={{ backgroundColor: 'var(--landing-primary)' }}>
                Export all
              </Button>
              <div className="space-y-2 mb-4">
                <input
                  type="date"
                  value={exportStartDate}
                  onChange={(e) => setExportStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border"
                  style={{ borderColor: 'var(--landing-border)' }}
                />
                <input
                  type="date"
                  value={exportEndDate}
                  onChange={(e) => setExportEndDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border"
                  style={{ borderColor: 'var(--landing-border)' }}
                />
              </div>
              <Button variant="outline" onClick={handleExportRange} className="w-full" style={{ borderColor: 'var(--landing-border)' }}>
                Export range
              </Button>
            </div>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}

function DayOverviewModal({
  date,
  events,
  todos,
  goals,
  gratitudeEntries,
  journalEntries,
  onClose,
  onNewSchedule,
  onEventClick,
}: {
  date: Date;
  events: CalendarEventData[];
  todos: ManifestationTodo[];
  goals: ManifestationGoal[];
  gratitudeEntries: { id: string; date: string; content?: string }[];
  journalEntries: { id: string; date: string; title?: string; content?: string }[];
  onClose: () => void;
  onNewSchedule: () => void;
  onEventClick: (ev: CalendarEventData) => void;
}) {
  const { toISODate } = useTimezone();
  const dayIso = toISODate(date);
  const eventsOnDate = events.filter((e) => toISODate(new Date(e.startTime)) === dayIso);
  const eventsWithLanes = useMemo(() => assignEventLanes(eventsOnDate), [eventsOnDate]);
  const todosOnDate = todos.filter((t) => t.scheduledDate === dayIso);
  const gratitude = gratitudeEntries.find((g) => g.date === dayIso);
  const journal = journalEntries.find((j) => j.date === dayIso);
  const stepsDue = useMemo(
    () =>
      goals.flatMap((g) =>
        (g.steps ?? [])
          .filter((s) => s.predictDate === dayIso)
          .map((s) => ({ step: s, goalTitle: g.title }))
      ),
    [goals, dayIso]
  );
  const dateLabel = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="rounded-2xl border-2 max-w-lg max-h-[90vh] overflow-y-auto" style={{ borderColor: 'var(--landing-border)' }}>
        <DialogHeader className="flex flex-row items-center justify-between gap-4">
          <DialogTitle style={{ color: 'var(--landing-text)' }}>{dateLabel}</DialogTitle>
          <Button size="sm" onClick={onNewSchedule} className="rounded-xl">
            <Plus className="h-4 w-4 mr-2" />
            New schedule
          </Button>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          {/* To-Dos */}
          {todosOnDate.length > 0 && (
            <div className="rounded-xl p-3 border" style={{ borderColor: 'var(--landing-border)', backgroundColor: 'var(--landing-accent)' }}>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: 'var(--landing-primary)' }}>
                <ListTodo className="h-4 w-4" /> To-Dos ({todosOnDate.length})
              </h4>
              <ul className="space-y-1.5 text-sm" style={{ color: 'var(--landing-text)' }}>
                {todosOnDate.map((t) => (
                  <li key={t.id} className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded border shrink-0" style={{ borderColor: 'var(--landing-border)' }} />
                    {t.title}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Gratitude Journal */}
          {gratitude && (
            <div className="rounded-xl p-3 border" style={{ borderColor: 'var(--landing-border)', backgroundColor: 'rgba(236,72,153,0.08)' }}>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: 'var(--landing-text)' }}>
                <Heart className="h-4 w-4 text-pink-500" /> Appreciate
              </h4>
              <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--landing-text)' }}>{gratitude.content || '—'}</p>
            </div>
          )}

          {/* Goal steps due this day */}
          {stepsDue.length > 0 && (
            <div className="rounded-xl p-3 border" style={{ borderColor: 'var(--landing-border)', backgroundColor: 'rgba(16,185,129,0.08)' }}>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: 'var(--landing-primary)' }}>
                <Target className="h-4 w-4" /> Goal steps due ({stepsDue.length})
              </h4>
              <ul className="space-y-2 text-sm" style={{ color: 'var(--landing-text)' }}>
                {stepsDue.map(({ step, goalTitle }) => (
                  <li key={step.id}>
                    <span className="font-medium">{step.title}</span>
                    <span className="opacity-80"> · {goalTitle}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 24h timeline */}
          <div className="flex border rounded-xl overflow-hidden" style={{ borderColor: 'var(--landing-border)' }}>
            <div className="w-12 flex-shrink-0 py-2 border-r text-xs font-medium" style={{ borderColor: 'var(--landing-border)', color: 'var(--landing-text)', opacity: 0.8 }}>
              {HOURS.map((h) => (
                <div key={h} className="h-8 flex items-center justify-end pr-1">
                  {h}:00
                </div>
              ))}
            </div>
            <div className="flex-1 relative min-h-[192px]">
              {HOURS.map((h) => (
                <div key={h} className="h-8 border-b last:border-b-0" style={{ borderColor: 'var(--landing-border)' }} />
              ))}
              {eventsWithLanes.map((ev) => {
                const start = ev.startTime.getHours() + ev.startTime.getMinutes() / 60;
                const end = ev.endTime.getHours() + ev.endTime.getMinutes() / 60;
                const top = (start / 24) * 100;
                const height = Math.max(((end - start) / 24) * 100, 8);
                const gap = 4;
                const margin = 4;
                const n = ev.totalLanes;
                const slotWidth = n === 1
                  ? 'calc(100% - 8px)'
                  : `calc((100% - ${margin * 2}px - ${(n - 1) * gap}px) / ${n})`;
                const leftVal = n === 1
                  ? margin
                  : `calc(${margin}px + ${ev.lane} * ((100% - ${margin * 2}px - ${(n - 1) * gap}px) / ${n} + ${gap}px))`;
                return (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={() => onEventClick(ev)}
                    className="absolute rounded px-2 py-0.5 text-xs font-medium text-white truncate text-left shadow hover:opacity-95 transition-opacity"
                    style={{
                      top: `${top}%`,
                      height: `${height}%`,
                      left: leftVal,
                      width: slotWidth,
                      backgroundColor: ev.color || 'var(--landing-primary)',
                      minHeight: '20px',
                    }}
                  >
                    {ev.title}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-sm" style={{ color: 'var(--landing-text)' }}>
            <span className="font-medium">{eventsOnDate.length} scheduled</span>
            <span>·</span>
            <span>{todosOnDate.length} To-Do</span>
            {stepsDue.length > 0 && <span>· {stepsDue.length} step{stepsDue.length !== 1 ? 's' : ''} due</span>}
            {gratitude && <span>· Appreciate ✓</span>}
            {journal && <span>· Journal ✓</span>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
