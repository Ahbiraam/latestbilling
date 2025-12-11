import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";

export const columns: ColumnDef<any>[] = [
  // ----------------------------------
  // ⭐ FIRST COLUMN → AUTO ROW NUMBER
  // ----------------------------------
  {
    id: "serial",
    header: "No.",
    cell: ({ row }) => row.index + 1,
  },

  // ❌ REMOVED creditNoteNumber COLUMN

  {
    accessorKey: "creditNoteDate",
    header: "Date",
  },
  {
    accessorKey: "customerName",
    header: "Customer",
  },
  {
    accessorKey: "invoiceNumber",
    header: "Invoice Ref",
  },
  {
    accessorKey: "reason",
    header: "Reason",
  },
  {
    accessorKey: "amount",
    header: "Total Credit",
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("amount"));
      const formatted = new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
      }).format(amount);
      return formatted;
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <Badge
          variant={
            status === "Issued"
              ? "secondary"
              : status === "Draft"
              ? "outline"
              : "default"
          }
        >
          {status}
        </Badge>
      );
    },
  },
];
