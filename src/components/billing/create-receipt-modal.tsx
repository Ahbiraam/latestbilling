import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon, Check, X } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { mockCustomers, mockInvoices } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

// Define the payment method options
const paymentMethods = [
  { id: "cash", name: "Cash" },
  { id: "bank_transfer", name: "Bank Transfer" },
  { id: "cheque", name: "Cheque" },
  { id: "upi", name: "UPI" },
  { id: "credit_card", name: "Credit Card" },
];

// Define the receipt schema
const receiptSchema = z.object({
  receiptId: z.string().min(1, "Receipt ID is required"),
  receiptDate: z.date(),
  customerId: z.string().min(1, "Customer is required"),
  paymentMethod: z.string().min(1, "Payment method is required"),
  amountReceived: z.number().min(1, "Amount must be greater than 0"),
  notes: z.string().optional(),
});

type ReceiptFormValues = z.infer<typeof receiptSchema>;

interface CreateReceiptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReceiptCreated: () => void;
}

export function CreateReceiptModal({
  open,
  onOpenChange,
  onReceiptCreated,
}: CreateReceiptModalProps) {
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerInvoices, setCustomerInvoices] = useState<any[]>([]);
  const [selectedInvoices, setSelectedInvoices] = useState<any[]>([]);
  const [allocations, setAllocations] = useState<Record<string, number>>({});

  const form = useForm<ReceiptFormValues>({
    resolver: zodResolver(receiptSchema),
    defaultValues: {
      receiptId: `RCT-${new Date().getFullYear()}-${String(
        Math.floor(Math.random() * 1000)
      ).padStart(3, "0")}`,
      receiptDate: new Date(),
      amountReceived: 0,
      notes: "",
    },
  });

  // Watch for amount received changes to update allocations
  const amountReceived = form.watch("amountReceived");

  // Update customer invoices when customer changes
  const handleCustomerChange = (customerId: string) => {
    const customer = mockCustomers.find((c) => c.id === customerId);
    if (customer) {
      setSelectedCustomer(customer);
      
      // Filter invoices for this customer with "Pending" or "Overdue" status
      const filteredInvoices = mockInvoices.filter(
        (inv) => inv.customer === customer.name && 
                (inv.status === "Pending" || inv.status === "Overdue")
      );
      
      setCustomerInvoices(filteredInvoices);
      setSelectedInvoices([]);
      setAllocations({});
    }
  };

  // Toggle invoice selection
  const toggleInvoiceSelection = (invoice: any) => {
    if (selectedInvoices.some((inv) => inv.id === invoice.id)) {
      setSelectedInvoices(selectedInvoices.filter((inv) => inv.id !== invoice.id));
      const newAllocations = { ...allocations };
      delete newAllocations[invoice.id];
      setAllocations(newAllocations);
    } else {
      setSelectedInvoices([...selectedInvoices, invoice]);
    }
  };

  // Update allocation for an invoice
  const updateAllocation = (invoiceId: string, amount: number) => {
    const invoice = customerInvoices.find((inv) => inv.id === invoiceId);
    if (!invoice) return;

    // Ensure allocation doesn't exceed invoice amount
    const validAmount = Math.min(amount, invoice.amount);
    
    setAllocations({
      ...allocations,
      [invoiceId]: validAmount,
    });
  };

  // Auto-allocate the full amount to selected invoices
  const autoAllocate = () => {
    if (selectedInvoices.length === 0) return;
    
    let remaining = amountReceived;
    const newAllocations: Record<string, number> = {};
    
    // Sort invoices by date (oldest first)
    const sortedInvoices = [...selectedInvoices].sort((a, b) => 
      new Date(a.invoiceDate).getTime() - new Date(b.invoiceDate).getTime()
    );
    
    for (const invoice of sortedInvoices) {
      if (remaining <= 0) break;
      
      const allocation = Math.min(remaining, invoice.amount);
      newAllocations[invoice.id] = allocation;
      remaining -= allocation;
    }
    
    setAllocations(newAllocations);
  };

  // Clear all allocations
  const clearAllocations = () => {
    setAllocations({});
  };

  // Calculate totals
  const totalAllocated = Object.values(allocations).reduce((sum, amount) => sum + amount, 0);
  const unappliedAmount = amountReceived - totalAllocated;

  // Submit form
  const onSubmit = (data: ReceiptFormValues) => {
    // Validate that at least one invoice is selected
    if (selectedInvoices.length === 0) {
      toast.error("Please select at least one invoice");
      return;
    }
    
    // Validate that allocations don't exceed amount received
    if (totalAllocated > amountReceived) {
      toast.error("Total allocated amount cannot exceed amount received");
      return;
    }

    const receiptData = {
      ...data,
      customerName: selectedCustomer?.name,
      customerGst: selectedCustomer?.gstNumber,
      invoices: selectedInvoices.map(inv => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        amount: inv.amount,
        allocated: allocations[inv.id] || 0
      })),
      totalAllocated,
      unappliedAmount
    };

    console.log("Receipt created:", receiptData);
    toast.success("Payment recorded successfully!");
    onOpenChange(false);
    onReceiptCreated();
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  // Effect to auto-allocate when amount changes
  useEffect(() => {
    if (open && amountReceived > 0 && selectedInvoices.length > 0) {
      autoAllocate();
    }
  }, [amountReceived, selectedInvoices, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            Record a payment received from a customer and allocate it to invoices.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Receipt Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Receipt Details</h3>
                
                <FormField
                  control={form.control}
                  name="receiptId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Receipt ID</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="receiptDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Receipt Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                            <SelectValue placeholder="Select customer" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {mockCustomers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.name}
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
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Method</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select payment method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {paymentMethods.map((method) => (
                            <SelectItem key={method.id} value={method.id}>
                              {method.name}
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
                  name="amountReceived"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount Received</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          value={field.value}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Customer Information */}
              <div>
                {selectedCustomer ? (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="space-y-2">
                        <h3 className="font-medium">Customer Information</h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="text-muted-foreground">Name:</div>
                          <div>{selectedCustomer.name}</div>
                          
                          <div className="text-muted-foreground">GST Number:</div>
                          <div>{selectedCustomer.gstNumber || "N/A"}</div>
                          
                          <div className="text-muted-foreground">Email:</div>
                          <div>{selectedCustomer.email}</div>
                          
                          <div className="text-muted-foreground">Phone:</div>
                          <div>{selectedCustomer.phone}</div>
                          
                          <div className="text-muted-foreground">Address:</div>
                          <div>{selectedCustomer.address}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="flex items-center justify-center h-full border rounded-md p-6 bg-muted/50">
                    <p className="text-muted-foreground">
                      Select a customer to view their information
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Invoice Allocation Section */}
            {selectedCustomer && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Invoice Allocation</h3>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={autoAllocate}
                      disabled={selectedInvoices.length === 0 || amountReceived <= 0}
                    >
                      Auto Allocate
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={clearAllocations}
                      disabled={Object.keys(allocations).length === 0}
                    >
                      Clear Allocations
                    </Button>
                  </div>
                </div>

                {customerInvoices.length > 0 ? (
                  <div className="rounded-md border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted">
                          <th className="p-2 text-left font-medium w-[40px]"></th>
                          <th className="p-2 text-left font-medium">Invoice #</th>
                          <th className="p-2 text-left font-medium">Date</th>
                          <th className="p-2 text-left font-medium">Due Date</th>
                          <th className="p-2 text-left font-medium">Status</th>
                          <th className="p-2 text-right font-medium">Amount</th>
                          <th className="p-2 text-right font-medium">Allocate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {customerInvoices.map((invoice) => {
                          const isSelected = selectedInvoices.some(
                            (inv) => inv.id === invoice.id
                          );
                          return (
                            <tr key={invoice.id} className="border-t">
                              <td className="p-2">
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={() => toggleInvoiceSelection(invoice)}
                                />
                              </td>
                              <td className="p-2">{invoice.invoiceNumber}</td>
                              <td className="p-2">{invoice.invoiceDate}</td>
                              <td className="p-2">{invoice.dueDate}</td>
                              <td className="p-2">
                                <Badge
                                  variant={
                                    invoice.status === "Paid"
                                      ? "secondary"
                                      : invoice.status === "Overdue"
                                      ? "destructive"
                                      : "outline"
                                  }
                                >
                                  {invoice.status}
                                </Badge>
                              </td>
                              <td className="p-2 text-right">
                                {formatCurrency(invoice.amount)}
                              </td>
                              <td className="p-2">
                                <Input
                                  type="number"
                                  min="0"
                                  max={invoice.amount}
                                  step="0.01"
                                  disabled={!isSelected}
                                  value={allocations[invoice.id] || ""}
                                  onChange={(e) =>
                                    updateAllocation(
                                      invoice.id,
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                  className="h-8 w-24 ml-auto"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex items-center justify-center border rounded-md p-6 bg-muted/50">
                    <p className="text-muted-foreground">
                      No pending invoices found for this customer
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Summary Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Enter any additional notes about this payment"
                          className="min-h-[100px]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b">
                  <span className="font-medium">Amount Received:</span>
                  <span>{formatCurrency(amountReceived)}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="font-medium">Applied Amount:</span>
                  <span>{formatCurrency(totalAllocated)}</span>
                </div>
                <div className="flex justify-between py-2 text-lg font-bold">
                  <span>Unapplied Amount:</span>
                  <span className={unappliedAmount !== 0 ? "text-amber-500" : ""}>
                    {formatCurrency(unappliedAmount)}
                  </span>
                </div>
                {unappliedAmount !== 0 && (
                  <div className="text-sm text-amber-500 flex items-center">
                    <X className="h-4 w-4 mr-1" />
                    {unappliedAmount > 0
                      ? "Warning: Not all funds have been allocated"
                      : "Warning: Allocation exceeds received amount"}
                  </div>
                )}
                {unappliedAmount === 0 && amountReceived > 0 && (
                  <div className="text-sm text-green-500 flex items-center">
                    <Check className="h-4 w-4 mr-1" />
                    All funds have been allocated correctly
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Record Payment</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 