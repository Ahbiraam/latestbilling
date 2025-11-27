import React, { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

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
} from "@/components/ui/dialog";
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
 * Screenshot (Swagger) reference:
 * /mnt/data/Screenshot 2025-11-20 165024.png
 */

/** -------------------------
 * Types
 * ------------------------- */
type ServiceType = {
  id: string;
  companyId?: string;
  code: string;
  name: string;
  description?: string;
  sacCode?: string;
  taxRate?: number;
  isActive?: boolean;
};

type CustomerType = {
  id: string;
  companyId?: string;
  code: string;
  name: string;
  description?: string;
  paymentTerms?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type AccountsManager = {
  id: string;
  companyId: string;
  name: string;
  email: string;
  phone?: string;
  isActive?: boolean;
};

/** -------------------------
 * Mock / constants (replace as needed)
 * ------------------------- */
const companies = [
  { id: "c1", name: "Alpha Corp" },
  { id: "c2", name: "Beta Pvt Ltd" },
];
const currentUser = {
  id: "u1",
  name: "Admin User",
  companyId: "c1",
  isAdmin: true,
};

/** -------------------------
 * Validation schemas
 * ------------------------- */
const serviceTypeSchema = z.object({
  code: z.string().min(2, "Code must be at least 2 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  taxRate: z.coerce.number().min(0).max(100).optional(),
  isActive: z.boolean().optional(),
});

const customerTypeSchema = z.object({
  code: z.string().min(2),
  name: z.string().min(2),
  description: z.string().optional(),
  paymentTerms: z.coerce.number().min(0).optional(),
  isActive: z.boolean().optional(),
});

const accountsManagerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  isActive: z.boolean().optional(),
});

/** -------------------------
 * Component
 * ------------------------- */
export default function ServiceTypesPage(): JSX.Element {
  const [activeTab, setActiveTab] = useState<"service" | "customer" | "accounts">(
    "service"
  );

  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [customerTypes, setCustomerTypes] = useState<CustomerType[]>([]);
  const [accountsManagers, setAccountsManagers] = useState<AccountsManager[]>([]);

  // UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dialogMode, setDialogMode] = useState<"service" | "customer" | "accounts">(
    "service"
  );

  // forms
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

  /** -------------------------
   * Helpers
   * ------------------------- */
  async function tryParseJson(res: Response) {
    try {
      return await res.clone().json();
    } catch {
      return null;
    }
  }

  const companyId = currentUser.companyId;

  /** -------------------------
   * Load service types (GET)
   * ------------------------- */
  useEffect(() => {
    async function loadServiceTypes() {
      setIsLoadingServices(true);
      try {
        const res = await apiFetch("/api/v1/api/v1/service-types");
        if (!res.ok) {
          if (res.status === 401) {
            toast.error("Unauthorized. Please login or check token.");
            return;
          }
          throw new Error(`Failed to fetch service types (${res.status})`);
        }
        const body = await res.json();
        const list: any[] = Array.isArray(body)
          ? body
          : Array.isArray(body?.data)
          ? body.data
          : Array.isArray(body?.items)
          ? body.items
          : [];
        const normalized = list.map((it: any) => ({
          id: it.id ?? it._id ?? String(it.code ?? Date.now()),
          code: it.code,
          name: it.name,
          description: it.description,
          sacCode: it.sacCode,
          taxRate: it.taxRate ?? 0,
          isActive: typeof it.isActive === "boolean" ? it.isActive : true,
          companyId: it.companyId,
        })) as ServiceType[];
        setServiceTypes(normalized);
      } catch (err) {
        console.error(err);
        toast.error("Could not load service types");
      } finally {
        setIsLoadingServices(false);
      }
    }
    loadServiceTypes();
  }, []);

  /** -------------------------
   * Load customer types (GET)
   * ------------------------- */
  useEffect(() => {
    async function loadCustomerTypes() {
      setIsLoadingCustomers(true);
      try {
        const res = await apiFetch("/api/v1/api/v1/client-types");
        if (!res.ok) {
          if (res.status === 401) {
            toast.error("Unauthorized. Please login or check token.");
            return;
          }
          throw new Error(`Failed to fetch customer types (${res.status})`);
        }
        const body = await res.json();
        const list: any[] = Array.isArray(body)
          ? body
          : Array.isArray(body?.data)
          ? body.data
          : Array.isArray(body?.items)
          ? body.items
          : [];
        const normalized = list.map((it: any) => ({
          id: it.id ?? it._id ?? String(it.code ?? Date.now()),
          code: it.code,
          name: it.name,
          description: it.description,
          paymentTerms: it.paymentTerms ?? 0,
          isActive: typeof it.isActive === "boolean" ? it.isActive : true,
          companyId: it.companyId,
          createdAt: it.createdAt,
          updatedAt: it.updatedAt,
        })) as CustomerType[];
        setCustomerTypes(normalized);
      } catch (err) {
        console.error(err);
        toast.error("Could not load customer types");
      } finally {
        setIsLoadingCustomers(false);
      }
    }
    loadCustomerTypes();
  }, []);

  /** -------------------------
   * Load accounts managers (GET)
   * Endpoint (swagger shows):
   * /api/v1/account-managers/api/v1/account-managers
   * ------------------------- */
useEffect(() => {
  async function loadAccountManagers() {
    try {
      const res = await apiFetch("/api/v1/account-managers/api/v1/account-managers");

      const body = await res.clone().json().catch(() => null);
      console.log("🔥 ACCOUNT MANAGER RAW RESPONSE:", body);

      // FIX: backend returns { root: [...] }
      const list: any[] = Array.isArray(body?.root)
        ? body.root
        : [];

      const normalized = list.map((it: any) => ({
        id: it.id ?? it._id,
        name: it.name,
        email: it.email,
        phone: it.phone,
        isActive: it.isActive ?? true,
        companyId: it.companyId ?? currentUser.companyId,
      }));

      setAccountsManagers(normalized);
    } catch (err) {
      console.error("Accounts GET error:", err);
      toast.error("Failed to load account managers");
    }
  }

  loadAccountManagers();
}, []);

  // visible lists (filter by company if item belongs to company)
  const visibleServiceTypes = serviceTypes.filter(
    (s) => !s.companyId || s.companyId === companyId
  );
  const visibleCustomerTypes = customerTypes.filter((c) => !c.companyId || c.companyId === companyId);
  const visibleAccounts = accountsManagers.filter((a) => !a.companyId || a.companyId === companyId);

  const filteredServiceTypes = visibleServiceTypes.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.code.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredCustomerTypes = visibleCustomerTypes.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.code.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredAccounts = visibleAccounts.filter((m) =>
    `${m.name} ${m.email} ${m.phone ?? ""}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // open create dialog
  function openCreateDialog(mode: "service" | "customer" | "accounts") {
    if (!currentUser.isAdmin) {
      toast.error("Only admins can perform this action.");
      return;
    }
    setDialogMode(mode);
    setEditingId(null);
    if (mode === "service") serviceTypeForm.reset();
    if (mode === "customer") customerTypeForm.reset();
    if (mode === "accounts") accountsForm.reset();
    setIsDialogOpen(true);
  }

  // open edit dialog (kept for service/customer — accounts editing is not supported in backend)
  function openEditDialog(mode: "service" | "customer" | "accounts", id: string) {
    if (!currentUser.isAdmin) {
      toast.error("Only admins can perform this action.");
      return;
    }
    setDialogMode(mode);
    setEditingId(id);

    if (mode === "service") {
      const rec = serviceTypes.find((s) => s.id === id);
      if (!rec) return toast.error("Service not found");
      serviceTypeForm.reset({
        code: rec.code,
        name: rec.name,
        description: rec.description,
        taxRate: rec.taxRate ?? 0,
        isActive: rec.isActive ?? true,
      });
    } else if (mode === "customer") {
      const rec = customerTypes.find((c) => c.id === id);
      if (!rec) return toast.error("Customer type not found");
      customerTypeForm.reset({
        code: rec.code,
        name: rec.name,
        description: rec.description,
        paymentTerms: rec.paymentTerms ?? 0,
        isActive: rec.isActive ?? true,
      });
    } else {
      // accounts editing is not supported by backend per your request (only create + get)
      // but keep local prefill so user can see values — saving won't call PUT
      const rec = accountsManagers.find((a) => a.id === id);
      if (!rec) return toast.error("Accounts manager not found");
      accountsForm.reset({
        name: rec.name,
        email: rec.email,
        phone: rec.phone,
        isActive: rec.isActive ?? true,
      });
    }

    setIsDialogOpen(true);
  }

  /** -------------------------
   * Create or Update service type (POST / PUT)
   * ------------------------- */
  async function submitServiceType(values: z.infer<typeof serviceTypeSchema>) {
    if (!currentUser.isAdmin) return toast.error("Not authorized");
    setIsSubmitting(true);

    try {
      const payload = {
        code: values.code,
        name: values.name,
        description: values.description ?? "",
        taxRate: values.taxRate ?? 0,
        isActive: typeof values.isActive === "boolean" ? values.isActive : true,
      };

      if (editingId) {
        const res = await apiFetch(`/api/v1/api/v1/service-types/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const body = await tryParseJson(res);
          throw new Error(body?.message || `Update failed (${res.status})`);
        }
        const updated = await res.json();
        console.log("🔥 CUSTOMER UPDATE RESPONSE:", updated);
        console.log("🔥 SERVICE UPDATE RESPONSE:", updated);
        const normalized = {
          id: updated.id ?? updated._id ?? editingId,
          ...payload,
          companyId: updated.companyId ?? currentUser.companyId,
        } as ServiceType;

        setServiceTypes((prev) => prev.map((p) => (p.id === editingId ? normalized : p)));
        toast.success("Service updated");
      } else {
        const res = await apiFetch(`/api/v1/api/v1/service-types`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const body = await tryParseJson(res);
          throw new Error(body?.message || `Create failed (${res.status})`);
        }
        const created = await res.json();
        console.log("🔥 CUSTOMER CREATE RESPONSE:", created);
        console.log("🔥 SERVICE CREATE RESPONSE:", created);
        const normalized = {
          id: created.id ?? created._id ?? `s-${Date.now()}`,
          ...payload,
          companyId: created.companyId ?? currentUser.companyId,
        } as ServiceType;
        setServiceTypes((prev) => [...prev, normalized]);
        toast.success("Service created");
      }

      setIsDialogOpen(false);
      setEditingId(null);
      serviceTypeForm.reset();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message ?? "Operation failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  /** -------------------------
   * Create or Update customer type (POST / PUT)
   * ------------------------- */
  async function submitCustomerType(values: z.infer<typeof customerTypeSchema>) {
    if (!currentUser.isAdmin) return toast.error("Not authorized");
    setIsSubmitting(true);

    try {
      const payload = {
        code: values.code,
        name: values.name,
        description: values.description ?? "",
        paymentTerms: values.paymentTerms ?? 0,
        isActive: typeof values.isActive === "boolean" ? values.isActive : true,
      };

      if (editingId) {
        // Update (PUT)
        const res = await apiFetch(`/api/v1/api/v1/client-types/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const body = await tryParseJson(res);
          throw new Error(body?.message || `Update failed (${res.status})`);
        }
        const updated = await res.json();
        const normalized: CustomerType = {
          id: updated.id ?? updated._id ?? editingId,
          ...payload,
          companyId: updated.companyId ?? currentUser.companyId,
          createdAt: updated.createdAt,
          updatedAt: updated.updatedAt,
        };
        setCustomerTypes((prev) => prev.map((c) => (c.id === editingId ? normalized : c)));
        toast.success("Customer type updated");
      } else {
        // Create (POST)
        const res = await apiFetch(`/api/v1/api/v1/client-types`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const body = await tryParseJson(res);
          throw new Error(body?.message || `Create failed (${res.status})`);
        }
        const created = await res.json();
        console.log("🔥 SERVICE CREATE RESPONSE:", created);
        const normalized: CustomerType = {
          id: created.id ?? created._id ?? `ct-${Date.now()}`,
          ...payload,
          companyId: created.companyId ?? currentUser.companyId,
          createdAt: created.createdAt,
          updatedAt: created.updatedAt,
        };
        setCustomerTypes((prev) => [...prev, normalized]);
        toast.success("Customer type created");
      }

      setIsDialogOpen(false);
      setEditingId(null);
      customerTypeForm.reset();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message ?? "Operation failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  /** -------------------------
   * Delete service type (DELETE)
   * ------------------------- */
  async function deleteServiceType(id: string) {
    if (!currentUser.isAdmin) return toast.error("Not authorized");
    if (!confirm("Delete this service type?")) return;
    try {
      const res = await apiFetch(`/api/v1/api/v1/service-types/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const body = await tryParseJson(res);
        throw new Error(body?.message || `Delete failed (${res.status})`);
      }
      setServiceTypes((prev) => prev.filter((s) => s.id !== id));
      toast.success("Service deleted");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message ?? "Delete failed");
    }
  }

  /** -------------------------
   * Delete customer type (DELETE)
   * ------------------------- */
  async function deleteCustomerType(id: string) {
    if (!currentUser.isAdmin) return toast.error("Not authorized");
    if (!confirm("Delete this customer type?")) return;
    try {
      const res = await apiFetch(`/api/v1/api/v1/client-types/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const body = await tryParseJson(res);
        throw new Error(body?.message || `Delete failed (${res.status})`);
      }
      setCustomerTypes((prev) => prev.filter((c) => c.id !== id));
      toast.success("Customer type deleted");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message ?? "Delete failed");
    }
  }

  /** -------------------------
   * Toggle active status for service (PATCH fallback to PUT)
   * ------------------------- */
  async function toggleActiveService(id: string) {
    if (!currentUser.isAdmin) return toast.error("Not authorized");
    setServiceTypes((prev) => prev.map((s) => (s.id === id ? { ...s, isActive: !s.isActive } : s)));
    try {
      const res = await apiFetch(`/api/v1/api/v1/service-types/${id}/toggle`, {
        method: "PATCH",
      });
      if (res.ok) {
        toast.success("Service status updated");
        return;
      }
      // fallback to PUT
      const current = serviceTypes.find((s) => s.id === id);
      const newVal = !(current?.isActive ?? true);
      const res2 = await apiFetch(`/api/v1/api/v1/service-types/${id}`, {
        method: "PUT",
        body: JSON.stringify({ ...(current ?? {}), isActive: newVal }),
      });
      if (!res2.ok) {
        const body2 = await tryParseJson(res2);
        throw new Error(body2?.message || `Toggle failed (${res2.status})`);
      }
      toast.success("Service status updated");
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to update status");
      setServiceTypes((prev) => prev.map((s) => (s.id === id ? { ...s, isActive: !(s.isActive ?? true) } : s)));
    }
  }

  /** -------------------------
   * Toggle active status for customer (PATCH fallback)
   * (optional - some backends may not have toggle endpoint)
   * ------------------------- */
  async function toggleActiveCustomer(id: string) {
    if (!currentUser.isAdmin) return toast.error("Not authorized");
    setCustomerTypes((prev) => prev.map((c) => (c.id === id ? { ...c, isActive: !c.isActive } : c)));
    try {
      const res = await apiFetch(`/api/v1/api/v1/client-types/${id}/toggle`, {
        method: "PATCH",
      });
      if (res.ok) {
        toast.success("Customer status updated");
        return;
      }
      // fallback to PUT
      const current = customerTypes.find((c) => c.id === id);
      const newVal = !(current?.isActive ?? true);
      const res2 = await apiFetch(`/api/v1/api/v1/client-types/${id}`, {
        method: "PUT",
        body: JSON.stringify({ ...(current ?? {}), isActive: newVal }),
      });
      if (!res2.ok) {
        const body2 = await tryParseJson(res2);
        throw new Error(body2?.message || `Toggle failed (${res2.status})`);
      }
      toast.success("Customer status updated");
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to update status");
      setCustomerTypes((prev) => prev.map((c) => (c.id === id ? { ...c, isActive: !(c.isActive ?? true) } : c)));
    }
  }

  /** -------------------------
   * Create account manager (POST only)
   * Endpoint (as provided by you):
   * /api/v1/account-managers/api/v1/account-managers
   * ------------------------- */
  async function submitAccountManagerCreate(values: z.infer<typeof accountsManagerSchema>) {
    if (!currentUser.isAdmin) return toast.error("Not authorized");
    setIsSubmitting(true);

    try {
      const payload = {
        name: values.name,
        email: values.email,
        phone: values.phone ?? "",
        isActive: typeof values.isActive === "boolean" ? values.isActive : true,
        companyId, // attach companyId if backend expects it
      };

      const res = await apiFetch("/api/v1/account-managers/api/v1/account-managers", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await tryParseJson(res);
        throw new Error(body?.message || `Create failed (${res.status})`);
      }

      const created = await res.json();
        console.log("🔥 SERVICE CREATE RESPONSE:", created);
      const normalized: AccountsManager = {
        id: created.id ?? created._id ?? `am-${Date.now()}`,
        name: created.name ?? payload.name,
        email: created.email ?? payload.email,
        phone: created.phone ?? payload.phone,
        isActive: typeof created.isActive === "boolean" ? created.isActive : payload.isActive,
        companyId: created.companyId ?? companyId,
      };

      setAccountsManagers((prev) => [...prev, normalized]);
      toast.success("Accounts manager created");
      setIsDialogOpen(false);
      accountsForm.reset();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message ?? "Failed to create account manager");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Service / Customer Types & Accounts Managers</h1>
        <p className="text-muted-foreground">
          Company: <strong>{companies.find((c) => c.id === companyId)?.name}</strong> —{" "}
          {currentUser.isAdmin ? "Admin" : "User"}
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
                placeholder="Search..."
                className="pl-8 w-[300px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Button onClick={() => openCreateDialog(activeTab as any)} disabled={!currentUser.isAdmin}>
              <Plus className="mr-2 h-4 w-4" /> Add New
            </Button>
          </div>
        </div>

        {/* Service tab */}
        <TabsContent value="service">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Tax Rate</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[160px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingServices ? (
                  <TableRow>
                    <TableCell colSpan={6} className="p-6 text-center">
                      <Loader2 className="inline-block animate-spin" /> Loading...
                    </TableCell>
                  </TableRow>
                ) : filteredServiceTypes.length ? (
                  filteredServiceTypes.map((type) => (
                    <TableRow key={type.id}>
                      <TableCell className="font-medium">{type.code}</TableCell>
                      <TableCell>{type.name}</TableCell>
                      <TableCell>{type.description}</TableCell>
                      <TableCell>{type.taxRate ?? 0}%</TableCell>
                      <TableCell>
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-sm ${
                            type.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {type.isActive ? "Active" : "Inactive"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog("service", type.id)}>
                            <Pencil className="h-4 w-4" />
                          </Button>

                          <Button variant="ghost" size="icon" onClick={() => deleteServiceType(type.id)}>
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center p-6 text-muted-foreground">
                      No service types found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Customer tab */}
        <TabsContent value="customer">
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
                {isLoadingCustomers ? (
                  <TableRow>
                    <TableCell colSpan={6} className="p-6 text-center">
                      <Loader2 className="inline-block animate-spin" /> Loading...
                    </TableCell>
                  </TableRow>
                ) : filteredCustomerTypes.length ? (
                  filteredCustomerTypes.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.code}</TableCell>
                      <TableCell>{t.name}</TableCell>
                      <TableCell>{t.description}</TableCell>
                      <TableCell>{t.paymentTerms ?? "-"}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-sm ${
                            t.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {t.isActive ? "Active" : "Inactive"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog("customer", t.id)}>
                            <Pencil className="h-4 w-4" />
                          </Button>

                          <Button variant="ghost" size="icon" onClick={() => deleteCustomerType(t.id)}>
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center p-6 text-muted-foreground">
                      No customer types found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Accounts tab (GET + POST only) */}
        <TabsContent value="accounts">
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
                {isLoadingAccounts ? (
                  <TableRow>
                    <TableCell colSpan={5} className="p-6 text-center">
                      <Loader2 className="inline-block animate-spin" /> Loading...
                    </TableCell>
                  </TableRow>
                ) : filteredAccounts.length ? (
                  filteredAccounts.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>{a.name}</TableCell>
                      <TableCell>{a.email}</TableCell>
                      <TableCell>{a.phone}</TableCell>
                      <TableCell>
                        <span className={`inline-block rounded-full px-2 py-0.5 text-sm ${a.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"}`}>
                          {a.isActive ? "Active" : "Inactive"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {/* Editing accounts is intentionally disabled (backend supports only create + get per your request).
                              Keep a view-only Pencil that opens the dialog but saving will not perform PUT. */}
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog("accounts", a.id)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center p-6 text-muted-foreground">
                      No accounts managers found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog for create/edit */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit" : "Create"}{" "}
              {dialogMode === "service" ? "Service Type" : dialogMode === "customer" ? "Customer Type" : "Accounts Manager"}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === "service" && "Service type belongs to current company only."}
              {dialogMode === "customer" && "Customer type belongs to current company only."}
              {dialogMode === "accounts" && "Create new accounts manager (backend supports only create + get). Editing is view-only here."}
            </DialogDescription>
          </DialogHeader>

          {dialogMode === "service" && (
            <Form {...serviceTypeForm}>
              <form onSubmit={serviceTypeForm.handleSubmit(submitServiceType)} className="space-y-4">
                <FormField control={serviceTypeForm.control} name="code" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Code" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={serviceTypeForm.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={serviceTypeForm.control} name="description" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={serviceTypeForm.control} name="taxRate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tax Rate (%)</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" onChange={(e) => field.onChange(Number(e.target.value))} placeholder="Tax rate" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={serviceTypeForm.control} name="isActive" render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <FormLabel>Active</FormLabel>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )} />

                <DialogFooter>
                  <Button variant="outline" type="button" onClick={() => { setIsDialogOpen(false); setEditingId(null); }}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingId ? "Update" : "Create"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}

          {/* Customer form - integrated with API */}
          {dialogMode === "customer" && (
            <Form {...customerTypeForm}>
              <form onSubmit={customerTypeForm.handleSubmit(submitCustomerType)} className="space-y-4">
                <FormField control={customerTypeForm.control} name="code" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Code" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={customerTypeForm.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={customerTypeForm.control} name="description" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={customerTypeForm.control} name="paymentTerms" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Terms (days)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        placeholder="Payment terms"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={customerTypeForm.control} name="isActive" render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <FormLabel>Active</FormLabel>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )} />

                <DialogFooter>
                  <Button variant="outline" type="button" onClick={() => { setIsDialogOpen(false); setEditingId(null); }}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingId ? "Update" : "Create"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}

          {/* Accounts form (POST only) */}
          {dialogMode === "accounts" && (
            <Form {...accountsForm}>
              <form onSubmit={accountsForm.handleSubmit(async (v) => {
                // Note: backend supports only create + get per your instruction
                // If editingId is set, we treat dialog as view-only (no PUT)
                if (editingId) {
                  // editing not supported (backend is POST-only for accounts). Inform user.
                  toast.error("Editing accounts manager is not supported. Create only.");
                  return;
                }
                await submitAccountManagerCreate(v);
              })} className="space-y-4">
                <FormField control={accountsForm.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={accountsForm.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl><Input {...field} type="email" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={accountsForm.control} name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={accountsForm.control} name="isActive" render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <FormLabel>Active</FormLabel>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )} />

                <DialogFooter>
                  <Button variant="outline" type="button" onClick={() => { setIsDialogOpen(false); setEditingId(null); }}>Cancel</Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create
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
