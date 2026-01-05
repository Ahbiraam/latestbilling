"use client";

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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Search, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";

export default function CustomersPage() {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  const parseList = (json: any) =>
    Array.isArray(json)
      ? json
      : Array.isArray(json?.data)
      ? json.data
      : Array.isArray(json?.items)
      ? json.items
      : [];

  /* ================= LOAD CUSTOMERS ================= */
  const loadCustomers = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/v1/api/v1/customers");
      const json = await res.json();
      setCustomers(parseList(json));
    } catch {
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  /* ================= OPEN EDIT ================= */
  const openEdit = async (id: string) => {
    try {
      const res = await apiFetch(`/api/v1/api/v1/customers/${id}`);
      const json = await res.json();
      const customer = json?.data ?? json;

      // 🔑 Normalize address for edit
      if (!customer.addressLine1 && customer.address) {
        const parts = customer.address.split(",").map((p: string) => p.trim());
        customer.addressLine1 = parts[0] || "";
        customer.addressLine2 = parts[1] || "";
        customer.addressLine3 = parts[2] || "";
        customer.state = parts[3] || "";
        customer.country = parts[4] || "";
      }

      setSelectedCustomer(customer);
      setOpen(true);
    } catch {
      toast.error("Failed to load customer");
    }
  };

  /* ================= SAVE ================= */
  const handleSave = async () => {
    if (!selectedCustomer) return;
    setSaving(true);

    try {
      const payload = {
        code: selectedCustomer.code.trim(),
        name: selectedCustomer.name.trim(),

        type: "CUSTOMER",
        typeId: selectedCustomer.typeId,

        // ✅ REQUIRED
        addressLine1: selectedCustomer.addressLine1.trim(),
        addressLine2: selectedCustomer.addressLine2?.trim() || "",
        addressLine3: selectedCustomer.addressLine3?.trim() || "",
        state: selectedCustomer.state.trim(),
        country: selectedCustomer.country.trim(),

        email: selectedCustomer.email.trim(),
        whatsapp: selectedCustomer.whatsapp.replace(/\D/g, "").slice(-10),
        phone: selectedCustomer.phone.replace(/\D/g, "").slice(-10),
        contactPerson: selectedCustomer.contactPerson.trim(),

        gstNumber: selectedCustomer.gstNumber?.trim() || null,
        panNumber: selectedCustomer.panNumber?.trim() || null,
        paymentTerms: Number(selectedCustomer.paymentTerms || 0),

        accountManager: "NA",
        accountManagerId: selectedCustomer.accountManagerId,

        isActive: Boolean(selectedCustomer.isActive),
      };

      const res = await apiFetch(
        `/api/v1/api/v1/customers/${selectedCustomer.id}`,
        {
          method: "PUT",
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        toast.error(err?.message || "Update failed");
        return;
      }

      toast.success("Customer updated");
      setOpen(false);
      loadCustomers();
    } catch {
      toast.error("Unexpected error");
    } finally {
      setSaving(false);
    }
  };

  /* ================= DELETE ================= */
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this customer?")) return;
    try {
      await apiFetch(`/api/v1/api/v1/customers/${id}`, { method: "DELETE" });
      toast.success("Customer deleted");
      loadCustomers();
    } catch {
      toast.error("Delete failed");
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-semibold">Customers</h1>
        <Button onClick={() => navigate("/customers/create")}>
          <Plus className="h-4 w-4 mr-2" /> Add Customer
        </Button>
      </div>

      {/* TABLE */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Edit</TableHead>
            <TableHead>Delete</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center">
                Loading...
              </TableCell>
            </TableRow>
          ) : (
            customers.map((c) => (
              <TableRow key={c.id}>
                <TableCell>{c.code}</TableCell>
                <TableCell>{c.name}</TableCell>
                <TableCell>{c.email}</TableCell>
                <TableCell>{c.contactPerson}</TableCell>
                <TableCell>
                  <Switch checked={c.isActive} disabled />
                </TableCell>
                <TableCell>
                  <Button variant="ghost" onClick={() => openEdit(c.id)}>
                    <Pencil size={16} />
                  </Button>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    onClick={() => handleDelete(c.id)}
                  >
                    <Trash2 size={16} className="text-red-500" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* EDIT MODAL */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
          </DialogHeader>

          {selectedCustomer && (
            <div className="grid grid-cols-2 gap-4 mt-4">
              {[
                ["code", "Customer Code"],
                ["name", "Name"],
                ["email", "Email"],
                ["whatsapp", "WhatsApp"],
                ["phone", "Phone"],
                ["contactPerson", "Contact Person"],
                ["addressLine1", "Address Line 1"],
                ["addressLine2", "Address Line 2"],
                ["addressLine3", "Address Line 3"],
                ["state", "State"],
                ["country", "Country"],
                ["gstNumber", "GST Number"],
                ["panNumber", "PAN Number"],
              ].map(([key, label]) => (
                <div key={key}>
                  <label className="text-sm">{label}</label>
                  <Input
                    value={selectedCustomer[key] || ""}
                    onChange={(e) =>
                      setSelectedCustomer({
                        ...selectedCustomer,
                        [key]: e.target.value,
                      })
                    }
                  />
                </div>
              ))}

              <div>
                <label className="text-sm">Payment Terms (Days)</label>
                <Input
                  type="number"
                  value={selectedCustomer.paymentTerms || 0}
                  onChange={(e) =>
                    setSelectedCustomer({
                      ...selectedCustomer,
                      paymentTerms: Number(e.target.value),
                    })
                  }
                />
              </div>

              <div className="col-span-2 flex justify-between border p-3 rounded">
                <span>Active</span>
                <Switch
                  checked={selectedCustomer.isActive}
                  onCheckedChange={(v) =>
                    setSelectedCustomer({ ...selectedCustomer, isActive: v })
                  }
                />
              </div>

              <div className="col-span-2 flex justify-end gap-3">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
