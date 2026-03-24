import { useState, useCallback } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Leaf, Gift, Flame, X } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { useNavigate } from 'react-router-dom';
import { useTimezone } from '@/contexts/TimezoneContext';

const STORAGE_KEY = 'goals_app_trial_banner_dismissed_date';

function isDismissedToday(todayISO: string): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === todayISO;
  } catch {
    return false;
  }
}

function dismissForToday(todayISO: string) {
  try {
    localStorage.setItem(STORAGE_KEY, todayISO);
  } catch {}
}

export const TrialBanner = () => {
  const { isTrial, trialDaysRemaining, isPremium } = useSubscription();
  const { todayISO } = useTimezone();
  const navigate = useNavigate();
  const [hidden, setHidden] = useState(() => isDismissedToday(todayISO));

  const handleClose = useCallback(() => {
    dismissForToday(todayISO);
    setHidden(true);
  }, [todayISO]);

  const inviteCodeLine = (
    <p className="text-sm mt-2 text-muted-foreground">
      Have an invite code?{' '}
      <a href="/pricing#invite-code" className="font-medium underline hover:no-underline text-zinc-700 dark:text-zinc-300">
        Redeem it here
      </a>
      .
    </p>
  );

  if (hidden) return null;

  // Show welcome message for premium users
  if (isPremium && !isTrial) {
    return (
      <div>
        <Alert className="border-2 border-zinc-400 bg-gradient-to-r from-zinc-100 to-zinc-200 relative pr-12 mb-2">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 text-zinc-700 hover:bg-zinc-200/80 rounded-full"
            onClick={handleClose}
            aria-label="Dismiss for today"
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Leaf className="h-5 w-5 text-zinc-600" />
              <AlertDescription className="text-zinc-900">
                <span className="font-semibold">You're a Lifetime Member!</span>
                {' - '}Enjoy full access to all features, for life.
              </AlertDescription>
            </div>
          </div>
        </Alert>
        {inviteCodeLine}
      </div>
    );
  }

  if (!isTrial || trialDaysRemaining === null) {
    // Show one-time purchase banner for free users
    return (
      <div>
        <Alert className="border-2 border-zinc-400 bg-gradient-to-r from-zinc-100 to-zinc-200 relative pr-12 mb-2">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 text-zinc-700 hover:bg-zinc-200/80 rounded-full"
            onClick={handleClose}
            aria-label="Dismiss for today"
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Gift className="h-5 w-5 text-zinc-600" />
              <AlertDescription className="text-zinc-900">
                <span className="font-semibold">Get lifetime access</span>
                {' - '}One payment of $19. Full access to all features, for life.
              </AlertDescription>
            </div>
            <Button onClick={() => navigate('/pricing')} className="bg-zinc-800 hover:bg-zinc-900 text-white shrink-0">
              <Leaf className="h-4 w-4 mr-2" />
              Get access
            </Button>
          </div>
        </Alert>
        {inviteCodeLine}
      </div>
    );
  }

  const isExpiringSoon = trialDaysRemaining <= 3;

  return (
    <div>
      <Alert className={`border-2 relative pr-12 mb-2 ${isExpiringSoon ? 'border-orange-500 bg-gradient-to-r from-orange-50 to-amber-50' : 'border-zinc-400 bg-gradient-to-r from-zinc-100 to-zinc-200'}`}>
        <Button
          variant="ghost"
          size="icon"
          className={`absolute top-2 right-2 h-8 w-8 rounded-full ${isExpiringSoon ? 'text-orange-700 hover:bg-orange-100' : 'text-zinc-700 hover:bg-zinc-200/80'}`}
          onClick={handleClose}
          aria-label="Dismiss for today"
        >
          <X className="h-4 w-4" />
        </Button>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isExpiringSoon ? (
              <Flame className="h-5 w-5 text-orange-600" />
            ) : (
              <Leaf className="h-5 w-5 text-zinc-600" />
            )}
            <AlertDescription className={isExpiringSoon ? 'text-orange-900' : 'text-zinc-900'}>
              <span className="font-semibold">
                {trialDaysRemaining === 0 ? 'Your free trial expires today!' : 
                 trialDaysRemaining === 1 ? 'Your free trial expires tomorrow!' :
                 `${trialDaysRemaining} days left in your free trial`}
              </span>
              {' - '}Get lifetime access for $19 one time and never lose your progress.
            </AlertDescription>
          </div>
          <Button 
            onClick={() => navigate('/pricing')}
            className={isExpiringSoon ? 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600' : 'bg-zinc-800 hover:bg-zinc-900 text-white'}
          >
            <Leaf className="h-4 w-4 mr-2" />
            Get lifetime access
          </Button>
        </div>
      </Alert>
      {inviteCodeLine}
    </div>
  );
};
