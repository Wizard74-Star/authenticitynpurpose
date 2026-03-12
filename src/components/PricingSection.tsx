import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Check, Loader2, Leaf, Gift } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthModal } from '@/components/auth/AuthModal';
import { useSubscription } from '@/hooks/useSubscription';

const PricingSection: React.FC = () => {
  const { user } = useAuth();
  const { refresh: refreshSubscription } = useSubscription();
  const [loading, setLoading] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [redeemError, setRedeemError] = useState<string | null>(null);
  const [redeemSuccess, setRedeemSuccess] = useState(false);

  const priceId = import.meta.env.VITE_STRIPE_PRICE_ID;

  const handleOneTimePurchase = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(
          res.ok
            ? 'Invalid response from server.'
            : 'Checkout is not available. Run the app with API support (npm run dev:api) when testing locally.'
        );
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      const message =
        error instanceof Error && error.message.includes('Checkout is not available')
          ? 'Checkout is not available. Run the app with API support (npm run dev:api) when testing locally.'
          : error instanceof Error
            ? error.message
            : 'Failed to start checkout. Please try again.';
      console.error('Checkout error:', error);
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeemCode = async () => {
    if (!user || !inviteCode.trim()) return;
    setRedeemError(null);
    setRedeemSuccess(false);
    setRedeemLoading(true);
    try {
      const res = await fetch('/api/redeem-invite-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: inviteCode.trim(), userId: user.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setRedeemError((data?.error as string) || 'Failed to redeem code');
        return;
      }
      setRedeemSuccess(true);
      setInviteCode('');
      refreshSubscription?.();
    } finally {
      setRedeemLoading(false);
    }
  };

  const features = [
    'All goal timelines (30 days - 5 years)',
    '0-10 progress tracking scale',
    'Vision board with photo uploads',
    'To-do list with rewards',
    'Appreciation journal',
    'Life journal with photos',
    'Smart recommendations',
    'Email support',
  ];

  return (
    <section className="py-16 px-4 sm:px-6 bg-gradient-to-br from-green-50 via-lime-50 to-emerald-50">
      <div className="max-w-6xl mx-auto">
        <section id="invite-code" className="max-w-md mx-auto mb-10 scroll-mt-24">
          <Card className="border border-green-200 bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Gift className="h-5 w-5 text-green-600" />
                Redeem invite code
              </CardTitle>
              <CardDescription>Influencer or partner code? Enter it here for lifetime access.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {!user ? (
                <AuthModal
                  trigger={<Button variant="outline" className="w-full bg-green-50 border-green-200 text-green-800 hover:bg-green-100">Sign in to redeem your code</Button>}
                  defaultMode="login"
                />
              ) : redeemSuccess ? (
                <p className="text-sm font-medium text-green-700">Lifetime membership activated. You&apos;re all set!</p>
              ) : (
                <>
                  <Input
                    placeholder="Enter code"
                    value={inviteCode}
                    onChange={(e) => { setInviteCode(e.target.value); setRedeemError(null); }}
                    className="uppercase"
                  />
                  {redeemError && <p className="text-sm text-red-600">{redeemError}</p>}
                  <Button
                    onClick={handleRedeemCode}
                    disabled={redeemLoading || !inviteCode.trim()}
                    className="w-full"
                    variant="secondary"
                  >
                    {redeemLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Redeem code
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </section>

        <p className="text-center text-sm text-gray-500 mb-6">
          Have an invite code?{' '}
          <a href="/#invite-code" className="text-green-600 font-medium hover:underline">
            Redeem it here
          </a>
          .{' '}
          <a href="/invite-codes" className="text-green-600 font-medium hover:underline">
            Access invite codes
          </a>
          .
        </p>

        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">One-time purchase</h2>
          <p className="text-lg text-gray-600">
            Pay once. Lifetime access.
          </p>
        </div>

        <div className="max-w-md mx-auto">
          <Card className="border-2 border-green-600 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-xl">Lifetime access</CardTitle>
              <CardDescription>
                One payment. Full access to all features, for life.
              </CardDescription>
              <div className="mt-3">
                <span className="text-4xl font-bold text-green-700">$19</span>
                <span className="text-gray-600 text-sm"> one time</span>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              <ul className="space-y-2 text-sm text-gray-600">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="h-5 w-5 mt-0.5 flex-shrink-0 text-green-500" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              {user ? (
                <Button
                  onClick={handleOneTimePurchase}
                  disabled={loading || !priceId}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Leaf className="h-4 w-4 mr-2" />}
                  Get lifetime access — $19
                </Button>
              ) : (
                <AuthModal
                  trigger={
                    <Button className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white">
                      <Leaf className="h-4 w-4 mr-2" />
                      Get lifetime access — $19
                    </Button>
                  }
                  defaultMode="signup"
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
