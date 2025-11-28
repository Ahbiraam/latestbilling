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
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

interface RevenueTrend {
  date: string;
  revenue: number;
  previousYearRevenue: number;
}

export function RevenueChart() {
  const currentYear = new Date().getFullYear();

  const [year, setYear] = useState<number>(currentYear);
  const [months, setMonths] = useState<number>(12);
  const [data, setData] = useState<RevenueTrend[]>([]);
  const [loading, setLoading] = useState(false);

  async function loadRevenue() {
    setLoading(true);

    const url = `/api/v1/dashboard/revenue-trend?year=${year}&months=${months}`;
    console.log("🔵 Fetching Revenue Trend:", url);

    try {
      const res = await apiFetch(url);
      console.log("🟡 Response Status:", res.status);

      const raw = await res.json().catch((err) => {
        console.error("🔴 JSON parse failed:", err);
        return null;
      });

      console.log("🟢 RAW API DATA:", raw);

      if (!Array.isArray(raw)) {
        console.error("❌ ERROR: API did not return an array");
        setData([]);
        setLoading(false);
        return;
      }

      const formatted = raw.map((item: any) => ({
        date: item.month,
        revenue: item.revenue,
        previousYearRevenue: item.previousYearRevenue,
      }));

      console.log("🟣 FORMATTED CHART DATA:", formatted);

      setData(formatted);
    } catch (err) {
      console.error("🔴 Revenue trend fetch failed:", err);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadRevenue();
  }, []);

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Revenue Trend</CardTitle>

        <div className="flex gap-4 mt-4">
          <div className="flex flex-col">
            <label className="text-sm">Year</label>
            <input
              type="number"
              className="border rounded p-2 w-32"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm">Months (1 - 12)</label>
            <input
              type="number"
              className="border rounded p-2 w-32"
              value={months}
              onChange={(e) => setMonths(Number(e.target.value))}
            />
          </div>

          <div className="flex items-end">
            <Button onClick={loadRevenue}>Submit</Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <p>Loading revenue trend...</p>
        ) : (
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
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />

                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--primary))"
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
        )}
      </CardContent>
    </Card>
  );
}
