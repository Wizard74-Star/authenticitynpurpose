import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ManifestationGoal } from '@/hooks/useManifestationDatabase';

export function BudgetSpentEditDialog({
  goal,
  onClose,
  onSave,
}: {
  goal: ManifestationGoal | null;
  onClose: () => void;
  onSave: (budget: number, spent: number) => void | Promise<void>;
}) {
  const [budgetStr, setBudgetStr] = useState('');
  const [spentStr, setSpentStr] = useState('');

  useEffect(() => {
    if (goal) {
      setBudgetStr(String(goal.budget ?? 0));
      setSpentStr(String(goal.spent ?? 0));
    }
  }, [goal]);

  const handleSave = () => {
    const budget = Math.max(0, Math.round(Number(budgetStr) || 0));
    const spent = Math.max(0, Math.round(Number(spentStr) || 0));
    onSave(budget, spent);
  };

  if (!goal) return null;

  return (
    <Dialog open={!!goal} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="rounded-2xl max-w-sm" style={{ borderColor: 'var(--landing-border)' }}>
        <DialogHeader>
          <DialogTitle style={{ color: 'var(--landing-text)' }}>Edit budget</DialogTitle>
        </DialogHeader>
        <p className="text-sm truncate mb-3" style={{ color: 'var(--landing-text)', opacity: 0.8 }}>{goal.title}</p>
        <div className="space-y-4">
          <div>
            <Label style={{ color: 'var(--landing-text)' }}>Budget ($)</Label>
            <Input
              type="number"
              min={0}
              value={budgetStr}
              onChange={(e) => setBudgetStr(e.target.value)}
              className="rounded-xl mt-1.5"
              style={{ borderColor: 'var(--landing-border)' }}
            />
          </div>
          <div>
            <Label style={{ color: 'var(--landing-text)' }}>Spent ($)</Label>
            <Input
              type="number"
              min={0}
              value={spentStr}
              onChange={(e) => setSpentStr(e.target.value)}
              className="rounded-xl mt-1.5"
              style={{ borderColor: 'var(--landing-border)' }}
            />
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <Button variant="outline" onClick={onClose} className="rounded-xl flex-1">Cancel</Button>
          <Button onClick={handleSave} className="rounded-xl flex-1" style={{ backgroundColor: 'var(--landing-primary)', color: 'white' }}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
