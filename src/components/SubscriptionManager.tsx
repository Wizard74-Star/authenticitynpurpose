import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Calendar, CreditCard, AlertCircle, CheckCircle, Clock, Zap } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import FamilyGroupManager from './FamilyGroupManager';

interface Subscription {
  id: string;
  status: string;
  current_period_end: number;
  current_period_start: number;
  trial_start?: number | null;
  trial_end?: number | null;
  plan: {
    amount: number;
    currency: string;
    interval: string;
    nickname?: string;
  };
}

const SubscriptionManager: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    status,
    isTrial,
    trialDaysRemaining,
    trialDaysUsed,
    subscribedDaysInPeriod,
    periodLengthDays,
    periodEnd,
    periodStart,
  } = useSubscription();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSubscription();
    }
  }, [user]);

  const fetchSubscription = async () => {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user?.id)
        .in('status', ['active', 'trialing'])
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (data) {
        setSubscription({
          id: data.stripe_subscription_id ?? data.id,
          status: data.status,
          current_period_start: data.current_period_start ?? 0,
          current_period_end: data.current_period_end ?? 0,
          trial_start: data.trial_start,
          trial_end: data.trial_end,
          plan: {
            amount: data.plan_amount ?? 0,
            currency: data.plan_currency ?? 'usd',
            interval: data.plan_interval ?? 'month',
            nickname: data.plan_name,
          },
        });
      } else {
        setSubscription(null);
      }
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscription) return;

    setCancelling(true);
    try {
      const { data, error } = await supabase.functions.invoke('stripe-payments', {
        body: { 
          action: 'cancel-subscription',
          subscriptionId: subscription.id
        }
      });

      if (error) throw error;
      
      setSubscription({ ...subscription, status: 'canceled' });
      alert('Subscription cancelled successfully');
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      alert('Failed to cancel subscription. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Subscription
          </CardTitle>
          <CardDescription>You don&apos;t have an active subscription</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            Subscribe to unlock all premium features and start achieving your goals.
          </p>
          <Button onClick={() => window.location.href = '/pricing'}>
            View Plans
          </Button>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount / 100);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Active', variant: 'default' as const, icon: CheckCircle },
      trialing: { label: 'Trial', variant: 'secondary' as const, icon: Clock },
      canceled: { label: 'Canceled', variant: 'secondary' as const, icon: AlertCircle },
      past_due: { label: 'Past Due', variant: 'destructive' as const, icon: AlertCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const isFamilyPlan = subscription.plan.nickname?.includes('Family');
  const showTrialDays = isTrial && (trialDaysRemaining != null || trialDaysUsed != null);
  const showSubscribedDays = status === 'active' && subscribedDaysInPeriod != null && periodLengthDays != null;

  return (
    <div className="w-full space-y-6">
      <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Subscription Details
            </CardTitle>
            <CardDescription>Manage your subscription and billing</CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Status</span>
              {getStatusBadge(subscription.status)}
            </div>

            {(showTrialDays || showSubscribedDays) && (
              <>
                <Separator />
                <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
                  <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Active days
                  </span>
                  {showTrialDays && trialDaysUsed != null && (
                    <>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Trial progress</span>
                          <span className="font-medium">{trialDaysUsed} of 7 days</span>
                        </div>
                        <Progress value={Math.min(100, (trialDaysUsed / 7) * 100)} variant="warning" className="h-2.5" />
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        {trialDaysRemaining != null && (
                          <div>
                            <span className="text-muted-foreground">Trial days left</span>
                            <p className="font-semibold">{trialDaysRemaining} days</p>
                          </div>
                        )}
                        <div>
                          <span className="text-muted-foreground">Trial days used</span>
                          <p className="font-semibold">{trialDaysUsed} days</p>
                        </div>
                      </div>
                    </>
                  )}
                  {showSubscribedDays && subscribedDaysInPeriod != null && periodLengthDays != null && (
                    <>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Period progress</span>
                          <span className="font-medium">{subscribedDaysInPeriod} of {periodLengthDays} days</span>
                        </div>
                        <Progress
                          value={periodLengthDays > 0 ? Math.min(100, (subscribedDaysInPeriod / periodLengthDays) * 100) : 0}
                          variant="default"
                          className="h-2.5"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">Subscribed days this period</span>
                          <p className="font-semibold">{subscribedDaysInPeriod} of {periodLengthDays} days</p>
                        </div>
                        {periodStart != null && periodEnd != null && (
                          <div>
                            <span className="text-muted-foreground">Period</span>
                            <p className="font-medium">
                              {formatDate(periodStart)} – {formatDate(periodEnd)}
                            </p>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </>
            )}

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-600">Plan</span>
                <p className="font-medium">
                  {subscription.plan.amount
                    ? formatAmount(subscription.plan.amount, subscription.plan.currency) + ' / ' + subscription.plan.interval
                    : subscription.plan.nickname ?? 'Premium'}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-600">{isTrial ? 'Trial ends' : 'Next billing'}</span>
                <p className="font-medium flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDate(subscription.current_period_end)}
                </p>
              </div>
            </div>

            <Separator />

            {(() => {
              // Use trial start when current_period_start is missing/zero (common for trial-only subscriptions)
              const periodStart = subscription.current_period_start > 0
                ? subscription.current_period_start
                : (subscription.trial_start ?? 0);
              const periodEnd = subscription.current_period_end ?? 0;
              const hasValidPeriod = periodEnd > 0 && periodStart > 0;
              if (!hasValidPeriod) return null;
              return (
                <div className="flex flex-row items-center justify-between gap-4 flex-wrap">
                  <div className="space-y-2">
                    <span className="text-sm text-gray-600">Billing Period</span>
                    <p className="text-sm">
                      {formatDate(periodStart)} - {formatDate(periodEnd)}
                    </p>
                  </div>
                  {isTrial && (
                    <Button
                      onClick={() => navigate('/pricing')}
                      className="trial-cta text-white rounded-md h-10 px-4 shrink-0"
                    >
                      Update
                    </Button>
                  )}
                </div>
              );
            })()}

            {subscription.status === 'active' && (
              <div className="pt-4">
                <Button
                  variant="outline"
                  onClick={handleCancelSubscription}
                  disabled={cancelling}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  {cancelling ? 'Cancelling...' : 'Cancel Subscription'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

      {isFamilyPlan && <FamilyGroupManager />}
    </div>
  );

};

export default SubscriptionManager;