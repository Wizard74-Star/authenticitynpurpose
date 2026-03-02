import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, CheckCircle, Clock, AlertCircle, CreditCard, Gift } from "lucide-react";

interface MetricsCardsProps {
  metrics: {
    totalTrials: number;
    activeTrials: number;
    expiredTrials: number;
    convertedTrials: number;
    conversionRate: number;
    avgTimeToConversion: number;
    canceledTrials: number;
    paidSubscribers?: number;
    invitePremium?: number;
  };
}

export function TrialMetricsCards({ metrics }: MetricsCardsProps) {
  const cards = [
    {
      title: "Total Trials Started",
      value: metrics.totalTrials,
      icon: Users,
      color: "text-blue-600"
    },
    {
      title: "Active Trials",
      value: metrics.activeTrials,
      icon: Clock,
      color: "text-green-600"
    },
    {
      title: "Converted to Paid",
      value: metrics.convertedTrials,
      icon: CheckCircle,
      color: "text-emerald-600"
    },
    {
      title: "Paid Subscribers",
      value: metrics.paidSubscribers ?? 0,
      icon: CreditCard,
      color: "text-emerald-700"
    },
    {
      title: "Premium (invite code)",
      value: metrics.invitePremium ?? 0,
      icon: Gift,
      color: "text-violet-600"
    },
    {
      title: "Conversion Rate",
      value: `${metrics.conversionRate}%`,
      icon: TrendingUp,
      color: "text-purple-600"
    },
    {
      title: "Expired Trials",
      value: metrics.expiredTrials,
      icon: AlertCircle,
      color: "text-orange-600"
    },
    {
      title: "Avg. Time to Convert",
      value: `${metrics.avgTimeToConversion} days`,
      icon: Clock,
      color: "text-indigo-600"
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {cards.map((card, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <card.icon className={`h-4 w-4 ${card.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
