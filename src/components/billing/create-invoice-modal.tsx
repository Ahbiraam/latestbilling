// src/components/billing/create-invoice-modal.tsx
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { v4 as uuidv4 } from "uuid";

import {
  Dialog,
  DialogContent,
  DialogDescription,
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

import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Printer } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";

// ------------------ ZOD VALIDATION (updated for service industry UI) ------------------
const lineItemSchema = z.object({
  id: z.string().optional(),
  serviceType: z.string().min(1, "Service is required"),
  description: z.string().min(1, "Description is required"),
  amount: z.number().min(0.01, "Amount is required"),
});

const invoiceSchema = z.object({
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  invoiceDate: z.coerce.date(),
  customerId: z.string().min(1, "Customer is required"),
  dueDate: z.coerce.date(),
  // referenceNumber removed per client request
  lineItems: z.array(lineItemSchema).min(1, "Add at least one line item"),
  notes: z.string().optional(),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

// Props
interface CreateInvoiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvoiceCreated: (id?: string) => void;
}

export default function CreateInvoiceModal({
  open,
  onOpenChange,
  onInvoiceCreated,
}: CreateInvoiceModalProps) {
  const [loading, setLoading] = useState(false);

  // Line items (amount instead of qty/rate)
  const [lineItems, setLineItems] = useState<any[]>([
    { id: uuidv4(), serviceType: "", description: "", amount: 0 },
  ]);

  // Customer list
  const [customers, setCustomers] = useState<any[]>([]);
  const [customersLoading, setCustomersLoading] = useState(false);

  // Service types (only active)
  const [serviceTypes, setServiceTypes] = useState<any[]>([]);
  const [serviceLoading, setServiceLoading] = useState(false);

  // Saved invoice id (used to show print button)
  const [savedInvoiceId, setSavedInvoiceId] = useState<string | null>(null);

  // Global tax rate (calculated on consolidated total)
  const [globalTaxRate, setGlobalTaxRate] = useState<number>(18);

  // ---------------- FETCH CUSTOMERS ----------------
  useEffect(() => {
    const loadCustomers = async () => {
      setCustomersLoading(true);
      try {
        const res = await apiFetch("/api/v1/api/v1/customers");
        const json = await res.json();
        // API returns { data: [...] }
        setCustomers(Array.isArray(json) ? json : json.data || []);
      } catch (err) {
        console.error("Customer API error:", err);
      } finally {
        setCustomersLoading(false);
      }
    };

    loadCustomers();
  }, []);

  // ---------------- FETCH SERVICE TYPES (only active) ----------------
  useEffect(() => {
    const loadServiceTypes = async () => {
      setServiceLoading(true);
      try {
        const res = await apiFetch("/api/v1/api/v1/service-types?isActive=true");
        const json = await res.json();
        setServiceTypes(Array.isArray(json) ? json : json.data || []);
      } catch (err) {
        console.error("Service API error:", err);
      } finally {
        setServiceLoading(false);
      }
    };

    loadServiceTypes();
  }, []);

  // ---------------- FORM SETUP ----------------
  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      invoiceNumber: `INV-${new Date().getFullYear()}-${String(
        Math.floor(Math.random() * 1000)
      ).padStart(3, "0")}`,
      invoiceDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 86400000),
      notes: "",
      customerId: "",
      lineItems,
    },
  });

  // keep RHF and local state in sync
  const syncLineItems = (updated: any[]) => {
    setLineItems(updated);
    form.setValue("lineItems", updated, { shouldValidate: true });
  };

  const addLine = () =>
    syncLineItems([
      ...lineItems,
      { id: uuidv4(), serviceType: "", description: "", amount: 0 },
    ]);

  const removeLine = (id: string) => {
    if (lineItems.length === 1) return toast.error("At least one line item required");
    syncLineItems(lineItems.filter((item) => item.id !== id));
  };

  const updateLine = (id: string, field: string, value: any) => {
    syncLineItems(
      lineItems.map((li) => (li.id === id ? { ...li, [field]: value } : li))
    );
  };

  const lineAmount = (li: any) => {
    return Number(li.amount || 0);
  };

  const subtotal = lineItems.reduce((sum, li) => sum + lineAmount(li), 0);
  const taxTotal = +(subtotal * (globalTaxRate / 100));
  const grandTotal = +(subtotal + taxTotal);

  const toDateString = (d: Date | string) => new Date(d).toISOString().slice(0, 10);

  // Build payload compatible with backend (send quantity=1, rate=amount)
  const buildPayload = (data: InvoiceFormValues) => ({
    invoiceNumber: data.invoiceNumber,
    invoiceDate: toDateString(data.invoiceDate),
    customerId: data.customerId,
    dueDate: toDateString(data.dueDate),
    // referenceNumber intentionally omitted
    notes: data.notes,
    lineItems: lineItems.map((li) => ({
      serviceType: li.serviceType,
      description: li.description,
      // backend expects quantity & rate -> we send quantity 1 and rate as the "amount" entered
      quantity: 1,
      rate: Number(li.amount || 0),
      // send globalTaxRate so backend can compute tax if needed
      taxRate: Number(globalTaxRate || 0),
    })),
  });

  // ---------------- SUBMIT ----------------
  const onSubmit = async (data: InvoiceFormValues) => {
    setLoading(true);

    try {
      const res = await apiFetch("/api/v1/api/v1/invoices", {
        method: "POST",
        body: JSON.stringify(buildPayload(data)),
      });

      if (!res.ok) {
        const msg = await res.text();
        toast.error("Invoice creation failed: " + msg);
        return;
      }

      const created = await res.json();

      if (created?.id) {
        setSavedInvoiceId(created.id);
        localStorage.setItem("last_created_invoice_id", created.id);
      }

      toast.success("Invoice created successfully!");

      onInvoiceCreated(created?.id);

      // keep modal open so user can print or close manually if desired
      // Optionally you can close automatically:
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (!savedInvoiceId) return toast.error("No saved invoice to print");
    // open PDF endpoint in new tab
    const pdfUrl = `/api/v1/api/v1/invoices/${savedInvoiceId}/pdf`;
    window.open(pdfUrl, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Invoice</DialogTitle>
          <DialogDescription>Fill all required fields to continue.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
            {/* CUSTOMER DROPDOWN */}
            <FormField
              control={form.control}
              name="customerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select customer" />
                      </SelectTrigger>

                      <SelectContent>
                        {customersLoading && (
                          <SelectItem disabled value="loading">
                            Loading...
                          </SelectItem>
                        )}

                        {!customersLoading &&
                          customers.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* INVOICE NUMBER */}
            <FormField
              control={form.control}
              name="invoiceNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Invoice Number</FormLabel>
                  <FormControl>
                    <Input {...field} readOnly />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* DATES */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="invoiceDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        value={toDateString(field.value)}
                        onChange={(e) => field.onChange(new Date(e.target.value))}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        value={toDateString(field.value)}
                        onChange={(e) => field.onChange(new Date(e.target.value))}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* REFERENCE NUMBER removed per client request */}

            {/* LINE ITEMS TABLE (Amount-based) */}
            <div className="border rounded">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted">
                    <th className="p-2">Service</th>
                    <th className="p-2">Description</th>
                    <th className="p-2 text-right">Amount</th>
                    <th />
                  </tr>
                </thead>

                <tbody>
                  {lineItems.map((li) => (
                    <tr key={li.id}>
                      <td className="p-2">
                        <Select
                          value={li.serviceType}
                          onValueChange={(value) => updateLine(li.id, "serviceType", value)}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder="Select service" />
                          </SelectTrigger>
                          <SelectContent>
                            {serviceLoading && (
                              <SelectItem disabled value="loading">
                                Loading...
                              </SelectItem>
                            )}

                            {!serviceLoading &&
                              serviceTypes.map((s) => (
                                <SelectItem key={s.id} value={s.id}>
                                  {s.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </td>

                      <td className="p-2">
                        <Input
                          className="h-8"
                          value={li.description}
                          onChange={(e) => updateLine(li.id, "description", e.target.value)}
                        />
                      </td>

                      <td className="p-2 text-right">
                        <Input
                          className="h-8 text-right"
                          type="number"
                          value={li.amount}
                          onChange={(e) => updateLine(li.id, "amount", Number(e.target.value))}
                        />
                      </td>

                      <td className="p-2 text-right">
                        <Button variant="ghost" size="icon" onClick={() => removeLine(li.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <Button type="button" variant="outline" className="m-2" onClick={addLine}>
                <Plus className="h-4 w-4 mr-1" /> Add Item
              </Button>
            </div>

            {/* NOTES */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Invoice notes" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* SUMMARY (subtotal, tax, total). Tax calculated on consolidated total */}
            <div className="flex justify-end items-end gap-6">
              <div className="text-right">
                <div>Subtotal: ₹ {subtotal.toFixed(2)}</div>
                <div className="mt-2 flex items-center gap-2">
                  <label className="text-sm">Tax %</label>
                  <Input
                    className="w-24 h-8 text-right"
                    type="number"
                    value={globalTaxRate}
                    onChange={(e) => setGlobalTaxRate(Number(e.target.value || 0))}
                  />
                </div>
                <div className="mt-2">Tax: ₹ {taxTotal.toFixed(2)}</div>
                <div className="mt-2 font-bold">Total: ₹ {grandTotal.toFixed(2)}</div>
              </div>
            </div>

            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Invoice"}
              </Button>

              {/* Print button shown only after saving invoice */}
              {savedInvoiceId ? (
                <Button variant="secondary" onClick={handlePrint}>
                  <Printer className="h-4 w-4 mr-2" /> Print
                </Button>
              ) : null}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
