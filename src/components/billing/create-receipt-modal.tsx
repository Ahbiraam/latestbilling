import { useState } from "react";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { mockCompanies, mockCustomers, mockInvoices } from "@/lib/mock-data";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

const receiptSchema = z.object({
  companyId: z.string().min(1, "Company is required"),
  receiptId: z.string().min(1, "Receipt ID is required"),
  receiptDate: z.date(),
  customerId: z.string().min(1, "Customer is required"),
  paymentMethod: z.string().min(1, "Payment method is required"),
  tdsAmount: z.number().min(0),
  amountReceived: z.number().min(1, "Amount must be greater than 0"),
  chequeNo: z.string().optional(),
  bankName: z.string().optional(),
  chequeDate: z.date().optional(),
});

type ReceiptFormValues = z.infer<typeof receiptSchema>;

let companyReceiptCounts: Record<string, number> = {};

export function CreateReceiptModal({ open, onOpenChange, onReceiptCreated }: any) {
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerInvoices, setCustomerInvoices] = useState<any[]>([]);
  const [selectedInvoices, setSelectedInvoices] = useState<any[]>([]);
  const [allocations, setAllocations] = useState<Record<string, number>>({});

  const form = useForm<ReceiptFormValues>({
    resolver: zodResolver(receiptSchema),
    defaultValues: {
      receiptDate: new Date(),
      tdsAmount: 0,
      amountReceived: 0,
    },
  });

  // ✅ Generate sequential receipt per company
  const generateReceiptNo = (companyId: string) => {
    companyReceiptCounts[companyId] = (companyReceiptCounts[companyId] || 0) + 1;
    const company = mockCompanies.find((c) => c.id === companyId);
    const prefix = company?.prefix || company?.name.substring(0, 3).toUpperCase();
    return `${prefix}-RCT-${companyReceiptCounts[companyId]
      .toString()
      .padStart(3, "0")}`;
  };

  const handleCompanyChange = (companyId: string) => {
    setSelectedCompany(companyId);
    const newReceiptId = generateReceiptNo(companyId);
    form.setValue("receiptId", newReceiptId);
  };

  const handleCustomerChange = (customerId: string) => {
    const customer = mockCustomers.find((c) => c.id === customerId);
    setSelectedCustomer(customer || null);

    const filtered = mockInvoices.filter(
      (inv) =>
        inv.customer === customer?.name &&
        inv.companyId === selectedCompany &&
        inv.status !== "Paid"
    );

    setCustomerInvoices(filtered);
  };

  const toggleInvoice = (invoice: any) => {
    setSelectedInvoices((prev) =>
      prev.some((i) => i.id === invoice.id)
        ? prev.filter((i) => i.id !== invoice.id)
        : [...prev, invoice]
    );
  };

  const updateAllocation = (invoiceId: string, value: number) => {
    setAllocations((prev) => ({
      ...prev,
      [invoiceId]: isNaN(value) ? 0 : value,
    }));
  };

  const tdsAmount = form.watch("tdsAmount");
  const amountReceived = form.watch("amountReceived");
  const netPayment = amountReceived - (tdsAmount || 0);

  const onSubmit = (data: ReceiptFormValues) => {
    const now = new Date();
    const receipt = {
      ...data,
      companyId: selectedCompany,
      companyName: mockCompanies.find((c) => c.id === selectedCompany)?.name,
      customer: selectedCustomer?.name,
      invoices: selectedInvoices.map((i) => ({
        id: i.id,
        number: i.invoiceNumber,
        allocated: allocations[i.id] || 0,
      })),
      netPayment,
      createdAt: now.toISOString(),
      createdBy: "Manager",
      auditTrail: [
        {
          action: "Created",
          by: "Manager",
          timestamp: now.toISOString(),
        },
      ],
    };

    console.log("✅ Receipt Created:", receipt);
    toast.success("Receipt created successfully!");

    // Mock invoice update for outstanding balance
    selectedInvoices.forEach((inv) => {
      const allocated = allocations[inv.id] || 0;
      if (allocated >= inv.amount) inv.status = "Paid";
      else inv.status = "Partially Paid";
    });

    onReceiptCreated();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Receipt</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* --- Company / Receipt --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="companyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company</FormLabel>
                    <Select
                      onValueChange={(val) => {
                        field.onChange(val);
                        handleCompanyChange(val);
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select company" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {mockCompanies.map((c) => (
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

              <FormItem>
                <FormLabel>Receipt No</FormLabel>
                <Input disabled value={form.watch("receiptId")} />
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

            {/* --- Customer --- */}
            <FormField
              control={form.control}
              name="customerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer</FormLabel>
                  <Select
                    onValueChange={(val) => {
                      field.onChange(val);
                      handleCustomerChange(val);
                    }}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select customer" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {mockCustomers.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            {/* --- Outstanding Bills --- */}
            {customerInvoices.length > 0 && (
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
                      {customerInvoices.map((invoice) => (
                        <tr key={invoice.id} className="border-t">
                          <td className="text-center">
                            <Checkbox
                              checked={selectedInvoices.some((i) => i.id === invoice.id)}
                              onCheckedChange={() => toggleInvoice(invoice)}
                            />
                          </td>
                          <td>{invoice.invoiceNumber}</td>
                          <td>₹{invoice.amount.toLocaleString()}</td>
                          <td>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              className="w-24"
                              disabled={!selectedInvoices.some((i) => i.id === invoice.id)}
                              value={allocations[invoice.id] || ""}
                              onChange={(e) =>
                                updateAllocation(
                                  invoice.id,
                                  parseFloat(e.target.value) || 0
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

            {/* --- TDS / Payment --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="tdsAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>TDS Amount</FormLabel>
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
                name="amountReceived"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Received</FormLabel>
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

              <FormItem>
                <FormLabel>Net Payment After TDS</FormLabel>
                <Input value={netPayment.toFixed(2)} disabled />
              </FormItem>
            </div>

            {/* --- Payment Mode --- */}
            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Mode</FormLabel>
                  <Select onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment mode" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                      <SelectItem value="UPI">UPI</SelectItem>
                      <SelectItem value="Cheque">Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            {/* --- Cheque Details --- */}
            {form.watch("paymentMethod") === "Cheque" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="chequeNo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cheque No</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bankName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bank Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="chequeDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cheque Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button variant="outline" className="w-full justify-start">
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value
                                ? format(field.value, "PPP")
                                : "Select date"}
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
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Receipt</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
