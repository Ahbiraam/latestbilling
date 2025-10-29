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

const taxRateSchema = z.object({
  category: z.string().min(1, "Tax category is required"),
  rate: z.number().min(0).max(100, "Tax rate must be between 0 and 100"),
  effectiveFrom: z.date({
    required_error: "Effective date is required",
  }),
  description: z.string().optional(),
});

const gstFormSchema = z.object({
  isGstApplicable: z.boolean(),
  gstNumber: z.string().min(15, "GST number must be 15 characters").optional(),
  effectiveDate: z.date({
    required_error: "Effective date is required",
  }),
  defaultRate: z.number().min(0).max(100, "Tax rate must be between 0 and 100"),
  displayFormat: z.string().min(1, "Display format is required"),
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

  const form = useForm<z.infer<typeof gstFormSchema>>({
    resolver: zodResolver(gstFormSchema),
    defaultValues: {
      isGstApplicable: false,
      defaultRate: 0,
      displayFormat: "GST-###-###",
      filingFrequency: "MONTHLY",
      taxRates: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "taxRates",
  });

  const isGstApplicable = form.watch("isGstApplicable");

  async function onSubmit(values: z.infer<typeof gstFormSchema>) {
    try {
      setIsSubmitting(true);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      console.log(values);
      toast.success("GST settings saved successfully!");
    } catch (error) {
      toast.error("Failed to save GST settings. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1>GST Settings</h1>
        <p className="text-muted-foreground">
          Configure GST parameters and tax rates for your company
        </p>
      </div>

      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Tax Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="isGstApplicable"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">GST Applicable</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Enable if your company is registered for GST
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {isGstApplicable && (
                <div className="space-y-8">
                  <div className="grid gap-6 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="gstNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>GST Registration Number</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter GST number"
                              {...field}
                              maxLength={15}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="effectiveDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>GST Effective Date</FormLabel>
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
                                  date > new Date() ||
                                  date < new Date("1900-01-01")
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
                      name="defaultRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Default Tax Rate (%)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Enter default rate"
                              {...field}
                              onChange={(e) =>
                                field.onChange(Number(e.target.value))
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="displayFormat"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tax ID Display Format</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter display format"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="filingFrequency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Filing Frequency</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select frequency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {filingFrequencies.map((frequency) => (
                                <SelectItem
                                  key={frequency.value}
                                  value={frequency.value}
                                >
                                  {frequency.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
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
                        <Plus className="mr-2 h-4 w-4" />
                        Add Tax Rate
                      </Button>
                    </div>

                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Category</TableHead>
                            <TableHead>Rate (%)</TableHead>
                            <TableHead>Effective From</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {fields.map((field, index) => (
                            <TableRow key={field.id}>
                              <TableCell>
                                <FormField
                                  control={form.control}
                                  name={`taxRates.${index}.category`}
                                  render={({ field }) => (
                                    <Select
                                      onValueChange={field.onChange}
                                      defaultValue={field.value}
                                    >
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {taxCategories.map((category) => (
                                          <SelectItem
                                            key={category}
                                            value={category}
                                          >
                                            {category}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <FormField
                                  control={form.control}
                                  name={`taxRates.${index}.rate`}
                                  render={({ field }) => (
                                    <Input
                                      type="number"
                                      {...field}
                                      onChange={(e) =>
                                        field.onChange(Number(e.target.value))
                                      }
                                    />
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <FormField
                                  control={form.control}
                                  name={`taxRates.${index}.effectiveFrom`}
                                  render={({ field }) => (
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <Button
                                          variant="outline"
                                          className={cn(
                                            "w-full pl-3 text-left font-normal",
                                            !field.value &&
                                              "text-muted-foreground"
                                          )}
                                        >
                                          {field.value ? (
                                            format(field.value, "PPP")
                                          ) : (
                                            <span>Pick a date</span>
                                          )}
                                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                      </PopoverTrigger>
                                      <PopoverContent
                                        className="w-auto p-0"
                                        align="start"
                                      >
                                        <Calendar
                                          mode="single"
                                          selected={field.value}
                                          onSelect={field.onChange}
                                          disabled={(date) =>
                                            date > new Date() ||
                                            date < new Date("1900-01-01")
                                          }
                                          initialFocus
                                        />
                                      </PopoverContent>
                                    </Popover>
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <FormField
                                  control={form.control}
                                  name={`taxRates.${index}.description`}
                                  render={({ field }) => (
                                    <Input {...field} />
                                  )}
                                />
                              </TableCell>
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

              <div className="flex justify-end gap-4">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => form.reset()}
                >
                  Reset
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
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