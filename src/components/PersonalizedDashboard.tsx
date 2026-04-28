import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { TrialBanner } from './TrialBanner';


import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { TargetIcon } from './TargetIcon';
import { 
  Target,
  LogOut, 
  User, 
  Settings, 
  TrendingUp, 
  Calendar,
  CreditCard,
  Receipt,
  Trophy,
  Star,
  Sparkles,
  Bell,
  Home,
  Activity,
  Leaf
} from 'lucide-react';




import SubscriptionManager from './SubscriptionManager';
import BillingHistory from './BillingHistory';
import { GoalCard } from './GoalCard';
import HabitTracker from './HabitTracker';
import MoodTracker from './MoodTracker';
import SimpleGoalDialog from './SimpleGoalDialog';
import HabitDialog from './HabitDialog';
import Journal from './Journal';
import ToDoList from './ToDoList';
import { OfflineIndicator } from './OfflineIndicator';
import { PWAInstallPrompt } from './PWAInstallPrompt';
import { DataExport } from './DataExport';
import { NotificationManager } from './NotificationManager';
import { NotificationBadge } from './NotificationBadge';
import { GoalDependencies } from './GoalDependencies';
import { ProgressPhotos } from './ProgressPhotos';
import { VoiceNotes } from './VoiceNotes';
import { AICoachPanel } from './AICoachPanel';
import { AICheckInDialog } from './AICheckInDialog';
import { ReminderPreferences } from './ReminderPreferences';
import { UpcomingReminders } from './UpcomingReminders';
import { FitnessActivityTracker } from './FitnessActivityTracker';




import ProgressHistorySystem from './ProgressHistorySystem';
import { ConstructionMilestones } from './ConstructionMilestones';
import BudgetTracker from './BudgetTracker';
import { ComprehensiveAnalytics } from './ComprehensiveAnalytics';
import { useDatabase } from '@/hooks/useDatabase';
import { useRecommendations } from '@/hooks/useRecommendations';
import GoalTemplates, { GoalTemplateData } from './GoalTemplates';
import CommunityTemplates, { CommunityTemplate } from './CommunityTemplates';
import CommunityFeed from './CommunityFeed';
import CalendarSync from './CalendarSync';




const PersonalizedDashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const { hasFeatureAccess, isPremium, tier } = useSubscription();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedGoalForAI, setSelectedGoalForAI] = useState<any>(null);
  const [showCheckInDialog, setShowCheckInDialog] = useState(false);

  
  // Use database hooks for persistent data
  const { 
    goals, 
    habits, 
    journalEntries, 
    loading: dbLoading, 
    addGoal, 
    updateGoal, 
    addHabit, 
    addJournalEntry,
    refreshData
  } = useDatabase();

  // Get AI recommendations
  const { 
    recommendations, 
    loading: recLoading, 
    dismissRecommendation 
  } = useRecommendations(goals, habits);
  // User stats calculated from actual data
  const safeGoals = Array.isArray(goals) ? goals : [];
  const safeHabits = Array.isArray(habits) ? habits : [];
  
  const userStats = {
    totalGoals: safeGoals.length,
    completedGoals: safeGoals.filter(g => g?.progress === 100).length,
    activeGoals: safeGoals.filter(g => g?.progress < 100).length,
    totalAchievements: 12,
    currentStreak: safeHabits.length > 0 ? Math.max(...safeHabits.map(h => h?.streak || 0), 0) : 0,
    totalPoints: 2450
  };



  const handleGoalAdd = async (goalData: any) => {
    await addGoal({
      title: goalData.title,
      description: goalData.description || '',
      category: goalData.category || 'Personal',
      progress: 0,
      due_date: goalData.dueDate,
      status: 'active'
    });
  };

  const handleTemplateSelect = async (template: GoalTemplateData | CommunityTemplate) => {
    const durationInDays = parseInt(template.duration) * (template.duration.includes('week') ? 7 : 
                                                          template.duration.includes('month') ? 30 : 1);
    await addGoal({
      title: template.title,
      description: template.description,
      category: template.category,
      progress: 0,
      due_date: new Date(Date.now() + durationInDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'active'
    });
    setActiveTab('goals');
  };

  const handleHabitAdd = async (habitData: any) => {
    await addHabit({
      name: habitData.name,
      category: habitData.category || 'General',
      frequency: habitData.frequency || 'daily',
      streak: 0
    });
  };

  const recentAchievements = [
    { id: 1, title: 'First Goal Completed', icon: '🎯', date: '2024-09-20', points: 100 },
    { id: 2, title: 'Week Streak', icon: '🔥', date: '2024-09-18', points: 50 },
    { id: 3, title: 'Early Bird', icon: '🌅', date: '2024-09-15', points: 25 }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-lime-50 to-emerald-50 dark:bg-stone-900">
      {/* Header */}
      <div className="bg-white dark:bg-stone-800 shadow-sm border-b border-green-200 dark:border-stone-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <Leaf className="h-8 w-8 text-green-600" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-lime-500 bg-clip-text text-transparent">Authenticity & Purpose</h1>


              <Button variant="ghost" onClick={() => window.location.href = '/'} className="text-green-700 hover:bg-green-50">
                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>
              <Button variant="ghost" onClick={() => window.location.href = '/settings'} className="text-green-700 hover:bg-green-50">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>

            <div className="flex items-center gap-4">

              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" />
                  <AvatarFallback>{user?.email?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{user?.email?.split('@')[0]}</span>
              </div>
              <Button variant="outline" size="sm" onClick={() => signOut()}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>


      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Trial Banner */}
        <div className="mb-6">
          <TrialBanner />
        </div>

        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.email?.split('@')[0]}!
          </h2>
          <p className="text-gray-600">Here's your progress overview and personalized recommendations.</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Goals</p>
                  <p className="text-2xl font-bold text-gray-900">{userStats.activeGoals}</p>
                </div>
                <Target className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">{userStats.completedGoals}</p>
                </div>
                <Trophy className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Current Streak</p>
                  <p className="text-2xl font-bold text-gray-900">{userStats.currentStreak} days</p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Points</p>
                  <p className="text-2xl font-bold text-gray-900">{userStats.totalPoints}</p>
                </div>
                <Star className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 lg:grid-cols-9 gap-1 h-auto p-1">

            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="goals">Goals–Vision Board</TabsTrigger>
            <TabsTrigger value="aicoach">
              <Sparkles className="h-4 w-4 mr-1" />
              AI Coach
            </TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="habits">Tasks/Habits</TabsTrigger>
            <TabsTrigger value="fitness">
              <Activity className="h-4 w-4 mr-1" />
              Fitness
            </TabsTrigger>
            <TabsTrigger value="todo">To-Do List</TabsTrigger>
            <TabsTrigger value="journal">Journal</TabsTrigger>
            <TabsTrigger value="calendar">
              <Calendar className="h-4 w-4 mr-1" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="reminders">
              <Bell className="h-4 w-4 mr-1" />
              Reminders
            </TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="budget">Budget</TabsTrigger>
            <TabsTrigger value="subscription">
              <CreditCard className="h-4 w-4 mr-1" />
              Billing
            </TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>






          
          <TabsContent value="overview" className="space-y-6">
            {/* Quick Actions */}
            <div className="flex gap-4 mb-6">
              <SimpleGoalDialog
                trigger={
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Target className="h-4 w-4 mr-2" />
                    Add New Goal
                  </Button>
                }
                onGoalAdd={handleGoalAdd}
              />
              <HabitDialog
                trigger={
                  <Button variant="outline">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Add New Habit
                  </Button>
                }
                onHabitAdd={handleHabitAdd}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Goals */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Active Goals</CardTitle>
                      <CardDescription>Your current goals and progress</CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setActiveTab('goals')}>
                      View All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(goals || []).slice(0, 3).map((goal) => (
                    <div key={goal.id} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">{goal.title}</h4>
                        <Badge variant="outline">{goal.category}</Badge>
                      </div>
                      <Progress value={goal.progress} className="h-2" />
                      <div className="flex justify-between text-sm text-gray-600">
                         <span>{goal.progress}% complete</span>
                         <span>Due: {goal.due_date ? new Date(goal.due_date).toLocaleDateString() : 'No due date'}</span>
                      </div>
                    </div>
                  ))}
                  {(!goals || goals.length === 0) && (
                    <div className="text-center py-8 text-gray-500">
                      <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No goals yet. Click "Add New Goal" to get started!</p>
                    </div>
                  )}
                </CardContent>

              </Card>
              {/* Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle>Personalized Recommendations</CardTitle>
                  <CardDescription>Suggestions to help you succeed</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Array.isArray(recommendations) && recommendations.length > 0 ? (
                    recommendations.map((rec) => (
                      <div key={rec.id} className="p-3 border rounded-lg">
                        <h4 className="font-medium text-sm">{rec.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                        <div className="flex gap-2 mt-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={async () => {
                              if (rec.type === 'goal') {
                                await handleGoalAdd({
                                  title: rec.title,
                                  category: 'Health',
                                  dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                                });
                              } else if (rec.type === 'habit') {
                                await handleHabitAdd({
                                  name: rec.title,
                                  category: 'Productivity',
                                  frequency: 'daily'
                                });
                              }
                              dismissRecommendation(rec.id);
                            }}
                          >
                            Apply
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => dismissRecommendation(rec.id)}
                          >
                            Dismiss
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No recommendations available yet</p>
                    </div>
                  )}
                </CardContent>

              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="analytics" className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">Analytics Dashboard</h3>
              <p className="text-sm text-gray-600">Track your progress patterns and optimize your approach</p>
            </div>
            <ComprehensiveAnalytics goals={(goals || []).map(g => ({ ...g, dueDate: g.due_date ?? '', id: Number(g.id) || 0, status: g.status ?? 'active', createdAt: g.created_at }))} />

          </TabsContent>
          
          
          <TabsContent value="goals" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Your Goals</h3>
              <SimpleGoalDialog
                trigger={<Button>Add New Goal</Button>}
                onGoalAdd={handleGoalAdd}
              />
            </div>
            
            {/* Construction Milestones for Build a New Home goal */}
            <ConstructionMilestones />
            
            <div className="grid gap-4">
              {(goals || []).map((goal) => (
                <Card key={goal.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-semibold text-lg">{goal.title}</h4>
                        <Badge variant="outline" className="mt-1">{goal.category}</Badge>
                      </div>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                    <Progress value={goal.progress} className="mb-2" />
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>{goal.progress}% complete</span>
                       <span>Due: {goal.due_date ? new Date(goal.due_date).toLocaleDateString() : 'No due date'}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

          </TabsContent>


          <TabsContent value="aicoach" className="space-y-6">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">AI Goal Coach</h3>
              <p className="text-gray-600">Get personalized insights, strategies, and motivation powered by AI</p>
            </div>

            {(!goals || goals.length === 0) ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Sparkles className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <h4 className="text-lg font-semibold mb-2">No Goals Yet</h4>
                  <p className="text-gray-600 mb-4">Create your first goal to get AI-powered coaching and insights</p>
                  <SimpleGoalDialog
                    trigger={<Button>Create Your First Goal</Button>}
                    onGoalAdd={handleGoalAdd}
                  />
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1">
                  <CardHeader>
                    <CardTitle>Select a Goal</CardTitle>
                    <CardDescription>Choose a goal to analyze</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {(goals || []).map((goal) => (
                      <Button
                        key={goal.id}
                        variant={selectedGoalForAI?.id === goal.id ? 'default' : 'outline'}
                        className="w-full justify-start"
                        onClick={() => setSelectedGoalForAI(goal)}
                      >
                        <Target className="h-4 w-4 mr-2" />
                        {goal.title}
                      </Button>
                    ))}
                  </CardContent>
                </Card>

                <div className="lg:col-span-2">
                  {selectedGoalForAI ? (
                    <>
                      <div className="mb-4 flex gap-2">
                        <Button onClick={() => setShowCheckInDialog(true)}>
                          Quick Check-In
                        </Button>
                      </div>
                      <AICoachPanel 
                        goal={selectedGoalForAI} 
                        onDeadlineUpdate={async (date) => {
                          await updateGoal(selectedGoalForAI.id, { due_date: date });
                          refreshData();

                          refreshData();
                        }}
                      />
                    </>
                  ) : (
                    <Card>
                      <CardContent className="p-12 text-center">
                        <Sparkles className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-gray-600">Select a goal from the list to get AI coaching</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}
          </TabsContent>
          

          <TabsContent value="templates" className="space-y-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Goal Templates</h3>
              <p className="text-sm text-gray-600">Choose from pre-defined templates to quickly create goals</p>
            </div>
            <GoalTemplates onSelectTemplate={handleTemplateSelect} />
          </TabsContent>

          
          <TabsContent value="habits" className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Your Habits</h3>
              <HabitDialog
                trigger={<Button>Add New Habit</Button>}
                onHabitAdd={handleHabitAdd}
              />
            </div>
            <HabitTracker habits={habits} onHabitsUpdate={refreshData} />
          </TabsContent>

          <TabsContent value="fitness" className="space-y-6">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Fitness Activity Tracker</h3>
              <p className="text-gray-600">Track your daily steps, calories burned, and active minutes</p>
            </div>
            <FitnessActivityTracker />
          </TabsContent>

          <TabsContent value="todo" className="space-y-6">
            <ToDoList />
          </TabsContent>


          <TabsContent value="journal" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Journal />
              </div>
              <div>
                <VoiceNotes />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="calendar" className="space-y-6">
            <CalendarSync />
          </TabsContent>

          <TabsContent value="reminders" className="space-y-6">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Reminder Settings</h3>
              <p className="text-gray-600">Manage your notification preferences and upcoming reminders</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ReminderPreferences />
              <UpcomingReminders />
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <ProgressHistorySystem events={[]} goals={goals ?? []} />
          </TabsContent>

          
          <TabsContent value="achievements" className="space-y-6">
            <h3 className="text-lg font-semibold">Your Achievements</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentAchievements.map((achievement) => (
                <Card key={achievement.id}>
                  <CardContent className="p-6 text-center">
                    <div className="text-4xl mb-2">{achievement.icon}</div>
                    <h4 className="font-semibold">{achievement.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Earned on {new Date(achievement.date).toLocaleDateString()}
                    </p>
                    <Badge className="mt-2">+{achievement.points} points</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="budget" className="space-y-6">
            <BudgetTracker />
          </TabsContent>
          
          <TabsContent value="subscription" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SubscriptionManager />
              <BillingHistory />
            </div>
          </TabsContent>
          
          <TabsContent value="profile" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Settings</CardTitle>
                  <CardDescription>Manage your account and preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src="" />
                      <AvatarFallback className="text-lg">
                        {user?.email?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-semibold">{user?.email?.split('@')[0]}</h4>
                      <p className="text-sm text-gray-600">{user?.email}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start">
                      Edit Profile
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      Privacy Settings
                    </Button>
                    <Button variant="destructive" className="w-full justify-start" onClick={() => signOut()}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <div className="space-y-6">
                <NotificationManager />
                <DataExport />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Offline Indicator */}
      <OfflineIndicator />
      
      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
      
      {/* AI Check-In Dialog */}
      {selectedGoalForAI && (
        <AICheckInDialog
          open={showCheckInDialog}
          onOpenChange={setShowCheckInDialog}
          goal={selectedGoalForAI}
          onComplete={(responses) => {
            console.log('Check-in responses:', responses);
          }}
        />
      )}
    </div>


  );
};

export default PersonalizedDashboard;
