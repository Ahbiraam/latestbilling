import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  SortingState,
  getSortedRowModel,
  ColumnFiltersState,
  getFilteredRowModel,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

import { Download, Edit, Mail, Trash } from "lucide-react";

import EditInvoiceModal from "@/components/billing/edit-invoice-modal";
import SendEmailModal from "@/components/billing/send-email-modal";

interface Invoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  invoiceDate: string;
}

export function DataTable() {
  const [data, setData] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Email modal
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailInvoiceId, setEmailInvoiceId] = useState<string | null>(null);

  // Load invoice list
  const loadInvoices = async () => {
    try {
      const response = await apiFetch("/api/v1/api/v1/invoices");
      const res = await response.json();
      setData(res.data || []);
    } catch (error) {
      console.error("Invoice loading failed:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  // Delete invoice
  const deleteInvoice = async (id: string) => {
    if (!confirm("Are you sure you want to delete this invoice?")) return;
    try {
      await apiFetch(`/api/v1/api/v1/invoices/${id}`, { method: "DELETE" });
      loadInvoices();
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  // Download PDF
  const downloadPdf = async (id: string) => {
    const response = await apiFetch(`/api/v1/api/v1/invoices/${id}/pdf`);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `invoice-${id}.pdf`;
    link.click();
  };

  // Table columns
  const columns: ColumnDef<Invoice>[] = [
    { accessorKey: "invoiceNumber", header: "Invoice No" },
    { accessorKey: "customerName", header: "Customer" },
    {
      accessorKey: "invoiceDate",
      header: "Date",
      cell: ({ row }) =>
        new Date(row.original.invoiceDate).toLocaleDateString(),
    },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => {
        const invoice = row.original;

        return (
          <div className="flex items-center gap-5">

            {/* EDIT */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full hover:bg-blue-100 text-blue-600 border border-blue-200"
              onClick={() => {
                setEditingId(invoice.id);
                setEditOpen(true);
              }}
            >
              <Edit size={18} />
            </Button>

            {/* DELETE */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full hover:bg-red-100 text-red-600 border border-red-200"
              onClick={() => deleteInvoice(invoice.id)}
            >
              <Trash size={18} />
            </Button>

            {/* PDF */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full hover:bg-green-100 text-green-600 border border-green-200"
              onClick={() => downloadPdf(invoice.id)}
            >
              <Download size={18} />
            </Button>

            {/* EMAIL */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full hover:bg-purple-100 text-purple-600 border border-purple-200"
              onClick={() => {
                setEmailInvoiceId(invoice.id);
                setEmailOpen(true);
              }}
            >
              <Mail size={18} />
            </Button>

          </div>
        );
      },
    },
  ];

  // React Table
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: { sorting, columnFilters },
  });

  if (loading)
    return <div className="p-6 text-center text-lg font-medium">Loading invoices…</div>;

  return (
    <div>
      {/* Edit Invoice Modal */}
      <EditInvoiceModal
        open={editOpen}
        invoiceId={editingId}
        onOpenChange={setEditOpen}
        onUpdated={loadInvoices}
      />

      {/* Email Modal */}
      <SendEmailModal
        open={emailOpen}
        invoiceId={emailInvoiceId}
        onOpenChange={setEmailOpen}
      />

      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center md:space-x-4 py-4 space-y-3 md:space-y-0">
        <Input
          placeholder="Search Invoice Number..."
          value={(table.getColumn("invoiceNumber")?.getFilterValue() as string) ?? ""}
          onChange={(e) =>
            table.getColumn("invoiceNumber")?.setFilterValue(e.target.value)
          }
          className="max-w-sm"
        />

        <Input
          placeholder="Search Customer..."
          value={(table.getColumn("customerName")?.getFilterValue() as string) ?? ""}
          onChange={(e) =>
            table.getColumn("customerName")?.setFilterValue(e.target.value)
          }
          className="max-w-sm"
        />

        <Input
          type="date"
          value={(table.getColumn("invoiceDate")?.getFilterValue() as string) ?? ""}
          onChange={(e) =>
            table.getColumn("invoiceDate")?.setFilterValue(e.target.value)
          }
          className="max-w-sm"
        />
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
