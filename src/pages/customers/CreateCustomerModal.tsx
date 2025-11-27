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

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

// ---------------- SCHEMA ----------------
const customerSchema = z.object({
  code: z.string().min(2),
  name: z.string().min(2),
  type: z.string().min(1), // UUID
  address: z.string().min(10),
  email: z.string().email(),
  whatsapp: z.string().min(10),
  phone: z.string().min(10),
  contactPerson: z.string().min(2),
  gstNumber: z.string().optional().nullable(),
  panNumber: z.string().optional().nullable(),
  paymentTerms: z.number().int(),
  accountManager: z.string().min(1), // UUID
  isActive: z.boolean().nullable(),
});

// ---------------- AUTO CODE ----------------
function generateCustomerCode(name?: string) {
  const prefix = "CUST";
  const num = Math.floor(1000 + Math.random() * 9000);
  if (!name) return `${prefix}${num}`;
  return `${prefix}-${name.substring(0, 3).toUpperCase()}${num}`;
}

export function CreateCustomerModal({ open, onOpenChange, onCustomerCreated }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [clientTypes, setClientTypes] = useState<any[]>([]);
  const [accountManagers, setAccountManagers] = useState<any[]>([]);

  // ---------- FORM ----------
  const form = useForm({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: "",
      code: generateCustomerCode(),
      type: "",
      address: "",
      email: "",
      whatsapp: "",
      phone: "",
      contactPerson: "",
      gstNumber: "",
      panNumber: "",
      paymentTerms: 30,
      accountManager: "",
      isActive: true,
    },
  });

  // ---------- SAFE AUTO CODE ----------
  const watchedName = form.watch("name");
  useEffect(() => {
    form.setValue("code", generateCustomerCode(watchedName));
  }, [watchedName]);

  // ---------- LOAD CUSTOMER TYPES ----------
  useEffect(() => {
    async function loadTypes() {
      try {
        const res = await apiFetch("/api/v1/api/v1/client-types");
        const data = await res.json();
        setClientTypes(data?.data || data?.root || []);
      } catch {
        toast.error("Failed to load customer types");
      }
    }
    if (open) loadTypes();
  }, [open]);

  // ---------- LOAD ACCOUNT MANAGERS ----------
  useEffect(() => {
    async function loadManagers() {
      try {
        const res = await apiFetch(
          "/api/v1/account-managers/api/v1/account-managers"
        );
        const data = await res.json();
        setAccountManagers(data?.root || data?.data || []);
      } catch {
        toast.error("Failed to load account managers");
      }
    }
    if (open) loadManagers();
  }, [open]);

  // ---------- SUBMIT ----------
  async function onSubmit(values) {
    try {
      setIsSubmitting(true);

  const payload = {
  code: values.code,
  name: values.name,

  // REQUIRED: backend wants both fields
  type: values.type,
  typeId: values.type,

  address: values.address,
  email: values.email,
  whatsapp: values.whatsapp,
  phone: values.phone,
  contactPerson: values.contactPerson,
  gstNumber: values.gstNumber,
  panNumber: values.panNumber,
  paymentTerms: Number(values.paymentTerms),

  // REQUIRED: backend wants both fields
  accountManager: values.accountManager,
  accountManagerId: values.accountManager,

  isActive: values.isActive,
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

      toast.success("Customer created successfully!");
      onCustomerCreated?.();
      onOpenChange(false);
      form.reset();
    } catch {
      toast.error("Unexpected error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Create Customer</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">

              {/* NAME */}
              <FormField
                name="name"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                  </FormItem>
                )}
              />

              {/* CODE */}
              <FormField
                name="code"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code</FormLabel>
                    <FormControl><Input readOnly {...field} /></FormControl>
                  </FormItem>
                )}
              />

              {/* CUSTOMER TYPE (UUID) */}
              <FormField
                name="type"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clientTypes.map((ct) => (
                          <SelectItem key={ct.id} value={ct.id}>
                            {ct.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* EMAIL */}
              <FormField
                name="email"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                  </FormItem>
                )}
              />

              {/* ADDRESS */}
              <FormField
                name="address"
                control={form.control}
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Address</FormLabel>
                    <FormControl><Textarea {...field} /></FormControl>
                  </FormItem>
                )}
              />

              {/* WHATSAPP */}
              <FormField
                name="whatsapp"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>WhatsApp</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                  </FormItem>
                )}
              />

              {/* PHONE */}
              <FormField
                name="phone"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                  </FormItem>
                )}
              />

              {/* CONTACT PERSON */}
              <FormField
                name="contactPerson"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Person</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                  </FormItem>
                )}
              />

              {/* GST */}
              <FormField
                name="gstNumber"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GST Number</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                  </FormItem>
                )}
              />

              {/* PAN */}
              <FormField
                name="panNumber"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PAN Number</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                  </FormItem>
                )}
              />

              {/* PAYMENT TERMS */}
              <FormField
                name="paymentTerms"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Terms</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) =>
                          field.onChange(Number(e.target.value))
                        }
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* ACCOUNT MANAGER (UUID) */}
              <FormField
                name="accountManager"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Manager</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Manager" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {accountManagers.map((mgr) => (
                          <SelectItem key={mgr.id} value={mgr.id}>
                            {mgr.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              {/* ACTIVE SWITCH */}
              <FormField
                name="isActive"
                control={form.control}
                render={({ field }) => (
                  <FormItem className="flex justify-between p-4 border rounded">
                    <FormLabel>Active</FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value ?? false}
                        onCheckedChange={(v) => field.onChange(Boolean(v))}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* BUTTONS */}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>

              <Button disabled={isSubmitting} type="submit">
                {isSubmitting && <Loader2 className="mr-2 animate-spin" />}
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
