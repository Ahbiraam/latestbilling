"use client";

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

/* =======================
   VALIDATION
======================= */
const lineItemSchema = z.object({
  id: z.string().optional(),
  serviceType: z.string().min(1, "Service required"),
  description: z.string().min(1, "Description required"),
  amount: z.number().min(0.01),
});

const invoiceSchema = z.object({
  invoiceNumber: z.string(),
  invoiceDate: z.coerce.date(),
  dueDate: z.coerce.date(),
  customerId: z.string().min(1, "Customer required"),
  notes: z.string().optional(),
  lineItems: z.array(lineItemSchema).min(1),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvoiceCreated: (id?: string) => void;
}

export default function CreateInvoiceModal({
  open,
  onOpenChange,
  onInvoiceCreated,
}: Props) {
  const [loading, setLoading] = useState(false);

  /* =======================
     GST FLAGS
  ======================= */
  const isGstApplicable = true;
  const isCompositionCompany = false;
  const isCustomerGstExempted = false;

  const shouldApplyGst =
    isGstApplicable &&
    !isCompositionCompany &&
    !isCustomerGstExempted;

  const companyState = "Kerala";

  /* =======================
     DATA STATES
  ======================= */
  const [customers, setCustomers] = useState<any[]>([]);
  const [serviceTypes, setServiceTypes] = useState<any[]>([]);
  const [pendingInvoices, setPendingInvoices] = useState<any[]>([]);
  const [savedInvoiceId, setSavedInvoiceId] = useState<string | null>(null);
  const [globalTaxRate] = useState(18);

  const [lineItems, setLineItems] = useState<any[]>([
    { id: uuidv4(), serviceType: "", description: "", amount: 0 },
  ]);

  /* =======================
     FORM
  ======================= */
  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      invoiceNumber: `INV-${Date.now()}`,
      invoiceDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 86400000),
      customerId: "",
      notes: "",
      lineItems,
    },
  });

  /* =======================
     FETCH DATA
  ======================= */
  useEffect(() => {
    apiFetch("/api/v1/api/v1/customers")
      .then((r) => r.json())
      .then((d) => setCustomers(d?.data || []));
  }, []);

  useEffect(() => {
    apiFetch("/api/v1/api/v1/service-types?isActive=true")
      .then((r) => r.json())
      .then((d) => setServiceTypes(d?.data || []));
  }, []);

  /* =======================
     CUSTOMER + PENDING
  ======================= */
  const customerId = form.watch("customerId");
  const selectedCustomer = customers.find((c) => c.id === customerId);

  useEffect(() => {
    if (!customerId) {
      setPendingInvoices([]);
      return;
    }

    apiFetch(
      `/api/v1/api/v1/invoices?customerId=${customerId}&status=pending`
    )
      .then((r) => r.json())
      .then((d) => {
        const list =
          d?.data?.items ||
          d?.data ||
          d?.items ||
          [];

        setPendingInvoices(Array.isArray(list) ? list : []);
      })
      .catch(() => setPendingInvoices([]));
  }, [customerId]);

  /* =======================
     LINE ITEMS
  ======================= */
  const syncLineItems = (items: any[]) => {
    setLineItems(items);
    form.setValue("lineItems", items, { shouldValidate: true });
  };

  const addLine = () =>
    syncLineItems([
      ...lineItems,
      { id: uuidv4(), serviceType: "", description: "", amount: 0 },
    ]);

  const removeLine = (id: string) => {
    if (lineItems.length === 1)
      return toast.error("At least one line item required");
    syncLineItems(lineItems.filter((l) => l.id !== id));
  };

  const updateLine = (id: string, field: string, value: any) => {
    syncLineItems(
      lineItems.map((l) => {
        if (l.id !== id) return l;

        if (field === "serviceType") {
          const service = serviceTypes.find((s) => s.id === value);
          return {
            ...l,
            serviceType: value,
            description:
              service?.description || service?.name || "",
          };
        }

        return { ...l, [field]: value };
      })
    );
  };

  /* =======================
     CALCULATIONS
  ======================= */
  const subtotal = lineItems.reduce(
    (sum, li) => sum + Number(li.amount || 0),
    0
  );

  const gstAmount = shouldApplyGst
    ? subtotal * (globalTaxRate / 100)
    : 0;

  const customerState = selectedCustomer?.state;
  const isSameState =
    customerState &&
    companyState.toLowerCase() === customerState.toLowerCase();

  const cgst = shouldApplyGst && isSameState ? gstAmount / 2 : 0;
  const sgst = shouldApplyGst && isSameState ? gstAmount / 2 : 0;
  const igst = shouldApplyGst && !isSameState ? gstAmount : 0;

  const grandTotal = subtotal + gstAmount;

  /* =======================
     SUBMIT
  ======================= */
  const onSubmit = async (data: InvoiceFormValues) => {
    setLoading(true);
    try {
      const payload = {
        invoiceNumber: data.invoiceNumber,
        invoiceDate: data.invoiceDate.toISOString().slice(0, 10),
        dueDate: data.dueDate.toISOString().slice(0, 10),
        customerId: data.customerId,
        notes: data.notes,
        lineItems: lineItems.map((li) => ({
          serviceType: li.serviceType,
          description: li.description,
          quantity: 1,
          rate: li.amount,
          taxRate: shouldApplyGst ? globalTaxRate : 0,
        })),
      };

      const res = await apiFetch("/api/v1/api/v1/invoices", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error();

      const created = await res.json();
      setSavedInvoiceId(created.id);
      toast.success("Invoice created");
      onInvoiceCreated(created.id);
      onOpenChange(false);
    } catch {
      toast.error("Invoice creation failed");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (!savedInvoiceId) return;
    window.open(
      `/api/v1/api/v1/invoices/${savedInvoiceId}/pdf`,
      "_blank"
    );
  };

  /* =======================
     UI
  ======================= */
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Invoice</DialogTitle>
          <DialogDescription>
            Fill all required details
          </DialogDescription>
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
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 🔴 PENDING INVOICES */}
            {pendingInvoices.length > 0 && (
              <div className="border rounded p-4 bg-muted/30">
                <h4 className="font-semibold mb-2">
                  Pending Outstanding Invoices
                </h4>

                <table className="w-full text-sm border">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-2 text-left">Invoice No</th>
                      <th className="p-2 text-left">Date</th>
                      <th className="p-2 text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingInvoices.map((p) => (
                      <tr key={p.id} className="border-t">
                        <td className="p-2">{p.invoiceNumber}</td>
                        <td className="p-2">{p.invoiceDate}</td>
                        <td className="p-2 text-right font-medium">
                          ₹ {p.balanceAmount ?? p.balance ?? 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* LINE ITEMS */}
            <div className="border rounded">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-2">Service</th>
                    <th className="p-2">Description</th>
                    <th className="p-2 text-right w-28">Amount</th>
                    <th />
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
                            <SelectValue placeholder="Service" />
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
                        <Textarea
                          value={li.description}
                          onChange={(e) =>
                            updateLine(li.id, "description", e.target.value)
                          }
                        />
                      </td>

                      <td className="p-2 text-right">
                        <Input
                          type="number"
                          value={li.amount}
                          onChange={(e) =>
                            updateLine(
                              li.id,
                              "amount",
                              Number(e.target.value)
                            )
                          }
                        />
                      </td>

                      <td className="p-2">
                        <Button
                          type="button"
                          variant="ghost"
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

            {/* SUMMARY */}
            <div className="text-right space-y-1">
              <div>Subtotal: ₹ {subtotal.toFixed(2)}</div>

              {shouldApplyGst && (
                <>
                  {isSameState ? (
                    <>
                      <div>CGST: ₹ {cgst.toFixed(2)}</div>
                      <div>SGST: ₹ {sgst.toFixed(2)}</div>
                    </>
                  ) : (
                    <div>IGST: ₹ {igst.toFixed(2)}</div>
                  )}
                </>
              )}

              <div className="font-bold">
                Total: ₹ {grandTotal.toFixed(2)}
              </div>
            </div>

            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Invoice"}
              </Button>

              {/* {savedInvoiceId && (
                <Button variant="secondary" onClick={handlePrint}>
                  <Printer className="h-4 w-4 mr-2" /> Print
                </Button>
              )} */}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
