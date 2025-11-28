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

// ------------------ ZOD VALIDATION ------------------
const lineItemSchema = z.object({
  id: z.string().optional(),
  serviceType: z.string().min(1, "Service is required"),
  description: z.string().min(1, "Description is required"),
  quantity: z.number().min(1, "Quantity must be > 0"),
  rate: z.number().min(0, "Rate is required"),
  taxRate: z.number().min(0, "Tax rate is required"),
});

const invoiceSchema = z.object({
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  invoiceDate: z.coerce.date(),
  customerId: z.string().min(1, "Customer is required"),
  dueDate: z.coerce.date(),
  referenceNumber: z.string().min(1, "Reference number is required"),
  lineItems: z.array(lineItemSchema).min(1, "Add at least one line item"),
  notes: z.string().min(1, "Notes are required"),
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

  // Line items
  const [lineItems, setLineItems] = useState([
    { id: uuidv4(), serviceType: "", description: "", quantity: 1, rate: 0, taxRate: 0 },
  ]);

  // Customer list
  const [customers, setCustomers] = useState<any[]>([]);
  const [customersLoading, setCustomersLoading] = useState(false);

  // Service types
  const [serviceTypes, setServiceTypes] = useState<any[]>([]);
  const [serviceLoading, setServiceLoading] = useState(false);

  // ---------------- FETCH CUSTOMERS ----------------
  useEffect(() => {
    const loadCustomers = async () => {
      setCustomersLoading(true);
      try {
        const res = await apiFetch("/api/v1/api/v1/customers");
        const json = await res.json();
        setCustomers(Array.isArray(json) ? json : json.data || []);
      } catch (err) {
        console.error("Customer API error:", err);
      } finally {
        setCustomersLoading(false);
      }
    };

    loadCustomers();
  }, []);

  // ---------------- FETCH SERVICE TYPES ----------------
  useEffect(() => {
    const loadServiceTypes = async () => {
      setServiceLoading(true);
      try {
        const res = await apiFetch("/api/v1/api/v1/service-types");
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
      referenceNumber: "",
      notes: "",
      customerId: "",
      lineItems,
    },
  });

  const syncLineItems = (updated: any[]) => {
    setLineItems(updated);
    form.setValue("lineItems", updated, { shouldValidate: true });
  };

  const addLine = () =>
    syncLineItems([
      ...lineItems,
      { id: uuidv4(), serviceType: "", description: "", quantity: 1, rate: 0, taxRate: 0 },
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
    const base = li.quantity * li.rate;
    const tax = (base * li.taxRate) / 100;
    return base + tax;
  };

  const subtotal = lineItems.reduce((sum, li) => sum + li.quantity * li.rate, 0);

  const toDateString = (d: Date | string) =>
    new Date(d).toISOString().slice(0, 10);

  const buildPayload = (data: InvoiceFormValues) => ({
    invoiceNumber: data.invoiceNumber,
    invoiceDate: toDateString(data.invoiceDate),
    customerId: data.customerId,
    dueDate: toDateString(data.dueDate),
    referenceNumber: data.referenceNumber,
    notes: data.notes,
    lineItems: lineItems.map((li) => ({
      serviceType: li.serviceType,
      description: li.description,
      quantity: Number(li.quantity),
      rate: Number(li.rate),
      taxRate: Number(li.taxRate),
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

      // Read created invoice JSON
      const created = await res.json();

      // -------------------------------------------------------
      // ✅ STORE CREATED INVOICE ID IN LOCAL STORAGE
      // -------------------------------------------------------
      if (created?.id) {
        localStorage.setItem("last_created_invoice_id", created.id);
        console.log("Invoice created ID:", created.id);
      }

      toast.success("Invoice created successfully!");

      // Send ID to parent
      onInvoiceCreated(created?.id);

      onOpenChange(false);
    } catch (err) {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------

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
                        onChange={(e) =>
                          field.onChange(new Date(e.target.value))
                        }
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
                        onChange={(e) =>
                          field.onChange(new Date(e.target.value))
                        }
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* REFERENCE NUMBER */}
            <FormField
              control={form.control}
              name="referenceNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reference Number</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Reference number" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* LINE ITEMS TABLE */}
            <div className="border rounded">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted">
                    <th className="p-2">Service</th>
                    <th className="p-2">Description</th>
                    <th className="p-2 text-right">Qty</th>
                    <th className="p-2 text-right">Rate</th>
                    <th className="p-2 text-right">Tax %</th>
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
                          onValueChange={(value) =>
                            updateLine(li.id, "serviceType", value)
                          }
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
                          onChange={(e) =>
                            updateLine(li.id, "description", e.target.value)
                          }
                        />
                      </td>

                      <td className="p-2 text-right">
                        <Input
                          className="h-8 text-right"
                          type="number"
                          value={li.quantity}
                          onChange={(e) =>
                            updateLine(li.id, "quantity", Number(e.target.value))
                          }
                        />
                      </td>

                      <td className="p-2 text-right">
                        <Input
                          className="h-8 text-right"
                          type="number"
                          value={li.rate}
                          onChange={(e) =>
                            updateLine(li.id, "rate", Number(e.target.value))
                          }
                        />
                      </td>

                      <td className="p-2 text-right">
                        <Input
                          className="h-8 text-right"
                          type="number"
                          value={li.taxRate}
                          onChange={(e) =>
                            updateLine(li.id, "taxRate", Number(e.target.value))
                          }
                        />
                      </td>

                      <td className="p-2 text-right">
                        ₹ {lineAmount(li).toFixed(2)}
                      </td>

                      <td className="p-2 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeLine(li.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <Button
                type="button"
                variant="outline"
                className="m-2"
                onClick={addLine}
              >
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

            {/* TOTAL */}
            <div className="text-right text-lg font-bold">
              Total: ₹ {subtotal.toFixed(2)}
            </div>

            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Invoice"}
              </Button>

              <Button
                variant="secondary"
                onClick={() => window.print()}
              >
                <Printer className="h-4 w-4 mr-2" /> Print
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
