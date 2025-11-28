// src/components/billing/edit-invoice-modal.tsx
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { v4 as uuidv4 } from "uuid";

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

import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";

// ------------------ SCHEMAS ------------------
const lineItemSchema = z.object({
  id: z.string().optional(),
  serviceType: z.string().min(1),
  description: z.string().min(1),
  quantity: z.number().min(1),
  rate: z.number().min(0),
  taxRate: z.number().min(0),
});

const invoiceSchema = z.object({
  invoiceNumber: z.string().min(1),
  invoiceDate: z.coerce.date(),
  customerId: z.string().min(1),
  dueDate: z.coerce.date(),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
  lineItems: z.array(lineItemSchema),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

interface EditInvoiceModalProps {
  invoiceId: string | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onUpdated?: () => void;
}

export default function EditInvoiceModal({
  invoiceId,
  open,
  onOpenChange,
  onUpdated,
}: EditInvoiceModalProps) {
  const [loading, setLoading] = useState(false);

  const [customers, setCustomers] = useState<any[]>([]);
  const [serviceTypes, setServiceTypes] = useState<any[]>([]);

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      invoiceNumber: "",
      invoiceDate: new Date(),
      dueDate: new Date(),
      customerId: "",
      referenceNumber: "",
      notes: "",
      lineItems: [
        {
          id: uuidv4(),
          serviceType: "",
          description: "",
          quantity: 1,
          rate: 0,
          taxRate: 0,
        },
      ],
    },
  });

  const ensureLineIds = (lines: any[]) =>
    lines.map((li) => ({ id: li.id ?? uuidv4(), ...li }));

  // ----------------------------------------------------
  // LOAD REQUIRED LISTS
  // ----------------------------------------------------
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const res = await apiFetch(`/api/v1/api/v1/customers`);
        const json = await res.json();
        setCustomers(json.data ?? json);
      } catch {
        toast.error("Failed to load customers");
      }
    };

    const loadServiceTypes = async () => {
      try {
        const res = await apiFetch(`/api/v1/api/v1/service-types`);
        const json = await res.json();
        setServiceTypes(json.data ?? json);
      } catch {
        toast.error("Failed to load service types");
      }
    };

    loadCustomers();
    loadServiceTypes();
  }, []);

  // ----------------------------------------------------
  // LOAD INVOICE DATA WHEN EDITING
  // ----------------------------------------------------
  useEffect(() => {
    if (!open || !invoiceId) return;

    const loadInvoice = async () => {
      setLoading(true);
      try {
        const res = await apiFetch(`/api/v1/api/v1/invoices/${invoiceId}`);
        const json = await res.json();

        const invoice = json.data ?? json;

        form.reset({
          invoiceNumber: invoice.invoiceNumber,
          invoiceDate: new Date(invoice.invoiceDate),
          dueDate: new Date(invoice.dueDate),
          customerId: invoice.customerId,
          referenceNumber: invoice.referenceNumber,
          notes: invoice.notes,
          lineItems: ensureLineIds(invoice.lineItems ?? []),
        });
      } catch {
        toast.error("Failed to load invoice");
      }
      setLoading(false);
    };

    loadInvoice();
  }, [open, invoiceId]);

  // ----------------------------------------------------
  // LINE ITEMS
  // ----------------------------------------------------
  const [lineItems, setLineItems] = useState<any[]>([]);

  useEffect(() => {
    const sub = form.watch((val) => setLineItems(val.lineItems ?? []));
    setLineItems(form.getValues("lineItems") ?? []);
    return () => sub.unsubscribe();
  }, [form]);

  const syncLineItems = (updated: any[]) => {
    setLineItems(updated);
    form.setValue("lineItems", updated, { shouldValidate: true });
  };

  const addLine = () =>
    syncLineItems([
      ...lineItems,
      {
        id: uuidv4(),
        serviceType: "",
        description: "",
        quantity: 1,
        rate: 0,
        taxRate: 0,
      },
    ]);

  const removeLine = (id: string) => {
    if (lineItems.length <= 1)
      return toast.error("At least one line item required");

    syncLineItems(lineItems.filter((li) => li.id !== id));
  };

  const updateLine = (id: string, field: string, value: any) => {
    syncLineItems(
      lineItems.map((li) =>
        li.id === id ? { ...li, [field]: value } : li
      )
    );
  };

  const lineAmount = (li: any) => {
    const base = li.quantity * li.rate;
    const tax = (base * li.taxRate) / 100;
    return base + tax;
  };

  const subtotal = lineItems.reduce(
    (s, li) => s + li.quantity * li.rate,
    0
  );

  const toDateString = (d: any) =>
    new Date(d).toISOString().slice(0, 10);

  const buildPayload = (data: InvoiceFormValues) => ({
    invoiceNumber: data.invoiceNumber,
    invoiceDate: toDateString(data.invoiceDate),
    dueDate: toDateString(data.dueDate),
    customerId: data.customerId,
    referenceNumber: data.referenceNumber,
    notes: data.notes,
    lineItems: data.lineItems.map((li) => ({
      id: li.id,
      serviceType: li.serviceType,
      description: li.description,
      quantity: li.quantity,
      rate: li.rate,
      taxRate: li.taxRate,
    })),
  });

  // ----------------------------------------------------
  // UPDATE INVOICE
  // ----------------------------------------------------
 const onSubmit = async (data: InvoiceFormValues) => {
  if (!invoiceId) return toast.error("No invoice selected");

  const payload = {
    invoiceNumber: data.invoiceNumber,
    invoiceDate: toDateString(data.invoiceDate),
    customerId: data.customerId,
    dueDate: toDateString(data.dueDate),
    referenceNumber: data.referenceNumber,
    notes: data.notes,
    lineItems: data.lineItems.map((li) => ({
      serviceType: li.serviceType,
      description: li.description,
      quantity: Number(li.quantity),
      rate: Number(li.rate),
      taxRate: Number(li.taxRate),
    })),
  };

  setLoading(true);

  try {
    const resp = await apiFetch(`/api/v1/api/v1/invoices/${invoiceId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      toast.error("Update failed: " + (await resp.text()));
      return;
    }

    toast.success("Invoice updated successfully");
    onOpenChange(false);
    onUpdated?.();
  } catch (err) {
    toast.error("Network error");
  } finally {
    setLoading(false);
  }
};


  // ----------------------------------------------------
  // UI
  // ----------------------------------------------------
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Invoice</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

            {/* CUSTOMER */}
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
                        {customers.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
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
                    <Input {...field} />
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

            {/* REFERENCE */}
            <FormField
              control={form.control}
              name="referenceNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reference Number</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* LINE ITEMS */}
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
                    <th></th>
                  </tr>
                </thead>

                <tbody>
                  {lineItems.map((li) => (
                    <tr key={li.id}>
                      <td className="p-2">
                        <Select
                          value={li.serviceType}
                          onValueChange={(v) =>
                            updateLine(li.id, "serviceType", v)
                          }
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {serviceTypes.map((s) => (
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
                            updateLine(
                              li.id,
                              "description",
                              e.target.value
                            )
                          }
                        />
                      </td>

                      <td className="p-2 text-right">
                        <Input
                          className="h-8 text-right"
                          type="number"
                          value={li.quantity}
                          onChange={(e) =>
                            updateLine(
                              li.id,
                              "quantity",
                              Number(e.target.value)
                            )
                          }
                        />
                      </td>

                      <td className="p-2 text-right">
                        <Input
                          className="h-8 text-right"
                          type="number"
                          value={li.rate}
                          onChange={(e) =>
                            updateLine(
                              li.id,
                              "rate",
                              Number(e.target.value)
                            )
                          }
                        />
                      </td>

                      <td className="p-2 text-right">
                        <Input
                          className="h-8 text-right"
                          type="number"
                          value={li.taxRate}
                          onChange={(e) =>
                            updateLine(
                              li.id,
                              "taxRate",
                              Number(e.target.value)
                            )
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
                    <Textarea {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* TOTAL */}
            <div className="text-right text-lg font-bold">
              Total: ₹ {subtotal.toFixed(2)}
            </div>

            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
