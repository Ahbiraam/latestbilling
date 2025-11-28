import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, ResponsiveContainer, Cell, Tooltip } from "recharts";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

interface CustomerRevenue {
  type: string;
  revenue: number;
}

export function CustomerChart() {
  const [data, setData] = useState<CustomerRevenue[]>([]);
  const [loading, setLoading] = useState(false);

  const COLORS = [
    "hsl(var(--primary))",
    "hsl(var(--secondary))",
    "hsl(var(--accent))",
    "hsl(var(--muted))",
  ];

  // 🔥 Fetch API
  async function loadCustomerRevenue() {
    setLoading(true);

    console.log("🔵 Fetching customer revenue...");

    try {
      const res = await apiFetch(
        "/api/v1/dashboard/customer-revenue?period=all"
      );

      console.log("🟡 Response Status:", res.status);

      const raw = await res.json();
      console.log("🟢 RAW API DATA:", raw);

      if (!Array.isArray(raw)) {
        console.error("❌ Backend did not return an array");
        setData([]);
        setLoading(false);
        return;
      }

      setData(raw);
    } catch (err) {
      console.error("🔴 Customer revenue fetch failed:", err);
    }

    setLoading(false);
  }

  // Load once
  useEffect(() => {
    loadCustomerRevenue();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue by Customer Type</CardTitle>
      </CardHeader>

      <CardContent>
        {loading ? (
          <p>Loading customer revenue...</p>
        ) : (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="revenue"
                  nameKey="type"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {data.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>

                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
