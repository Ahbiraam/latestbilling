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

/**
 * Types (simplified)
 */
type Company = { id: string; name: string };
type ServiceType = {
  id: string;
  companyId: string;
  code: string;
  name: string;
  description: string;
  taxRate: number;
  isActive: boolean;
};
type CustomerType = {
  id: string;
  companyId: string;
  code: string;
  name: string;
  description: string;
  paymentTerms: number;
  isActive: boolean;
};
type AccountsManager = {
  id: string;
  companyId: string;
  name: string;
  email: string;
  phone?: string;
  isActive: boolean;
};

/**
 * Mock companies & current user (simulate multi-company + admin rights)
 * In real app, replace `currentUser` with auth context and fetch companies from API
 */
const companies: Company[] = [
  { id: "c1", name: "Alpha Corp" },
  { id: "c2", name: "Beta Pvt Ltd" },
];

// currentUser simulates logged-in user; change `companyId` to test different company view
const currentUser = {
  id: "u1",
  name: "Admin User",
  companyId: "c1", // user belongs to company c1
  isAdmin: true, // controls whether user can create/edit/inactivate
};

/**
 * Initial mock data (company-specific)
 */
const initialServiceTypes: ServiceType[] = [
  {
    id: "s1",
    companyId: "c1",
    code: "CONS",
    name: "Consulting",
    description: "Professional consulting services",
    taxRate: 18,
    isActive: true,
  },
  {
    id: "s2",
    companyId: "c2",
    code: "MAINT",
    name: "Maintenance",
    description: "Regular maintenance services",
    taxRate: 12,
    isActive: true,
  },
];

const initialCustomerTypes: CustomerType[] = [
  {
    id: "ct1",
    companyId: "c1",
    code: "CORP",
    name: "Corporate",
    description: "Large corporate clients",
    paymentTerms: 30,
    isActive: true,
  },
  {
    id: "ct2",
    companyId: "c2",
    code: "SME",
    name: "Small Business",
    description: "Small and medium enterprises",
    paymentTerms: 15,
    isActive: true,
  },
];

const initialAccountsManagers: AccountsManager[] = [
  {
    id: "am1",
    companyId: "c1",
    name: "Ravi Kumar",
    email: "ravi@alpha.com",
    phone: "9876543210",
    isActive: true,
  },
  {
    id: "am2",
    companyId: "c2",
    name: "Susan Lee",
    email: "susan@beta.com",
    phone: "9123456780",
    isActive: true,
  },
];

/**
 * Validation schemas
 */
const serviceTypeSchema = z.object({
  code: z.string().min(2, "Code must be at least 2 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().min(5, "Description must be at least 5 characters"),
  taxRate: z.number().min(0).max(100, "Tax rate must be between 0 and 100"),
  isActive: z.boolean(),
});

const customerTypeSchema = z.object({
  code: z.string().min(2, "Code must be at least 2 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().min(5, "Description must be at least 5 characters"),
  paymentTerms: z.number().min(0, "Payment terms must be positive"),
  isActive: z.boolean(),
});

const accountsManagerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  isActive: z.boolean(),
});

/**
 * Component
 */
export default function ServiceTypesPage() {
  const [activeTab, setActiveTab] = useState<"service" | "customer" | "accounts">(
    "service"
  );
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>(
    initialServiceTypes
  );
  const [customerTypes, setCustomerTypes] = useState<CustomerType[]>(
    initialCustomerTypes
  );
  const [accountsManagers, setAccountsManagers] = useState<AccountsManager[]>(
    initialAccountsManagers
  );

  // UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null); // id being edited
  const [dialogMode, setDialogMode] = useState<
    "service" | "customer" | "accounts"
  >("service");

  // Forms
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

  const customerTypeForm = useForm<z.infer<typeof customerTypeSchema>>({
    resolver: zodResolver(customerTypeSchema),
    defaultValues: {
      code: "",
      name: "",
      description: "",
      paymentTerms: 30,
      isActive: true,
    },
  });

  const accountsForm = useForm<z.infer<typeof accountsManagerSchema>>({
    resolver: zodResolver(accountsManagerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      isActive: true,
    },
  });

  /**
   * Helper: filter lists by current user's company
   */
  const companyId = currentUser.companyId;
  const visibleServiceTypes = serviceTypes.filter((s) => s.companyId === companyId);
  const visibleCustomerTypes = customerTypes.filter((c) => c.companyId === companyId);
  const visibleAccounts = accountsManagers.filter((a) => a.companyId === companyId);

  const filteredServiceTypes = visibleServiceTypes.filter(
    (type) =>
      type.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      type.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCustomerTypes = visibleCustomerTypes.filter(
    (type) =>
      type.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      type.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAccounts = visibleAccounts.filter((m) =>
    `${m.name} ${m.email} ${m.phone ?? ""}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  /**
   * Create / Edit handlers (all actions require isAdmin AND matching company)
   */

  // Open dialog for create
  function openCreateDialog(mode: "service" | "customer" | "accounts") {
    if (!currentUser.isAdmin) {
      toast.error("Only company admins can perform this action.");
      return;
    }
    setDialogMode(mode);
    setEditingId(null);
    // reset corresponding form
    if (mode === "service") serviceTypeForm.reset();
    if (mode === "customer") customerTypeForm.reset();
    if (mode === "accounts") accountsForm.reset();
    setIsDialogOpen(true);
  }

  // Open dialog for edit
  function openEditDialog(mode: "service" | "customer" | "accounts", id: string) {
    if (!currentUser.isAdmin) {
      toast.error("Only company admins can perform this action.");
      return;
    }
    setDialogMode(mode);
    setEditingId(id);

    if (mode === "service") {
      const record = serviceTypes.find((s) => s.id === id && s.companyId === companyId);
      if (!record) return toast.error("Record not found or access denied");
      serviceTypeForm.reset({
        code: record.code,
        name: record.name,
        description: record.description,
        taxRate: record.taxRate,
        isActive: record.isActive,
      });
    }

    if (mode === "customer") {
      const record = customerTypes.find((c) => c.id === id && c.companyId === companyId);
      if (!record) return toast.error("Record not found or access denied");
      customerTypeForm.reset({
        code: record.code,
        name: record.name,
        description: record.description,
        paymentTerms: record.paymentTerms,
        isActive: record.isActive,
      });
    }

    if (mode === "accounts") {
      const record = accountsManagers.find((a) => a.id === id && a.companyId === companyId);
      if (!record) return toast.error("Record not found or access denied");
      accountsForm.reset({
        name: record.name,
        email: record.email,
        phone: record.phone,
        isActive: record.isActive,
      });
    }

    setIsDialogOpen(true);
  }

  // Submit service type (create or update)
  async function onSubmitServiceType(values: z.infer<typeof serviceTypeSchema>) {
    if (!currentUser.isAdmin) return toast.error("Not authorized");
    setIsSubmitting(true);
    try {
      await new Promise((r) => setTimeout(r, 700));

      if (editingId) {
        // update
        setServiceTypes((prev) =>
          prev.map((s) =>
            s.id === editingId && s.companyId === companyId ? { ...s, ...values } : s
          )
        );
        toast.success("Service type updated");
      } else {
        // create
        const newRecord: ServiceType = {
          id: `s${serviceTypes.length + 1}-${Date.now()}`,
          companyId,
          ...values,
        };
        setServiceTypes((prev) => [...prev, newRecord]);
        toast.success("Service type created");
      }
      setIsDialogOpen(false);
      serviceTypeForm.reset();
      setEditingId(null);
    } catch (e) {
      toast.error("Operation failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Submit customer type
  async function onSubmitCustomerType(values: z.infer<typeof customerTypeSchema>) {
    if (!currentUser.isAdmin) return toast.error("Not authorized");
    setIsSubmitting(true);
    try {
      await new Promise((r) => setTimeout(r, 700));
      if (editingId) {
        setCustomerTypes((prev) =>
          prev.map((c) =>
            c.id === editingId && c.companyId === companyId ? { ...c, ...values } : c
          )
        );
        toast.success("Customer type updated");
      } else {
        const newRecord: CustomerType = {
          id: `ct${customerTypes.length + 1}-${Date.now()}`,
          companyId,
          ...values,
        };
        setCustomerTypes((prev) => [...prev, newRecord]);
        toast.success("Customer type created");
      }
      setIsDialogOpen(false);
      customerTypeForm.reset();
      setEditingId(null);
    } catch {
      toast.error("Operation failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Submit accounts manager
  async function onSubmitAccounts(values: z.infer<typeof accountsManagerSchema>) {
    if (!currentUser.isAdmin) return toast.error("Not authorized");
    setIsSubmitting(true);
    try {
      await new Promise((r) => setTimeout(r, 700));
      if (editingId) {
        setAccountsManagers((prev) =>
          prev.map((a) =>
            a.id === editingId && a.companyId === companyId ? { ...a, ...values } : a
          )
        );
        toast.success("Accounts manager updated");
      } else {
        const newRecord: AccountsManager = {
          id: `am${accountsManagers.length + 1}-${Date.now()}`,
          companyId,
          ...values,
        };
        setAccountsManagers((prev) => [...prev, newRecord]);
        toast.success("Accounts manager created");
      }
      setIsDialogOpen(false);
      accountsForm.reset();
      setEditingId(null);
    } catch {
      toast.error("Operation failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Inactivate / Activate (toggle) -- admin-only
  async function toggleActive(id: string, type: "service" | "customer" | "accounts") {
    if (!currentUser.isAdmin) return toast.error("Not authorized");
    try {
      await new Promise((r) => setTimeout(r, 400));
      if (type === "service") {
        setServiceTypes((prev) =>
          prev.map((s) => (s.id === id && s.companyId === companyId ? { ...s, isActive: !s.isActive } : s))
        );
        toast.success("Service status updated");
      } else if (type === "customer") {
        setCustomerTypes((prev) =>
          prev.map((c) => (c.id === id && c.companyId === companyId ? { ...c, isActive: !c.isActive } : c))
        );
        toast.success("Customer type status updated");
      } else {
        setAccountsManagers((prev) =>
          prev.map((a) => (a.id === id && a.companyId === companyId ? { ...a, isActive: !a.isActive } : a))
        );
        toast.success("Accounts manager status updated");
      }
    } catch {
      toast.error("Operation failed");
    }
  }

  /**
   * Notes / integration points:
   * - When creating invoices, pick a serviceTypeId from visibleServiceTypes and display its name + description on invoice.
   * - For revenue reports, group invoices by serviceTypeId and customerTypeId and sum amounts (not implemented here).
   */

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Service / Customer Types & Accounts Managers</h1>
        <p className="text-muted-foreground">
          Company: <strong>{companies.find(c => c.id === companyId)?.name}</strong> — {currentUser.isAdmin ? "Admin" : "User"}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="service">Service Types</TabsTrigger>
            <TabsTrigger value="customer">Customer Types</TabsTrigger>
            <TabsTrigger value="accounts">Accounts Managers</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search types or managers..."
                className="pl-8 w-[300px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Button
              onClick={() => openCreateDialog(activeTab as any)}
              disabled={!currentUser.isAdmin}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add New
            </Button>
          </div>
        </div>

        {/* --- SERVICE TYPES TAB --- */}
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
                  <TableHead className="w-[120px]">Actions</TableHead>
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
                      <span className={`inline-block rounded-full px-2 py-0.5 text-sm ${type.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"}`}>
                        {type.isActive ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog("service", type.id)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => toggleActive(type.id, "service")}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredServiceTypes.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center p-6 text-muted-foreground">
                      No service types found for this company.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* --- CUSTOMER TYPES TAB --- */}
        <TabsContent value="customer" className="mt-0">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Payment Terms</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomerTypes.map((type) => (
                  <TableRow key={type.id}>
                    <TableCell className="font-medium">{type.code}</TableCell>
                    <TableCell>{type.name}</TableCell>
                    <TableCell>{type.description}</TableCell>
                    <TableCell>{type.paymentTerms} days</TableCell>
                    <TableCell>
                      <span className={`inline-block rounded-full px-2 py-0.5 text-sm ${type.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"}`}>
                        {type.isActive ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog("customer", type.id)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => toggleActive(type.id, "customer")}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredCustomerTypes.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center p-6 text-muted-foreground">
                      No customer types found for this company.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* --- ACCOUNTS MANAGERS TAB --- */}
        <TabsContent value="accounts" className="mt-0">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAccounts.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.name}</TableCell>
                    <TableCell>{m.email}</TableCell>
                    <TableCell>{m.phone}</TableCell>
                    <TableCell>
                      <span className={`inline-block rounded-full px-2 py-0.5 text-sm ${m.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"}`}>
                        {m.isActive ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog("accounts", m.id)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => toggleActive(m.id, "accounts")}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredAccounts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center p-6 text-muted-foreground">
                      No accounts managers found for this company.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* ---------- Dialog for Create / Edit ---------- */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit" : "Create"}{" "}
              {dialogMode === "service" ? "Service Type" : dialogMode === "customer" ? "Customer Type" : "Accounts Manager"}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === "service" && "Service type belongs to current company only."}
              {dialogMode === "customer" && "Customer types will appear in Customer Master for selection."}
              {dialogMode === "accounts" && "Accounts managers can be assigned to customers/invoices."}
            </DialogDescription>
          </DialogHeader>

          {dialogMode === "service" && (
            <Form {...serviceTypeForm}>
              <form onSubmit={serviceTypeForm.handleSubmit(onSubmitServiceType)} className="space-y-4">
                <FormField control={serviceTypeForm.control} name="code" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code</FormLabel>
                    <FormControl><Input placeholder="Enter code" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={serviceTypeForm.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl><Input placeholder="Enter name" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={serviceTypeForm.control} name="description" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl><Input placeholder="Enter description" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={serviceTypeForm.control} name="taxRate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tax Rate (%)</FormLabel>
                    <FormControl><Input type="number" placeholder="Enter tax rate" {...field} onChange={(e) => field.onChange(Number(e.target.value))} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={serviceTypeForm.control} name="isActive" render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Active Status</FormLabel>
                      <p className="text-sm text-muted-foreground">Enable if this service type is active</p>
                    </div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  </FormItem>
                )} />

                <DialogFooter>
                  <Button variant="outline" type="button" onClick={() => { setIsDialogOpen(false); setEditingId(null); }}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} {editingId ? "Update" : "Create"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}

          {dialogMode === "customer" && (
            <Form {...customerTypeForm}>
              <form onSubmit={customerTypeForm.handleSubmit(onSubmitCustomerType)} className="space-y-4">
                <FormField control={customerTypeForm.control} name="code" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code</FormLabel>
                    <FormControl><Input placeholder="Enter code" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={customerTypeForm.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl><Input placeholder="Enter name" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={customerTypeForm.control} name="description" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl><Input placeholder="Enter description" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={customerTypeForm.control} name="paymentTerms" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Terms (days)</FormLabel>
                    <FormControl><Input type="number" placeholder="Enter payment terms" {...field} onChange={(e) => field.onChange(Number(e.target.value))} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={customerTypeForm.control} name="isActive" render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Active Status</FormLabel>
                      <p className="text-sm text-muted-foreground">Enable if this customer type is active</p>
                    </div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  </FormItem>
                )} />

                <DialogFooter>
                  <Button variant="outline" type="button" onClick={() => { setIsDialogOpen(false); setEditingId(null); }}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} {editingId ? "Update" : "Create"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}

          {dialogMode === "accounts" && (
            <Form {...accountsForm}>
              <form onSubmit={accountsForm.handleSubmit(onSubmitAccounts)} className="space-y-4">
                <FormField control={accountsForm.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl><Input placeholder="Enter name" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={accountsForm.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl><Input type="email" placeholder="Enter email" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={accountsForm.control} name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl><Input placeholder="Enter phone (optional)" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={accountsForm.control} name="isActive" render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Active Status</FormLabel>
                      <p className="text-sm text-muted-foreground">Enable if this manager is active</p>
                    </div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  </FormItem>
                )} />

                <DialogFooter>
                  <Button variant="outline" type="button" onClick={() => { setIsDialogOpen(false); setEditingId(null); }}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} {editingId ? "Update" : "Create"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
