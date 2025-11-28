import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Search, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Customer } from "@/lib/types";
import { apiFetch } from "@/lib/api";

// Extract list from backend response
const extractArray = (res: any) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  return [];
};

export default function CustomersPage() {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showActive, setShowActive] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // ===========================
  // FETCH CUSTOMERS
  // ===========================
  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true);
      try {
        const res = await apiFetch("/api/v1/api/v1/customers");
        const json = await res.json();
        const list = extractArray(json);
        setCustomers(list);
      } catch {
        toast.error("Failed to load customers");
        setCustomers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  // ===========================
  // FILTER LIST
  // ===========================
  const filteredCustomers = customers.filter((c) => {
    const q = searchQuery.toLowerCase();
    const matches =
      !q ||
      c.name?.toLowerCase().includes(q) ||
      c.code?.toLowerCase().includes(q) ||
      // c.mobile?.toLowerCase().includes(q) ||
      c.gstNumber?.toLowerCase().includes(q) ||
      c.contactPerson?.toLowerCase().includes(q);

    const status = showActive ? c.isActive : !c.isActive;

    return matches && status;
  });

  // ===========================
  // OPEN EDIT
  // ===========================
  const openEdit = async (id: string) => {
    setOpen(true);
    setSelectedCustomer(null);

    try {
      const res = await apiFetch(`/api/v1/api/v1/customers/${id}`);
      const json = await res.json();
      setSelectedCustomer(json as Customer);
    } catch {
      toast.error("Failed to load customer");
      setOpen(false);
    }
  };

  // ===========================
  // UPDATE CUSTOMER
  // ===========================
  const handleSave = async () => {
    if (!selectedCustomer) return;

    setSaving(true);

    try {
      // Only allowed fields
      const payload = {
        name: selectedCustomer.name,
        contactPerson: selectedCustomer.contactPerson,
        email: selectedCustomer.email,
        isActive: selectedCustomer.isActive,
      };

      const res = await apiFetch(
        `/api/v1/api/v1/customers/${selectedCustomer.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) throw new Error("Update failed");

      // Update locally
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === selectedCustomer.id ? { ...c, ...payload } : c
        )
      );

      toast.success("Customer updated");
      setOpen(false);
    } catch {
      toast.error("Failed to update customer");
    } finally {
      setSaving(false);
    }
  };

  // ===========================
  // DELETE CUSTOMER
  // ===========================
  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this customer?"))
      return;

    try {
      const res = await apiFetch(`/api/v1/api/v1/customers/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Delete failed");

      setCustomers((prev) => prev.filter((c) => c.id !== id));
      toast.success("Customer deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  // ===========================
  // UI
  // ===========================
  return (
    <div className="p-8">

      <div className="mb-8">
        <h1 className="text-2xl font-semibold">Customers</h1>
        <p className="text-muted-foreground">Manage customer details.</p>
      </div>

      {/* Search + Filter + Add */}
      <div className="flex items-center justify-between mb-6 gap-4">

        <div className="relative w-[320px]">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, code, mobile, GST..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <Switch checked={showActive} onCheckedChange={setShowActive} />
          <span className="text-sm">
            {showActive ? "Showing Active" : "Showing Inactive"}
          </span>
        </div>

        <Button onClick={() => navigate("/customers/create")}>
          <Plus className="mr-2 h-4 w-4" />
          Add Customer
        </Button>

      </div>

      {/* TABLE */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Contact Person</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Mobile</TableHead>
              <TableHead>GST No</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Edit</TableHead>
              <TableHead className="text-center">Delete</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-6">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredCustomers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-6">
                  No customers found
                </TableCell>
              </TableRow>
            ) : (
              filteredCustomers.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>{c.code}</TableCell>
                  <TableCell>{c.name}</TableCell>
                  <TableCell>{c.type}</TableCell>
                  <TableCell>{c.contactPerson}</TableCell>
                  <TableCell>{c.email}</TableCell>
                  <TableCell>{c.phone}</TableCell>
                  <TableCell>{c.gstNumber}</TableCell>

                  <TableCell>
                    <Switch checked={!!c.isActive} disabled />
                  </TableCell>

                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(c.id)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>

                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(c.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </TableCell>

                </TableRow>
              ))
            )}
          </TableBody>

        </Table>
      </div>

      {/* EDIT MODAL */}
      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (!v) setSelectedCustomer(null);
          setOpen(v);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
            <DialogDescription>Update customer details</DialogDescription>
          </DialogHeader>

          {!selectedCustomer ? (
            <div className="py-4 text-center">Loading...</div>
          ) : (
            <div className="space-y-3 mt-4">

              <Input
                value={selectedCustomer.name || ""}
                onChange={(e) =>
                  setSelectedCustomer({
                    ...selectedCustomer,
                    name: e.target.value,
                  })
                }
                placeholder="Customer Name"
              />

              <Input
                value={selectedCustomer.contactPerson || ""}
                onChange={(e) =>
                  setSelectedCustomer({
                    ...selectedCustomer,
                    contactPerson: e.target.value,
                  })
                }
                placeholder="Contact Person"
              />

              <Input
                value={selectedCustomer.email || ""}
                onChange={(e) =>
                  setSelectedCustomer({
                    ...selectedCustomer,
                    email: e.target.value,
                  })
                }
                placeholder="Email"
              />

              <div className="flex items-center justify-between border rounded-md p-2">
                <span>Active</span>
                <Switch
                  checked={!!selectedCustomer.isActive}
                  onCheckedChange={(v) =>
                    setSelectedCustomer({
                      ...selectedCustomer,
                      isActive: v,
                    })
                  }
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? "Saving..." : "Save"}
                </Button>
              </div>

            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}
