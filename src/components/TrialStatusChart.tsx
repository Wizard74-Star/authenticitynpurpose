import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface TrialStatusChartProps {
  metrics: {
    activeTrials: number;
    convertedTrials: number;
    expiredTrials: number;
    canceledTrials: number;
    paidSubscribers?: number;
    invitePremium?: number;
  };
}

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#059669", "#8b5cf6"];

export function TrialStatusChart({ metrics }: TrialStatusChartProps) {
  const data = [
    { name: "Active Trial", value: metrics.activeTrials },
    { name: "Expired Trial", value: metrics.expiredTrials },
    { name: "Canceled", value: metrics.canceledTrials },
    { name: "Paid Subscribers", value: metrics.paidSubscribers ?? 0 },
    { name: "Invite Premium", value: metrics.invitePremium ?? 0 },
  ].filter((item) => item.value > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription Status Distribution (All)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
