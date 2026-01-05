import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Eye, Download, FileText } from "lucide-react";
import { DataTable } from "@/components/receipts/data-table";
import { columns } from "@/components/receipts/columns";
import { mockReceipts } from "@/lib/mock-data";
import { CreateReceiptModal } from "@/components/billing/create-receipt-modal";

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState(mockReceipts);
  const [isCreateReceiptModalOpen, setIsCreateReceiptModalOpen] = useState(false);

  const handleReceiptCreated = () => {
    // In a real app, you would fetch the updated list of receipts
    // For now, we'll just simulate adding a new receipt
    const newReceipt = {
      id: `rct${receipts.length + 1}`,
      receiptId: `RCT-2023-00${receipts.length + 1}`,
      receiptDate: new Date().toISOString().split('T')[0],
      customer: "New Customer",
      amount: Math.floor(Math.random() * 50000) + 5000,
      paymentMethod: "Bank Transfer",
      status: "Completed"
    };
    
    setReceipts([...receipts, newReceipt]);
  };

  return (
    <div className="container py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Receipts</h1>
        <Button onClick={() => setIsCreateReceiptModalOpen(true)}>
          <CreditCard className="mr-2 h-4 w-4" />
          Record Payment
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Payment Receipts</CardTitle>
          <CardDescription>
            View and manage all payment receipts from customers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={receipts} />
        </CardContent>
      </Card>

      <CreateReceiptModal
        open={isCreateReceiptModalOpen}
        onOpenChange={setIsCreateReceiptModalOpen}
        onReceiptCreated={handleReceiptCreated}
      />
    </div>
  );
} 