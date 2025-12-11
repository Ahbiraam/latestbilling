import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
} from "@/components/ui/form";

import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

import { toast } from "sonner";
import { apiFetch } from "@/lib/api";

/* ----------------------- VALIDATION ----------------------- */

const creditNoteSchema = z.object({
  creditNoteId: z.string().min(1),
  creditNoteDate: z.date(),
  customerId: z.string().min(1),
  invoiceId: z.string().min(1),
  reason: z.string().min(1),
  amount: z.number().min(0),
  gstRate: z.number().min(0),
  notes: z.string().optional(),
});

type CreditNoteFormValues = z.infer<typeof creditNoteSchema>;

/* ----------------------- AUTO ID ----------------------- */

function generateCreditNoteId() {
  const year = new Date().getFullYear();
  const rn = String(Math.floor(Math.random() * 1000)).padStart(3, "0");
  return `CN-${year}-${rn}`;
}

/* -------------------------------------------------------- */
/*                     MAIN COMPONENT                       */
/* -------------------------------------------------------- */

export function CreateCreditNoteModal({
  open,
  onOpenChange,
  onCreditNoteCreated,
}) {
  const [customers, setCustomers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const form = useForm<CreditNoteFormValues>({
    resolver: zodResolver(creditNoteSchema),
    defaultValues: {
      creditNoteId: generateCreditNoteId(),
      creditNoteDate: new Date(),
      customerId: "",
      invoiceId: "",
      reason: "",
      amount: 0,
      gstRate: 0,
      notes: "",
    },
  });

  /* ----------------------- LOAD CUSTOMERS ----------------------- */

  useEffect(() => {
    if (!open) return;

    async function loadCustomers() {
      try {
        const res = await apiFetch("/api/v1/api/v1/customers");
        const data = await res.json();
        setCustomers(data?.data || data?.root || []);
      } catch {
        toast.error("Failed to load customers");
      }
    }

    loadCustomers();
  }, [open]);

  /* ----------------------- LOAD INVOICES ----------------------- */

  const handleCustomerChange = async (customerId: string) => {
    form.setValue("customerId", customerId);
    form.setValue("invoiceId", "");

    setInvoices([]);
    setSelectedInvoice(null);

    try {
      const res = await apiFetch(
        `/api/v1/api/v1/invoices?customerId=${customerId}`
      );
      const json = await res.json();
      setInvoices(json?.data || json?.root || []);
    } catch {
      toast.error("Failed to load invoices");
    }
  };

  /* ----------------------- INVOICE SELECT ----------------------- */

  const handleInvoiceChange = (invoiceId: string) => {
    form.setValue("invoiceId", invoiceId);

    const invoice = invoices.find((i) => i.id === invoiceId);
    setSelectedInvoice(invoice);

    if (invoice) {
      const gst = invoice.lineItems?.[0]?.taxRate ?? 0;
      form.setValue("gstRate", Number(gst));
    }
  };

  /* ----------------------- SUBMIT ----------------------- */

  const onSubmit = async (formData: CreditNoteFormValues) => {
    try {
      const gstAmount = (formData.amount * formData.gstRate) / 100;
      const totalCredit = formData.amount + gstAmount;

      const payload = {
        creditNoteId: formData.creditNoteId,
        creditNoteDate: formData.creditNoteDate.toISOString().split("T")[0],
        customerId: formData.customerId,
        invoiceId: formData.invoiceId,
        reason: formData.reason,
        amount: formData.amount,
        gstRate: formData.gstRate,
        gstAmount,
        totalCredit,
        notes: formData.notes || "",
        status: "Issued",
      };

      const res = await apiFetch("/api/v1/api/v1/credit-notes", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      /* ---------------- SUCCESS CHECK ---------------- */
      if (res.ok) {
        toast.success("Credit Note Created Successfully!");

        console.log("✔ SUCCESS: Credit Note Created", json.data);

        onCreditNoteCreated(json.data);
        onOpenChange(false);
        return;
      }

      /* ---------------- FAILURE ---------------- */
      toast.error(json?.detail || "Create failed");

    } catch (err) {
      toast.error("Unexpected error");
      console.error("Create Error:", err);
    }
  };

  /* ----------------------- UI ----------------------- */

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6 rounded-xl shadow-lg">

        <DialogHeader>
          <DialogTitle>Create Credit Note</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

            {/* CREDIT NOTE ID */}
            <FormField
              control={form.control}
              name="creditNoteId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Credit Note ID</FormLabel>
                  <FormControl>
                    <Input {...field} readOnly />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* DATE */}
            <FormField
              control={form.control}
              name="creditNoteDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-between">
                        {format(field.value, "PPP")}
                        <CalendarIcon className="h-4 w-4 opacity-60" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent>
                      <Calendar selected={field.value} onSelect={field.onChange} />
                    </PopoverContent>
                  </Popover>
                </FormItem>
              )}
            />

            {/* CUSTOMER SELECT */}
            <FormField
              control={form.control}
              name="customerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer</FormLabel>
                  <Select
                    onValueChange={(v) => {
                      field.onChange(v);
                      handleCustomerChange(v);
                    }}
                    value={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            {/* INVOICE SELECT */}
            <FormField
              control={form.control}
              name="invoiceId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Invoice</FormLabel>

                  <Select
                    onValueChange={(v) => {
                      field.onChange(v);
                      handleInvoiceChange(v);
                    }}
                    value={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select invoice" />
                    </SelectTrigger>
                    <SelectContent>
                      {invoices.map((inv) => (
                        <SelectItem key={inv.id} value={inv.id}>
                          {inv.invoiceNumber}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {selectedInvoice && (
                    <div className="text-sm text-muted-foreground mt-1">
                      Invoice Total: <strong>{selectedInvoice.total}</strong>
                    </div>
                  )}
                </FormItem>
              )}
            />

            {/* REASON */}
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Reason for credit note" />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* AMOUNT */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      value={field.value}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* GST RATE */}
            <FormField
              control={form.control}
              name="gstRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>GST Rate (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      value={field.value}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* AUTO CALCULATIONS */}
            <div className="text-sm space-y-1">
              <div>
                GST Amount:{" "}
                <strong>
                  {(form.watch("amount") * form.watch("gstRate")) / 100}
                </strong>
              </div>
              <div>
                Total Credit:{" "}
                <strong>
                  {form.watch("amount") +
                    (form.watch("amount") * form.watch("gstRate")) / 100}
                </strong>
              </div>
            </div>

            {/* NOTES */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea {...field} className="min-h-[80px]" />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Create</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default CreateCreditNoteModal;
