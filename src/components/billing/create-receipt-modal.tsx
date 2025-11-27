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
  FormMessage,
} from "@/components/ui/form";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { apiFetch } from "@/lib/api";

// -----------------------------------------------------------------------------
// VALIDATION (Relaxed but correct for backend)
// -----------------------------------------------------------------------------
const receiptSchema = z.object({
  receiptId: z.string(),
  receiptDate: z.date(),
  customerId: z.string(),
  paymentMethod: z.string(),
  amountReceived: z.number(),
  notes: z.string().optional(),
  allocations: z.array(
    z.object({
      invoiceId: z.string(),
      amountAllocated: z.number(),
    })
  ),
});

type ReceiptFormValues = z.infer<typeof receiptSchema>;

export default function CreateReceiptModal({
  open,
  onOpenChange,
  onReceiptCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onReceiptCreated?: () => void;
}) {
  const [customers, setCustomers] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [selectedInvoices, setSelectedInvoices] = useState<Record<string, boolean>>({});
  const [allocations, setAllocations] = useState<Record<string, number>>({});
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [creating, setCreating] = useState(false);

  const form = useForm<ReceiptFormValues>({
    resolver: zodResolver(receiptSchema),
    defaultValues: {
      receiptId: "",
      receiptDate: new Date(),
      paymentMethod: "cash",
      amountReceived: 0,
      notes: "",
      allocations: [],
    },
  });

  // ---------------------------------------------------------------------------
  // LOAD Customrs + Invoices (with normalization)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const loadMeta = async () => {
      try {
        const cRes = await apiFetch("/api/v1/api/v1/customers");
        const iRes = await apiFetch("/api/v1/api/v1/invoices");

        const cJson = await cRes.json();
        const iJson = await iRes.json();

        // Customers
        setCustomers(Array.isArray(cJson) ? cJson : cJson.data || []);

        // Normalize invoices so UI NEVER breaks
        const rawInvoices = Array.isArray(iJson) ? iJson : iJson.data || [];

        const formatted = rawInvoices.map((inv: any) => ({
          id: inv.id || inv._id || inv.invoiceId || "",
          customerId:
            inv.customerId || inv.customer || inv.client || "",
          invoiceNumber:
            inv.invoiceNumber ||
            inv.invoiceNo ||
            inv.no ||
            inv.number ||
            "N/A",
          totalAmount:
            inv.totalAmount || inv.amount || inv.total || 0,
        }));

        setInvoices(formatted);

        // Generate receipt ID
        form.setValue(
          "receiptId",
          `RCT-${Date.now().toString().slice(-6)}`
        );
      } catch (err) {
        toast.error("Failed to load data");
      } finally {
        setLoadingMeta(false);
      }
    };

    if (open) loadMeta();
  }, [open]);

  // ---------------------------------------------------------------------------
  // FILTER INVOICES BY CUSTOMER
  // ---------------------------------------------------------------------------
  const customerId = form.watch("customerId");
  const filteredInvoices = invoices.filter(
    (inv) => inv.customerId === customerId
  );

  // ---------------------------------------------------------------------------
  // ALLOCATION value update
  // ---------------------------------------------------------------------------
  const updateAllocation = (id: string, value: number) => {
    setAllocations((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  // ---------------------------------------------------------------------------
  // SUBMIT (Final working logic)
  // ---------------------------------------------------------------------------
  const onSubmit = async (data: ReceiptFormValues) => {
  setCreating(true);

  const selected = Object.keys(selectedInvoices).filter(
    (id) => selectedInvoices[id]
  );

  if (selected.length === 0) {
    toast.error("Please select at least one invoice for allocation");
    setCreating(false);
    return;
  }

  const allocationArray = selected.map((id) => ({
    invoiceId: id,
    amountAllocated: allocations[id] >= 0.01 ? allocations[id] : 0.01,
  }));

  const payload = {
    receiptId: data.receiptId,
    receiptDate: data.receiptDate.toISOString().split("T")[0], // FIXED
    customerId: data.customerId,
    paymentMethod: data.paymentMethod,
    amountReceived: data.amountReceived,
    notes: data.notes || "",
    allocations: allocationArray,
  };

  try {
    const res = await apiFetch("/api/v1/api/v1/receipts", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const json = await res.json();

    if (!res.ok) {
      toast.error(json.message || "Failed to create receipt");
      return;
    }

    toast.success("Receipt created successfully!");
    onReceiptCreated?.();
    onOpenChange(false);
    form.reset();
    setSelectedInvoices({});
    setAllocations({});
  } catch (err) {
    toast.error("Network error");
  } finally {
    setCreating(false);
  }
};

  // ---------------------------------------------------------------------------
  // UI
  // ---------------------------------------------------------------------------
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Receipt</DialogTitle>
        </DialogHeader>

        {loadingMeta ? (
          <div className="p-4 text-center">Loading...</div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* CUSTOMER */}
              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer</FormLabel>
                    <Select onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select customer" />
                        </SelectTrigger>
                      </FormControl>

                      <SelectContent>
                        {customers.map((c: any) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* RECEIPT ID + DATE */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormItem>
                  <FormLabel>Receipt No</FormLabel>
                  <Input disabled {...form.register("receiptId")} />
                </FormItem>

                <FormField
                  control={form.control}
                  name="receiptDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Receipt Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button variant="outline" className="w-full justify-start">
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? format(field.value, "PPP") : "Select date"}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>

                        <PopoverContent className="w-auto p-0" align="start">
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
              </div>

              {/* INVOICE LIST */}
              {filteredInvoices.length > 0 && (
                <Card>
                  <CardContent>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b font-medium">
                          <th></th>
                          <th>Invoice No</th>
                          <th>Amount</th>
                          <th>Allocate</th>
                        </tr>
                      </thead>

                      <tbody>
                        {filteredInvoices.map((inv) => (
                          <tr key={inv.id} className="border-t">
                            <td className="text-center">
                              <Checkbox
                                checked={!!selectedInvoices[inv.id]}
                                onCheckedChange={() =>
                                  setSelectedInvoices((prev) => ({
                                    ...prev,
                                    [inv.id]: !prev[inv.id],
                                  }))
                                }
                              />
                            </td>

                            <td>{inv.invoiceNumber}</td>
                            <td>₹{inv.totalAmount}</td>

                            <td>
                              <Input
                                disabled={!selectedInvoices[inv.id]}
                                type="number"
                                step="0.01"
                                min="0.01"
                                className="w-24"
                                value={allocations[inv.id] || ""}
                                onChange={(e) =>
                                  updateAllocation(
                                    inv.id,
                                    parseFloat(e.target.value) || 0.01
                                  )
                                }
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              )}

              {/* PAYMENT */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Mode</FormLabel>
                      <Select
                        defaultValue="cash"
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select payment mode" />
                          </SelectTrigger>
                        </FormControl>

                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                          <SelectItem value="upi">UPI</SelectItem>
                          <SelectItem value="cheque">Cheque</SelectItem>
                          <SelectItem value="card">Card</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="amountReceived"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount Received</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Optional note" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {/* SUBMIT BUTTONS */}
              <DialogFooter>
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>

                <Button type="submit" disabled={creating}>
                  {creating ? "Creating..." : "Create Receipt"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
