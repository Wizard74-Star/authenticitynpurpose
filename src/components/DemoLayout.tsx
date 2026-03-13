import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { AuthModal } from '@/components/auth/AuthModal';
import { Target, CheckCircle2, Plus, Heart, Award, Calendar, TrendingUp, Flame, DollarSign, RotateCcw, Sparkles, Clock, SparklesIcon, Flower2 } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DemoGoalDialog from '@/components/DemoGoalDialog';
import DemoGoalDetailView from '@/components/DemoGoalDetailView';
import DemoTestimonials from '@/components/DemoTestimonials';
import DemoAchievementsSection from '@/components/DemoAchievementsSection';
import { DemoAnalyticsSection } from '@/components/DemoAnalyticsSection';
import DemoProgressTimeline from '@/components/DemoProgressTimeline';
import PricingSection from '@/components/PricingSection';
import { HeroFloatingCircles } from '@/components/HeroFloatingCircles';
import { useTimezone } from '@/contexts/TimezoneContext';
import { DemoOnboardingModals } from '@/components/DemoOnboardingModals';
import { getMockTodosForDay, type DemoGoalGenerated } from '@/data/demoOnboardingMockData';
import { GratitudeJournalSections } from '@/components/GratitudeJournalSections';
import demoHeroBg from '@/assets/images/Demo-bg.png';
import { BookOpen } from 'lucide-react';

const DEMO_STORAGE_GOALS = 'goals_app_demo_layout_goals';
const DEMO_STORAGE_TASKS = 'goals_app_demo_layout_tasks';

const DEFAULT_DEMO_GOALS = [
    { 
      id: '1', 
      title: 'Launch My Dream Business', 
      description: 'Start and grow my online coaching business', 
      progress: 7, 
      timeline: '1year',
      priority: 'high',
      category: 'Business', 
      targetDate: '2027-01-15',
      image: 'https://d64gsuwffb70l.cloudfront.net/68dab31588d806ca5c085b8d_1760313364420_116e655c.webp',
      budget: 15000,
      spent: 10500,
      steps: [
        { id: 's1', title: 'Define niche and target audience', completed: true },
        { id: 's2', title: 'Create business plan', completed: true },
        { id: 's3', title: 'Build website and branding', completed: true },
        { id: 's4', title: 'Launch and get first clients', completed: false }
      ]
    },
    { 
      id: '2', 
      title: 'Run a Marathon', 
      description: 'Complete my first 26.2 mile race', 
      progress: 6, 
      timeline: '90',
      priority: 'high',
      category: 'Health', 
      targetDate: '2026-04-15',
      image: 'https://d64gsuwffb70l.cloudfront.net/68dab31588d806ca5c085b8d_1760313346309_a977d9c8.webp',
      budget: 800,
      spent: 480,
      steps: [
        { id: 's1', title: 'Build base mileage', completed: true },
        { id: 's2', title: 'Follow training plan', completed: true },
        { id: 's3', title: 'Complete long runs', completed: true },
        { id: 's4', title: 'Race day!', completed: false }
      ]
    },
    { 
      id: '3', 
      title: 'Build My Dream Home', 
      description: 'Design and construct our forever home', 
      progress: 4, 
      timeline: '5year',
      priority: 'medium',
      category: 'Personal', 
      targetDate: '2030-10-01',
      image: 'https://d64gsuwffb70l.cloudfront.net/68dab31588d806ca5c085b8d_1760313355593_1366f9cc.webp',
      budget: 450000,
      spent: 180000,
      steps: [
        { id: 's1', title: 'Save for down payment', completed: true },
        { id: 's2', title: 'Find perfect land', completed: false },
        { id: 's3', title: 'Design with architect', completed: false },
        { id: 's4', title: 'Build and move in', completed: false }
      ]
    },
    { 
      id: '4', 
      title: 'Build Deeper Connections', 
      description: 'Strengthen relationships with family, friends, and loved ones', 
      progress: 5, 
      timeline: '60',
      priority: 'medium',
      category: 'Family', 
      targetDate: '2026-03-20',
      image: 'https://d64gsuwffb70l.cloudfront.net/68c468b90879cba7ca0dcccd_1757703340244_c4563a20.webp',
      budget: 0,
      spent: 0,
      steps: [
        { id: 's1', title: 'Family', completed: true },
        { id: 's2', title: 'Friends', completed: true },
        { id: 's3', title: 'Relationships', completed: false }
      ]
    },
    { 
      id: '5', 
      title: 'Community', 
      description: 'Give back through volunteering, contributing, donating, and sharing ideas', 
      progress: 3, 
      timeline: '90',
      priority: 'medium',
      category: 'Community', 
      targetDate: '2026-05-01',
      image: 'https://d64gsuwffb70l.cloudfront.net/68dab31588d806ca5c085b8d_1760313337681_8f380009.webp',
      budget: 0,
      spent: 0,
      steps: [
        { id: 's1', title: 'Volunteer', completed: true },
        { id: 's2', title: 'Contribute', completed: false },
        { id: 's3', title: 'Donate', completed: false },
        { id: 's4', title: 'Ideas', completed: false }
      ]
    },
    { 
      id: '6', 
      title: 'Travel to Japan', 
      description: 'Experience Japanese culture and cuisine', 
      progress: 3, 
      timeline: '1year',
      priority: 'low',
      category: 'Travel', 
      targetDate: '2027-10-01',
      image: 'https://d64gsuwffb70l.cloudfront.net/68dab31588d806ca5c085b8d_1760531037278_55604682.webp',
      budget: 5000,
      spent: 1500,
      steps: [
        { id: 's1', title: 'Save travel fund', completed: true },
        { id: 's2', title: 'Research destinations', completed: false },
        { id: 's3', title: 'Book flights and hotels', completed: false },
        { id: 's4', title: 'Take the trip!', completed: false }
      ]
    },
    { 
      id: '7', 
      title: 'Save $50,000 Emergency Fund', 
      description: 'Build financial security for my family', 
      progress: 8, 
      timeline: '1year',
      priority: 'high',
      category: 'Finance', 
      targetDate: '2026-12-31',
      image: 'https://d64gsuwffb70l.cloudfront.net/68dab31588d806ca5c085b8d_1760313391802_60649dba.webp',
      budget: 50000,
      spent: 40000,
      steps: [
        { id: 's1', title: 'Create budget plan', completed: true },
        { id: 's2', title: 'Automate savings', completed: true },
        { id: 's3', title: 'Reach $25k milestone', completed: true },
        { id: 's4', title: 'Hit $50k goal', completed: false }
      ]
    },
    {
      id: '8',
      title: 'Deepen Spiritual Practice',
      description: 'Mind, body & soul—church, yoga, meditation, and chakra balance',
      progress: 4,
      timeline: '90',
      priority: 'medium',
      category: 'Spiritual',
      targetDate: '2026-06-01',
      image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&q=80',
      budget: 0,
      spent: 0,
      steps: [
        { id: 's1', title: 'Weekly worship or reflection', completed: true },
        { id: 's2', title: 'Regular yoga or mindful movement', completed: true },
        { id: 's3', title: 'Meditation and chakra awareness', completed: false },
        { id: 's4', title: 'Sustain a balanced routine', completed: false }
      ]
    }
];

/** Demo task: can have day (today/tomorrow/ISO date) and optional time slot */
type DemoTask = {
  id: string;
  title: string;
  completed: boolean;
  points: number;
  priority: 'high' | 'medium' | 'low';
  day?: string;
  timeSlot?: string;
};

const DEFAULT_DEMO_TASKS: DemoTask[] = [
  { id: '1', title: 'Morning meditation - 15 minutes', completed: true, points: 5, priority: 'high', day: 'today', timeSlot: '08:00' },
  { id: '2', title: 'Review weekly goals', completed: true, points: 5, priority: 'high', day: 'today', timeSlot: '09:00' },
  { id: '3', title: 'Call mom', completed: true, points: 5, priority: 'medium', day: 'today', timeSlot: '12:00' },
  { id: '4', title: 'Workout session', completed: true, points: 5, priority: 'high', day: 'today', timeSlot: '17:00' },
  { id: '5', title: 'Read for 30 minutes', completed: true, points: 5, priority: 'medium', day: 'today' },
  { id: '6', title: 'Prepare healthy lunch', completed: false, points: 5, priority: 'medium', day: 'today', timeSlot: '13:00' },
  { id: '7', title: 'Evening walk', completed: false, points: 5, priority: 'low', day: 'today', timeSlot: '19:00' },
  { id: '8', title: 'Journal before bed', completed: false, points: 5, priority: 'medium', day: 'today', timeSlot: '21:00' },
  { id: '9', title: 'Block 30 min for top goal', completed: false, points: 5, priority: 'high', day: 'tomorrow', timeSlot: '10:00' },
  { id: '10', title: 'Plan next day priorities', completed: false, points: 5, priority: 'medium', day: 'tomorrow', timeSlot: '21:00' },
];

const DemoLayout: React.FC = () => {
  const { todayISO: todayIso, tomorrowISO: tomorrowIso } = useTimezone();
  const [selectedGoal, setSelectedGoal] = useState<any>(null);
  const [onboardingOpen, setOnboardingOpen] = useState(false);

  const [demoGoals, setDemoGoals] = useState(() => {
    try {
      const raw = sessionStorage.getItem(DEMO_STORAGE_GOALS);
      if (raw) return JSON.parse(raw);
    } catch {}
    return DEFAULT_DEMO_GOALS;
  });

  const [demoTasks, setDemoTasks] = useState<DemoTask[]>(() => {
    try {
      const raw = sessionStorage.getItem(DEMO_STORAGE_TASKS);
      if (raw) {
        const parsed = JSON.parse(raw) as DemoTask[];
        return parsed.map(t => ({ ...t, day: t.day ?? 'today', timeSlot: t.timeSlot }));
      }
    } catch {}
    return DEFAULT_DEMO_TASKS;
  });

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDay, setNewTaskDay] = useState<'today' | 'tomorrow'>('today');
  const [newTaskTimeSlot, setNewTaskTimeSlot] = useState('');

  useEffect(() => {
    try {
      sessionStorage.setItem(DEMO_STORAGE_GOALS, JSON.stringify(demoGoals));
    } catch {}
  }, [demoGoals]);

  useEffect(() => {
    try {
      sessionStorage.setItem(DEMO_STORAGE_TASKS, JSON.stringify(demoTasks));
    } catch {}
  }, [demoTasks]);

  const timelineLabels: Record<string, string> = {
    '30': '30 Days',
    '60': '60 Days',
    '90': '90 Days',
    '1year': '1 Year',
    '5year': '5 Year Plan'
  };


  const [gratitudeEntries, setGratitudeEntries] = useState<{ id: string; content: string; date: string; sectionKey?: string; sectionLabel?: string }[]>([
    { id: '1', content: "I'm grateful for my supportive family who believes in my dreams", date: '2026-01-18', sectionKey: 'family-friends-loved-ones' },
    { id: '2', content: "Thankful for my health and the ability to pursue my goals", date: '2026-01-17', sectionKey: 'good-health' },
    { id: '3', content: "Grateful for this beautiful morning and a fresh start", date: '2026-01-16', sectionKey: 'moments-of-joy' }
  ]);

  const handleAddGoal = (newGoal: any) => {
    setDemoGoals(prev => [...prev, {
      ...newGoal,
      progress: newGoal.progress ?? 0,
      timeline: newGoal.timeline || '90',
      priority: newGoal.priority || 'medium',
      budget: newGoal.budget ?? 0,
      spent: newGoal.spent ?? 0,
      steps: newGoal.steps ?? [],
    }]);
  };

  const handleUpdateGoal = (updatedGoal: any) => {
    setDemoGoals(prev => prev.map(g => g.id === updatedGoal.id ? updatedGoal : g));
  };

  const updateGoalProgress = (goalId: string, progress: number) => {
    setDemoGoals(prev => prev.map(g => g.id === goalId ? { ...g, progress } : g));
  };

  const handleOnboardingRecommended = (goals: DemoGoalGenerated[]) => {
    setDemoGoals(prev => [
      ...prev,
      ...goals.map(g => ({
        ...g,
        steps: g.steps ?? [],
      })),
    ]);
    setOnboardingOpen(false);
    document.getElementById('demo-dashboard')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleAIGenerateTodos = (day: 'today' | 'tomorrow') => {
    const mock = getMockTodosForDay(day, demoGoals);
    const newTasks: DemoTask[] = mock.map((m, i) => ({
      id: `ai-${day}-${Date.now()}-${i}`,
      title: m.title,
      completed: false,
      points: 5,
      priority: 'medium' as const,
      day,
      timeSlot: m.timeSlot,
    }));
    setDemoTasks(prev => [...prev, ...newTasks]);
  };

  const tasksByDay = useMemo(() => {
    const today = todayIso;
    const tomorrow = tomorrowIso;
    const byDay: Record<string, DemoTask[]> = { today: [], tomorrow: [] };
    demoTasks.forEach(t => {
      const d = t.day ?? 'today';
      if (d === 'today' || d === today) byDay.today.push(t);
      else if (d === 'tomorrow' || d === tomorrow) byDay.tomorrow.push(t);
      else {
        if (!byDay[d]) byDay[d] = [];
        byDay[d].push(t);
      }
    });
    return byDay;
  }, [demoTasks]);

  const earnedAchievementBonus = 150;
  const totalPoints = demoTasks.filter(t => t.completed).reduce((sum, t) => sum + (t.points ?? 5), 0) + earnedAchievementBonus;
  const streak = 14;

  if (selectedGoal) {
    return (
      <div className="w-full max-w-[100vw] overflow-x-hidden box-border">
        <DemoGoalDetailView 
          goal={selectedGoal} 
          onBack={() => setSelectedGoal(null)}
          onUpdateGoal={handleUpdateGoal}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen landing w-full max-w-[100vw] overflow-x-hidden box-border" style={{ backgroundColor: 'var(--landing-bg)', color: 'var(--landing-text)' }}>
      {/* Demo Banner */}
      <div className="py-3 px-4 text-center text-white flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 flex-wrap" style={{ backgroundColor: 'var(--landing-primary)' }}>
        <p className="font-semibold flex items-center justify-center gap-2 min-w-0 flex-1 basis-full sm:basis-auto">
          <Flame className="h-5 w-5 shrink-0" />
          <span className="break-words">Interactive Demo — Try the app with sample goals and tasks</span>
          <Sparkles className="h-4 w-4 ml-1 shrink-0" />
        </p>
        <Button
          variant="secondary"
          size="sm"
          className="bg-white/20 hover:bg-white/30 text-white border-0 shrink-0"
          onClick={() => {
            setDemoGoals(DEFAULT_DEMO_GOALS);
            setDemoTasks(DEFAULT_DEMO_TASKS as DemoTask[]);
            setGratitudeEntries([
              { id: '1', content: "I'm grateful for my supportive family who believes in my dreams", date: '2026-01-18', sectionKey: 'family-friends-loved-ones' },
              { id: '2', content: "Thankful for my health and the ability to pursue my goals", date: '2026-01-17', sectionKey: 'good-health' },
              { id: '3', content: "Grateful for this beautiful morning and a fresh start", date: '2026-01-16', sectionKey: 'moments-of-joy' }
            ]);
          }}
        >
          <RotateCcw className="h-4 w-4 mr-1" />
          Reset to sample data
        </Button>
      </div>

      {/* Hero Section — matches Features/Pricing/About pattern */}
      <section
        id="hero"
        className="relative py-20 sm:py-28 px-4 min-h-[28rem] flex items-center justify-center overflow-hidden w-full max-w-[100vw]"
      >
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${demoHeroBg})` }}
          aria-hidden
        />
        <div className="absolute inset-0" style={{ backgroundColor: 'var(--landing-accent)', opacity: 0.85 }} aria-hidden />
        <HeroFloatingCircles />
        <div className="relative z-10 max-w-6xl mx-auto text-center px-4 sm:px-6 w-full min-w-0">
          <h1
            className="text-3xl sm:text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent animate-slide-up break-words"
            style={{
              backgroundImage: 'linear-gradient(135deg, var(--landing-primary) 0%, var(--landing-primary-soft) 50%, #1a6b4f 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              animationDelay: '0.1s',
            }}
          >
            See how it works
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
            Explore goals, progress tracking, and daily tasks — no account needed
          </p>
          <p
            className="text-sm font-medium opacity-90 mb-8 animate-slide-up"
            style={{ color: 'var(--landing-text)', animationDelay: '0.3s' }}
          >
            Try it: Click a goal to see details • Drag the progress sliders • Toggle tasks • Add your own
          </p>
          <div
            className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up"
            style={{ animationDelay: '0.4s' }}
          >
            <Button
              size="lg"
              variant="default"
              className="hero-cta-primary"
              onClick={() => setOnboardingOpen(true)}
            >
              <Sparkles className="h-5 w-5 mr-2" />
              Start guided demo
            </Button>
            <AuthModal
              trigger={
                <Button size="lg" variant="default" className="trial-cta">
                  Start 7-day free trial
                </Button>
              }
              defaultMode="signup"
            />
            <Button
              size="lg"
              variant="outline"
              onClick={() => document.getElementById('demo-dashboard')?.scrollIntoView({ behavior: 'smooth' })}
              className="hero-cta-outline"
            >
              Try the demo below
            </Button>
          </div>
        </div>
      </section>

      <DemoOnboardingModals
        open={onboardingOpen}
        onClose={() => setOnboardingOpen(false)}
        onCompleteWithOwnPlan={() => setOnboardingOpen(false)}
        onCompleteWithRecommended={handleOnboardingRecommended}
        acceptButtonLabel="Add these to my demo"
      />





      {/* Stats Bar */}
      <section className="py-8 px-4 sm:px-6 border-t overflow-x-hidden" style={{ backgroundColor: 'var(--landing-bg)', borderColor: 'var(--landing-border)' }}>
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-center min-w-0">
          <div className="p-4 rounded-xl border" style={{ backgroundColor: 'var(--landing-accent)', borderColor: 'var(--landing-border)' }}>
            <div className="text-3xl font-bold mb-1" style={{ color: 'var(--landing-primary)' }}>{demoGoals.length}</div>
            <div className="text-sm font-medium" style={{ color: 'var(--landing-text)' }}>Active Goals</div>
          </div>
          <div className="p-4 rounded-xl border" style={{ backgroundColor: 'var(--landing-accent)', borderColor: 'var(--landing-border)' }}>
            <div className="text-3xl font-bold mb-1" style={{ color: 'var(--landing-primary)' }}>{demoTasks.filter(t => t.completed).length}/{demoTasks.length}</div>
            <div className="text-sm font-medium" style={{ color: 'var(--landing-text)' }}>Tasks Done</div>
          </div>
          <div className="p-4 rounded-xl border" style={{ backgroundColor: 'var(--landing-accent)', borderColor: 'var(--landing-border)' }}>
            <div className="text-3xl font-bold mb-1" style={{ color: 'var(--landing-primary)' }}>{totalPoints}</div>
            <div className="text-sm font-medium" style={{ color: 'var(--landing-text)' }}>Total Points</div>
          </div>
          <div className="p-4 rounded-xl border" style={{ backgroundColor: 'var(--landing-accent)', borderColor: 'var(--landing-border)' }}>
            <div className="text-3xl font-bold mb-1" style={{ color: 'var(--landing-primary)' }}>{streak} days</div>
            <div className="text-sm font-medium" style={{ color: 'var(--landing-text)' }}>Current Streak</div>
          </div>
        </div>
      </section>

      {/* Demo Dashboard */}
      <section id="demo-dashboard" className="py-12 px-4 sm:px-6 border-t scroll-mt-24 overflow-x-hidden" style={{ backgroundColor: 'var(--landing-bg)', borderColor: 'var(--landing-border)' }}>
        <div className="max-w-6xl mx-auto space-y-12 min-w-0">
          {/* Goals Grid */}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
              <div className="flex items-center gap-3 min-w-0">
                <Target className="h-8 w-8 shrink-0" style={{ color: 'var(--landing-primary)' }} />
                <h2 className="text-2xl sm:text-3xl font-bold truncate min-w-0" style={{ color: 'var(--landing-text)' }}>Goals–Vision Board (0-10 Scale)</h2>
              </div>
              <DemoGoalDialog
                trigger={
                  <Button className="hero-cta-primary">
                    <Plus className="h-5 w-5 mr-2" />
                    Add Goal
                  </Button>
                }
                onGoalAdd={handleAddGoal}
              />
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {demoGoals.map(goal => (
                <Card
                  key={goal.id}
                  className="overflow-hidden shadow-lg hover:shadow-xl transition-all cursor-pointer feature-card-shadow"
                  style={{ borderColor: 'var(--landing-border)', backgroundColor: 'white' }}
                  onClick={() => setSelectedGoal(goal)}
                >
                  {goal.image && (
                    <div className="w-full h-40 overflow-hidden">
                      <img
                        src={goal.image}
                        alt={goal.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold" style={{ color: 'var(--landing-text)' }}>{goal.title}</h3>
                      <span className="text-2xl font-bold" style={{ color: '#1d4ed8' }}>{goal.progress}/10</span>
                    </div>
                    <p className="text-sm mb-3 opacity-90" style={{ color: 'var(--landing-text)' }}>{goal.description}</p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge
                        variant="outline"
                        className="rounded-full border border-sky-300 bg-sky-50 text-xs font-semibold text-sky-700 shadow-sm"
                      >
                        {timelineLabels[goal.timeline]}
                      </Badge>
                      <Badge
                        className={`rounded-full text-xs font-semibold shadow-sm ${
                          goal.priority === 'high'
                            ? 'border border-red-200 bg-red-50 text-red-600'
                            : 'border border-sky-200 bg-sky-50 text-sky-700'
                        }`}
                      >
                        {goal.priority}
                      </Badge>
                    </div>
                    {/* Budget & Spent */}
                    {(goal.budget != null && goal.budget > 0) && (
                      <div className="flex flex-wrap gap-4 mb-3 text-sm" style={{ color: 'var(--landing-text)' }}>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" style={{ color: 'var(--landing-primary)' }} />
                          <span><strong>Budget:</strong> {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(goal.budget)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" style={{ color: 'var(--landing-primary)' }} />
                          <span><strong>Spent:</strong> {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(goal.spent ?? 0)}</span>
                        </div>
                      </div>
                    )}
                    <div className="space-y-2">
                      <Slider
                        value={[goal.progress]}
                        onValueChange={(value) => updateGoalProgress(goal.id, value[0])}
                        onClick={(e) => e.stopPropagation()}
                        max={10}
                        step={1}
                        className="w-full"
                      />
                      <Progress
                        value={goal.progress * 10}
                        className="h-2"
                        style={{ backgroundColor: 'var(--landing-accent)' }}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* To-Do List by day */}
            <Card className="shadow-lg feature-card-shadow min-w-0 overflow-hidden" style={{ borderColor: 'var(--landing-border)', backgroundColor: 'white' }}>
              <CardContent className="p-6 min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3 min-w-0 flex-wrap">
                    <CheckCircle2 className="h-7 w-7 shrink-0" style={{ color: 'var(--landing-primary)' }} />
                    <h3 className="text-xl sm:text-2xl font-semibold" style={{ color: 'var(--landing-text)' }}>To-Do List</h3>
                    <Badge className="shrink-0" style={{ backgroundColor: 'var(--landing-accent)', color: 'var(--landing-primary)' }}>By day · +5 pts each</Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleAIGenerateTodos('today')}
                      className="text-xs"
                    >
                      <SparklesIcon className="h-3 w-3 mr-1" />
                      AI: Today
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleAIGenerateTodos('tomorrow')}
                      className="text-xs"
                    >
                      <SparklesIcon className="h-3 w-3 mr-1" />
                      AI: Tomorrow
                    </Button>
                  </div>
                </div>
                <Tabs defaultValue="today" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4" style={{ backgroundColor: 'var(--landing-accent)' }}>
                    <TabsTrigger value="today">Today</TabsTrigger>
                    <TabsTrigger value="tomorrow">Tomorrow</TabsTrigger>
                  </TabsList>
                  <TabsContent value="today" className="space-y-3 mt-0">
                    {(tasksByDay.today ?? []).map(task => (
                      <div
                        key={task.id}
                        className={`flex items-center gap-3 p-4 rounded-xl transition-all ${
                          task.completed ? 'border-2' : ''
                        }`}
                        style={{
                          backgroundColor: task.completed ? 'var(--landing-accent)' : 'var(--landing-bg)',
                          borderColor: task.completed ? 'var(--landing-primary)' : 'transparent',
                        }}
                      >
                        <button
                          onClick={() => setDemoTasks(demoTasks.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t))}
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${
                            task.completed ? '' : 'border-gray-300'
                          }`}
                          style={task.completed ? { backgroundColor: 'var(--landing-primary)', borderColor: 'var(--landing-primary)' } : {}}
                        >
                          {task.completed && <CheckCircle2 className="h-4 w-4 text-white" />}
                        </button>
                        <div className="flex-1 min-w-0 flex items-center gap-2">
                          {task.timeSlot && (
                            <span className="flex items-center gap-1 text-xs shrink-0 opacity-80" style={{ color: 'var(--landing-text)' }}>
                              <Clock className="h-3 w-3" /> {task.timeSlot}
                            </span>
                          )}
                          <span className={`${task.completed ? 'line-through opacity-70' : ''}`} style={{ color: 'var(--landing-text)' }}>
                            {task.title}
                          </span>
                        </div>
                      </div>
                    ))}
                  </TabsContent>
                  <TabsContent value="tomorrow" className="space-y-3 mt-0">
                    {(tasksByDay.tomorrow ?? []).map(task => (
                      <div
                        key={task.id}
                        className={`flex items-center gap-3 p-4 rounded-xl transition-all ${
                          task.completed ? 'border-2' : ''
                        }`}
                        style={{
                          backgroundColor: task.completed ? 'var(--landing-accent)' : 'var(--landing-bg)',
                          borderColor: task.completed ? 'var(--landing-primary)' : 'transparent',
                        }}
                      >
                        <button
                          onClick={() => setDemoTasks(demoTasks.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t))}
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${
                            task.completed ? '' : 'border-gray-300'
                          }`}
                          style={task.completed ? { backgroundColor: 'var(--landing-primary)', borderColor: 'var(--landing-primary)' } : {}}
                        >
                          {task.completed && <CheckCircle2 className="h-4 w-4 text-white" />}
                        </button>
                        <div className="flex-1 min-w-0 flex items-center gap-2">
                          {task.timeSlot && (
                            <span className="flex items-center gap-1 text-xs shrink-0 opacity-80" style={{ color: 'var(--landing-text)' }}>
                              <Clock className="h-3 w-3" /> {task.timeSlot}
                            </span>
                          )}
                          <span className={`${task.completed ? 'line-through opacity-70' : ''}`} style={{ color: 'var(--landing-text)' }}>
                            {task.title}
                          </span>
                        </div>
                      </div>
                    ))}
                  </TabsContent>
                </Tabs>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const title = newTaskTitle.trim();
                    if (title) {
                      setDemoTasks([...demoTasks, {
                        id: Date.now().toString(),
                        title,
                        completed: false,
                        points: 5,
                        priority: 'medium',
                        day: newTaskDay,
                        timeSlot: newTaskTimeSlot.trim() || undefined,
                      }]);
                      setNewTaskTitle('');
                      setNewTaskTimeSlot('');
                    }
                  }}
                  className="space-y-2 mt-4"
                >
                  <div className="flex flex-wrap gap-2 items-center">
                    <Input
                      placeholder="Add a task..."
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      className="flex-1 min-w-0 w-full sm:w-auto sm:min-w-[120px] max-w-full"
                      style={{ borderColor: 'var(--landing-border)' }}
                    />
                    <Select value={newTaskDay} onValueChange={(v: 'today' | 'tomorrow') => setNewTaskDay(v)}>
                      <SelectTrigger className="w-full sm:w-[110px] shrink-0" style={{ borderColor: 'var(--landing-border)' }}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="tomorrow">Tomorrow</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Time (e.g. 09:00)"
                      value={newTaskTimeSlot}
                      onChange={(e) => setNewTaskTimeSlot(e.target.value)}
                      className="w-full sm:w-[100px] min-w-0 max-w-[120px] sm:max-w-none"
                      style={{ borderColor: 'var(--landing-border)' }}
                    />
                    <Button type="submit" size="sm" className="hero-cta-primary shrink-0 w-full sm:w-auto" disabled={!newTaskTitle.trim()}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Appreciate — 7 categories + custom, works on computer, tablet, phone */}
            <GratitudeJournalSections
              date={todayIso}
              entries={gratitudeEntries}
              onSaveSection={(date, sectionKey, sectionLabel, content) => {
                setGratitudeEntries(prev => {
                  const existing = prev.find(e => e.date === date && (e.sectionKey ?? '') === sectionKey);
                  if (existing) {
                    return prev.map(e => e.id === existing.id ? { ...e, content } : e);
                  }
                  if (!content.trim()) return prev;
                  return [{ id: crypto.randomUUID(), content, date, sectionKey, sectionLabel: sectionLabel ?? undefined }, ...prev];
                });
              }}
              onRemoveCustomSection={(date, sectionKey) => {
                setGratitudeEntries(prev => prev.filter(e => !(e.date === date && e.sectionKey === sectionKey)));
              }}
              useLandingStyles
            />
          </div>

          {/* Calendar & Written Plan Row */}
          <div className="grid lg:grid-cols-2 gap-8">
            <Card className="shadow-lg feature-card-shadow" style={{ borderColor: 'var(--landing-border)', backgroundColor: 'white' }}>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Calendar className="h-7 w-7" style={{ color: 'var(--landing-primary)' }} />
                  <h3 className="text-2xl font-semibold" style={{ color: 'var(--landing-text)' }}>Calendar</h3>
                </div>
                <p className="text-sm opacity-90 mb-4" style={{ color: 'var(--landing-text)' }}>
                  In the full app, goals are attached to your calendar with reminders—so you revisit them when it matters.
                </p>
                <div className="p-4 rounded-xl border space-y-2 min-w-0 overflow-hidden" style={{ backgroundColor: 'var(--landing-accent)', borderColor: 'var(--landing-border)' }}>
                  {[
                    { date: 'Feb 18', goal: 'Run a Marathon — 90-day check-in' },
                    { date: 'Feb 20', goal: 'Build Deeper Connections — Family time' },
                    { date: 'Mar 15', goal: 'Launch Business — First client milestone' }
                  ].map((item, i) => (
                    <div key={i} className="flex gap-3 text-sm min-w-0">
                      <span className="font-semibold shrink-0" style={{ color: 'var(--landing-primary)' }}>{item.date}</span>
                      <span className="min-w-0 break-words" style={{ color: 'var(--landing-text)' }}>{item.goal}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg feature-card-shadow" style={{ borderColor: 'var(--landing-border)', backgroundColor: 'white' }}>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <BookOpen className="h-7 w-7" style={{ color: 'var(--landing-primary)' }} />
                <h3 className="text-2xl font-semibold" style={{ color: 'var(--landing-text)' }}>Written Plan</h3>
              </div>
              <p className="text-sm opacity-90 mb-4" style={{ color: 'var(--landing-text)' }}>
                In the full app, each goal has a written development plan—your own words clarifying the path. This keeps you focused and accountable.
              </p>
              <div className="p-4 rounded-xl border" style={{ backgroundColor: 'var(--landing-accent)', borderColor: 'var(--landing-border)' }}>
                <p className="text-sm italic opacity-90" style={{ color: 'var(--landing-text)' }}>
                  &quot;My plan: I will launch my coaching business by defining my niche, building a website, and getting my first 5 clients within 6 months. I&apos;ll work with Sarah on marketing and Mike on tech.&quot;
                </p>
                <p className="text-xs mt-2 opacity-70" style={{ color: 'var(--landing-text)' }}>— Sample written plan for &quot;Launch My Dream Business&quot;</p>
              </div>
            </CardContent>
            </Card>
          </div>

          {/* Achievements */}
          <DemoAchievementsSection totalPoints={totalPoints} />

          {/* Progress Timeline */}
          <DemoProgressTimeline />

          {/* Analytics */}
          <DemoAnalyticsSection goals={demoGoals} tasks={demoTasks} />

          {/* Testimonials */}
          <DemoTestimonials />

          {/* Spiritual, Mind Body & Soul */}
          <div className="rounded-2xl p-6 sm:p-8 shadow-lg border min-w-0 overflow-hidden" style={{ backgroundColor: 'white', borderColor: 'var(--landing-border)' }}>
            <div className="flex items-center justify-center gap-2 mb-6">
              <Flower2 className="h-7 w-7" style={{ color: 'var(--landing-primary)' }} />
              <h3 className="text-xl sm:text-2xl font-bold text-center" style={{ color: 'var(--landing-text)' }}>Spiritual, Mind Body & Soul</h3>
            </div>
            <p className="text-sm opacity-90 text-center mb-6 max-w-2xl mx-auto" style={{ color: 'var(--landing-text)' }}>
              Set goals for faith, wellness, and inner growth—church and community, yoga and mindful movement, chakras and meditation.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 min-w-0">
              <Card className="overflow-hidden border shadow-md hover:shadow-lg transition-shadow" style={{ borderColor: 'var(--landing-border)' }}>
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=600&q=80"
                    alt="People in church"
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-1" style={{ color: 'var(--landing-text)' }}>Faith & Community</h4>
                  <p className="text-sm opacity-90" style={{ color: 'var(--landing-text)' }}>Church, worship, and connection with your spiritual community.</p>
                </CardContent>
              </Card>
              <Card className="overflow-hidden border shadow-md hover:shadow-lg transition-shadow" style={{ borderColor: 'var(--landing-border)' }}>
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&q=80"
                    alt="Woman doing yoga"
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-1" style={{ color: 'var(--landing-text)' }}>Yoga & Mind-Body</h4>
                  <p className="text-sm opacity-90" style={{ color: 'var(--landing-text)' }}>Yoga, mindful movement, and body-soul balance.</p>
                </CardContent>
              </Card>
              <Card className="overflow-hidden border shadow-md hover:shadow-lg transition-shadow" style={{ borderColor: 'var(--landing-border)' }}>
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&q=80"
                    alt="Meditation and chakras"
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-1" style={{ color: 'var(--landing-text)' }}>Chakras & Energy</h4>
                  <p className="text-sm opacity-90" style={{ color: 'var(--landing-text)' }}>Meditation, chakra awareness, and inner energy.</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Feature Highlights */}
          <div className="rounded-2xl p-6 sm:p-8 shadow-lg border min-w-0 overflow-hidden" style={{ backgroundColor: 'white', borderColor: 'var(--landing-border)' }}>
            <h3 className="text-xl sm:text-2xl font-bold mb-6 text-center" style={{ color: 'var(--landing-text)' }}>Why Authenticity and Purpose?</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 min-w-0">
              <div className="text-center p-6 rounded-xl border" style={{ backgroundColor: 'var(--landing-accent)', borderColor: 'var(--landing-border)' }}>
                <Calendar className="h-10 w-10 mx-auto mb-3" style={{ color: 'var(--landing-primary)' }} />
                <h4 className="font-semibold text-lg mb-2" style={{ color: 'var(--landing-text)' }}>Goal Timelines</h4>
                <p className="text-sm opacity-90" style={{ color: 'var(--landing-text)' }}>30, 60, 90 days to 5-year plans</p>
              </div>
              <div className="text-center p-6 rounded-xl border" style={{ backgroundColor: 'var(--landing-accent)', borderColor: 'var(--landing-border)' }}>
                <TrendingUp className="h-10 w-10 mx-auto mb-3" style={{ color: 'var(--landing-primary)' }} />
                <h4 className="font-semibold text-lg mb-2" style={{ color: 'var(--landing-text)' }}>0-10 Progress</h4>
                <p className="text-sm opacity-90" style={{ color: 'var(--landing-text)' }}>Simple, visual progress tracking</p>
              </div>
              <div className="text-center p-6 rounded-xl border" style={{ backgroundColor: 'var(--landing-accent)', borderColor: 'var(--landing-border)' }}>
                <Heart className="h-10 w-10 mx-auto mb-3" style={{ color: 'var(--landing-primary)' }} />
                <h4 className="font-semibold text-lg mb-2" style={{ color: 'var(--landing-text)' }}>Focus on YOU</h4>
                <p className="text-sm opacity-90" style={{ color: 'var(--landing-text)' }}>No social comparison, just growth</p>
              </div>
              <div className="text-center p-6 rounded-xl border" style={{ backgroundColor: 'var(--landing-accent)', borderColor: 'var(--landing-border)' }}>
                <Award className="h-10 w-10 mx-auto mb-3" style={{ color: 'var(--landing-primary)' }} />
                <h4 className="font-semibold text-lg mb-2" style={{ color: 'var(--landing-text)' }}>Earn Rewards</h4>
                <p className="text-sm opacity-90" style={{ color: 'var(--landing-text)' }}>Points for every achievement</p>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div id="pricing">
            <PricingSection />
          </div>

          {/* CTA Section — matches About/Features/Pricing pattern */}
          <section className="py-20 px-4 overflow-x-hidden">
            <div className="max-w-6xl mx-auto text-center rounded-3xl p-6 sm:p-10 md:p-14 relative overflow-hidden min-w-0" style={{ background: 'linear-gradient(135deg, var(--landing-primary) 0%, var(--landing-primary-soft) 50%, #1a6b4f 100%)' }}>
              <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-20 blur-3xl" style={{ backgroundColor: 'white' }} aria-hidden />
              <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-20 blur-3xl" style={{ backgroundColor: 'white' }} aria-hidden />
              <div className="relative z-10">
                <Flame className="w-12 h-12 mx-auto mb-4 text-white/90" />
                <h2 className="text-2xl sm:text-3xl font-bold mb-3 text-white">Ready to start your growth journey?</h2>
                <p className="text-white/90 mb-6 max-w-md mx-auto">7-day free trial. No credit card required.</p>
                <AuthModal
                  defaultMode="signup"
                  trigger={
                    <Button size="lg" className="text-base px-8 bg-white text-[var(--landing-primary)] hover:bg-white/95 shadow-lg">
                      <Flame className="h-5 w-5 mr-2" />
                      Begin your journey
                    </Button>
                  }
                />
              </div>
            </div>
          </section>
        </div>
      </section>
    </div>
  );

};

export default DemoLayout;
