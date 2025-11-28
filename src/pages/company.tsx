import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";

// ===============================
// BACKEND SCHEMA
// ===============================
const companyFormSchema = z.object({
  name: z.string().trim().min(2, "Company name is required"),
  address: z.string().trim().min(2, "Address is required"),

  registrationNumber: z.string().trim().min(2, "Registration number required"),
  taxId: z.string().trim().min(2, "Tax ID required"),

  contactName: z.string().trim().min(2, "Contact name required"),
  contactEmail: z.string().email("Invalid email"),
  contactPhone: z.string().regex(/^[0-9]{10}$/, "Enter valid 10-digit phone"),

  financialYearStart: z.string().trim().min(4, "Enter date YYYY-MM-DD"),

  currency: z.string().trim().min(2, "Currency required"),
  industry: z.string().trim().min(2, "Industry required"),
  companySize: z.string().trim().min(1, "Company size required"),
});

// ===============================
export default function CompanyPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof companyFormSchema>>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      name: "",
      address: "",
      registrationNumber: "",
      taxId: "",
      contactName: "",
      contactEmail: "",
      contactPhone: "",
      financialYearStart: "",
      currency: "",
      industry: "",
      companySize: "",
    },
  });

  // ===============================
  async function onSubmit(values: z.infer<typeof companyFormSchema>) {
    try {
      setIsSubmitting(true);
      console.log("📤 Sending Payload:", values);

      const res = await apiFetch("/api/v1/api/v1/company", {
        method: "POST",
        body: JSON.stringify(values),
      });

      const data = await res.json();

      if (!res.ok) {
        const msg =
          data?.detail?.[0]?.msg || // FastAPI validation error
          data?.message ||
          "Error saving company";

        toast.error(msg);
        return;
      }

      toast.success("Company saved successfully!");
      form.reset();
    } catch (err) {
      toast.error("Unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  // ===============================
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Company Creation</h1>

      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Create or Update Company</CardTitle>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

              {[
                ["name", "Company Name"],
                ["address", "Address"],
                ["registrationNumber", "Registration Number"],
                ["taxId", "Tax ID"],
                ["contactName", "Contact Name"],
                ["contactEmail", "Contact Email"],
                ["contactPhone", "Contact Phone"],
                ["financialYearStart", "Financial Year Start (YYYY-MM-DD)"],
                ["currency", "Currency"],
                ["industry", "Industry"],
                ["companySize", "Company Size"],
              ].map(([name, label]) => (
                <FormField
                  key={name}
                  control={form.control}
                  name={name as any}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{label}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Company
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
