import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ABTestingResultsProps {
  subscriptions?: any[] | null;
}

export function ABTestingResults({ subscriptions }: ABTestingResultsProps) {
  const list = Array.isArray(subscriptions) ? subscriptions : [];
  const totalTrials = list.filter((s) => s?.trial_start != null).length;
  const convertedPaid = list.filter(
    (s) =>
      s?.trial_start != null &&
      s?.status === 'active' &&
      (String(s?.plan_name || '').toLowerCase() !== 'lifetime' || !!s?.stripe_subscription_id)
  ).length;
  const invitePremium = list.filter(
    (s) =>
      s?.status === 'active' &&
      String(s?.plan_name || '').toLowerCase() === 'lifetime'
  ).length;
  const conversionRate =
    totalTrials > 0 ? Math.round((convertedPaid / totalTrials) * 100) : 0;

  const conversionBarData = [{ label: '7-Day Trial', conversionRate: conversionRate }];
  const premiumBarData = [
    { label: 'Paid', count: convertedPaid },
    { label: 'Invite code', count: invitePremium },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>7-Day Trial & Premium</CardTitle>
        <CardDescription>
          This project offers a 7-day trial and premium access (paid or invite code).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="min-h-[260px]">
          <h4 className="text-sm font-medium mb-2">Trial conversion</h4>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={conversionBarData}
              margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
              <Tooltip
                formatter={(value: number) => [`${Number(value)}%`, 'Conversion rate']}
                contentStyle={{ minWidth: 120 }}
              />
              <Bar dataKey="conversionRate" fill="#3b82f6" name="Conversion rate %" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg mt-2">
            <span className="font-medium">7-Day Trial</span>
            <div className="flex gap-6 text-sm">
              <span>{totalTrials} trials</span>
              <span className="font-semibold text-primary">{conversionRate}% conversion to paid</span>
            </div>
          </div>
        </div>
        <div className="min-h-[220px]">
          <h4 className="text-sm font-medium mb-2">Premium access</h4>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart
              data={premiumBarData}
              margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" name="Users" radius={[4, 4, 0, 0]}>
                {premiumBarData.map((_, index) => (
                  <Cell key={index} fill={index === 0 ? '#10b981' : '#8b5cf6'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">Paid subscribers</p>
              <p className="text-lg font-semibold text-emerald-600">{convertedPaid}</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">Premium (invite code)</p>
              <p className="text-lg font-semibold text-violet-600">{invitePremium}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
