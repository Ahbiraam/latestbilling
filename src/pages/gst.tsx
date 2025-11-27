"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
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

import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";

import { useNavigate } from "react-router-dom"; // ⭐ React Router for Vite

// =======================
//    ZOD SCHEMAS
// =======================
const taxRateSchema = z.object({
  category: z.string().min(1, "Tax category is required"),
  rate: z.number().min(0).max(100),
  effectiveFrom: z.date(),
  description: z.string().optional(),
});

const gstFormSchema = z.object({
  isGstApplicable: z.boolean(),
  gstNumber: z.string().length(15, "GST number must be exactly 15 characters").optional(),
  effectiveDate: z.date(),
  defaultRate: z.number().min(0).max(100),
  displayFormat: z.enum(["Inclusive", "Exclusive"]),
  filingFrequency: z.enum(["MONTHLY", "QUARTERLY", "ANNUALLY"]),
  taxRates: z.array(taxRateSchema),
});

const taxCategories = [
  "Standard Rate",
  "Zero Rate",
  "Exempt",
  "Reduced Rate",
  "Special Rate",
];

const filingFrequencies = [
  { value: "MONTHLY", label: "Monthly" },
  { value: "QUARTERLY", label: "Quarterly" },
  { value: "ANNUALLY", label: "Annually" },
];

export default function GstPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate(); // ⭐ useNavigate for redirect

  const form = useForm({
    resolver: zodResolver(gstFormSchema),
    defaultValues: {
      isGstApplicable: false,
      gstNumber: "",
      defaultRate: 0,
      displayFormat: "Inclusive",
      filingFrequency: "MONTHLY",
      taxRates: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "taxRates",
  });

  const isGstApplicable = form.watch("isGstApplicable");

  // ======================
  //     SUBMIT
  // ======================
  async function onSubmit(values) {
    try {
      setIsSubmitting(true);

      const payload = {
        isGstApplicable: values.isGstApplicable,
        gstNumber: values.isGstApplicable ? values.gstNumber : null,
        effectiveDate: values.effectiveDate.toISOString().split("T")[0],
        defaultRate: values.defaultRate,
        displayFormat: values.displayFormat,
        filingFrequency: values.filingFrequency,

        taxRates: values.taxRates.map((rate) => ({
          ...rate,
          effectiveFrom: rate.effectiveFrom.toISOString().split("T")[0],
        })),
      };

      const res = await apiFetch("/api/v1/api/v1/gst-settings", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to save GST settings");
      }

      toast.success("GST settings saved successfully!");

      // ⭐ Redirect to Dashboard (Vite React)
      setTimeout(() => navigate("/dashboard"), 800);

    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">GST Settings</h1>
        <p className="text-muted-foreground">
          Configure GST parameters and tax rates for your company.
        </p>
      </div>

      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Tax Configuration</CardTitle>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

              {/* GST Switch */}
              <FormField
                control={form.control}
                name="isGstApplicable"
                render={({ field }) => (
                  <FormItem className="flex justify-between items-center border p-4 rounded-lg">
                    <div>
                      <FormLabel>GST Applicable</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Enable if your company is registered for GST
                      </p>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* GST FIELDS */}
              {isGstApplicable && (
                <div className="space-y-8">
                  <div className="grid gap-6 md:grid-cols-2">

                    {/* GST Number */}
                    <FormField
                      control={form.control}
                      name="gstNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>GST Number</FormLabel>
                          <FormControl>
                            <Input {...field} maxLength={15} placeholder="22AAAAA0000A1Z5" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Effective Date */}
                    <FormField
                      control={form.control}
                      name="effectiveDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Effective Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button variant="outline" className="w-full justify-start">
                                  {field.value ? format(field.value, "PPP") : "Pick a date"}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent align="start" className="p-0">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Default Rate */}
                    <FormField
                      control={form.control}
                      name="defaultRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Default Tax Rate (%)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Display Format */}
                    <FormField
                      control={form.control}
                      name="displayFormat"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Display Format</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Inclusive">Inclusive</SelectItem>
                              <SelectItem value="Exclusive">Exclusive</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Filing Frequency */}
                    <FormField
                      control={form.control}
                      name="filingFrequency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Filing Frequency</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {filingFrequencies.map((f) => (
                                <SelectItem key={f.value} value={f.value}>
                                  {f.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* TAX RATES */}
                  <div className="space-y-4">

                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium">Tax Rates</h3>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          append({
                            category: "",
                            rate: 0,
                            effectiveFrom: new Date(),
                            description: "",
                          })
                        }
                      >
                        <Plus className="mr-2 h-4 w-4" /> Add Tax Rate
                      </Button>
                    </div>

                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Category</TableHead>
                            <TableHead>Rate (%)</TableHead>
                            <TableHead>Effective From</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead />
                          </TableRow>
                        </TableHeader>

                        <TableBody>
                          {fields.map((item, index) => (
                            <TableRow key={item.id}>

                              {/* Category */}
                              <TableCell>
                                <FormField
                                  control={form.control}
                                  name={`taxRates.${index}.category`}
                                  render={({ field }) => (
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Category" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {taxCategories.map((c) => (
                                          <SelectItem key={c} value={c}>
                                            {c}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  )}
                                />
                              </TableCell>

                              {/* Rate */}
                              <TableCell>
                                <FormField
                                  control={form.control}
                                  name={`taxRates.${index}.rate`}
                                  render={({ field }) => (
                                    <Input
                                      type="number"
                                      {...field}
                                      onChange={(e) => field.onChange(Number(e.target.value))}
                                    />
                                  )}
                                />
                              </TableCell>

                              {/* Effective Date */}
                              <TableCell>
                                <FormField
                                  control={form.control}
                                  name={`taxRates.${index}.effectiveFrom`}
                                  render={({ field }) => (
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <Button variant="outline" className="w-full justify-start">
                                          {field.value ? format(field.value, "PPP") : "Pick a date"}
                                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                      </PopoverTrigger>
                                      <PopoverContent align="start" className="p-0">
                                        <Calendar
                                          mode="single"
                                          selected={field.value}
                                          onSelect={field.onChange}
                                        />
                                      </PopoverContent>
                                    </Popover>
                                  )}
                                />
                              </TableCell>

                              {/* Description */}
                              <TableCell>
                                <FormField
                                  control={form.control}
                                  name={`taxRates.${index}.description`}
                                  render={({ field }) => <Input {...field} />}
                                />
                              </TableCell>

                              {/* Remove */}
                              <TableCell>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => remove(index)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </TableCell>

                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                  </div>
                </div>
              )}

              {/* BUTTONS */}
              <div className="flex justify-end gap-4">
                <Button variant="outline" type="button" onClick={() => form.reset()}>
                  Reset
                </Button>

                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </div>

            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
