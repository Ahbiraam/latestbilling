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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

// ✅ Enhanced Zod Validation Schema
const companyFormSchema = z
  .object({
    companyName: z.string().trim().min(2, "Company name is required"),
    addressLine1: z.string().trim().min(2, "Address Line 1 is required"),
    addressLine2: z.string().optional(),
    addressLine3: z.string().optional(),
    state: z.string().trim().min(2, "State is required"),
    country: z.string().trim().min(2, "Country is required"),
    contact1: z
      .string()
      .trim()
      .regex(/^[0-9]{10}$/, "Contact number must be 10 digits"),
    contact2: z
      .string()
      .optional()
      .refine((val) => !val || /^[0-9]{10}$/.test(val), {
        message: "Contact number must be 10 digits",
      }),
    contact3: z
      .string()
      .optional()
      .refine((val) => !val || /^[0-9]{10}$/.test(val), {
        message: "Contact number must be 10 digits",
      }),
    email: z
      .string()
      .trim()
      .email("Enter a valid email address"),

    gstApplicable: z.enum(["Yes", "No"]),
    gstNumber: z
      .string()
      .optional()
      .refine(
        (val) => !val || /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(val),
        { message: "Invalid GST number format" }
      ),
    gstStateCode: z
      .string()
      .optional()
      .refine(
        (val) => !val || /^[0-9]{2}$/.test(val),
        { message: "GST state code must be 2 digits" }
      ),
    gstCompounding: z.enum(["Yes", "No"]).optional(),

    panNumber: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN format (e.g., ABCDE1234F)"),

    groupCompany: z.enum(["Yes", "No"]),
    groupCode: z.string().optional(),

    bankName: z.string().trim().min(2, "Bank name is required"),
    branchName: z.string().trim().min(2, "Branch name is required"),
    accountNumber: z
      .string()
      .trim()
      .regex(/^[0-9]{6,18}$/, "Enter a valid account number (6–18 digits)"),
    ifscCode: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC code format"),
    upiId: z
      .string()
      .optional()
      .refine(
        (val) => !val || /^[\w.\-_]{2,}@[a-zA-Z]{2,}$/.test(val),
        { message: "Invalid UPI ID format (e.g., name@bank)" }
      ),
    upiMobile: z
      .string()
      .optional()
      .refine((val) => !val || /^[0-9]{10}$/.test(val), {
        message: "Mobile number must be 10 digits",
      }),
  })
  .refine(
    (data) =>
      data.gstApplicable === "No" ||
      (data.gstApplicable === "Yes" &&
        data.gstNumber &&
        data.gstStateCode),
    {
      message: "GST Number and State Code are required if GST is applicable",
      path: ["gstNumber"],
    }
  )
  .refine(
    (data) =>
      data.groupCompany === "No" ||
      (data.groupCompany === "Yes" && data.groupCode),
    {
      message: "Group Code is required if Group Company is Yes",
      path: ["groupCode"],
    }
  );

export default function CompanyPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<z.infer<typeof companyFormSchema>>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      companyName: "",
      addressLine1: "",
      addressLine2: "",
      addressLine3: "",
      state: "",
      country: "",
      contact1: "",
      contact2: "",
      contact3: "",
      email: "",
      gstApplicable: "No",
      gstNumber: "",
      gstStateCode: "",
      gstCompounding: "No",
      panNumber: "",
      groupCompany: "No",
      groupCode: "",
      bankName: "",
      branchName: "",
      accountNumber: "",
      ifscCode: "",
      upiId: "",
      upiMobile: "",
    },
  });

  async function onSubmit(values: z.infer<typeof companyFormSchema>) {
    try {
      setIsSubmitting(true);
      console.log("✅ Submitted Data:", values);
      toast.success("Company details saved successfully!");
      form.reset();
    } catch (error) {
      toast.error("Failed to save company details. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Company Creation</h1>
        <p className="text-muted-foreground">
          Fill in the company details as per client requirements.
        </p>
      </div>

      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

              {/* ---- Company Basic Info ---- */}
              <div className="grid gap-4 md:grid-cols-2">
                {[
                  ["companyName", "Company Name", "Enter company name"],
                  ["addressLine1", "Address Line 1", "Address line 1"],
                  ["addressLine2", "Address Line 2", "Address line 2"],
                  ["addressLine3", "Address Line 3", "Address line 3"],
                  ["state", "State", "Enter state"],
                  ["country", "Country", "Enter country"],
                  ["contact1", "Contact No 1", "Enter contact number"],
                  ["contact2", "Contact No 2", "Optional"],
                  ["contact3", "Contact No 3", "Optional"],
                  ["email", "Email ID", "Enter email ID"],
                ].map(([name, label, placeholder]) => (
                  <FormField
                    key={name}
                    control={form.control}
                    name={name as any}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{label}</FormLabel>
                        <FormControl>
                          <Input placeholder={placeholder} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>

              {/* ---- GST Section ---- */}
              <div>
                <h2 className="text-lg font-semibold mb-2">GST Information</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="gstApplicable"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>GST Applicable</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Yes or No" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Yes">Yes</SelectItem>
                            <SelectItem value="No">No</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.watch("gstApplicable") === "Yes" && (
                    <>
                      <FormField
                        control={form.control}
                        name="gstNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>GST Number</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter GST number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="gstStateCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>GST State Code</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter GST state code" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                </div>
              </div>

              {/* ---- PAN & Group Section ---- */}
              <div>
                <h2 className="text-lg font-semibold mb-2">Other Information</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="panNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>PAN Number</FormLabel>
                        <FormControl>
                          <Input placeholder="ABCDE1234F" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="groupCompany"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Group Company</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Yes or No" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Yes">Yes</SelectItem>
                            <SelectItem value="No">No</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.watch("groupCompany") === "Yes" && (
                    <FormField
                      control={form.control}
                      name="groupCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Group Code</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter group code" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </div>

              {/* ---- Bank Section ---- */}
              <div>
                <h2 className="text-lg font-semibold mb-2">Bank Information</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {[
                    ["bankName", "Bank Name", "Enter bank name"],
                    ["branchName", "Branch Name", "Enter branch name"],
                    ["accountNumber", "Account Number", "Enter account number"],
                    ["ifscCode", "IFSC Code", "Enter IFSC code"],
                    ["upiId", "UPI ID", "e.g., name@bank"],
                    ["upiMobile", "UPI Mobile No", "Enter UPI mobile number"],
                  ].map(([name, label, placeholder]) => (
                    <FormField
                      key={name}
                      control={form.control}
                      name={name as any}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{label}</FormLabel>
                          <FormControl>
                            <Input placeholder={placeholder} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </div>

              {/* ---- Submit Buttons ---- */}
              <div className="flex justify-end gap-4">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => form.reset()}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save Company
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
