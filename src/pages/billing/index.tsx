import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, CreditCard } from "lucide-react";
import { DataTable } from "@/components/billing/data-table";
import { columns } from "@/components/billing/columns";
import { mockInvoices } from "@/lib/mock-data";
import { CreateInvoiceModal } from "@/components/billing/create-invoice-modal";
import { CreateReceiptModal } from "@/components/billing/create-receipt-modal";

export default function BillingPage() {
  const [invoices, setInvoices] = useState(mockInvoices);
  const [isCreateInvoiceModalOpen, setIsCreateInvoiceModalOpen] = useState(false);
  const [isCreateReceiptModalOpen, setIsCreateReceiptModalOpen] = useState(false);

  const handleInvoiceCreated = () => {
    // In a real app, you would fetch the updated list of invoices
    // For now, we'll just simulate adding a new invoice
    const newInvoice = {
      id: `inv${invoices.length + 1}`,
      invoiceNumber: `INV-2023-00${invoices.length + 1}`,
      invoiceDate: new Date().toISOString().split('T')[0],
      customer: "New Customer",
      amount: Math.floor(Math.random() * 50000) + 5000,
      status: "Pending",
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };
    
    setInvoices([...invoices, newInvoice]);
  };

  const handleReceiptCreated = () => {
    // In a real app, you would update the invoice statuses
    // For now, we'll just simulate updating a random invoice to "Paid"
    if (invoices.length > 0) {
      const updatedInvoices = [...invoices];
      const randomIndex = Math.floor(Math.random() * updatedInvoices.length);
      updatedInvoices[randomIndex] = {
        ...updatedInvoices[randomIndex],
        status: "Paid"
      };
      setInvoices(updatedInvoices);
    }
  };

  return (
    <div className="container py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setIsCreateReceiptModalOpen(true)}
          >
            <CreditCard className="mr-2 h-4 w-4" />
            Record Payment
          </Button>
          <Button onClick={() => setIsCreateInvoiceModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Invoice
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
          <CardDescription>
            Manage your customer invoices and billing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={invoices} />
        </CardContent>
      </Card>

      <CreateInvoiceModal 
        open={isCreateInvoiceModalOpen}
        onOpenChange={setIsCreateInvoiceModalOpen}
        onInvoiceCreated={handleInvoiceCreated}
      />
      
      <CreateReceiptModal
        open={isCreateReceiptModalOpen}
        onOpenChange={setIsCreateReceiptModalOpen}
        onReceiptCreated={handleReceiptCreated}
      />
    </div>
  );
} 