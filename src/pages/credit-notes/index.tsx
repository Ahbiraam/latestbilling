import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileMinus } from "lucide-react";
import { DataTable } from "@/components/credit-notes/data-table";
import { columns } from "@/components/credit-notes/columns";
import { mockCreditNotes } from "@/lib/mock-data";
import { CreateCreditNoteModal } from "@/components/credit-notes/create-credit-note-modal";
import { ErrorBoundary } from "@/components/ui/error-boundary";

export default function CreditNotesPage() {
  const [creditNotes, setCreditNotes] = useState(mockCreditNotes || []);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleCreditNoteCreated = () => {
    // In a real app, you would fetch the updated list of credit notes
    // For now, we'll just simulate adding a new credit note
    const newCreditNote = {
      id: `cn${creditNotes.length + 1}`,
      creditNoteId: `CN-2023-00${creditNotes.length + 1}`,
      creditNoteDate: new Date().toISOString().split('T')[0],
      customer: "New Customer",
      invoiceReference: `INV-2023-00${Math.floor(Math.random() * 3) + 1}`,
      reason: "Discount",
      amount: Math.floor(Math.random() * 5000) + 1000,
      gstAmount: Math.floor(Math.random() * 900) + 100,
      totalCredit: Math.floor(Math.random() * 6000) + 1000,
      status: "Issued"
    };
    
    setCreditNotes([...creditNotes, newCreditNote]);
  };

  return (
    <ErrorBoundary fallback={<div className="container py-10">Something went wrong loading the Credit Notes page</div>}>
      <div className="container py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Credit Notes</h1>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <FileMinus className="mr-2 h-4 w-4" />
            Issue Credit Note
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Credit Notes</CardTitle>
            <CardDescription>
              Manage refunds, adjustments, and discounts for customer invoices.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable columns={columns} data={creditNotes} />
          </CardContent>
        </Card>

        <CreateCreditNoteModal
          open={isCreateModalOpen}
          onOpenChange={setIsCreateModalOpen}
          onCreditNoteCreated={handleCreditNoteCreated}
        />
      </div>
    </ErrorBoundary>
  );
} 