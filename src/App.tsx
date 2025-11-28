import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { Toaster } from "@/components/ui/sonner";

import DashboardPage from "@/pages/dashboard";
import CompanyPage from "@/pages/company";
import GstPage from "@/pages/gst";
import ServiceTypesPage from "@/pages/service-types";
import CustomersPage from "@/pages/customers";
import CreateCustomerPage from "@/pages/customers/Create";   // ✔ CORRECT
import BillingPage from "@/pages/billing";
import CreateInvoicePage from "@/pages/billing/create";
import ReceiptsPage from "@/pages/receipts";
import CreditNotesPage from "@/pages/credit-notes";
import LoginPage from "@/pages/login";

import { AuthProvider } from "@/context/AuthContext";

function AppLayout() {
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";

  return (
    <div className="min-h-screen bg-background">
      {!isLoginPage && <Sidebar />}
      <div className={!isLoginPage ? "lg:pl-72" : ""}>
        {!isLoginPage && <Header />}

      <Routes>
  {/* PUBLIC */}
  <Route path="/login" element={<LoginPage />} />

  {/* PROTECTED */}
  <Route path="/dashboard" element={<DashboardPage />} />
  <Route path="/company" element={<CompanyPage />} />
  <Route path="/gst" element={<GstPage />} />
  <Route path="/service-types" element={<ServiceTypesPage />} />

  {/* CUSTOMERS */}
  <Route path="/customers" element={<CustomersPage />} />
  <Route path="/customers/create" element={<CreateCustomerPage />} />

  {/* BILLING */}
  <Route path="/billing" element={<BillingPage />} />
  <Route path="/billing/create" element={<CreateInvoicePage />} />

  {/* OTHERS */}
  <Route path="/receipts" element={<ReceiptsPage />} />
  <Route path="/credit-notes" element={<CreditNotesPage />} />

  {/* DEFAULT → LOGIN */}
  <Route path="/" element={<Navigate to="/login" replace />} />
</Routes>
        <Toaster />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </BrowserRouter>
  );
}
