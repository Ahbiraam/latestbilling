"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

/* ================= SCHEMA ================= */
const customerSchema = z
  .object({
    code: z.string(),
    name: z.string().min(2),

    address1: z.string().min(2, "Address Line 1 is required"),
    address2: z.string().optional(),
    address3: z.string().optional(),
    state: z.string().min(2, "State is required"),
    country: z.string().min(2, "Country is required"),

    email: z.string().email(),
    whatsapp: z.string().min(10),
    phone: z.string().min(10),
    contactPerson: z.string().min(2),

    gstNumber: z.string().optional(),
    gstExempted: z.boolean(),
    gstExemptionReason: z.string().optional(),

    panNumber: z.string().optional(),
    paymentTerms: z.coerce.number().min(0),

    customerNote: z.string().optional(),
    isActive: z.boolean(),
  })
  .refine(
    (data) =>
      !data.gstExempted || Boolean(data.gstExemptionReason?.trim()),
    {
      path: ["gstExemptionReason"],
      message: "Reason is required when GST is exempted",
    }
  );

/* ================= AUTO CUSTOMER CODE ================= */
function generateCustomerCode(name?: string) {
  const prefix = "CUST";
  const num = Math.floor(1000 + Math.random() * 9000);
  if (!name) return `${prefix}${num}`;
  return `${prefix}-${name.substring(0, 3).toUpperCase()}${num}`;
}

export function CreateCustomerModal({
  open,
  onOpenChange,
  onCustomerCreated,
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: "",
      code: generateCustomerCode(),

      address1: "",
      address2: "",
      address3: "",
      state: "",
      country: "",

      email: "",
      whatsapp: "",
      phone: "",
      contactPerson: "",

      gstNumber: "",
      gstExempted: false,
      gstExemptionReason: "",

      panNumber: "",
      paymentTerms: 0,

      customerNote: "",
      isActive: true,
    },
  });

  /* AUTO UPDATE CUSTOMER CODE */
  const watchedName = form.watch("name");
  useEffect(() => {
    form.setValue("code", generateCustomerCode(watchedName));
  }, [watchedName]);

  /* ================= SUBMIT ================= */
  async function onSubmit(values) {
    try {
      setIsSubmitting(true);

      // ✅ Combine address fields → backend expects ONE string
      const address = [
        values.address1.trim(),
        values.address2?.trim(),
        values.address3?.trim(),
        values.state.trim(),
        values.country.trim(),
      ]
        .filter(Boolean)
        .join(", ");

    const payload = {
  code: values.code.trim(),
  name: values.name.trim(),

  type: "CUSTOMER",
  typeId: "3fa85f64-5717-4562-b3fc-2c963f66afa6",

  // ✅ REQUIRED BY BACKEND
  addressLine1: values.address1.trim(),
  addressLine2: values.address2?.trim() || "",
  addressLine3: values.address3?.trim() || "",
  state: values.state.trim(),
  country: values.country.trim(),

  email: values.email.trim(),
  whatsapp: values.whatsapp.replace(/\D/g, "").slice(-10),
  phone: values.phone.replace(/\D/g, "").slice(-10),
  contactPerson: values.contactPerson.trim(),

  gstNumber: values.gstNumber?.trim() || null,
  panNumber: values.panNumber?.trim() || null,

  paymentTerms: Number(values.paymentTerms),

  accountManager: "NA",
  accountManagerId: "3fa85f64-5717-4562-b3fc-2c963f66afa6",

  isActive: Boolean(values.isActive),
};


      const res = await apiFetch("/api/v1/api/v1/customers", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data?.message || "Customer creation failed");
        return;
      }

      toast.success("Customer created successfully");
      onCustomerCreated?.();
      onOpenChange(false);
      form.reset();

    } catch (err) {
      console.error(err);
      toast.error("Unexpected error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] p-0 flex flex-col">

        {/* HEADER */}
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>Create Customer</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex-1 overflow-y-auto px-6 py-6 space-y-10"
          >

            {/* BASIC INFORMATION */}
            <section>
              <h3 className="text-sm font-semibold text-muted-foreground mb-4">
                BASIC INFORMATION
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField name="name" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                  </FormItem>
                )} />
                <FormField name="code" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Code</FormLabel>
                    <FormControl><Input readOnly {...field} /></FormControl>
                  </FormItem>
                )} />
                <FormField name="email" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                  </FormItem>
                )} />
                <FormField name="whatsapp" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>WhatsApp</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                  </FormItem>
                )} />
                <FormField name="phone" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                  </FormItem>
                )} />
                <FormField name="contactPerson" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Person</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                  </FormItem>
                )} />
              </div>
            </section>

            {/* ADDRESS DETAILS */}
            <section>
              <h3 className="text-sm font-semibold text-muted-foreground mb-4">
                ADDRESS DETAILS
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField name="address1" control={form.control} render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Address Line 1</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField name="address2" control={form.control} render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Address Line 2</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                  </FormItem>
                )} />
                <FormField name="address3" control={form.control} render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Address Line 3</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                  </FormItem>
                )} />
                <FormField name="state" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>State</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField name="country" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </section>

            {/* TAX DETAILS */}
            <section>
              <h3 className="text-sm font-semibold text-muted-foreground mb-4">
                TAX DETAILS
              </h3>
              <FormField name="gstNumber" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>GST Number</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                </FormItem>
              )} />
              <FormField name="gstExempted" control={form.control} render={({ field }) => (
                <FormItem className="flex justify-between items-center border rounded p-4 mt-4">
                  <FormLabel>GST Exempted Customer?</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )} />
              {form.watch("gstExempted") && (
                <FormField name="gstExemptionReason" control={form.control} render={({ field }) => (
                  <FormItem className="mt-4">
                    <FormLabel>Reason for GST Exemption</FormLabel>
                    <FormControl><Textarea rows={3} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              )}
            </section>

            {/* FINANCE & NOTES */}
            <section>
              <h3 className="text-sm font-semibold text-muted-foreground mb-4">
                FINANCE & NOTES
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField name="panNumber" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>PAN Number</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                  </FormItem>
                )} />
                <FormField name="paymentTerms" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Terms (Days)</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                  </FormItem>
                )} />
                <FormField name="customerNote" control={form.control} render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Customer Note</FormLabel>
                    <FormControl><Textarea rows={4} {...field} /></FormControl>
                  </FormItem>
                )} />
                <FormField name="isActive" control={form.control} render={({ field }) => (
                  <FormItem className="flex justify-between items-center border rounded p-4 md:col-span-2">
                    <FormLabel>Active</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )} />
              </div>
            </section>

            {/* ACTIONS */}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button disabled={isSubmitting} type="submit">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Customer
              </Button>
            </div>

          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default CreateCustomerModal;
