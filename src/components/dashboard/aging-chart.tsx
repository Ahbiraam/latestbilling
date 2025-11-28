import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

interface AgingBucket {
  range: string;
  amount: number;
  count: number;
}

export function AgingChart() {
  const [data, setData] = useState<AgingBucket[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadAging() {
    setLoading(true);

    try {
      console.log("🔵 Fetching aging analysis...");

      const res = await apiFetch("/api/v1/dashboard/aging-analysis");
      const raw = await res.json();

      console.log("🟢 RAW AGING RESPONSE:", JSON.stringify(raw, null, 2));

      // ❗ Backend returned error object (500), not array
      if (!Array.isArray(raw)) {
        console.error("❌ Aging API did NOT return an array:", raw);
        setData([]);      // avoid crash
        setLoading(false); // 🔥 FIX: stop loading
        return;
      }

      // Format valid data
      const formatted = raw.map((item: any) => ({
        range: item.range,
        amount: item.amount,
        count: item.count,
      }));

      setData(formatted);

    } catch (err) {
      console.error("🔴 Aging API failed:", err);
      setData([]); // keep UI stable
    }

    setLoading(false); // 🔥 ALWAYS stop loading
  }

  useEffect(() => {
    loadAging();
  }, []);

  if (loading) return <p>Loading aging analysis...</p>;

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Receivables Aging</CardTitle>
      </CardHeader>

      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />

              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip />

              <Bar
                dataKey="amount"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
