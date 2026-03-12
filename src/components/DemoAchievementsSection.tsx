import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Star } from 'lucide-react';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earned: boolean;
  category: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

const DEMO_ACHIEVEMENTS: Achievement[] = [
  { id: '1', title: 'Goal Setter', description: 'Set your first goal', icon: '🎯', earned: true, category: 'goals', rarity: 'common' },
  { id: '2', title: 'Week Warrior', description: 'Complete all tasks for 7 days', icon: '⚔️', earned: true, category: 'streaks', rarity: 'rare' },
  { id: '3', title: 'Halfway Hero', description: 'Reach 5/10 on any goal', icon: '🌟', earned: true, category: 'progress', rarity: 'common' },
  { id: '4', title: 'Heart of Appreciation', description: 'Write 10 appreciation entries', icon: '🙏', earned: false, category: 'tasks', rarity: 'common' },
  { id: '5', title: 'Marathon Master', description: 'Complete a 90-day goal', icon: '🏆', earned: false, category: 'goals', rarity: 'epic' },
];

const rarityStyles: Record<string, string> = {
  common: 'border-gray-300',
  rare: 'border-blue-300',
  epic: 'border-purple-400',
  legendary: 'border-amber-400',
};

const DemoAchievementsSection: React.FC<{ totalPoints: number }> = ({ totalPoints }) => {
  const earned = DEMO_ACHIEVEMENTS.filter(a => a.earned);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--landing-text)' }}>
          <Trophy className="h-7 w-7" style={{ color: 'var(--landing-primary)' }} />
          Achievements & Rewards
        </h3>
        <div className="flex items-center gap-2">
          <Badge style={{ backgroundColor: 'var(--landing-accent)', color: 'var(--landing-primary)' }}>
            {earned.length}/{DEMO_ACHIEVEMENTS.length} Earned
          </Badge>
          <Badge style={{ backgroundColor: 'var(--landing-primary)', color: 'white' }}>
            <Star className="h-3 w-3 mr-1" />
            {totalPoints} pts
          </Badge>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {DEMO_ACHIEVEMENTS.map(a => (
          <Card
            key={a.id}
            className={`transition-all ${a.earned ? 'opacity-100 shadow-lg' : 'opacity-75'}`}
            style={{
              borderColor: a.earned ? 'var(--landing-primary)' : 'var(--landing-border)',
              backgroundColor: 'white',
              borderWidth: a.earned ? 2 : 1,
            }}
          >
            <CardContent className="p-4 flex items-center gap-4">
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl shrink-0 ${
                  a.earned ? '' : 'grayscale opacity-60'
                }`}
                style={{ backgroundColor: 'var(--landing-accent)' }}
              >
                {a.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className={`font-semibold truncate ${a.earned ? '' : 'opacity-70'}`} style={{ color: 'var(--landing-text)' }}>
                    {a.title}
                  </h4>
                  <Badge variant="outline" className="text-xs shrink-0" style={{ borderColor: 'var(--landing-border)' }}>
                    {a.rarity}
                  </Badge>
                </div>
                <p className="text-sm mt-0.5 opacity-90" style={{ color: 'var(--landing-text)' }}>
                  {a.description}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DemoAchievementsSection;
