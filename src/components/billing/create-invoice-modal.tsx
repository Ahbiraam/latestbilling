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
} from "@/lib/mock-data";

// ✅ Schema for each line item
const lineItemSchema = z.object({
  id: z.string(),
  serviceType: z.string().min(1, "Service type is required"),
  description: z.string().optional(),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  rate: z.number().min(0, "Rate must be positive"),
  amount: z.number(),
});

// ✅ Fixed schema for the entire invoice (using z.coerce.date())
const invoiceSchema = z.object({
  invoiceNumber: z.string().optional(),
  invoiceDate: z.coerce.date(), // ✅ accepts string or Date
  customerId: z.string().min(1, "Customer is required"),
  companyId: z.string().min(1, "Company is required"),
  dueDate: z.coerce.date(), // ✅ accepts string or Date
  referenceNumber: z.string().optional(),
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
    {
      id: uuidv4(),
      serviceType: "",
      description: "",
      quantity: 1,
      rate: 0,
      amount: 0,
    },
  ]);

  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [contactInfo, setContactInfo] = useState({ whatsapp: "", email: "" });
  const [createdInvoiceData, setCreatedInvoiceData] = useState<any>(null);

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

  // ✅ Add line item
  const handleAddLineItem = () => {
    const newItem = {
      id: uuidv4(),
      serviceType: "",
      description: "",
      quantity: 1,
      rate: 0,
      amount: 0,
    };
    const updated = [...lineItems, newItem];
    setLineItems(updated);
    form.setValue("lineItems", updated);
  };

  // ✅ Remove line item
  const handleRemoveLineItem = (id: string) => {
    if (lineItems.length === 1) {
      toast.error("At least one line item is required");
      return;
    }
    const updated = lineItems.filter((i) => i.id !== id);
    setLineItems(updated);
    form.setValue("lineItems", updated);
  };

  // ✅ Update line item fields
  const handleLineItemChange = (id: string, field: string, value: any) => {
    const updated = lineItems.map((item) =>
      item.id === id
        ? { ...item, [field]: value, amount: item.quantity * item.rate }
        : item
    );
    setLineItems(updated);
    form.setValue("lineItems", updated);
  };

  // ✅ Customer & Company changes
  const handleCustomerChange = (customerId: string) => {
    const customer = mockCustomers.find((c) => c.id === customerId);
    setSelectedCustomer(customer || null);
  };

  const handleCompanyChange = (companyId: string) => {
    const company = mockCompanies.find((c) => c.id === companyId);
    if (company) {
      const randomNum = Math.floor(100 + Math.random() * 900);
      const invoiceNumber = `${company.prefix}-${randomNum}`;
      form.setValue("invoiceNumber", invoiceNumber);
    }
  };

  // ✅ Totals calculation
  const subtotal = lineItems.reduce((sum, i) => sum + i.amount, 0);
  const gstValues =
    gstType === "CGST/SGST"
      ? { cgst: subtotal * 0.09, sgst: subtotal * 0.09, igst: 0 }
      : { cgst: 0, sgst: 0, igst: subtotal * 0.18 };
  const total =
    gstType === "CGST/SGST"
      ? subtotal + gstValues.cgst + gstValues.sgst
      : subtotal + gstValues.igst;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);

  // ✅ Submit invoice
  const onSubmit = (data: InvoiceFormValues) => {
    console.log("✅ onSubmit triggered", data); // debug log
    const invoiceData = {
      ...data,
      subtotal,
      gstType,
      cgst: gstValues.cgst,
      sgst: gstValues.sgst,
      igst: gstValues.igst,
      total,
      customerName: selectedCustomer?.name,
      customerGst: selectedCustomer?.gstNumber,
    };
    setCreatedInvoiceData(invoiceData);
    toast.success("Invoice created successfully!");
    setShowConfirmModal(true);
  };

  const onError = (errors: any) => {
    console.log("❌ Validation errors:", errors);
    toast.error("Please fill all required fields before submitting.");
  };

  const handleConfirmSend = () => {
    if (!contactInfo.whatsapp || !contactInfo.email) {
      toast.error("Please enter WhatsApp and Email before sending.");
      return;
    }
    console.log("✅ Sending invoice to:", contactInfo);
    console.log("📄 Invoice Data:", createdInvoiceData);
    toast.success("Invoice sent successfully via WhatsApp and Email!");
    setShowConfirmModal(false);
    onInvoiceCreated();
    onOpenChange(false);
  };

  const handlePrintInvoice = () => window.print();

  return (
    <>
      {/* ✅ Main Invoice Modal */}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Invoice</DialogTitle>
            <DialogDescription>
              Fill all required details below to create a new invoice.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit, onError)}
              className="space-y-6"
            >
              {/* Customer & Company */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select active customer" />
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="companyId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            handleCompanyChange(value);
                          }}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select company" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {mockCompanies.map((company) => (
                              <SelectItem key={company.id} value={company.id}>
                                {company.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

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
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* ✅ Line Items */}
              <div className="space-y-4">
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
                        <th className="p-2 w-[80px]">Qty</th>
                        <th className="p-2 w-[100px]">Rate</th>
                        <th className="p-2 text-right">Amount</th>
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

                          <td className="p-2">
                            <Input
                              className="h-8"
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) =>
                                handleLineItemChange(
                                  item.id,
                                  "quantity",
                                  parseInt(e.target.value) || 1
                                )
                              }
                            />
                          </td>

                          <td className="p-2">
                            <Input
                              className="h-8"
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.rate}
                              onChange={(e) =>
                                handleLineItemChange(
                                  item.id,
                                  "rate",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                            />
                          </td>

                          <td className="p-2 text-right">
                            {formatCurrency(item.quantity * item.rate)}
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

              {/* ✅ Notes + Totals */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Enter notes or terms" />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <div className="flex justify-between border-b py-2">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>

                  <div className="flex items-center justify-between border-b py-2">
                    <span>GST Type:</span>
                    <Select value={gstType} onValueChange={setGstType}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Select GST" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CGST/SGST">CGST/SGST</SelectItem>
                        <SelectItem value="IGST">IGST</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {gstType === "CGST/SGST" ? (
                    <>
                      <div className="flex justify-between border-b py-2">
                        <span>CGST (9%):</span>
                        <span>{formatCurrency(gstValues.cgst)}</span>
                      </div>
                      <div className="flex justify-between border-b py-2">
                        <span>SGST (9%):</span>
                        <span>{formatCurrency(gstValues.sgst)}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between border-b py-2">
                      <span>IGST (18%):</span>
                      <span>{formatCurrency(gstValues.igst)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-lg font-semibold py-2">
                    <span>Total:</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>

              <DialogFooter className="flex flex-col items-start gap-2">
                <div className="flex w-full justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Create Invoice</Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handlePrintInvoice}
                  >
                    <Printer className="h-4 w-4 mr-2" /> Print Invoice
                  </Button>
                </div>
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
              Confirm WhatsApp and Email ID to send the invoice copy.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <Label>WhatsApp Number</Label>
              <Input
                type="text"
                placeholder="+91 9876543210"
                value={contactInfo.whatsapp}
                onChange={(e) =>
                  setContactInfo({ ...contactInfo, whatsapp: e.target.value })
                }
              />
            </div>

            <div>
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
