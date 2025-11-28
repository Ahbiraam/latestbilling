// src/lib/dashboard.ts
import { apiFetch } from "@/lib/api";

export interface DashboardMetrics {
  averageCollectionPeriod: number;
  currency: string;
  pendingInvoices: number;
  totalCreditNotes: number;
  totalReceivables: number;
  totalRevenue: number;
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const res = await apiFetch("/api/v1/dashboard/metrics");

  if (!res.ok) {
    throw new Error("Failed to fetch dashboard metrics");
  }

  return res.json();
}
