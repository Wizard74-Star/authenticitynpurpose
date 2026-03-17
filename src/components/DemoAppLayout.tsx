import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { GoalCard } from './GoalCard';
import { TaskItem } from './TaskItem';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import AchievementsSection from './AchievementsSection';
import ProgressHistorySystem from './ProgressHistorySystem';
import PricingSection from './PricingSection';
import DemoTestimonials from './DemoTestimonials';
import { GoalInputDialog } from './GoalInputDialog';
import { TaskInputDialog } from './TaskInputDialog';
import { Target, CheckCircle, Trophy, TrendingUp, ArrowLeft, Sparkles, Users, BarChart3 } from 'lucide-react';
import { HeroFloatingCircles } from '@/components/HeroFloatingCircles';


interface DemoAppLayoutProps {
  onBack?: () => void;
}

const DemoAppLayout: React.FC<DemoAppLayoutProps> = ({ onBack }) => {
  const [goals, setGoals] = useState([
    {
      id: '1',
      title: 'Build Your Own Home',
      description: 'Complete construction of custom family home within 12 months',
      progress: 75,
      category: 'personal',
      timeframe: '12 months',
      imageUrl: 'https://d64gsuwffb70l.cloudfront.net/68dab31588d806ca5c085b8d_1759582856408_5daccfe2.webp'
    },
    {
      id: '2', 
      title: 'Get in Shape',
      description: 'Lose 20 pounds and run a 5K',
      progress: 60,
      category: 'health',
      timeframe: '4 months',
      imageUrl: 'https://d64gsuwffb70l.cloudfront.net/68dab31588d806ca5c085b8d_1759582857210_3b046c70.webp'
    },
    {
      id: '3',
      title: 'Start Your Own Business',
      description: 'Launch entrepreneurial venture',
      progress: 85,
      category: 'career',
      timeframe: '6 months',
      imageUrl: 'https://d64gsuwffb70l.cloudfront.net/68dab31588d806ca5c085b8d_1759582857965_f943f4b3.webp'
    },

    {
      id: '4',
      title: 'Deepen Spiritual Practice',
      description: 'Mind, body and soul-Faith, prayer & meditation, fulfill your calling',
      progress: 45,
      category: 'spiritual',
      timeframe: '3 months',
      imageUrl: 'https://d64gsuwffb70l.cloudfront.net/68dab31588d806ca5c085b8d_1759582858737_2de0bd37.webp'
    }
  ]);


  const [tasks, setTasks] = useState([
    { id: '1', title: 'Review construction blueprints', completed: true, priority: 'high' as const, points: 25 },
    { id: '2', title: 'Go for morning jog', completed: true, priority: 'medium' as const, points: 15 },
    { id: '3', title: 'Meditate for 20 minutes', completed: true, priority: 'medium' as const, points: 15 },
    { id: '4', title: 'Complete business plan draft', completed: true, priority: 'high' as const, points: 25 },
    { id: '5', title: 'Meal prep for the week', completed: true, priority: 'low' as const, points: 10 }
  ]);

  const achievements = [
    { id: '1', title: 'Goal Setter', description: 'Set your first goal', icon: '🎯', earned: true, category: 'goals', rarity: 'common' as const, earnedDate: '2024-01-15' },
    { id: '2', title: 'Week Warrior', description: 'Complete all tasks for 7 days straight', icon: '⚔️', earned: true, category: 'streaks', rarity: 'rare' as const, earnedDate: '2024-01-22' },
    { id: '3', title: 'Halfway Hero', description: 'Reach 50% progress on any goal', icon: '🌟', earned: true, category: 'progress', rarity: 'common' as const, earnedDate: '2024-01-25' }
  ];

  const historyEvents = [
    { id: 'e1', goalId: '1', goalTitle: 'Build Your Own Home', type: 'created' as const, timestamp: new Date('2024-01-01'), description: 'Started home construction project', icon: null, color: 'blue' },
    { id: 'e2', goalId: '1', goalTitle: 'Build Your Own Home', type: 'progress' as const, timestamp: new Date('2024-01-15'), description: 'Foundation completed', oldValue: 0, newValue: 25, notes: 'Major milestone!', icon: null, color: 'indigo' }
  ];

  const totalPoints = achievements.filter(a => a.earned).length * 100 + tasks.filter(t => t.completed).reduce((sum, t) => sum + t.points, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Demo Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white py-3 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-sm font-medium flex items-center justify-center gap-2">
            <Sparkles className="h-4 w-4" />
            <span>Interactive Demo! Get your <strong>7 Day Free Trial</strong> - then just $4.99/month</span>
            <Sparkles className="h-4 w-4" />
          </p>
        </div>
      </div>

      {/* Header */}

      <div className="bg-white shadow-sm py-4 px-4 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Button onClick={onBack} variant="ghost" size="sm" className="text-gray-600 hover:text-gray-800">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Target className="h-8 w-8 text-slate-700" />
            <h1 className="text-2xl font-bold text-gray-800">DEPO Goal Tracker - Demo</h1>
          </div>
        </div>
      </div>


      {/* Hero Section */}
      <section className="relative h-80 flex items-center justify-center text-center px-4 overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('https://d64gsuwffb70l.cloudfront.net/68dab31588d806ca5c085b8d_1759372026555_f1de9f1c.webp')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}>
        <HeroFloatingCircles variant="dark" />
        <div className="relative z-10 max-w-4xl mx-auto text-white">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 drop-shadow-lg">
            Experience Goal Achievement
          </h1>
          <p className="text-lg md:text-xl mb-6 drop-shadow-md">
            Try all features below - Add goals, complete tasks, track progress
          </p>
          <div className="flex gap-4 justify-center">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-6 py-3">
              <div className="text-3xl font-bold">{goals.length}</div>
              <div className="text-sm">Active Goals</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-6 py-3">
              <div className="text-3xl font-bold">{tasks.filter(t => t.completed).length}</div>
              <div className="text-sm">Tasks Done</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-6 py-3">
              <div className="text-3xl font-bold">{totalPoints}</div>
              <div className="text-sm">Total Points</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Goals Section */}
          <div>
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                  <Target className="h-8 w-8 text-emerald-600" />
                  Your Goals
                </h2>
                <p className="text-gray-600 mt-1">Track progress and visualize your dreams</p>
              </div>
              <GoalInputDialog onAddGoal={(goalData) => {
                const newGoal = {
                  id: Date.now().toString(),
                  title: goalData.title,
                  description: goalData.description,
                  progress: 0,
                  category: goalData.category,
                  timeframe: goalData.timeframe,
                  imageUrl: 'https://d64gsuwffb70l.cloudfront.net/68c4741a8a8de4d59ea75e59_1758337253949_7c190052.webp'
                };
                setGoals([...goals, newGoal]);
              }}>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  + Add Your Goal
                </Button>
              </GoalInputDialog>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {goals.map(goal => (
                <GoalCard key={goal.id} {...goal} 
                  onProgressUpdate={(progress) => setGoals(goals.map(g => g.id === goal.id ? { ...g, progress } : g))} 
                  onImageUpload={(file) => console.log('Demo: Image uploaded:', file)} 
                />
              ))}
            </div>
          </div>

          {/* Tasks Section */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
                  <CheckCircle className="h-6 w-6 text-teal-600" />
                  Tasks & Habits
                </h3>
                <p className="text-gray-600 text-sm mt-1">Complete daily actions toward your goals</p>
              </div>
              <TaskInputDialog onAddTask={(taskData) => {
                const pointsMap = { low: 5, medium: 15, high: 25 };
                const newTask = {
                  id: Date.now().toString(),
                  title: taskData.title,
                  completed: false,
                  priority: taskData.priority,
                  points: pointsMap[taskData.priority]
                };
                setTasks([...tasks, newTask]);
              }}>
                <Button className="bg-teal-600 hover:bg-teal-700 text-white" size="sm">
                  + Add Task
                </Button>
              </TaskInputDialog>
            </div>
            <div className="space-y-3">
              {tasks.map(task => (
                <TaskItem key={task.id} {...task} 
                  onToggle={(id) => setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t))} 
                  onDelete={(id) => setTasks(tasks.filter(t => t.id !== id))} 
                />
              ))}
            </div>
          </div>

          {/* Achievements */}
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Trophy className="h-6 w-6 text-amber-600" />
              Achievements & Rewards
            </h2>
            <AchievementsSection achievements={achievements} totalPoints={totalPoints} />
          </div>

          {/* Progress History */}
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-blue-600" />
              Progress Timeline
            </h2>
            <ProgressHistorySystem events={historyEvents} goals={goals} />
          </div>

          {/* Analytics */}
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-purple-600" />
              Analytics Dashboard
            </h2>
            <AnalyticsDashboard goals={goals} tasks={tasks} />
          </div>


          {/* Testimonials */}
          <DemoTestimonials />

          {/* Pricing */}
          <PricingSection />

        </div>
      </section>
    </div>
  );
};

export default DemoAppLayout;
