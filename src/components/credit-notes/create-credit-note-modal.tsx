import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const BASE_URL = "https://rms-billing-backend.onrender.com";

/* ----------------------- VALIDATION ----------------------- */

const creditNoteSchema = z.object({
  creditNoteId: z.string().min(1),
  creditNoteDate: z.date(),
  customerId: z.string().min(1),
  invoiceId: z.string().min(1), // internal ID
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

export function CreateCreditNoteModal({
  open,
  onOpenChange,
  onCreditNoteCreated,
}) {
  const [customers, setCustomers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const token = localStorage.getItem("token");

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
    async function loadCustomers() {
      try {
        const res = await fetch(`${BASE_URL}/api/v1/api/v1/customers`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        setCustomers(data?.data || []);
      } catch (err) {
        toast.error("Failed to load customers");
      }
    }
    loadCustomers();
  }, []);

  /* ----------------------- LOAD INVOICES AFTER CUSTOMER SELECT ----------------------- */

  const handleCustomerChange = async (customerId: string) => {
    form.setValue("customerId", customerId);
    form.setValue("invoiceId", "");
    setInvoices([]);
    setSelectedInvoice(null);

    try {
      const res = await fetch(
        `${BASE_URL}/api/v1/api/v1/invoices?customerId=${customerId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const json = await res.json();
      setInvoices(json?.data || []);
    } catch (err) {
      toast.error("Failed to load invoices");
    }
  };

  /* ----------------------- WHEN INVOICE SELECTED ----------------------- */

  const handleInvoiceChange = (invoiceId: string) => {
    form.setValue("invoiceId", invoiceId);

    const invoice = invoices.find((i) => i.id === invoiceId); // internal ID
    setSelectedInvoice(invoice);

    if (invoice) {
      const gst = invoice.lineItems?.[0]?.taxRate ?? 0;
      form.setValue("gstRate", Number(gst));
    }
  };

  /* ----------------------- FINAL SUBMIT ----------------------- */

  const onSubmit = async (formData: CreditNoteFormValues) => {
    try {
      const gstAmount = (formData.amount * formData.gstRate) / 100;
      const totalCredit = formData.amount + gstAmount;

      const payload = {
        creditNoteId: formData.creditNoteId,
        creditNoteDate: formData.creditNoteDate.toISOString().split("T")[0],
        customerId: formData.customerId,
        invoiceId: formData.invoiceId, // INTERNAL ID (confirmed)
        reason: formData.reason,
        amount: formData.amount,
        gstRate: formData.gstRate,
        gstAmount,
        totalCredit,
        notes: formData.notes || "",
        status: "Issued",
      };

      const res = await fetch(`${BASE_URL}/api/v1/api/v1/credit-notes`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const responseData = await res.json();

      if (!res.ok) {
        toast.error(responseData?.detail || "Failed to create credit note");
        return;
      }

      toast.success("Credit Note created successfully");

      onCreditNoteCreated(responseData.data);
      onOpenChange(false);
    } catch (err) {
      toast.error("Create failed");
      console.error("Create Error:", err);
    }
  };

  /* ----------------------- UI ----------------------- */

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6 rounded-xl shadow-xl">
        <DialogHeader>
          <DialogTitle>Create Credit Note</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 pb-10">

            {/* Credit Note ID */}
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

            {/* Date */}
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
                        <CalendarIcon className="h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent>
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                      />
                    </PopoverContent>
                  </Popover>
                </FormItem>
              )}
            />

            {/* Customer */}
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

            {/* Invoice */}
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
                      Invoice Total:{" "}
                      <strong>{selectedInvoice.total}</strong>
                    </div>
                  )}
                </FormItem>
              )}
            />

            {/* Reason */}
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter reason" />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Amount */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      value={field.value}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* GST Rate */}
            <FormField
              control={form.control}
              name="gstRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>GST Rate (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      value={field.value}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Auto Calculations */}
            <div className="text-sm space-y-1">
              <div>
                GST Amount:{" "}
                <strong>
                  {(form.watch("amount") * form.watch("gstRate")) / 100 || 0}
                </strong>
              </div>
              <div>
                Total Credit:{" "}
                <strong>
                  {form.watch("amount") +
                    (form.watch("amount") * form.watch("gstRate")) / 100 || 0}
                </strong>
              </div>
            </div>

            {/* Notes */}
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
