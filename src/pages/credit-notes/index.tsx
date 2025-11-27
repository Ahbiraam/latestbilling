import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileMinus } from "lucide-react";
import { DataTable } from "@/components/credit-notes/data-table";
import { columns } from "@/components/credit-notes/columns";
import { CreateCreditNoteModal } from "@/components/credit-notes/create-credit-note-modal";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { apiFetch } from "@/lib/api";

export default function CreditNotesPage() {
  const [creditNotes, setCreditNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fetchCreditNotes = async () => {
    try {
      setLoading(true);

      const response = await apiFetch("/api/v1/api/v1/credit-notes", {
        method: "GET",
      });

      setCreditNotes(response?.data || response || []);
    } catch (error) {
      console.error("Failed to load credit notes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCreditNotes();
  }, []);

  const handleCreditNoteCreated = async (createdNote) => {
    if (createdNote) {
      setCreditNotes((prev) => [...prev, createdNote]); // instant UI update
    }
    fetchCreditNotes(); // ensure full refresh
  };

  return (
    <ErrorBoundary
      fallback={<div className="container py-10">Something went wrong loading the Credit Notes page</div>}
    >
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
            {loading ? (
              <div className="py-10 text-center">Loading credit notes...</div>
            ) : (
              <DataTable columns={columns} data={creditNotes} />
            )}
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
