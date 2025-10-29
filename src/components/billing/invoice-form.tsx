import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card } from "@/components/ui/card";
import { InvoiceHeader } from "./invoice-header";
import { LineItemsTable } from "./line-items-table";
import { InvoiceSummary } from "./invoice-summary";
import { ActionButtons } from "./action-buttons";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { mockCustomers, mockServiceTypes } from "@/lib/mock-data";

// Define the line item schema
const lineItemSchema = z.object({
  id: z.string(),
  serviceType: z.string().min(1, "Service type is required"),
  description: z.string().optional(),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  rate: z.number().min(0, "Rate must be a positive number"),
  taxRate: z.number().min(0, "Tax rate must be a positive number"),
  taxAmount: z.number(),
  amount: z.number(),
  total: z.number(),
});

// Define the invoice schema
const invoiceSchema = z.object({
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  invoiceDate: z.date(),
  customerId: z.string().min(1, "Customer is required"),
  dueDate: z.date(),
  referenceNumber: z.string().optional(),
  customerGst: z.string().optional(),
  lineItems: z.array(lineItemSchema).min(1, "At least one line item is required"),
  subtotal: z.number(),
  taxTotal: z.number(),
  total: z.number(),
  notes: z.string().optional(),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

export function InvoiceForm() {
  const navigate = useNavigate();
  const [lineItems, setLineItems] = useState<any[]>([
    {
      id: crypto.randomUUID(),
      serviceType: "",
      description: "",
      quantity: 1,
      rate: 0,
      taxRate: 0,
      taxAmount: 0,
      amount: 0,
      total: 0,
    },
  ]);

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      invoiceNumber: `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
      invoiceDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      lineItems: lineItems,
      subtotal: 0,
      taxTotal: 0,
      total: 0,
    },
  });

  const handleAddLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        id: crypto.randomUUID(),
        serviceType: "",
        description: "",
        quantity: 1,
        rate: 0,
        taxRate: 0,
        taxAmount: 0,
        amount: 0,
        total: 0,
      },
    ]);
  };

  const handleRemoveLineItem = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter(item => item.id !== id));
    } else {
      toast.error("At least one line item is required");
    }
  };

  const handleLineItemChange = (id: string, field: string, value: any) => {
    const updatedItems = lineItems.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        
        // If quantity or rate changed, recalculate amount and tax
        if (field === 'quantity' || field === 'rate') {
          const amount = updatedItem.quantity * updatedItem.rate;
          const taxAmount = amount * (updatedItem.taxRate / 100);
          
          updatedItem.amount = amount;
          updatedItem.taxAmount = taxAmount;
          updatedItem.total = amount + taxAmount;
        }
        
        // If service type changed, update tax rate
        if (field === 'serviceType') {
          const serviceType = mockServiceTypes.find(s => s.id === value);
          if (serviceType) {
            updatedItem.taxRate = serviceType.taxRate;
            
            // Recalculate tax amount and total
            const taxAmount = updatedItem.amount * (serviceType.taxRate / 100);
            updatedItem.taxAmount = taxAmount;
            updatedItem.total = updatedItem.amount + taxAmount;
          }
        }
        
        return updatedItem;
      }
      return item;
    });
    
    setLineItems(updatedItems);
    
    // Calculate totals
    const subtotal = updatedItems.reduce((sum, item) => sum + item.amount, 0);
    const taxTotal = updatedItems.reduce((sum, item) => sum + item.taxAmount, 0);
    const total = subtotal + taxTotal;
    
    form.setValue('lineItems', updatedItems);
    form.setValue('subtotal', subtotal);
    form.setValue('taxTotal', taxTotal);
    form.setValue('total', total);
  };

  const handleCustomerChange = (customerId: string) => {
    const customer = mockCustomers.find(c => c.id === customerId);
    if (customer) {
      form.setValue('customerGst', customer.gstNumber || '');
    }
  };

  const onSubmit = (data: InvoiceFormValues) => {
    console.log("Form submitted:", data);
    toast.success("Invoice created successfully!");
    navigate("/billing");
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <div className="space-y-6">
        <Card>
          <InvoiceHeader 
            form={form} 
            customers={mockCustomers} 
            onCustomerChange={handleCustomerChange}
          />
        </Card>
        
        <Card>
          <LineItemsTable 
            lineItems={lineItems} 
            serviceTypes={mockServiceTypes}
            onAddLineItem={handleAddLineItem}
            onRemoveLineItem={handleRemoveLineItem}
            onLineItemChange={handleLineItemChange}
          />
        </Card>
        
        <Card>
          <InvoiceSummary 
            subtotal={form.watch('subtotal')} 
            taxTotal={form.watch('taxTotal')} 
            total={form.watch('total')}
            form={form}
          />
        </Card>
        
        <ActionButtons />
      </div>
    </form>
  );
} 