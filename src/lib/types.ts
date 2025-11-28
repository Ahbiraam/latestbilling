export interface FinancialMetrics {
  totalReceivables: number;
  totalRevenue: number;
  averageCollectionPeriod: number;
  pendingInvoices: number;
  totalCreditNotes: number;
}

export interface RevenueTrend {
  date: string;
  revenue: number;
  previousYearRevenue: number;
}

export interface AgingBucket {
  range: string;
  amount: number;
}

export interface CustomerRevenue {
  type: string;
  revenue: number;
}

export interface ServicePerformance {
  name: string;
  revenue: number;
  growth: number;
}

export interface ServiceType {
  id: string;
  code: string;
  name: string;
  description: string;
  taxRate: number;
  isActive: boolean;
}

export interface ClientType {
  id: string;
  code: string;
  name: string;
  description: string;
  paymentTerms: number;
  isActive: boolean;
}

export interface AccountManager {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
}

export interface Customer {
  id: string;
  name: string;
  code: string;
  type: string;
  address: string;
  email: string;
  whatsapp: string;
  phone: string;
  contactPerson: string;
  gstNumber: string;
  panNumber: string;
  paymentTerms: number;
  accountManager: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}