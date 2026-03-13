import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Calendar, Target, TrendingUp, CheckCircle2, DollarSign, Lightbulb, ListTodo, Clock, Image as ImageIcon, PenLine } from 'lucide-react';
import VisualProgressTimeline, { TaggedImage } from './VisualProgressTimeline';
import { analyzeProgressImage } from '@/lib/aiImageAnalysis';
import { getMockGoalInsights } from '@/data/demoOnboardingMockData';
import { useTimezone } from '@/contexts/TimezoneContext';

interface Step {
  id: string;
  title: string;
  completed: boolean;
  predictDate?: string;
  predictPrice?: number;
  completedAt?: string;
}

interface Note {
  id: string;
  content: string;
  date: string;
}

interface StepCompletionDay {
  date: string;
  stepTitles: string[];
}

interface Goal {
  id: string;
  title: string;
  description: string;
  category: string;
  progress: number;
  targetDate?: string;
  steps?: Step[];
  image?: string;
  images?: string[];
  budget?: number;
  spent?: number;
}

interface DemoGoalDetailViewProps {
  goal: Goal;
  onBack: () => void;
  onUpdateGoal: (updatedGoal: Goal) => void;
}

export default function DemoGoalDetailView({ goal, onBack, onUpdateGoal }: DemoGoalDetailViewProps) {
  const [currentGoal, setCurrentGoal] = useState(goal);
  const [notes, setNotes] = useState<Note[]>([
    { id: '1', content: 'Started working on this goal today!', date: new Date().toISOString() }
  ]);
  const [newNote, setNewNote] = useState('');

  const getCategoryImages = (category: string): TaggedImage[] => {
    const personalImages = { start: 'https://d64gsuwffb70l.cloudfront.net/68dab31588d806ca5c085b8d_1760313355593_1366f9cc.webp', mid: 'https://d64gsuwffb70l.cloudfront.net/68dab31588d806ca5c085b8d_1760313356469_7d5cbb6c.webp', advanced: 'https://d64gsuwffb70l.cloudfront.net/68dab31588d806ca5c085b8d_1760313357732_45dc90f0.webp' };
    const purposeImages = { start: 'https://d64gsuwffb70l.cloudfront.net/68dab31588d806ca5c085b8d_1760313337681_8f380009.webp', mid: 'https://d64gsuwffb70l.cloudfront.net/68dab31588d806ca5c085b8d_1760313338490_d34ce5f7.webp', advanced: 'https://d64gsuwffb70l.cloudfront.net/68dab31588d806ca5c085b8d_1760313339293_90544afc.webp' };
    const familyImage = 'https://d64gsuwffb70l.cloudfront.net/68c468b90879cba7ca0dcccd_1757703340244_c4563a20.webp';
    const familyImages = { start: familyImage, mid: familyImage, advanced: familyImage };
    const imageMap: Record<string, { start: string; mid: string; advanced: string }> = {
      Purpose: purposeImages,
      Health: { start: 'https://d64gsuwffb70l.cloudfront.net/68dab31588d806ca5c085b8d_1760313346309_a977d9c8.webp', mid: 'https://d64gsuwffb70l.cloudfront.net/68dab31588d806ca5c085b8d_1760313347064_15ae5b20.webp', advanced: 'https://d64gsuwffb70l.cloudfront.net/68dab31588d806ca5c085b8d_1760313347821_2f491fc4.webp' },
      Personal: personalImages,
      Family: familyImages,
      Friends: familyImages,
      Relationships: familyImages,
      Community: purposeImages,
      Volunteer: purposeImages,
      Contribute: purposeImages,
      Donate: purposeImages,
      Ideas: purposeImages,
      Business: { start: 'https://d64gsuwffb70l.cloudfront.net/68dab31588d806ca5c085b8d_1760313364420_116e655c.webp', mid: 'https://d64gsuwffb70l.cloudfront.net/68dab31588d806ca5c085b8d_1760313365234_ba8c7e8e.webp', advanced: 'https://d64gsuwffb70l.cloudfront.net/68dab31588d806ca5c085b8d_1760313365979_65d24337.webp' },
      Education: { start: 'https://d64gsuwffb70l.cloudfront.net/68dab31588d806ca5c085b8d_1760313372407_435111e0.webp', mid: 'https://d64gsuwffb70l.cloudfront.net/68dab31588d806ca5c085b8d_1760313373329_3bd1e9fc.webp', advanced: 'https://d64gsuwffb70l.cloudfront.net/68dab31588d806ca5c085b8d_1760313374079_754e70fb.webp' },
      Creative: { start: 'https://d64gsuwffb70l.cloudfront.net/68dab31588d806ca5c085b8d_1760313381569_d052cb92.webp', mid: 'https://d64gsuwffb70l.cloudfront.net/68dab31588d806ca5c085b8d_1760313382703_29eb08a7.webp', advanced: 'https://d64gsuwffb70l.cloudfront.net/68dab31588d806ca5c085b8d_1760313384066_98016a1d.webp' },
      Finance: { start: 'https://d64gsuwffb70l.cloudfront.net/68dab31588d806ca5c085b8d_1760313391802_60649dba.webp', mid: 'https://d64gsuwffb70l.cloudfront.net/68dab31588d806ca5c085b8d_1760313393555_473380cf.webp', advanced: 'https://d64gsuwffb70l.cloudfront.net/68dab31588d806ca5c085b8d_1760313394327_57e28b17.webp' },
      Wellness: { start: 'https://d64gsuwffb70l.cloudfront.net/68dab31588d806ca5c085b8d_1760313400738_0397d33b.webp', mid: 'https://d64gsuwffb70l.cloudfront.net/68dab31588d806ca5c085b8d_1760313401543_1e9a42f2.webp', advanced: 'https://d64gsuwffb70l.cloudfront.net/68dab31588d806ca5c085b8d_1760313402336_36dc20cf.webp' },
      Travel: { start: 'https://d64gsuwffb70l.cloudfront.net/68dab31588d806ca5c085b8d_1760531037278_55604682.webp', mid: 'https://d64gsuwffb70l.cloudfront.net/68dab31588d806ca5c085b8d_1760531038069_b2a3394d.webp', advanced: 'https://d64gsuwffb70l.cloudfront.net/68dab31588d806ca5c085b8d_1760531039095_6b7be7f5.webp' },
      Career: { start: 'https://d64gsuwffb70l.cloudfront.net/68dab31588d806ca5c085b8d_1760313364420_116e655c.webp', mid: 'https://d64gsuwffb70l.cloudfront.net/68dab31588d806ca5c085b8d_1760313365234_ba8c7e8e.webp', advanced: 'https://d64gsuwffb70l.cloudfront.net/68dab31588d806ca5c085b8d_1760313365979_65d24337.webp' },
    };
    const images = imageMap[category] || imageMap['Personal'];
    return [
      { id: '1', url: images.start, date: '2025-09-15', progress: 0, label: 'Before', aiAnalysis: analyzeProgressImage('', 0, category, []) },
      { id: '2', url: images.mid, date: '2025-09-25', progress: 25, label: 'Week 2', aiAnalysis: analyzeProgressImage('', 25, category, [{ url: '', progress: 0 }]) },
      { id: '3', url: images.advanced, date: '2025-10-02', progress: 50, label: 'Halfway!', aiAnalysis: analyzeProgressImage('', 50, category, [{ url: '', progress: 0 }, { url: '', progress: 25 }]) }
    ];
  };

  const [taggedImages, setTaggedImages] = useState<TaggedImage[]>(() => getCategoryImages(goal.category));

  const stepCompletionHistory: StepCompletionDay[] = (() => {
    const byDate: Record<string, string[]> = {};
    currentGoal.steps?.forEach(step => {
      if (step.completed && step.completedAt) {
        if (!byDate[step.completedAt]) byDate[step.completedAt] = [];
        byDate[step.completedAt].push(step.title);
      }
    });
    return Object.entries(byDate).map(([date, stepTitles]) => ({ date, stepTitles })).sort((a, b) => b.date.localeCompare(a.date));
  })();

  const handleAddImage = (image: TaggedImage) => setTaggedImages(prev => [...prev, image]);
  const handleRemoveImage = (id: string) => setTaggedImages(prev => prev.filter(img => img.id !== id));

  const { todayISO: todayIso } = useTimezone();
  const handleStepToggle = (stepId: string) => {
    const updatedSteps = currentGoal.steps?.map(step =>
      step.id === stepId ? { ...step, completed: !step.completed, completedAt: !step.completed ? todayIso : undefined } : step
    );
    const completed = updatedSteps?.filter(s => s.completed).length || 0;
    const total = updatedSteps?.length || 1;
    const updated = { ...currentGoal, steps: updatedSteps, progress: Math.round((completed / total) * 10) };
    setCurrentGoal(updated);
    onUpdateGoal(updated);
  };

  const handleAddNote = () => {
    if (newNote.trim()) {
      setNotes(prev => [...prev, { id: Date.now().toString(), content: newNote, date: new Date().toISOString() }]);
      setNewNote('');
    }
  };

  const mockInsights = getMockGoalInsights(currentGoal.title, currentGoal.progress);
  const progressPct = currentGoal.progress * 10;

  type TimelineEntry = { type: 'note'; id: string; date: string; content: string } | { type: 'image'; id: string; date: string; url: string; label?: string; progress: number };
  const timelineEntries: TimelineEntry[] = [
    ...notes.map(n => ({ type: 'note' as const, id: n.id, date: n.date.split('T')[0], content: n.content })),
    ...taggedImages.map(img => ({ type: 'image' as const, id: img.id, date: img.date, url: img.url, label: img.label, progress: img.progress })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  const goalImage = currentGoal.image || currentGoal.images?.[0] || taggedImages[0]?.url || '';

  return (
    <div className="min-h-screen landing w-full max-w-[100vw] overflow-x-hidden box-border" style={{ backgroundColor: 'var(--landing-bg)', color: 'var(--landing-text)' }}>
      {/* Back: minimal floating */}
      <div className="fixed top-4 left-4 z-20">
        <Button
          onClick={onBack}
          variant="ghost"
          size="sm"
          className="rounded-full bg-white/90 dark:bg-gray-900/90 shadow-lg backdrop-blur-sm border-0 hover:bg-white"
          style={{ color: 'var(--landing-primary)' }}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
      </div>

      {/* Hero: full-bleed with overlay, circular progress, bold type */}
      <section className="relative min-h-[42vh] flex flex-col justify-end pb-8 pt-16 px-4 sm:px-6">
        {goalImage ? (
          <div className="absolute inset-0">
            <img src={goalImage} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          </div>
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(135deg, var(--landing-primary) 0%, #1a6b4f 50%, #0f4c3a 100%)',
            }}
          />
        )}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-20 blur-3xl" style={{ background: 'var(--landing-primary)' }} />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-10 blur-2xl bg-white" />

        <div className="relative z-10 max-w-6xl mx-auto w-full flex flex-col sm:flex-row items-end gap-8 px-4 sm:px-6">
          <div className="flex-1">
            <span
              className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-3"
              style={{ backgroundColor: 'rgba(255,255,255,0.25)', color: 'white' }}
            >
              {currentGoal.category}
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white tracking-tight drop-shadow-lg">
              {currentGoal.title}
            </h1>
            <p className="text-white/90 text-lg mt-2 max-w-2xl">{currentGoal.description}</p>
            <div className="flex flex-wrap items-center gap-4 mt-4 text-white/80 text-sm">
              {currentGoal.targetDate && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {new Date(currentGoal.targetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              )}
              {currentGoal.budget != null && currentGoal.budget > 0 && (
                <span className="flex items-center gap-1.5">
                  <DollarSign className="h-4 w-4" />
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(currentGoal.spent ?? 0)} / {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(currentGoal.budget)}
                </span>
              )}
            </div>
          </div>
          {/* Circular progress */}
          <div className="relative shrink-0">
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full flex items-center justify-center bg-white/10 backdrop-blur-sm border-2 border-white/30">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="44"
                  fill="none"
                  stroke="white"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${progressPct * 2.76} 276`}
                  className="transition-all duration-700"
                />
              </svg>
              <span className="absolute text-2xl sm:text-3xl font-bold text-white">{currentGoal.progress}</span>
            </div>
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-xs text-white/80 font-medium">/ 10</span>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-16">
        {/* Steps to complete : Progress history — 50:50 width */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
          {/* Left: Steps to complete */}
          <div className="min-w-0">
            <h2 className="text-2xl font-bold mb-8 flex items-center gap-3" style={{ color: 'var(--landing-text)' }}>
              <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--landing-accent)', color: 'var(--landing-primary)' }}>
                <Target className="h-5 w-5" />
              </span>
              Steps to complete
            </h2>
            <div className="space-y-4">
              {currentGoal.steps?.map((step) => (
                <div
                  key={step.id}
                  className="flex items-start gap-3 cursor-pointer group rounded-lg p-3 transition-colors hover:bg-[var(--landing-accent)]/50"
                  onClick={() => handleStepToggle(step.id)}
                  style={{ backgroundColor: step.completed ? 'var(--landing-accent)' : 'transparent' }}
                >
                  <Checkbox
                    checked={step.completed}
                    onCheckedChange={() => handleStepToggle(step.id)}
                    className="mt-0.5 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium ${step.completed ? 'line-through opacity-60' : ''}`} style={{ color: 'var(--landing-text)' }}>
                      {step.title}
                    </p>
                    {(step.predictDate != null || step.predictPrice != null) && (
                      <div className="flex flex-wrap gap-3 mt-1.5 text-xs opacity-80" style={{ color: 'var(--landing-text)' }}>
                        {step.predictDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 shrink-0" />
                            {new Date(step.predictDate).toLocaleDateString()}
                          </span>
                        )}
                        {step.predictPrice != null && step.predictPrice > 0 && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3 shrink-0" />
                            ${step.predictPrice}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Progress history */}
          <div className="min-w-0">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3" style={{ color: 'var(--landing-text)' }}>
              <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--landing-accent)', color: 'var(--landing-primary)' }}>
                <TrendingUp className="h-5 w-5" />
              </span>
              Progress history
            </h2>
            <p className="text-sm mb-4 opacity-80" style={{ color: 'var(--landing-text)' }}>
              Days when steps were completed.
            </p>
            {stepCompletionHistory.length === 0 ? (
              <div className="rounded-2xl p-8 text-center border-2 border-dashed" style={{ borderColor: 'var(--landing-border)', backgroundColor: 'var(--landing-accent)' }}>
                <p className="text-sm" style={{ color: 'var(--landing-text)', opacity: 0.8 }}>No steps completed yet. Check off steps above to see completion dates here.</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-3">
                {stepCompletionHistory.map((entry) => (
                  <div
                    key={entry.date}
                    className="rounded-2xl px-5 py-4 border min-w-0 flex-1"
                    style={{ borderColor: 'var(--landing-border)', backgroundColor: 'var(--landing-accent)' }}
                  >
                    <p className="text-sm font-semibold mb-2" style={{ color: 'var(--landing-primary)' }}>
                      {new Date(entry.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                    <ul className="space-y-1">
                      {entry.stepTitles.map((title, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm" style={{ color: 'var(--landing-text)' }}>
                          <CheckCircle2 className="h-3.5 w-3 shrink-0" style={{ color: 'var(--landing-primary)' }} />
                          {title}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* AI Insights: glass panel */}
        <section className="rounded-3xl overflow-hidden border" style={{ borderColor: 'var(--landing-border)' }}>
          <div
            className="p-8 sm:p-10 backdrop-blur-xl"
            style={{
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(59, 130, 246, 0.08) 100%)',
            }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-violet-500/20 text-violet-600">
                <Lightbulb className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold" style={{ color: 'var(--landing-text)' }}>AI Insights</h2>
                <p className="text-sm opacity-70" style={{ color: 'var(--landing-text)' }}>For this goal</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-6 mb-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-2 opacity-70" style={{ color: 'var(--landing-text)' }}>Status</p>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--landing-text)' }}>{mockInsights.status}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-2 opacity-70" style={{ color: 'var(--landing-text)' }}>Improve</p>
                <ul className="text-sm space-y-1.5" style={{ color: 'var(--landing-text)' }}>
                  {mockInsights.improvements.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-violet-500 mt-0.5">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px] rounded-xl p-4 border" style={{ borderColor: 'var(--landing-border)', backgroundColor: 'rgba(255,255,255,0.6)' }}>
                <p className="text-xs font-semibold flex items-center gap-1.5 mb-2" style={{ color: 'var(--landing-primary)' }}>
                  <Clock className="h-3.5 w-3.5" /> Today
                </p>
                <ul className="text-sm space-y-1" style={{ color: 'var(--landing-text)' }}>
                  {mockInsights.todoToday.map((t, i) => (
                    <li key={i}>· {t}</li>
                  ))}
                </ul>
              </div>
              <div className="flex-1 min-w-[200px] rounded-xl p-4 border" style={{ borderColor: 'var(--landing-border)', backgroundColor: 'rgba(255,255,255,0.6)' }}>
                <p className="text-xs font-semibold flex items-center gap-1.5 mb-2" style={{ color: 'var(--landing-primary)' }}>
                  <ListTodo className="h-3.5 w-3.5" /> Tomorrow
                </p>
                <ul className="text-sm space-y-1" style={{ color: 'var(--landing-text)' }}>
                  {mockInsights.todoTomorrow.map((t, i) => (
                    <li key={i}>· {t}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Visual Progress Timeline: journey strip + add note/photo */}
        <section>
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--landing-accent)', color: 'var(--landing-primary)' }}>
                <ImageIcon className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-2xl font-bold" style={{ color: 'var(--landing-text)' }}>Your journey</h2>
                <p className="text-sm opacity-70" style={{ color: 'var(--landing-text)' }}>Notes and images by date. Add more below.</p>
              </div>
            </div>
          </div>

          {timelineEntries.length === 0 ? (
            <div className="rounded-2xl p-10 text-center border-2 border-dashed" style={{ borderColor: 'var(--landing-border)', backgroundColor: 'var(--landing-accent)' }}>
              <PenLine className="h-12 w-12 mx-auto mb-3 opacity-40" style={{ color: 'var(--landing-primary)' }} />
              <p className="text-sm" style={{ color: 'var(--landing-text)', opacity: 0.8 }}>No notes or images yet. Add a note or photo to build your timeline.</p>
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-4 -mx-1 scroll-smooth">
              {timelineEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="shrink-0 w-[280px] rounded-2xl overflow-hidden border transition-shadow hover:shadow-lg"
                  style={{ borderColor: 'var(--landing-border)', backgroundColor: 'var(--landing-accent)' }}
                >
                  <div className="p-4 border-b text-xs font-semibold" style={{ borderColor: 'var(--landing-border)', color: 'var(--landing-primary)' }}>
                    {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  {entry.type === 'note' ? (
                    <p className="p-4 text-sm leading-relaxed" style={{ color: 'var(--landing-text)' }}>{entry.content}</p>
                  ) : (
                    <div className="p-4">
                      <img src={entry.url} alt="" className="w-full aspect-square object-cover rounded-xl" />
                      <div className="flex justify-between items-center mt-2 text-xs" style={{ color: 'var(--landing-text)', opacity: 0.8 }}>
                        {entry.label && <span>{entry.label}</span>}
                        <span>{entry.progress}%</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 rounded-2xl p-6 border" style={{ borderColor: 'var(--landing-border)', backgroundColor: 'var(--landing-accent)' }}>
            <p className="text-sm font-semibold mb-3" style={{ color: 'var(--landing-text)' }}>Add a note</p>
            <Textarea
              placeholder="What happened? How do you feel about your progress?"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              rows={3}
              className="mb-3 rounded-xl resize-none border-2 focus-visible:ring-2"
              style={{ borderColor: 'var(--landing-border)' }}
            />
            <Button
              onClick={handleAddNote}
              disabled={!newNote.trim()}
              className="rounded-xl"
              style={{ backgroundColor: 'var(--landing-primary)' }}
            >
              <PenLine className="h-4 w-4 mr-2" />
              Add note
            </Button>
          </div>

          <div className="mt-6">
            <VisualProgressTimeline
              images={taggedImages}
              onAddImage={handleAddImage}
              onRemoveImage={handleRemoveImage}
              currentProgress={currentGoal.progress * 10}
              goalType={currentGoal.category}
              embedded
            />
          </div>
        </section>
      </div>
    </div>
  );
}
