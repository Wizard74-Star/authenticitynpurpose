import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, CreditCard, Bell } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthenticatedLayout } from '@/components/AuthenticatedLayout';
import SubscriptionManager from '@/components/SubscriptionManager';
import { ReminderPreferences } from '@/components/ReminderPreferences';
import { NotificationManager } from '@/components/NotificationManager';
import { TrialBanner } from '@/components/TrialBanner';

const Settings: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const state = location.state as { trialExpiredRedirect?: boolean } | null;
    if (state?.trialExpiredRedirect) {
      toast.warning('Your trial has ended', {
        description: 'Subscribe to continue using Dashboard, Goals, Progress, Journals, and Calendar.',
      });
      navigate('/settings', { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  if (!user) {
    return (
      <AuthenticatedLayout>
        <div className="min-h-screen landing flex items-center justify-center" style={{ backgroundColor: 'var(--landing-bg)' }}>
          <Card className="max-w-md mx-4" style={{ borderColor: 'var(--landing-border)' }}>
            <CardHeader>
              <CardTitle style={{ color: 'var(--landing-text)' }}>Access Denied</CardTitle>
              <CardDescription>Please log in to view settings</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="min-h-screen landing" style={{ backgroundColor: 'var(--landing-bg)', color: 'var(--landing-text)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold mb-6" style={{ color: 'var(--landing-primary)' }}>Settings</h1>

        <div className="mb-6">
          <TrialBanner />
        </div>


        <Tabs defaultValue="subscription" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">
              <User className="h-4 w-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="subscription">
              <CreditCard className="h-4 w-4 mr-2" />
              Subscription
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>Manage your account information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                  <p className="text-sm text-muted-foreground border-t pt-4">
                    Your information syncs across your computer, tablet, and phone.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscription">
            <SubscriptionManager />
          </TabsContent>

          <TabsContent value="notifications">
            <div className="space-y-6">
              <NotificationManager />
              <ReminderPreferences />
            </div>
          </TabsContent>
        </Tabs>
        </div>
      </div>
    </AuthenticatedLayout>
  );
};

export default Settings;
