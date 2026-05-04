import React, { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { User, CreditCard, Bell } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthenticatedLayout } from '@/components/AuthenticatedLayout';
import SubscriptionManager from '@/components/SubscriptionManager';
import { ReminderPreferences } from '@/components/ReminderPreferences';
import { NotificationManager } from '@/components/NotificationManager';
import { TrialBanner } from '@/components/TrialBanner';
import { supabase } from '@/lib/supabase';

const COMMUNITY_NAME_MIN = 2;
const COMMUNITY_NAME_MAX = 40;

const Settings: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [communityDisplayName, setCommunityDisplayName] = useState('');
  const [profileLoading, setProfileLoading] = useState(true);
  const [savingNickname, setSavingNickname] = useState(false);

  const loadCommunityNickname = useCallback(async () => {
    if (!user?.id) {
      setProfileLoading(false);
      return;
    }
    setProfileLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('community_display_name')
      .eq('id', user.id)
      .maybeSingle();
    if (error && error.code !== 'PGRST116') {
      toast.error('Could not load profile', { description: error.message });
      setProfileLoading(false);
      return;
    }
    setCommunityDisplayName((data?.community_display_name as string | undefined)?.trim() ?? '');
    setProfileLoading(false);
  }, [user?.id]);

  useEffect(() => {
    void loadCommunityNickname();
  }, [loadCommunityNickname]);

  useEffect(() => {
    const state = location.state as { trialExpiredRedirect?: boolean } | null;
    if (state?.trialExpiredRedirect) {
      toast.warning('Your trial has ended', {
        description: 'Subscribe to continue using Dashboard, Goals–Vision Board, Progress, Journals, and Calendar.',
      });
      navigate('/settings', { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  const handleSaveCommunityNickname = async () => {
    if (!user?.id) return;
    const trimmed = communityDisplayName.trim();
    if (trimmed.length > 0 && (trimmed.length < COMMUNITY_NAME_MIN || trimmed.length > COMMUNITY_NAME_MAX)) {
      toast.error(`Nickname must be empty (to clear) or between ${COMMUNITY_NAME_MIN} and ${COMMUNITY_NAME_MAX} characters.`);
      return;
    }
    setSavingNickname(true);
    try {
      const valueToStore = trimmed.length ? trimmed : null;
      const { data: existing, error: readError } = await supabase
        .from('profiles')
        .select('username, timezone')
        .eq('id', user.id)
        .maybeSingle();
      if (readError && readError.code !== 'PGRST116') {
        throw readError;
      }
      const { error } = await supabase.from('profiles').upsert(
        {
          id: user.id,
          username: existing?.username ?? user.email?.split('@')[0] ?? 'user',
          timezone: existing?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
          community_display_name: valueToStore,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' },
      );
      if (error) throw error;
      toast.success(valueToStore ? 'Community nickname saved.' : 'Community nickname cleared.');
      await loadCommunityNickname();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Save failed';
      toast.error(msg);
    } finally {
      setSavingNickname(false);
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
                <CardDescription>Manage your account information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                  <div className="border-t pt-4 space-y-2">
                    <Label htmlFor="community-display-name">Community board nickname</Label>
                    <p className="text-sm text-muted-foreground">
                      This name appears on posts and replies in Community connections. It does not replace your account email or your username used elsewhere.
                    </p>
                    <Input
                      id="community-display-name"
                      maxLength={COMMUNITY_NAME_MAX}
                      placeholder="e.g. SunnyHiker"
                      value={communityDisplayName}
                      onChange={(e) => setCommunityDisplayName(e.target.value)}
                      disabled={profileLoading || savingNickname}
                      autoComplete="nickname"
                    />
                    <p className="text-xs text-muted-foreground">
                      {COMMUNITY_NAME_MIN}–{COMMUNITY_NAME_MAX} characters, or leave blank to show your @username instead.
                    </p>
                    <Button type="button" onClick={() => void handleSaveCommunityNickname()} disabled={profileLoading || savingNickname}>
                      {savingNickname ? 'Saving…' : 'Save nickname'}
                    </Button>
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
