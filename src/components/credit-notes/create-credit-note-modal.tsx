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
import { CalendarIcon, Check } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { mockCustomers, mockInvoices } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Define the credit reasons
const creditReasons = [
  { id: "discount", name: "Discount" },
  { id: "return", name: "Return of Goods" },
  { id: "correction", name: "Invoice Correction" },
  { id: "cancellation", name: "Service Cancellation" },
  { id: "goodwill", name: "Goodwill Adjustment" },
];

// Define the credit note schema
const creditNoteSchema = z.object({
  creditNoteId: z.string().min(1, "Credit Note ID is required"),
  creditNoteDate: z.date(),
  customerId: z.string().min(1, "Customer is required"),
  invoiceId: z.string().min(1, "Invoice reference is required"),
  reason: z.string().min(1, "Reason is required"),
  amount: z.number().min(1, "Amount must be greater than 0"),
  gstRate: z.number().min(0, "GST rate must be a positive number"),
  notes: z.string().optional(),
});

type CreditNoteFormValues = z.infer<typeof creditNoteSchema>;

interface CreateCreditNoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreditNoteCreated: () => void;
}

export function CreateCreditNoteModal({
  open,
  onOpenChange,
  onCreditNoteCreated,
}: CreateCreditNoteModalProps) {
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerInvoices, setCustomerInvoices] = useState<any[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [gstAmount, setGstAmount] = useState(0);
  const [totalCredit, setTotalCredit] = useState(0);

  const form = useForm<CreditNoteFormValues>({
    resolver: zodResolver(creditNoteSchema),
    defaultValues: {
      creditNoteId: `CN-${new Date().getFullYear()}-${String(
        Math.floor(Math.random() * 1000)
      ).padStart(3, "0")}`,
      creditNoteDate: new Date(),
      amount: 0,
      gstRate: 0,
      notes: "",
    },
  });

  // Watch for amount and GST rate changes to update calculations
  const amount = form.watch("amount");
  const gstRate = form.watch("gstRate");

  // Update calculations when amount or GST rate changes
  useEffect(() => {
    const calculatedGstAmount = amount * (gstRate / 100);
    setGstAmount(calculatedGstAmount);
    setTotalCredit(amount + calculatedGstAmount);
  }, [amount, gstRate]);

  // Update customer invoices when customer changes
  const handleCustomerChange = (customerId: string) => {
    const customer = mockCustomers.find((c) => c.id === customerId);
    if (customer) {
      setSelectedCustomer(customer);
      
      // Filter invoices for this customer with "Paid" status
      // In a real app, you might want to show all invoices that can be credited
      const filteredInvoices = mockInvoices.filter(
        (inv) => inv.customer === customer.name && inv.status === "Paid"
      );
      
      setCustomerInvoices(filteredInvoices);
      setSelectedInvoice(null);
      
      // Reset invoice-related fields
      form.setValue("invoiceId", "");
      form.setValue("gstRate", 0);
    }
  };

  // Update selected invoice and GST rate when invoice changes
  const handleInvoiceChange = (invoiceId: string) => {
    const invoice = customerInvoices.find((inv) => inv.id === invoiceId);
    if (invoice) {
      setSelectedInvoice(invoice);
      
      // In a real app, you would get the GST rate from the invoice
      // For now, we'll use a mock value based on the invoice
      const mockGstRate = invoice.id === "inv1" ? 18 : invoice.id === "inv2" ? 12 : 5;
      form.setValue("gstRate", mockGstRate);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const onSubmit = (data: CreditNoteFormValues) => {
    // Validation checks
    if (amount <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }

    if (!selectedInvoice) {
      toast.error("Please select an invoice");
      return;
    }

    // In a real app, you would check if the credit amount exceeds the invoice amount
    if (amount > selectedInvoice.amount) {
      toast.error("Credit amount cannot exceed the invoice amount");
      return;
    }

    const creditNoteData = {
      ...data,
      customerName: selectedCustomer?.name,
      customerGst: selectedCustomer?.gstNumber,
      invoiceNumber: selectedInvoice?.invoiceNumber,
      gstAmount,
      totalCredit,
    };

    console.log("Credit note created:", creditNoteData);
    toast.success("Credit note issued successfully!");
    onOpenChange(false);
    onCreditNoteCreated();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Issue Credit Note</DialogTitle>
          <DialogDescription>
            Create a credit note for refunds, adjustments, or discounts.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Credit Note Details Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Credit Note Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="creditNoteId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Credit Note ID</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="creditNoteDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Credit Note Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date > new Date() || date < new Date("1900-01-01")
                            }
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
                  name="invoiceId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Invoice Reference</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          handleInvoiceChange(value);
                        }}
                        defaultValue={field.value}
                        disabled={!selectedCustomer}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select invoice" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {customerInvoices.map((invoice) => (
                            <SelectItem key={invoice.id} value={invoice.id}>
                              {invoice.invoiceNumber} ({formatCurrency(invoice.amount)})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Customer and Invoice Information */}
            {selectedCustomer && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {selectedInvoice && (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="space-y-2">
                        <h3 className="font-medium">Invoice Information</h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="text-muted-foreground">Invoice Number:</div>
                          <div>{selectedInvoice.invoiceNumber}</div>
                          
                          <div className="text-muted-foreground">Date:</div>
                          <div>{selectedInvoice.invoiceDate}</div>
                          
                          <div className="text-muted-foreground">Amount:</div>
                          <div>{formatCurrency(selectedInvoice.amount)}</div>
                          
                          <div className="text-muted-foreground">Status:</div>
                          <div>
                            <Badge variant="secondary">{selectedInvoice.status}</Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Credit Details Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Credit Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reason for Credit</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select reason" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {creditReasons.map((reason) => (
                            <SelectItem key={reason.id} value={reason.id}>
                              {reason.name}
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
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
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
                
                <FormField
                  control={form.control}
                  name="gstRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GST Rate (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          value={field.value}
                          readOnly={selectedInvoice !== null}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="space-y-1">
                  <FormLabel>GST Amount</FormLabel>
                  <div className="h-10 px-3 py-2 rounded-md border border-input bg-muted flex items-center">
                    {formatCurrency(gstAmount)}
                  </div>
                </div>
              </div>
            </div>

            {/* Summary Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Enter any additional notes about this credit note"
                        className="min-h-[100px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b">
                  <span className="font-medium">Amount:</span>
                  <span>{formatCurrency(amount)}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="font-medium">GST Amount:</span>
                  <span>{formatCurrency(gstAmount)}</span>
                </div>
                <div className="flex justify-between py-2 text-lg font-bold">
                  <span>Total Credit:</span>
                  <span>{formatCurrency(totalCredit)}</span>
                </div>
                {amount > 0 && selectedInvoice && (
                  <div className="text-sm text-green-500 flex items-center">
                    <Check className="h-4 w-4 mr-1" />
                    Credit note is ready to be issued
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
              <Button type="submit">Issue Credit Note</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 