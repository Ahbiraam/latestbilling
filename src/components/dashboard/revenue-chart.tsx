import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useState } from "react";
import type { RevenueTrend } from "@/lib/types";

interface RevenueChartProps {
  data: RevenueTrend[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  const [timeframe, setTimeframe] = useState<"monthly" | "quarterly">("monthly");

  return (
    <Card className="col-span-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Revenue Trend</CardTitle>
        <div className="flex gap-2">
          <Button
            variant={timeframe === "monthly" ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeframe("monthly")}
          >
            Monthly
          </Button>
          <Button
            variant={timeframe === "quarterly" ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeframe("quarterly")}
          >
            Quarterly
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date"
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={{ stroke: 'hsl(var(--border))' }}
                tick={{ fill: 'hsl(var(--foreground))' }}
              />
              <YAxis
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={{ stroke: 'hsl(var(--border))' }}
                tick={{ fill: 'hsl(var(--foreground))' }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="hsl(var(--primary))"
                fillOpacity={1}
                fill="url(#revenue)"
              />
              <Area
                type="monotone"
                dataKey="previousYearRevenue"
                stroke="hsl(var(--muted-foreground))"
                fillOpacity={0.3}
                fill="hsl(var(--muted))"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}