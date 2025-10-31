import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CreditCard,
  Building2,
  FileText,
  Download,
  Eye,
} from "lucide-react";
import { DataTable } from "@/components/receipts/data-table";
import { columns } from "@/components/receipts/columns";
import { mockReceipts, mockCompanies } from "@/lib/mock-data";
import { CreateReceiptModal } from "@/components/billing/create-receipt-modal";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState(mockReceipts);
  const [selectedCompany, setSelectedCompany] = useState<string>("all");
  const [isCreateReceiptModalOpen, setIsCreateReceiptModalOpen] = useState(false);

  // ✅ Filter receipts company-wise
  const filteredReceipts = useMemo(() => {
    if (selectedCompany === "all") return receipts;
    return receipts.filter((r) => r.companyId === selectedCompany);
  }, [selectedCompany, receipts]);

  // ✅ Add new receipt (simulated)
  const handleReceiptCreated = () => {
    const newReceipt = {
      id: `rct${receipts.length + 1}`,
      companyId:
        selectedCompany === "all" ? mockCompanies[0].id : selectedCompany,
      receiptId: `RCT-${new Date().getFullYear()}-${(receipts.length + 1)
        .toString()
        .padStart(3, "0")}`,
      receiptDate: new Date().toISOString().split("T")[0],
      customer: "New Customer",
      amount: Math.floor(Math.random() * 50000) + 5000,
      paymentMethod: "Bank Transfer",
      status: "Completed",
      tdsAmount: Math.floor(Math.random() * 1000),
    };
    setReceipts([...receipts, newReceipt]);
  };

  // ✅ Quick summary
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
            {mockCompanies.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
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

      {/* Receipt Creation Modal */}
      <CreateReceiptModal
        open={isCreateReceiptModalOpen}
        onOpenChange={setIsCreateReceiptModalOpen}
        onReceiptCreated={handleReceiptCreated}
        canEdit={true} // ✅ Managers can modify receipts (audit trail ready)
      />
    </div>
  );
}
