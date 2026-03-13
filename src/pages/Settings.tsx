import React, { useEffect, useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useTimezone } from '@/contexts/TimezoneContext';

const TIMEZONES: { value: string; label: string; description: string }[] = [
  { value: 'Pacific/Midway', label: '(GMT-11:00) Midway Island, Samoa', description: 'Pacific / Samoa' },
  { value: 'America/Adak', label: '(GMT-10:00) Hawaii-Aleutian', description: 'USA — Aleutian Islands' },
  { value: 'Pacific/Honolulu', label: '(GMT-10:00) Hawaii', description: 'USA — Hawaii' },
  { value: 'America/Anchorage', label: '(GMT-09:00) Alaska', description: 'USA — Alaska' },
  { value: 'America/Los_Angeles', label: '(GMT-08:00) Pacific Time (US & Canada)', description: 'USA & Canada — Los Angeles, Vancouver' },
  { value: 'America/Denver', label: '(GMT-07:00) Mountain Time (US & Canada)', description: 'USA & Canada — Denver' },
  { value: 'America/Chicago', label: '(GMT-06:00) Central Time (US & Canada)', description: 'USA & Canada — Chicago' },
  { value: 'America/New_York', label: '(GMT-05:00) Eastern Time (US & Canada)', description: 'USA & Canada — New York, Toronto' },
  { value: 'America/Sao_Paulo', label: '(GMT-03:00) São Paulo', description: 'Brazil — São Paulo' },
  { value: 'Europe/London', label: '(GMT+00:00) London', description: 'UK & Ireland — London' },
  { value: 'Europe/Paris', label: '(GMT+01:00) Central Europe', description: 'France, Germany, Spain, Italy' },
  { value: 'Europe/Athens', label: '(GMT+02:00) Eastern Europe', description: 'Greece, Turkey, South Africa' },
  { value: 'Asia/Dubai', label: '(GMT+04:00) Dubai', description: 'United Arab Emirates — Dubai' },
  { value: 'Asia/Kolkata', label: '(GMT+05:30) India Standard Time', description: 'India — Mumbai, Delhi' },
  { value: 'Asia/Bangkok', label: '(GMT+07:00) Bangkok', description: 'Thailand, Vietnam, Cambodia' },
  { value: 'Asia/Shanghai', label: '(GMT+08:00) China Standard Time', description: 'China — Shanghai, Singapore, Hong Kong' },
  { value: 'Asia/Tokyo', label: '(GMT+09:00) Japan Standard Time', description: 'Japan — Tokyo' },
  { value: 'Australia/Sydney', label: '(GMT+10:00) Sydney', description: 'Australia — Sydney, Melbourne' },
  { value: 'Pacific/Auckland', label: '(GMT+12:00) Auckland', description: 'New Zealand — Auckland' },
];

const Settings: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { timezone: detectedTimezone } = useTimezone();

  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [username, setUsername] = useState('');
  const [timezone, setTimezone] = useState('');
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    const state = location.state as { trialExpiredRedirect?: boolean } | null;
    if (state?.trialExpiredRedirect) {
      toast.warning('Your trial has ended', {
        description: 'Subscribe to continue using Dashboard, Goals–Vision Board, Progress, Journals, and Calendar.',
      });
      navigate('/settings', { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  useEffect(() => {
    if (!user) return;
    setProfileLoading(true);
    setProfileError(null);
    setProfileMessage(null);

    supabase
      .from('profiles')
      .select('username, timezone')
      .eq('id', user.id)
      .single()
      .then(({ data, error }) => {
        if (error && error.code !== 'PGRST116') {
          // PGRST116 = row not found
          setProfileError('Could not load profile. You can still update it below.');
        }
        const fallbackName =
          (user.user_metadata as any)?.full_name ||
          user.email?.split('@')[0] ||
          '';
        setUsername(data?.username || fallbackName);
        setTimezone(data?.timezone || detectedTimezone);
      })
      .finally(() => setProfileLoading(false));
  }, [user, detectedTimezone]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setProfileSaving(true);
    setProfileError(null);
    setProfileMessage(null);
    const cleanUsername = username.trim();
    const cleanTimezone = timezone || detectedTimezone;
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert(
          {
            id: user.id,
            username: cleanUsername || null,
            timezone: cleanTimezone,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' },
        );
      if (error) {
        setProfileError(error.message || 'Could not save profile.');
      } else {
        setProfileMessage('Profile updated. Your calendar and “today” will now use this timezone.');
      }
    } catch (err: any) {
      setProfileError(err?.message || 'Could not save profile.');
    } finally {
      setProfileSaving(false);
    }
  };

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
                <CardDescription>Manage your account information and personal timezone</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveProfile} className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Email</Label>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="username">Display name</Label>
                        <Input
                          id="username"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="How you’d like to be addressed"
                          disabled={profileLoading || profileSaving}
                        />
                        <p className="text-xs text-muted-foreground">
                          Shown in your dashboard and emails instead of your raw email.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="timezone">Timezone</Label>
                        <select
                          id="timezone"
                          className="w-full rounded-md border px-3 py-2 text-sm"
                          style={{ borderColor: 'var(--landing-border)' }}
                          value={timezone}
                          onChange={(e) => setTimezone(e.target.value)}
                          disabled={profileLoading || profileSaving}
                        >
                          {timezone === '' && (
                            <option value="">
                              Detecting… ({detectedTimezone})
                            </option>
                          )}
                          {TIMEZONES.map((tz) => (
                            <option key={tz.value} value={tz.value}>
                              {tz.label}
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-muted-foreground">
                          Used for “today”, reminders, and calendar dates. Pick the city that best matches where you are.
                        </p>
                      </div>
                    </div>
                  </div>
                  {profileError && (
                    <p className="text-sm text-red-600">
                      {profileError}
                    </p>
                  )}
                  {profileMessage && (
                    <p className="text-sm text-emerald-700">
                      {profileMessage}
                    </p>
                  )}
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={profileLoading || profileSaving}
                    >
                      {profileSaving ? 'Saving…' : 'Save profile'}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground border-t pt-4">
                    Your profile is stored securely in the database and used across Dashboard, Goals–Vision Board, Progress, Journals, and Calendar.
                  </p>
                </form>
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
