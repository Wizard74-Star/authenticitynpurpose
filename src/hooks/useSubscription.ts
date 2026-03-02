import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export type SubscriptionTier = 'free' | 'premium' | 'family';

interface SubscriptionData {
  tier: SubscriptionTier;
  status: string | null;
  isActive: boolean;
  isPremium: boolean;
  isFamily: boolean;
  isTrial: boolean;
  /** True when status was trialing and trial_end has passed (no paid subscription). */
  trialExpired: boolean;
  trialEnd: number | null;
  trialStart: number | null;
  trialDaysRemaining: number | null;
  trialDaysUsed: number | null;
  periodEnd: number | null;
  periodStart: number | null;
  subscribedDaysInPeriod: number | null;
  periodLengthDays: number | null;
}

export const useSubscription = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionData>({
    tier: 'free',
    status: null,
    isActive: false,
    isPremium: false,
    isFamily: false,
    isTrial: false,
    trialExpired: false,
    trialEnd: null,
    trialStart: null,
    trialDaysRemaining: null,
    trialDaysUsed: null,
    periodEnd: null,
    periodStart: null,
    subscribedDaysInPeriod: null,
    periodLengthDays: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSubscription();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchSubscription = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['active', 'trialing'])
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (data) {
        const isFamily = data.plan_name?.toLowerCase().includes('family') || false;
        const isTrial = data.status === 'trialing';
        const now = Date.now() / 1000;
        const trialEndSec = data.trial_end ?? 0;
        const trialExpired = isTrial && trialEndSec > 0 && now >= trialEndSec;
        const isPremium = (data.status === 'active' || (isTrial && !trialExpired));

        // Correct trial dates if trial was started after account creation (legacy bug)
        const TRIAL_DAYS = 7;
        const accountCreatedAt = user.created_at
          ? Math.floor(new Date(user.created_at).getTime() / 1000)
          : null;
        if (
          isTrial &&
          accountCreatedAt != null &&
          data.trial_start != null &&
          data.trial_end != null &&
          data.trial_start > accountCreatedAt + 3600
        ) {
          const correctTrialStart = accountCreatedAt;
          const correctTrialEnd = correctTrialStart + TRIAL_DAYS * 86400;
          await supabase
            .from('subscriptions')
            .update({
              trial_start: correctTrialStart,
              trial_end: correctTrialEnd,
              current_period_end: correctTrialEnd,
            })
            .eq('user_id', user.id);
          data.trial_start = correctTrialStart;
          data.trial_end = correctTrialEnd;
          data.current_period_end = correctTrialEnd;
        }

        const TRIAL_DAYS_CAP = 7;
        let trialDaysRemaining: number | null = null;
        let trialDaysUsed: number | null = null;
        if (data.trial_start != null && data.trial_end != null) {
          const trialStartSec = data.trial_start;
          const trialEndSec = data.trial_end;
          const trialTotalDays = Math.min(TRIAL_DAYS_CAP, Math.ceil((trialEndSec - trialStartSec) / 86400));
          if (now < trialEndSec) {
            trialDaysRemaining = Math.ceil((trialEndSec - now) / 86400);
            if (trialDaysRemaining < 0) trialDaysRemaining = 0;
            trialDaysUsed = Math.floor((now - trialStartSec) / 86400);
            if (trialDaysUsed < 0) trialDaysUsed = 0;
            if (trialDaysUsed > TRIAL_DAYS_CAP) trialDaysUsed = TRIAL_DAYS_CAP;
          } else {
            trialDaysRemaining = 0;
            trialDaysUsed = trialTotalDays;
          }
        }

        let subscribedDaysInPeriod: number | null = null;
        let periodLengthDays: number | null = null;
        if (data.current_period_start != null && data.current_period_end != null) {
          const start = data.current_period_start;
          const end = data.current_period_end;
          const rawPeriodDays = Math.ceil((end - start) / 86400);
          periodLengthDays = isTrial ? Math.min(TRIAL_DAYS_CAP, rawPeriodDays) : rawPeriodDays;
          subscribedDaysInPeriod = Math.floor((now - start) / 86400) + 1;
          if (subscribedDaysInPeriod < 1) subscribedDaysInPeriod = 1;
          if (subscribedDaysInPeriod > periodLengthDays) subscribedDaysInPeriod = periodLengthDays;
        }

        setSubscription({
          tier: isFamily ? 'family' : isPremium ? 'premium' : 'free',
          status: data.status,
          isActive: isPremium,
          isPremium,
          isFamily,
          isTrial,
          trialExpired,
          trialEnd: data.trial_end,
          trialStart: data.trial_start,
          trialDaysRemaining,
          trialDaysUsed,
          periodEnd: data.current_period_end,
          periodStart: data.current_period_start,
          subscribedDaysInPeriod,
          periodLengthDays,
        });
      } else {
        // No active/trialing subscription: ensure new users get a free trial (no Stripe required)
        const { data: anyRow } = await supabase
          .from('subscriptions')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!anyRow) {
          // New user — start 7-day trial from account creation (no credit card)
          const TRIAL_DAYS = 7;
          const accountCreatedAt = user.created_at
            ? Math.floor(new Date(user.created_at).getTime() / 1000)
            : Math.floor(Date.now() / 1000);
          const trialStart = accountCreatedAt;
          const trialEnd = trialStart + TRIAL_DAYS * 86400;
          await supabase.from('subscriptions').insert({
            user_id: user.id,
            status: 'trialing',
            plan_name: 'Premium Plan Trial',
            trial_start: trialStart,
            trial_end: trialEnd,
            current_period_end: trialEnd,
          });
          // Refetch so UI shows trial
          const { data: newData } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', user.id)
            .single();
          if (newData) {
            const isTrial = newData.status === 'trialing';
            const trialEndTs = newData.trial_end;
            let trialDaysRemaining = null;
            if (trialEndTs) {
              const diffTime = trialEndTs * 1000 - Date.now();
              trialDaysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              if (trialDaysRemaining < 0) trialDaysRemaining = 0;
            }
            const periodStart = newData.current_period_start ?? null;
            const periodEnd = newData.current_period_end ?? null;
            let subscribedDaysInPeriod: number | null = null;
            let periodLengthDays: number | null = null;
            if (periodStart != null && periodEnd != null) {
              const now = Date.now() / 1000;
              const rawPeriodDays = Math.ceil((periodEnd - periodStart) / 86400);
              periodLengthDays = Math.min(7, rawPeriodDays);
              subscribedDaysInPeriod = Math.floor((now - periodStart) / 86400) + 1;
              if (subscribedDaysInPeriod < 1) subscribedDaysInPeriod = 1;
              if (subscribedDaysInPeriod > periodLengthDays) subscribedDaysInPeriod = periodLengthDays;
            }
            setSubscription({
              tier: 'premium',
              status: newData.status,
              isActive: true,
              isPremium: true,
              isFamily: false,
              isTrial,
              trialExpired: false,
              trialEnd: trialEndTs,
              trialStart: newData.trial_start ?? null,
              trialDaysRemaining,
              trialDaysUsed: newData.trial_start != null && trialEndTs != null ? Math.min(7, Math.floor((trialEndTs - newData.trial_start) / 86400)) : null,
              periodEnd,
              periodStart,
              subscribedDaysInPeriod,
              periodLengthDays,
            });
          }
        } else {
          setSubscription({
            tier: 'free',
            status: null,
            isActive: false,
            isPremium: false,
            isFamily: false,
            isTrial: false,
            trialExpired: false,
            trialEnd: null,
            trialStart: null,
            trialDaysRemaining: null,
            trialDaysUsed: null,
            periodEnd: null,
            periodStart: null,
            subscribedDaysInPeriod: null,
            periodLengthDays: null,
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasFeatureAccess = (feature: 'ai-coach' | 'advanced-analytics' | 'family-groups' | 'collaboration'): boolean => {
    switch (feature) {
      case 'ai-coach':
      case 'advanced-analytics':
        return subscription.isPremium || subscription.isFamily;
      case 'family-groups':
        return subscription.isFamily;
      case 'collaboration':
        return subscription.isPremium || subscription.isFamily;
      default:
        return true;
    }
  };

  return {
    ...subscription,
    loading,
    hasFeatureAccess,
    refresh: fetchSubscription,
  };
};

