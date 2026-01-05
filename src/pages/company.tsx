"use client";

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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { useNavigate } from "react-router-dom";

/* =====================================
   VALIDATION SCHEMA
===================================== */
const companyFormSchema = z
  .object({
    name: z.string().min(2, "Company name required"),
    PAN: z.string().min(10, "PAN required"),

    addressLine1: z.string().min(2),
    addressLine2: z.string().optional(),
    addressLine3: z.string().optional(),
    state: z.string().min(2),
    country: z.string().min(2),

    contactNo1: z.string().min(10),
    contactNo2: z.string().optional(),
    contactNo3: z.string().optional(),

    financialYearFrom: z.date(),
    financialYearTo: z.date(),

    GSTApplicable: z.enum(["Yes", "No"]),
    GSTNumber: z.string().optional(),
    GSTStateCode: z.string().optional(),
    GSTCompounding: z.enum(["Yes", "No"]).optional(),

    groupCompany: z.enum(["Yes", "No"]),
    groupCode: z.string().optional(),

    bankName: z.string().min(2),
    branchName: z.string().min(2),
    bankAccountNo: z.string().min(3),
    IFSC: z.string().min(3),
    UPI: z.string().optional(),
    UPIMobile: z.string().optional(),
  })
  .refine((d) => d.GSTApplicable === "No" || !!d.GSTNumber, {
    path: ["GSTNumber"],
    message: "GST Number is required",
  })
  .refine((d) => d.GSTApplicable === "No" || !!d.GSTStateCode, {
    path: ["GSTStateCode"],
    message: "GST State Code is required",
  })
  .refine((d) => d.GSTApplicable === "No" || d.GSTCompounding !== undefined, {
    path: ["GSTCompounding"],
    message: "GST Composition Company is required",
  })
  .refine((d) => d.groupCompany === "No" || !!d.groupCode, {
    path: ["groupCode"],
    message: "Group Code required",
  });

/* =====================================
   COMPONENT
===================================== */
export default function CompanyPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const form = useForm({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      GSTApplicable: "No",
      groupCompany: "No",
      financialYearFrom: new Date(),
      financialYearTo: new Date(),
    },
  });

  /* =====================================
     SUBMIT HANDLER
  ===================================== */
  async function onSubmit(values: any) {
    try {
      setIsSubmitting(true);

      const payload = {
        companyName: values.name,
        PAN: values.PAN,

        addressLine1: values.addressLine1,
        addressLine2: values.addressLine2 || null,
        addressLine3: values.addressLine3 || null,
        state: values.state,
        country: values.country,

        contactNo1: values.contactNo1,
        contactNo2: values.contactNo2 || null,
        contactNo3: values.contactNo3 || null,

        // ✅ DATE ONLY (NO TIME)
        financialYearFrom: format(values.financialYearFrom, "yyyy-MM-dd"),
        financialYearTo: format(values.financialYearTo, "yyyy-MM-dd"),

        // ✅ BOOLEAN ONLY
        gstApplicable: values.GSTApplicable === "Yes",
        gstNumber: values.GSTApplicable === "Yes" ? values.GSTNumber : null,
        gstStateCode:
          values.GSTApplicable === "Yes" ? values.GSTStateCode : null,
        gstCompoundingCompany:
          values.GSTApplicable === "Yes"
            ? values.GSTCompounding === "Yes"
            : false,

        groupCompany: values.groupCompany === "Yes",
        groupCode:
          values.groupCompany === "Yes" ? values.groupCode : null,

        bankDetails: {
          bankName: values.bankName,
          branchName: values.branchName,
          accountNumber: values.bankAccountNo,
          ifscCode: values.IFSC,
          upiId: values.UPI || null,
          upiMobileNo: values.UPIMobile || null,
        },
      };

      const res = await apiFetch("/api/v1/api/v1/company", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        let errorMessage = "Failed to save company";

        if (typeof data?.detail === "string") {
          errorMessage = data.detail;
        } else if (Array.isArray(data?.detail)) {
          errorMessage = data.detail.map((e: any) => e.msg).join(", ");
        }

        toast.error(errorMessage);
        return;
      }

      toast.success("Company saved successfully");

      // ✅ REDIRECT AFTER SAVE
      setTimeout(() => {
        navigate("/dashboard");
      }, 800);

    } catch {
      toast.error("Unexpected server error");
    } finally {
      setIsSubmitting(false);
    }
  }

  /* =====================================
     UI
  ===================================== */
  return (
    <div className="p-10">
      <Card className="max-w-5xl mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            Company Creation
          </CardTitle>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">

              {/* COMPANY DETAILS */}
              <Section title="Company Details">
                <InputField form={form} name="name" label="Company Name" />
                <InputField form={form} name="PAN" label="PAN Number" />
              </Section>

              {/* ADDRESS DETAILS */}
              <Section title="Address Details">
                <InputField form={form} name="addressLine1" label="Address Line 1" />
                <InputField form={form} name="addressLine2" label="Address Line 2" />
                <InputField form={form} name="addressLine3" label="Address Line 3" />
                <InputField form={form} name="state" label="State" />
                <InputField form={form} name="country" label="Country" />
              </Section>

              {/* CONTACT DETAILS */}
              <Section title="Contact Details">
                <NumericInput form={form} name="contactNo1" label="Contact No 1" />
                <NumericInput form={form} name="contactNo2" label="Contact No 2" />
                <NumericInput form={form} name="contactNo3" label="Contact No 3" />
              </Section>

              {/* FINANCIAL YEAR */}
              <section>
                <h2 className="text-xl font-semibold mb-4">
                  Financial Year (From – To)
                </h2>
                <FormField
                  name="financialYearFrom"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>From Month</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {format(field.value, "MMM yyyy")}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="p-0">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={(date) => {
                              if (!date) return;
                              const from = new Date(date);
                              const to = new Date(from);
                              to.setMonth(from.getMonth() + 11);
                              form.setValue("financialYearFrom", from);
                              form.setValue("financialYearTo", to);
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                      <p className="text-sm text-gray-500">
                        To month auto-calculated
                      </p>
                    </FormItem>
                  )}
                />
              </section>

              {/* GST DETAILS */}
              <section>
                <h2 className="text-xl font-semibold mb-4">GST Details</h2>

                <SelectField
                  form={form}
                  name="GSTApplicable"
                  label="GST Applicable"
                  options={["Yes", "No"]}
                />

             {form.watch("GSTApplicable") === "Yes" && (
  <div className="grid md:grid-cols-2 gap-6 mt-4">

    {/* GST NUMBER – ALPHANUMERIC */}
    <InputField
      form={form}
      name="GSTNumber"
      label="GST Number (15 characters)"
    />

    {/* GST STATE CODE – NUMERIC ONLY */}
    <NumericInput
      form={form}
      name="GSTStateCode"
      label="GST Registration State Code"
    />

    <SelectField
      form={form}
      name="GSTCompounding"
      label="GST Composition Company"
      options={["Yes", "No"]}
    />
  </div>
)}

              </section>

              {/* GROUP COMPANY */}
              <section>
                <h2 className="text-xl font-semibold mb-4">Group Company</h2>

                <SelectField
                  form={form}
                  name="groupCompany"
                  label="Is Group Company?"
                  options={["Yes", "No"]}
                />

                {form.watch("groupCompany") === "Yes" && (
                  <InputField
                    form={form}
                    name="groupCode"
                    label="Group Code"
                  />
                )}
              </section>

              {/* BANK DETAILS */}
              <Section title="Bank Details">
                <InputField form={form} name="bankName" label="Bank Name" />
                <InputField form={form} name="branchName" label="Branch Name" />
                <NumericInput form={form} name="bankAccountNo" label="Bank Account No" />
                <InputField form={form} name="IFSC" label="IFSC Code" />
                <InputField form={form} name="UPI" label="UPI ID" />
                <NumericInput form={form} name="UPIMobile" label="UPI Mobile" />
              </Section>

              {/* SUBMIT */}
              <Button className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Company
              </Button>

            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

/* =====================================
   REUSABLE COMPONENTS
===================================== */
function Section({ title, children }: any) {
  return (
    <section>
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      <div className="grid md:grid-cols-2 gap-6">{children}</div>
    </section>
  );
}

function InputField({ form, name, label }: any) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl><Input {...field} /></FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function NumericInput({ form, name, label }: any) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              {...field}
              onChange={(e) =>
                field.onChange(e.target.value.replace(/\D/g, ""))
              }
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function SelectField({ form, name, label, options }: any) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <select {...field} className="border p-2 rounded w-full">
              {options.map((o: string) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
