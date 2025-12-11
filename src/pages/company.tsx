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
import { cn } from "@/lib/utils";

import { useState } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";

// ⭐ React Router navigation
import { useNavigate } from "react-router-dom";

// =======================================
// VALIDATION SCHEMA
// =======================================
const companyFormSchema = z
  .object({
    name: z.string().min(2, "Company name required"),

    addressLine1: z.string().min(2),
    addressLine2: z.string().optional(),
    addressLine3: z.string().optional(),
    state: z.string().min(2),
    country: z.string().min(2),

    contactNo1: z.string().min(10),
    contactNo2: z.string().optional(),
    contactNo3: z.string().optional(),

    PAN: z.string().min(10, "Invalid PAN"),

    financialYearFrom: z.date(),
    financialYearTo: z.date(),

    GSTApplicable: z.enum(["Yes", "No"]),
    GSTNumber: z.string().optional(),
    GSTStateCode: z.string().optional(),
    GSTCompounding: z.enum(["Yes", "No"]),

    groupCompany: z.enum(["Yes", "No"]),
    groupCode: z.string().optional(),

    bankName: z.string().min(2),
    branchName: z.string().min(2),
    bankAccountNo: z.string().min(3),
    IFSC: z.string().min(3),
    UPI: z.string().optional(),
    UPIMobile: z.string().optional(),
  })
  .refine((data) => data.GSTApplicable === "No" || !!data.GSTNumber, {
    message: "GST Number is required",
    path: ["GSTNumber"],
  })
  .refine((data) => data.GSTApplicable === "No" || !!data.GSTStateCode, {
    message: "GST State Code is required",
    path: ["GSTStateCode"],
  })
  .refine((data) => data.groupCompany === "No" || !!data.groupCode, {
    message: "Group Code required",
    path: ["groupCode"],
  });

// =======================================
// COMPONENT
// =======================================
export default function CompanyPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate(); // ⭐ React Router navigation

  const form = useForm({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      GSTApplicable: "No",
      GSTCompounding: "No",
      groupCompany: "No",
      financialYearFrom: new Date(),
      financialYearTo: new Date(),
    },
  });

  // =======================================
  // SUBMIT HANDLER
  // =======================================
  async function onSubmit(values: any) {
    try {
      setIsSubmitting(true);

      const payload = {
        PAN: values.PAN,
        addressLine1: values.addressLine1,
        addressLine2: values.addressLine2 || null,
        addressLine3: values.addressLine3 || null,
        state: values.state,
        country: values.country,

        companyName: values.name,

        contactNo1: values.contactNo1,
        contactNo2: values.contactNo2 || null,
        contactNo3: values.contactNo3 || null,

        financialYearFrom: format(values.financialYearFrom, "yyyy-MM-dd"),
        financialYearTo: format(values.financialYearTo, "yyyy-MM-dd"),

        gstApplicable: values.GSTApplicable === "Yes",
        gstNumber: values.GSTApplicable === "Yes" ? values.GSTNumber : null,
        gstStateCode: values.GSTApplicable === "Yes" ? values.GSTStateCode : null,
        gstCompoundingCompany: values.GSTCompounding === "Yes",

        groupCompany: values.groupCompany === "Yes",
        groupCode: values.groupCompany === "Yes" ? values.groupCode : null,

        bankDetails: {
          bankName: values.bankName,
          branchName: values.branchName,
          accountNumber: values.bankAccountNo,
          ifscCode: values.IFSC,
          upiId: values.UPI || null,
          upiMobileNo: values.UPIMobile || null,
        },
      };

      // ⭐ CORRECT BACKEND ENDPOINT (from your screenshot)
      const res = await apiFetch("/api/v1/api/v1/company", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data?.message || "Error saving company.");
        return;
      }

      toast.success("Company created successfully!");
      form.reset();

      // ⭐ Redirect after success
      setTimeout(() => {
        navigate("/dashboard");
      }, 500);

    } catch (err) {
      toast.error("Unexpected server error");
    } finally {
      setIsSubmitting(false);
    }
  }

  // =======================================
  // UI FORM
  // =======================================
  return (
    <div className="p-10">
      <Card className="max-w-5xl mx-auto shadow-xl border border-gray-200">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Company Creation</CardTitle>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form className="space-y-10" onSubmit={form.handleSubmit(onSubmit)}>

              {/* -------------------------------------- */}
              {/* ADDRESS DETAILS */}
              {/* -------------------------------------- */}
              <section>
                <h2 className="text-xl font-semibold mb-4">Address Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    ["addressLine1", "Address Line 1"],
                    ["addressLine2", "Address Line 2"],
                    ["addressLine3", "Address Line 3"],
                    ["state", "State"],
                    ["country", "Country"],
                    ["contactNo1", "Contact No 1"],
                    ["contactNo2", "Contact No 2"],
                    ["contactNo3", "Contact No 3"],
                  ].map(([name, label]) => (
                    <FormField
                      key={name}
                      control={form.control}
                      name={name as any}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{label}</FormLabel>
                          <FormControl><Input {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </section>

              {/* -------------------------------------- */}
              {/* COMPANY DETAILS */}
              {/* -------------------------------------- */}
              <section>
                <h2 className="text-xl font-semibold mb-4">Company Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  {[
                    ["name", "Company Name"],
                    ["PAN", "PAN Number"],
                  ].map(([name, label]) => (
                    <FormField
                      key={name}
                      control={form.control}
                      name={name as any}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{label}</FormLabel>
                          <FormControl><Input {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}

                  {/* FINANCIAL YEAR FROM */}
                  <FormField
                    control={form.control}
                    name="financialYearFrom"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Financial Year From</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start">
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? format(field.value, "PPP") : "Pick a date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="p-0">
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

                  {/* FINANCIAL YEAR TO */}
                  <FormField
                    control={form.control}
                    name="financialYearTo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Financial Year To</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start">
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? format(field.value, "PPP") : "Pick a date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="p-0">
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
              </section>

              {/* -------------------------------------- */}
              {/* GST DETAILS */}
              {/* -------------------------------------- */}
              <section>
                <h2 className="text-xl font-semibold mb-4">GST Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  {/* GST APPLICABLE */}
                  <FormField
                    control={form.control}
                    name="GSTApplicable"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>GST Applicable</FormLabel>
                        <FormControl>
                          <select {...field} className="border p-2 rounded w-full">
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                          </select>
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {form.watch("GSTApplicable") === "Yes" && (
                    <>
                      <FormField
                        control={form.control}
                        name="GSTNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>GST Number</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="GSTStateCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>GST State Code</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}

                  <FormField
                    control={form.control}
                    name="GSTCompounding"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>GST Compounding Company</FormLabel>
                        <FormControl>
                          <select {...field} className="border p-2 rounded w-full">
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                          </select>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </section>

              {/* -------------------------------------- */}
              {/* GROUP COMPANY */}
              {/* -------------------------------------- */}
              <section>
                <h2 className="text-xl font-semibold mb-4">Group Company</h2>

                <FormField
                  control={form.control}
                  name="groupCompany"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Is Group Company?</FormLabel>
                      <FormControl>
                        <select {...field} className="border p-2 rounded w-full">
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </FormControl>
                    </FormItem>
                  )}
                />

                {form.watch("groupCompany") === "Yes" && (
                  <FormField
                    control={form.control}
                    name="groupCode"
                    render={({ field }) => (
                      <FormItem className="mt-4">
                        <FormLabel>Group Code</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </section>

              {/* -------------------------------------- */}
              {/* BANK DETAILS */}
              {/* -------------------------------------- */}
              <section>
                <h2 className="text-xl font-semibold mb-4">Bank Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  {[
                    ["bankName", "Bank Name"],
                    ["branchName", "Branch Name"],
                    ["bankAccountNo", "Bank Account No"],
                    ["IFSC", "IFSC Code"],
                    ["UPI", "UPI ID"],
                    ["UPIMobile", "UPI Mobile Number"],
                  ].map(([name, label]) => (
                    <FormField
                      key={name}
                      control={form.control}
                      name={name as any}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{label}</FormLabel>
                          <FormControl><Input {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}

                </div>
              </section>

              {/* -------------------------------------- */}
              {/* SUBMIT BUTTON */}
              {/* -------------------------------------- */}
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
