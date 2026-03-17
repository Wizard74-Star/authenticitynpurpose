import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Target,
  Plus,
  Trash2,
  Pause,
  Play,
  CheckCircle,
  LogIn,
  DollarSign,
  Loader2,
  Pencil,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useManifestationDatabase } from '@/hooks/useManifestationDatabase';
import { useToast } from '@/hooks/use-toast';
import GoalDetailView from '@/components/GoalDetailView';
import { AddGoalDialog } from '@/components/AddGoalDialog';
import { EditGoalDialog } from '@/components/EditGoalDialog';
import { BudgetSpentEditDialog } from '@/components/BudgetSpentEditDialog';
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogAction } from '@/components/ui/alert-dialog';
import type { ManifestationGoal } from '@/hooks/useManifestationDatabase';
import { useNavigate } from 'react-router-dom';
import { HeroFloatingCircles } from '@/components/HeroFloatingCircles';
import goalsHeroImg from '@/assets/images/Goals-bg.jpg';

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

export default function Goals() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { goals, addGoal, updateGoal, updateGoalProgress, deleteGoal, isMutating } = useManifestationDatabase();
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [addGoalOpen, setAddGoalOpen] = useState(false);
  const [goalToDeleteId, setGoalToDeleteId] = useState<string | null>(null);
  const [budgetEditGoal, setBudgetEditGoal] = useState<ManifestationGoal | null>(null);
  const [editGoal, setEditGoal] = useState<ManifestationGoal | null>(null);

  const selectedGoal = selectedGoalId ? goals.find((g) => g.id === selectedGoalId) : null;

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
      {/* Hero — light green overlay like Progress */}
      <section
        className="relative w-full overflow-hidden"
        style={{ minHeight: '240px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}
      >
        <div className="absolute inset-0">
          <img src={goalsHeroImg} alt="" className="w-full h-full object-cover" />
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
                  Goals–Vision Board
                </h1>
                <p className="mt-3 text-sm sm:text-base max-w-2xl leading-relaxed opacity-90" style={{ color: 'var(--landing-text)' }}>
                  Set timelines, break goals into steps, track progress, and manage budgets. Pause or complete goals anytime—click a goal to see details and schedule steps on your calendar.
                </p>
              </div>
            </div>
            <Button
              onClick={() => setAddGoalOpen(true)}
              className="hero-cta-primary font-semibold rounded-xl shrink-0"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Goal
            </Button>
          </div>
        </div>
      </section>

      <section className="py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          {goals.length === 0 ? (
            <Card className="overflow-hidden shadow-lg rounded-2xl" style={{ borderColor: 'var(--landing-border)', backgroundColor: 'white' }}>
              <CardContent className="p-8 text-center">
                <Target className="h-10 w-10 mx-auto mb-3 opacity-50" style={{ color: 'var(--landing-primary)' }} />
                <p className="font-medium" style={{ color: 'var(--landing-text)' }}>No goals yet</p>
                <p className="text-sm mt-1" style={{ color: 'var(--landing-text)', opacity: 0.7 }}>Add a goal to get started.</p>
                <Button onClick={() => setAddGoalOpen(true)} className="mt-4 rounded-xl" size="sm">Add goal</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {goals.map((goal: ManifestationGoal) => (
                <Card
                  key={goal.id}
                  className="overflow-hidden shadow-lg hover:shadow-xl transition-all cursor-pointer"
                  style={{ borderColor: 'var(--landing-border)', backgroundColor: 'white' }}
                  onClick={() => setSelectedGoalId(goal.id)}
                >
                  {goal.imageUrl && (
                    <div className="w-full h-40 overflow-hidden">
                      <img src={goal.imageUrl} alt={goal.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold" style={{ color: 'var(--landing-text)' }}>{goal.title}</h3>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-2xl font-bold" style={{ color: '#1d4ed8' }}>{goal.progress}/10</span>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-600 hover:text-gray-900 hover:bg-gray-100" onClick={(e) => { e.stopPropagation(); setEditGoal(goal); }} title="Edit goal">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={(e) => { e.stopPropagation(); setGoalToDeleteId(goal.id); }} title="Delete goal">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm mb-3 opacity-90" style={{ color: 'var(--landing-text)' }}>{goal.description}</p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge
                        variant="outline"
                        className="rounded-full border border-sky-300 bg-sky-50 text-xs font-semibold text-sky-700 shadow-sm"
                      >
                        {timelineLabels[goal.timeline] ?? goal.timeline}
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
                      {goal.status === 'paused' && <Badge variant="outline" className="border-amber-500 text-amber-700">Paused</Badge>}
                      {goal.status === 'completed' && <Badge className="bg-green-100 text-green-800 border-0">Completed</Badge>}
                    </div>
                    <div className="flex flex-wrap gap-1 mb-3" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full text-xs min-h-9 border-sky-300 bg-sky-50 text-sky-700 hover:bg-sky-100 hover:text-sky-800"
                        onClick={() => setSelectedGoalId(goal.id)}
                        title="Open goal"
                      >
                        <LogIn className="h-3.5 w-3 mr-1" /> Enter
                      </Button>
                      {(goal.status === 'active' || !goal.status) && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full text-xs min-h-9 border-sky-200 text-sky-700 hover:bg-sky-50 hover:text-sky-800"
                            onClick={() => updateGoal(goal.id, { status: 'paused' })}
                            title="Pause goal"
                          >
                            <Pause className="h-3.5 w-3 mr-1" /> Pause
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full text-xs min-h-9 border-sky-500 bg-sky-500 text-white hover:bg-sky-600 hover:border-sky-600 shadow-sm"
                            onClick={() => updateGoal(goal.id, { status: 'completed', progress: 10 })}
                            title="Mark complete"
                          >
                            <CheckCircle className="h-3.5 w-3 mr-1" /> Complete
                          </Button>
                        </>
                      )}
                      {goal.status === 'paused' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full text-xs min-h-9 border-sky-500 bg-sky-500 text-white hover:bg-sky-600 hover:border-sky-600 shadow-sm"
                          onClick={() => updateGoal(goal.id, { status: 'active' })}
                          title="Resume goal"
                        >
                          <Play className="h-3.5 w-3 mr-1" /> Resume
                        </Button>
                      )}
                    </div>
                    <div className="space-y-2 mb-3" onClick={(e) => e.stopPropagation()}>
                      <p
                        className="text-xs font-semibold tracking-wide"
                        style={{ color: '#1d4ed8' }}
                      >
                        Progress {goal.progress}/10 — update in goal detail
                      </p>
                      <Progress
                        value={goal.progress * 10}
                        variant="success"
                        className="h-2 bg-orange-200/80 dark:bg-orange-900/30"
                      />
                    </div>
                    {(goal.budget != null && goal.budget > 0) && (
                      <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                        <div className="flex flex-wrap items-center gap-4 text-sm" style={{ color: 'var(--landing-text)' }}>
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4" style={{ color: 'var(--landing-primary)' }} />
                            <span><strong>Budget:</strong> {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(goal.budget)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4" style={{ color: 'var(--landing-primary)' }} />
                            <span><strong>Spent:</strong> {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(goal.spent ?? 0)}</span>
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setBudgetEditGoal(goal)} title="Edit budget and spent">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-medium opacity-80" style={{ color: 'var(--landing-text)' }}>
                            Budget progress — {Math.min(100, Math.round(((goal.spent ?? 0) / goal.budget) * 100))}% used
                          </p>
                          <Progress value={Math.min(100, ((goal.spent ?? 0) / goal.budget) * 100)} variant="success" className="h-2" style={{ backgroundColor: 'var(--landing-accent)' }} />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

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
      <EditGoalDialog
        open={!!editGoal}
        onOpenChange={(o) => !o && setEditGoal(null)}
        goal={editGoal}
        onSave={async (id, updates) => {
          await updateGoal(id, updates);
          toast({ title: 'Saved', description: 'Goal updated.' });
          setEditGoal(null);
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
      </div>
    </div>
  );
}
