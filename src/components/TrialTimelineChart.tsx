import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface TrialTimelineChartProps {
  data: Array<{
    date: string;
    started: number;
    converted: number;
    inviteActivated?: number;
  }>;
}

export function TrialTimelineChart({ data }: TrialTimelineChartProps) {
  const formattedData = data.map((item) => ({
    ...item,
    date: new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Timeline (Last 30 Days)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="started" stroke="#3b82f6" name="Trials Started" strokeWidth={2} />
            <Line type="monotone" dataKey="converted" stroke="#10b981" name="Converted" strokeWidth={2} />
            <Line type="monotone" dataKey="inviteActivated" stroke="#8b5cf6" name="Lifetime (invite)" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
