import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { Toaster } from "@/components/ui/sonner";
import DashboardPage from "@/pages/dashboard";
import CompanyPage from "@/pages/company";
import GstPage from "@/pages/gst";
import ServiceTypesPage from "@/pages/service-types";
import CustomersPage from "@/pages/customers";
import CreateCustomerPage from "@/pages/customers/create";
import BillingPage from "@/pages/billing";
import CreateInvoicePage from "@/pages/billing/create";
import ReceiptsPage from "@/pages/receipts";
import CreditNotesPage from "@/pages/credit-notes";

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background">
        <Sidebar />
        <div className="lg:pl-72">
          <Header />
          <Routes>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/company" element={<CompanyPage />} />
            <Route path="/gst" element={<GstPage />} />
            <Route path="/service-types" element={<ServiceTypesPage />} />
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/customers/create" element={<CreateCustomerPage />} />
            <Route path="/billing" element={<BillingPage />} />
            <Route path="/billing/create" element={<CreateInvoicePage />} />
            <Route path="/receipts" element={<ReceiptsPage />} />
            <Route path="/credit-notes" element={<CreditNotesPage />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
        <Toaster />
      </div>
    </BrowserRouter>
  );
}

export default App;