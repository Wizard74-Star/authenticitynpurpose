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
import { Slider } from '@/components/ui/slider';
import { useManifestationDatabase } from '@/hooks/useManifestationDatabase';
import { useToast } from '@/hooks/use-toast';
import GoalDetailView from '@/components/GoalDetailView';
import { AddGoalDialog } from '@/components/AddGoalDialog';
import { BudgetSpentEditDialog } from '@/components/BudgetSpentEditDialog';
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogAction } from '@/components/ui/alert-dialog';
import type { ManifestationGoal } from '@/hooks/useManifestationDatabase';

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
  const { toast } = useToast();
  const { goals, addGoal, updateGoal, updateGoalProgress, deleteGoal, isMutating } = useManifestationDatabase();
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [addGoalOpen, setAddGoalOpen] = useState(false);
  const [goalToDeleteId, setGoalToDeleteId] = useState<string | null>(null);
  const [budgetEditGoal, setBudgetEditGoal] = useState<ManifestationGoal | null>(null);

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
      <section className="py-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Target className="h-8 w-8" style={{ color: 'var(--landing-primary)' }} />
              <h1 className="text-3xl font-bold" style={{ color: 'var(--landing-text)' }}>All Goals</h1>
            </div>
            <Button className="hero-cta-primary rounded-xl" onClick={() => setAddGoalOpen(true)}>
              <Plus className="h-5 w-5 mr-2" />
              Add Goal
            </Button>
          </div>

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
                        <span className="text-2xl font-bold" style={{ color: 'var(--landing-primary)' }}>{goal.progress}/10</span>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={(e) => { e.stopPropagation(); setGoalToDeleteId(goal.id); }} title="Delete goal">
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
                    <div className="flex flex-wrap gap-1 mb-3" onClick={(e) => e.stopPropagation()}>
                      <Button variant="outline" size="sm" className="rounded-lg text-xs" onClick={() => setSelectedGoalId(goal.id)} title="Open goal">
                        <LogIn className="h-3.5 w-3 mr-1" /> Enter
                      </Button>
                      {(goal.status === 'active' || !goal.status) && (
                        <>
                          <Button variant="outline" size="sm" className="rounded-lg text-xs" onClick={() => updateGoal(goal.id, { status: 'paused' })} title="Pause goal">
                            <Pause className="h-3.5 w-3 mr-1" /> Pause
                          </Button>
                          <Button variant="outline" size="sm" className="rounded-lg text-xs" onClick={() => updateGoal(goal.id, { status: 'completed', progress: 10 })} title="Mark complete">
                            <CheckCircle className="h-3.5 w-3 mr-1" /> Complete
                          </Button>
                        </>
                      )}
                      {goal.status === 'paused' && (
                        <Button variant="outline" size="sm" className="rounded-lg text-xs" onClick={() => updateGoal(goal.id, { status: 'active' })} title="Resume goal">
                          <Play className="h-3.5 w-3 mr-1" /> Resume
                        </Button>
                      )}
                    </div>
                    {(goal.budget != null && goal.budget > 0) && (
                      <div className="flex flex-wrap items-center gap-4 mb-3 text-sm" style={{ color: 'var(--landing-text)' }} onClick={(e) => e.stopPropagation()}>
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
