import { MetricCard } from "@/components/dashboard/metric-card";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { AgingChart } from "@/components/dashboard/aging-chart";
import { CustomerChart } from "@/components/dashboard/customer-chart";
import {
  DollarSign,
  Users,
  Clock,
  FileText,
  CreditCard,
} from "lucide-react";

// Mock data - Replace with actual API calls
const metrics = {
  totalReceivables: "₹1,234,567",
  totalRevenue: "₹2,345,678",
  averageCollectionPeriod: "45 days",
  pendingInvoices: "123",
  totalCreditNotes: "₹123,456",
};

const revenueTrendData = [
  { date: "Jan", revenue: 4000, previousYearRevenue: 2400 },
  { date: "Feb", revenue: 3000, previousYearRevenue: 1398 },
  { date: "Mar", revenue: 2000, previousYearRevenue: 9800 },
  { date: "Apr", revenue: 2780, previousYearRevenue: 3908 },
  { date: "May", revenue: 1890, previousYearRevenue: 4800 },
  { date: "Jun", revenue: 2390, previousYearRevenue: 3800 },
];

const agingData = [
  { range: "0-30", amount: 4000 },
  { range: "31-60", amount: 3000 },
  { range: "61-90", amount: 2000 },
  { range: "90+", amount: 1000 },
];

const customerData = [
  { type: "Enterprise", revenue: 4000 },
  { type: "SMB", revenue: 3000 },
  { type: "Startup", revenue: 2000 },
  { type: "Individual", revenue: 1000 },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <h1>Dashboard</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Receivables"
          value={metrics.totalReceivables}
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
          trend={{ value: 12, isPositive: true }}
        />
        <MetricCard
          title="Total Revenue"
          value={metrics.totalRevenue}
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
          trend={{ value: 8, isPositive: true }}
        />
        <MetricCard
          title="Average Collection Period"
          value={metrics.averageCollectionPeriod}
          icon={<Clock className="h-4 w-4 text-muted-foreground" />}
          trend={{ value: 5, isPositive: false }}
        />
        <MetricCard
          title="Pending Invoices"
          value={metrics.pendingInvoices}
          icon={<FileText className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <RevenueChart data={revenueTrendData} />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <AgingChart data={agingData} />
        <CustomerChart data={customerData} />
      </div>
    </div>
  );
}