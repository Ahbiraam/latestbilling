import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
import { Switch } from "@/components/ui/switch";
import { Search, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { ServiceType, ClientType } from "@/lib/types";

// Mock data
const mockServiceTypes: ServiceType[] = [
  {
    id: "1",
    code: "CONS",
    name: "Consulting",
    description: "Professional consulting services",
    taxRate: 18,
    isActive: true,
  },
  {
    id: "2",
    code: "MAINT",
    name: "Maintenance",
    description: "Regular maintenance services",
    taxRate: 12,
    isActive: true,
  },
];

const mockClientTypes: ClientType[] = [
  {
    id: "1",
    code: "CORP",
    name: "Corporate",
    description: "Large corporate clients",
    paymentTerms: 30,
    isActive: true,
  },
  {
    id: "2",
    code: "SME",
    name: "Small Business",
    description: "Small and medium enterprises",
    paymentTerms: 15,
    isActive: true,
  },
];

const serviceTypeSchema = z.object({
  code: z.string().min(2, "Code must be at least 2 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().min(5, "Description must be at least 5 characters"),
  taxRate: z.number().min(0).max(100, "Tax rate must be between 0 and 100"),
  isActive: z.boolean(),
});

const clientTypeSchema = z.object({
  code: z.string().min(2, "Code must be at least 2 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().min(5, "Description must be at least 5 characters"),
  paymentTerms: z.number().min(0, "Payment terms must be positive"),
  isActive: z.boolean(),
});

export default function ServiceTypesPage() {
  const [activeTab, setActiveTab] = useState("service");
  const [serviceTypes, setServiceTypes] = useState(mockServiceTypes);
  const [clientTypes, setClientTypes] = useState(mockClientTypes);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const serviceTypeForm = useForm<z.infer<typeof serviceTypeSchema>>({
    resolver: zodResolver(serviceTypeSchema),
    defaultValues: {
      code: "",
      name: "",
      description: "",
      taxRate: 0,
      isActive: true,
    },
  });

  const clientTypeForm = useForm<z.infer<typeof clientTypeSchema>>({
    resolver: zodResolver(clientTypeSchema),
    defaultValues: {
      code: "",
      name: "",
      description: "",
      paymentTerms: 30,
      isActive: true,
    },
  });

  const filteredServiceTypes = serviceTypes.filter(
    (type) =>
      type.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      type.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredClientTypes = clientTypes.filter(
    (type) =>
      type.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      type.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  async function onSubmitServiceType(values: z.infer<typeof serviceTypeSchema>) {
    try {
      setIsSubmitting(true);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      setServiceTypes([
        ...serviceTypes,
        { id: String(serviceTypes.length + 1), ...values },
      ]);
      
      toast.success("Service type created successfully");
      serviceTypeForm.reset();
      setIsDialogOpen(false);
    } catch (error) {
      toast.error("Failed to create service type");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function onSubmitClientType(values: z.infer<typeof clientTypeSchema>) {
    try {
      setIsSubmitting(true);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      setClientTypes([
        ...clientTypes,
        { id: String(clientTypes.length + 1), ...values },
      ]);
      
      toast.success("Client type created successfully");
      clientTypeForm.reset();
      setIsDialogOpen(false);
    } catch (error) {
      toast.error("Failed to create client type");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string, type: "service" | "client") {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      if (type === "service") {
        setServiceTypes(serviceTypes.filter((t) => t.id !== id));
        toast.success("Service type deleted successfully");
      } else {
        setClientTypes(clientTypes.filter((t) => t.id !== id));
        toast.success("Client type deleted successfully");
      }
    } catch (error) {
      toast.error(`Failed to delete ${type} type`);
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1>Service & Client Types</h1>
        <p className="text-muted-foreground">
          Manage service types and client categories
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="service">Service Types</TabsTrigger>
            <TabsTrigger value="client">Client Types</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search types..."
                className="pl-8 w-[250px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Type
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {activeTab === "service"
                      ? "Add Service Type"
                      : "Add Client Type"}
                  </DialogTitle>
                  <DialogDescription>
                    {activeTab === "service"
                      ? "Create a new service type with its details"
                      : "Create a new client type with its details"}
                  </DialogDescription>
                </DialogHeader>

                {activeTab === "service" ? (
                  <Form {...serviceTypeForm}>
                    <form
                      onSubmit={serviceTypeForm.handleSubmit(onSubmitServiceType)}
                      className="space-y-4"
                    >
                      <FormField
                        control={serviceTypeForm.control}
                        name="code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Code</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter code" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={serviceTypeForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={serviceTypeForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter description"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={serviceTypeForm.control}
                        name="taxRate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tax Rate (%)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="Enter tax rate"
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
                        control={serviceTypeForm.control}
                        name="isActive"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel>Active Status</FormLabel>
                              <p className="text-sm text-muted-foreground">
                                Enable if this service type is currently active
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

                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                          {isSubmitting && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Create Service Type
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                ) : (
                  <Form {...clientTypeForm}>
                    <form
                      onSubmit={clientTypeForm.handleSubmit(onSubmitClientType)}
                      className="space-y-4"
                    >
                      <FormField
                        control={clientTypeForm.control}
                        name="code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Code</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter code" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={clientTypeForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={clientTypeForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter description"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={clientTypeForm.control}
                        name="paymentTerms"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Payment Terms (days)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="Enter payment terms"
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
                        control={clientTypeForm.control}
                        name="isActive"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel>Active Status</FormLabel>
                              <p className="text-sm text-muted-foreground">
                                Enable if this client type is currently active
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

                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                          {isSubmitting && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Create Client Type
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <TabsContent value="service" className="mt-0">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Tax Rate</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredServiceTypes.map((type) => (
                  <TableRow key={type.id}>
                    <TableCell className="font-medium">{type.code}</TableCell>
                    <TableCell>{type.name}</TableCell>
                    <TableCell>{type.description}</TableCell>
                    <TableCell>{type.taxRate}%</TableCell>
                    <TableCell>
                      <Switch checked={type.isActive} disabled />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete Service Type
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this service type?
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  handleDelete(type.id, "service")
                                }
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="client" className="mt-0">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Payment Terms</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClientTypes.map((type) => (
                  <TableRow key={type.id}>
                    <TableCell className="font-medium">{type.code}</TableCell>
                    <TableCell>{type.name}</TableCell>
                    <TableCell>{type.description}</TableCell>
                    <TableCell>{type.paymentTerms} days</TableCell>
                    <TableCell>
                      <Switch checked={type.isActive} disabled />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete Client Type
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this client type?
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(type.id, "client")}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}