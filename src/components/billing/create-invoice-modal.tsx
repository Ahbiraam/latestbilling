import { useState } from "react";
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
import { Label } from "@/components/ui/label";
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
import {
  mockCompanies,
  mockCustomers,
  mockServiceTypes,
  mockInvoices,
} from "@/lib/mock-data";

// ✅ Validation Schema
const lineItemSchema = z.object({
  id: z.string(),
  serviceType: z.string().min(1, "Service type is required"),
  description: z.string().optional(),
  amount: z.number().min(0, "Amount must be positive"),
});

const invoiceSchema = z.object({
  invoiceNumber: z.string().optional(),
  invoiceDate: z.coerce.date(),
  customerId: z.string().min(1, "Customer is required"),
  companyId: z.string().min(1, "Company is required"),
  dueDate: z.coerce.date(),
  invoiceType: z.enum(["Cash", "Credit"], {
    required_error: "Invoice type is required",
  }),
  lineItems: z.array(lineItemSchema).min(1, "At least one line item is required"),
  notes: z.string().min(1, "Note is required"),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

interface CreateInvoiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvoiceCreated: () => void;
}

export function CreateInvoiceModal({
  open,
  onOpenChange,
  onInvoiceCreated,
}: CreateInvoiceModalProps) {
  const [lineItems, setLineItems] = useState<any[]>([
    { id: uuidv4(), serviceType: "", description: "", amount: 0 },
  ]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [selectedPendingInvoices, setSelectedPendingInvoices] = useState<string[]>([]);
  const [companyInvoices, setCompanyInvoices] = useState(mockInvoices);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [contactInfo, setContactInfo] = useState({ whatsapp: "", email: "" });
  const [gstType, setGstType] = useState("CGST/SGST");

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      invoiceNumber: `INV-${new Date().getFullYear()}-${String(
        Math.floor(Math.random() * 1000)
      ).padStart(3, "0")}`,
      invoiceDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      lineItems,
      notes: "",
    },
  });

  // ✅ Auto-select company and show pending invoices
  const handleCustomerChange = (customerId: string) => {
    const customer = mockCustomers.find((c) => c.id === customerId);
    setSelectedCustomer(customer || null);
    setSelectedPendingInvoices([]);

    if (customer) {
      let company = null;

      if (customer.companyId) {
        company = mockCompanies.find((c) => c.id === customer.companyId);
      } else if (customer.companyName) {
        company = mockCompanies.find((c) => c.name === customer.companyName);
      }

      if (company) {
        setSelectedCompany(company);
        form.setValue("companyId", company.id);

        const randomNum = Math.floor(100 + Math.random() * 900);
        const invoiceNumber = `${company.prefix}-${randomNum}`;
        form.setValue("invoiceNumber", invoiceNumber);
      }
    }
  };

  const togglePendingInvoice = (invoiceId: string) => {
    setSelectedPendingInvoices((prev) =>
      prev.includes(invoiceId)
        ? prev.filter((id) => id !== invoiceId)
        : [...prev, invoiceId]
    );
  };

  const handleAddLineItem = () => {
    const newItem = { id: uuidv4(), serviceType: "", description: "", amount: 0 };
    const updated = [...lineItems, newItem];
    setLineItems(updated);
    form.setValue("lineItems", updated);
  };

  const handleRemoveLineItem = (id: string) => {
    if (lineItems.length === 1) {
      toast.error("At least one line item is required");
      return;
    }
    const updated = lineItems.filter((i) => i.id !== id);
    setLineItems(updated);
    form.setValue("lineItems", updated);
  };

  const handleLineItemChange = (id: string, field: string, value: any) => {
    const updated = lineItems.map((item) =>
      item.id === id ? { ...item, [field]: value } : item
    );
    setLineItems(updated);
    form.setValue("lineItems", updated);
  };

  const pendingTotal = companyInvoices
    .filter((inv) => selectedPendingInvoices.includes(inv.id))
    .reduce((sum, inv) => sum + inv.amount, 0);

  const subtotal = lineItems.reduce((sum, i) => sum + i.amount, 0) + pendingTotal;

  const gstRates =
    gstType === "CGST/SGST"
      ? { cgst: 0.09, sgst: 0.09, igst: 0 }
      : { cgst: 0, sgst: 0, igst: 0.18 };

  const cgst = subtotal * gstRates.cgst;
  const sgst = subtotal * gstRates.sgst;
  const igst = subtotal * gstRates.igst;
  const total = subtotal + cgst + sgst + igst;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);

  const onSubmit = (data: InvoiceFormValues) => {
    const invoiceData = {
      ...data,
      subtotal,
      cgst,
      sgst,
      igst,
      gstType,
      total,
      includedInvoices: selectedPendingInvoices,
    };
    toast.success("Invoice created successfully!");
    console.log("✅ Created Invoice:", invoiceData);
    setShowConfirmModal(true);
  };

  const handleConfirmSend = () => {
    if (!contactInfo.whatsapp || !contactInfo.email) {
      toast.error("Please enter WhatsApp and Email before sending.");
      return;
    }
    toast.success("Invoice sent successfully!");
    setShowConfirmModal(false);
    onInvoiceCreated();
    onOpenChange(false);
  };

  const handlePrintInvoice = () => window.print();

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Invoice</DialogTitle>
            <DialogDescription>
              Fill all required details below to create a new invoice.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* ✅ Customer & Auto Company Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Customer Information</h3>

                <FormField
                  control={form.control}
                  name="customerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          handleCustomerChange(value);
                        }}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Customer" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {mockCustomers
                            .filter((c) => c.active)
                            .map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                {/* ✅ Auto Company Field */}
                <FormField
                  control={form.control}
                  name="companyId"
                  render={() => (
                    <FormItem>
                      <FormLabel>Company (Auto-selected)</FormLabel>
                      <FormControl>
                        <Input
                          value={selectedCompany ? selectedCompany.name : ""}
                          readOnly
                          className="bg-gray-100"
                          placeholder="Auto-selects when customer chosen"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* ✅ Pending Invoices */}
                {selectedCompany && (
                  <div className="mt-4 border rounded-lg p-3 bg-blue-50">
                    <h4 className="font-semibold text-blue-800 mb-2">
                      Pending Invoices for {selectedCompany.name}
                    </h4>
                    <table className="w-full text-sm border">
                      <thead>
                        <tr className="border-b bg-blue-100">
                          <th className="p-2 text-left">Select</th>
                          <th className="p-2 text-left">Invoice No</th>
                          <th className="p-2">Customer</th>
                          <th className="p-2 text-right">Amount</th>
                          <th className="p-2 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {companyInvoices
                          .filter(
                            (inv) =>
                              (inv.companyId
                                ? inv.companyId === selectedCompany.id
                                : inv.company === selectedCompany.name) &&
                              inv.status !== "Paid"
                          )
                          .map((inv) => (
                            <tr key={inv.id} className="border-b">
                              <td className="p-2 text-center">
                                <input
                                  type="checkbox"
                                  checked={selectedPendingInvoices.includes(inv.id)}
                                  onChange={() => togglePendingInvoice(inv.id)}
                                />
                              </td>
                              <td className="p-2">{inv.invoiceNumber}</td>
                              <td className="p-2">{inv.customer}</td>
                              <td className="p-2 text-right">
                                {formatCurrency(inv.amount)}
                              </td>
                              <td className="p-2 text-center text-red-600 font-semibold">
                                {inv.status}
                              </td>
                            </tr>
                          ))}

                        {companyInvoices.filter(
                          (inv) =>
                            (inv.companyId
                              ? inv.companyId === selectedCompany.id
                              : inv.company === selectedCompany.name) &&
                            inv.status !== "Paid"
                        ).length === 0 && (
                          <tr>
                            <td
                              colSpan={5}
                              className="text-center text-gray-500 py-3"
                            >
                              No pending invoices.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* ✅ Invoice Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Invoice Details</h3>
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

                <FormField
                  control={form.control}
                  name="invoiceType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Invoice Type</FormLabel>
                      <Select onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Cash">Cash</SelectItem>
                          <SelectItem value="Credit">Credit</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>

              {/* ✅ Line Items */}
              <div className="space-y-4 mt-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Line Items</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddLineItem}
                  >
                    <Plus className="h-4 w-4 mr-2" /> Add Item
                  </Button>
                </div>

                <div className="rounded-md border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted">
                        <th className="p-2 text-left font-medium">Service</th>
                        <th className="p-2 text-left font-medium">Description</th>
                        <th className="p-2 text-right font-medium">Amount</th>
                        <th className="p-2 w-[40px]"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {lineItems.map((item) => (
                        <tr key={item.id} className="border-t">
                          <td className="p-2">
                            <Select
                              value={item.serviceType}
                              onValueChange={(value) =>
                                handleLineItemChange(item.id, "serviceType", value)
                              }
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                              <SelectContent>
                                {mockServiceTypes.map((s) => (
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
                              value={item.description}
                              onChange={(e) =>
                                handleLineItemChange(
                                  item.id,
                                  "description",
                                  e.target.value
                                )
                              }
                              placeholder="Description"
                            />
                          </td>
                          <td className="p-2 text-right">
                            <Input
                              className="h-8 text-right"
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.amount}
                              onChange={(e) =>
                                handleLineItemChange(
                                  item.id,
                                  "amount",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                            />
                          </td>
                          <td className="p-2 text-right">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleRemoveLineItem(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ✅ Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter notes or remarks" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* ✅ Totals */}
              <div className="mt-6 border-t pt-4 space-y-2">
                <div className="flex justify-between border-b py-2">
                  <span>Subtotal (including pending invoices):</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>

                <div className="flex items-center justify-between border-b py-2">
                  <span>GST Type:</span>
                  <Select value={gstType} onValueChange={setGstType}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Select GST Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CGST/SGST">CGST/SGST</SelectItem>
                      <SelectItem value="IGST">IGST</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-between border-b py-2">
                  <span>CGST (9%):</span>
                  <span>{formatCurrency(cgst)}</span>
                </div>
                <div className="flex justify-between border-b py-2">
                  <span>SGST (9%):</span>
                  <span>{formatCurrency(sgst)}</span>
                </div>
                <div className="flex justify-between border-b py-2">
                  <span>IGST (18%):</span>
                  <span>{formatCurrency(igst)}</span>
                </div>

                <div className="flex justify-between text-lg font-semibold py-2">
                  <span>Total Payable:</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>

              <DialogFooter>
                <Button type="submit">Create Invoice</Button>
                <Button variant="secondary" onClick={handlePrintInvoice}>
                  <Printer className="h-4 w-4 mr-2" /> Print
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* ✅ Confirmation Dialog */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send Invoice Copy</DialogTitle>
            <DialogDescription>
              Confirm WhatsApp and Email to send invoice copy.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <Label>WhatsApp Number</Label>
            <Input
              placeholder="+91 9876543210"
              value={contactInfo.whatsapp}
              onChange={(e) =>
                setContactInfo({ ...contactInfo, whatsapp: e.target.value })
              }
            />
            <Label>Email</Label>
            <Input
              type="email"
              placeholder="customer@example.com"
              value={contactInfo.email}
              onChange={(e) =>
                setContactInfo({ ...contactInfo, email: e.target.value })
              }
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmSend}>Send Invoice</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
