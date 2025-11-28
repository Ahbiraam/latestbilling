import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreditCard, Building2 } from "lucide-react";

import { DataTable } from "@/components/receipts/data-table";
import { columns } from "@/components/receipts/columns";

import CreateReceiptModal from "@/components/billing/create-receipt-modal";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import { apiFetch } from "@/lib/api";

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState<any[]>([]);
  const [company, setCompany] = useState<any | null>(null);

  const [selectedCompany, setSelectedCompany] = useState<string>("all");
  const [isCreateReceiptModalOpen, setIsCreateReceiptModalOpen] =
    useState(false);

  // ⭐ Load company
  useEffect(() => {
    async function loadCompany() {
      try {
        const res = await apiFetch("/api/v1/api/v1/company");
        const data = await res.json();
        if (res.ok) setCompany(data);
      } catch (err) {
        console.log("Company fetch error", err);
      }
    }
    loadCompany();
  }, []);

  // ⭐ Load receipts from backend
  async function loadReceipts() {
    try {
      const res = await apiFetch("/api/v1/api/v1/receipts");
      const data = await res.json();

      if (res.ok) {
        const list = Array.isArray(data) ? data : data.data || [];

        // ⭐ Normalize receipt values so table never breaks
        const formatted = list.map((r: any) => ({
          id: r.id || r._id,
          companyId: r.companyId || r.company_id || company?.id || "",
          receiptId: r.receiptId || r.receipt_id,
          receiptDate: r.receiptDate || r.date,
          customer: r.customerName || r.customer || "N/A",
          amount: r.amountReceived || r.amount || 0,
          paymentMethod: r.paymentMethod,
          status: r.status || "Completed",
          tdsAmount: r.tdsAmount || 0,
        }));

        setReceipts(formatted);
      }
    } catch (err) {
      console.log("Receipt fetch error", err);
    }
  }

  useEffect(() => {
    loadReceipts();
  }, []);

  // ⭐ After creating receipt → reload from backend
  const handleReceiptCreated = () => {
    loadReceipts();
  };

  // ⭐ Filter receipts by company
  const filteredReceipts = useMemo(() => {
    if (selectedCompany === "all") return receipts;
    return receipts.filter((r) => r.companyId === selectedCompany);
  }, [selectedCompany, receipts]);

  // ⭐ Summary values
  const totalReceipts = filteredReceipts.length;
  const totalAmount = filteredReceipts.reduce(
    (sum, r) => sum + (r.amount || 0),
    0
  );
  const totalTDS = filteredReceipts.reduce(
    (sum, r) => sum + (r.tdsAmount || 0),
    0
  );

  return (
    <div className="container py-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Receipts</h1>
          <p className="text-sm text-muted-foreground">
            Manage all customer receipts and payment records.
          </p>
        </div>
        <Button onClick={() => setIsCreateReceiptModalOpen(true)}>
          <CreditCard className="mr-2 h-4 w-4" />
          Create Receipt
        </Button>
      </div>

      {/* Company Filter */}
      <div className="flex items-center gap-2 mb-4">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <Select onValueChange={setSelectedCompany} value={selectedCompany}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Select Company" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="all">All Companies</SelectItem>
            {company && (
              <SelectItem value={company.id}>{company.name}</SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <p className="text-sm text-blue-700">Total Receipts</p>
            <p className="text-xl font-semibold">{totalReceipts}</p>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <p className="text-sm text-green-700">Total Amount</p>
            <p className="text-xl font-semibold">
              ₹{totalAmount.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <p className="text-sm text-yellow-700">Total TDS Deducted</p>
            <p className="text-xl font-semibold">
              ₹{totalTDS.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Receipts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Receipt Records</CardTitle>
          <CardDescription>
            View, download, or audit receipt details.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <DataTable columns={columns} data={filteredReceipts} />
        </CardContent>
      </Card>

      {/* Create Receipt Modal */}
      <CreateReceiptModal
        open={isCreateReceiptModalOpen}
        onOpenChange={setIsCreateReceiptModalOpen}
        onReceiptCreated={handleReceiptCreated}
        canEdit={true}
      />
    </div>
  );
}
