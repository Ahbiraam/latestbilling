// src/pages/customers/index.tsx
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
import { apiFetch } from "@/lib/api";

/**
 * Final Customers Page (shows ALL fields in edit modal)
 * Schema for customer (from your message):
 * {
 *  id, code, name, type, typeId, address, email, whatsapp, phone,
 *  contactPerson, gstNumber, panNumber, paymentTerms, accountManager,
 *  accountManagerId, isActive, createdAt, updatedAt
 * }
 */

export default function CustomersPage() {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState<any[]>([]);
  const [types, setTypes] = useState<any[]>([]);
  const [managers, setManagers] = useState<any[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [showActive, setShowActive] = useState(true);

  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [open, setOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Normalize list responses (array | { data: [] } | { root: [] } | { items: [] })
  const parseList = (json: any) =>
    Array.isArray(json)
      ? json
      : Array.isArray(json?.data)
      ? json.data
      : Array.isArray(json?.root)
      ? json.root
      : Array.isArray(json?.items)
      ? json.items
      : [];

  // Load client types and account managers.
  // Try the odd swagger path first (some of your Swagger screenshots used this),
  // then fallback to the 'normal' endpoint.
  const loadAuxLists = async () => {
    try {
      const [typeRes, mgrResCandidate] = await Promise.all([
        apiFetch("/api/v1/api/v1/client-types"),
        // Try the weird path first (Swagger showed this)
        apiFetch("/api/v1/account-managers/api/v1/account-managers"),
      ]);

      const typeJson = await typeRes.json().catch(() => ({}));
      const mgrJsonCandidate = await mgrResCandidate.json().catch(() => null);

      let mgrJson = mgrJsonCandidate;

      // If candidate returned empty/invalid, try the regular path
      if (!mgrJson || (Array.isArray(mgrJson) && mgrJson.length === 0) || (!Array.isArray(mgrJson) && !mgrJson.data && !mgrJson.root && !mgrJson.items)) {
        try {
          const fallback = await apiFetch("/api/v1/api/v1/account-managers");
          mgrJson = await fallback.json().catch(() => mgrJsonCandidate);
        } catch {
          // keep candidate if fallback fails
        }
      }

      setTypes(parseList(typeJson));
      setManagers(parseList(mgrJson));

      console.debug("Loaded types:", parseList(typeJson));
      console.debug("Loaded managers:", parseList(mgrJson));
    } catch (err) {
      console.error("loadAuxLists error:", err);
      toast.error("Failed to load client types or account managers");
      setTypes([]);
      setManagers([]);
    }
  };

  // Load customers list
  const loadCustomers = async () => {
    setLoading(true);
    try {
      await loadAuxLists();

      const res = await apiFetch("/api/v1/api/v1/customers");
      const json = await res.json();

      setCustomers(parseList(json));
    } catch (err) {
      console.error("loadCustomers error:", err);
      toast.error("Failed to load customers");
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter logic
  const filteredCustomers = customers.filter((c) => {
    const q = (searchQuery || "").toLowerCase();
    const textMatch =
      !q ||
      (c.name || "").toLowerCase().includes(q) ||
      (c.code || "").toLowerCase().includes(q) ||
      (c.email || "").toLowerCase().includes(q) ||
      (c.contactPerson || "").toLowerCase().includes(q);

    const statusMatch = showActive ? !!c.isActive : !c.isActive;
    return textMatch && statusMatch;
  });

  // Open edit modal and load single customer (normalize response)
  const openEdit = async (id: string) => {
    setOpen(true);
    setSelectedCustomer(null);
    setErrorMessage("");
    try {
      const res = await apiFetch(`/api/v1/api/v1/customers/${id}`);
      const json = await res.json();
      // Normalize — customer may be at json.data or json.root or direct object
      const customer = json?.data ?? json?.root ?? json;
      setSelectedCustomer(customer);
      console.debug("openEdit loaded customer:", customer);
    } catch (err) {
      console.error("openEdit error:", err);
      toast.error("Failed to load customer details");
      setOpen(false);
    }
  };

  // Save changes (PUT). Build payload to match your backend schema.
  const handleSave = async () => {
    if (!selectedCustomer) return;
    setSaving(true);
    setErrorMessage("");

    try {
      const payload = {
        code: selectedCustomer.code ?? "",
        name: selectedCustomer.name ?? "",
        type: selectedCustomer.type ?? "",
        typeId: selectedCustomer.typeId ?? null,
        address: selectedCustomer.address ?? "",
        email: selectedCustomer.email ?? "",
        whatsapp: selectedCustomer.whatsapp ?? "",
        phone: selectedCustomer.phone ?? "",
        contactPerson: selectedCustomer.contactPerson ?? "",
        gstNumber: selectedCustomer.gstNumber ?? "",
        panNumber: selectedCustomer.panNumber ?? "",
        paymentTerms: Number(selectedCustomer.paymentTerms ?? 0),
        accountManager: selectedCustomer.accountManager ?? "",
        accountManagerId: selectedCustomer.accountManagerId ?? null,
        isActive: !!selectedCustomer.isActive,
      };

      const res = await apiFetch(`/api/v1/api/v1/customers/${selectedCustomer.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        if (errJson?.detail && Array.isArray(errJson.detail)) {
          const msg = errJson.detail.map((d: any) => `${d.loc?.[1] || "field"}: ${d.msg}`).join("\n");
          setErrorMessage(msg);
        } else {
          setErrorMessage(errJson?.message || "Update failed");
        }
        throw new Error("Update failed");
      }

      // Try to get returned updated customer if API returns it
      const updatedJson = await res.json().catch(() => null);
      const updatedCustomer = updatedJson?.data ?? updatedJson ?? { id: selectedCustomer.id, ...payload };

      // Update local list safely
      setCustomers((prev) => prev.map((c) => (c.id === selectedCustomer.id ? { ...c, ...updatedCustomer } : c)));

      toast.success("Customer updated");
      setOpen(false);
    } catch (err) {
      console.error("handleSave error:", err);
    } finally {
      setSaving(false);
    }
  };

  // Delete
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this customer?")) return;
    try {
      const res = await apiFetch(`/api/v1/api/v1/customers/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setCustomers((prev) => prev.filter((c) => c.id !== id));
      toast.success("Customer deleted");
    } catch (err) {
      console.error("handleDelete:", err);
      toast.error("Delete failed");
    }
  };

  // Helper to display manager label: try fullName, name, or fallback
  const managerLabel = (m: any) => m?.fullName ?? m?.name ?? m?.email ?? "Unnamed";

  return (
    <div className="p-8">
      <div className="flex justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Customers</h1>
          <p className="text-sm text-muted-foreground">Manage customers</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-[320px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <Input placeholder="Search customers..." className="pl-8" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>

          <div className="flex items-center gap-2">
            <Switch checked={showActive} onCheckedChange={setShowActive} />
            <span className="text-sm">{showActive ? "Active" : "Inactive"}</span>
          </div>

          <Button onClick={() => navigate("/customers/create")}>
            <Plus className="h-4 w-4 mr-2" /> Add Customer
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
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
                <TableCell colSpan={8} className="text-center py-6">Loading...</TableCell>
              </TableRow>
            ) : filteredCustomers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-6">No customers found</TableCell>
              </TableRow>
            ) : (
              filteredCustomers.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>{c.code}</TableCell>
                  <TableCell>{c.name}</TableCell>
                  <TableCell>{c.type}</TableCell>
                  <TableCell>{c.email}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{c.contactPerson}</div>
                      <div className="text-xs text-muted-foreground">{c.phone ?? c.whatsapp}</div>
                    </div>
                  </TableCell>
                  <TableCell><Switch checked={!!c.isActive} disabled /></TableCell>
                  <TableCell><Button variant="ghost" onClick={() => openEdit(c.id)}><Pencil className="h-4 w-4" /></Button></TableCell>
                  <TableCell><Button variant="ghost" onClick={() => handleDelete(c.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button></TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Modal (shows ALL fields) */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto p-6">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
            <DialogDescription>Update all customer fields</DialogDescription>
          </DialogHeader>

          {!selectedCustomer ? (
            <div className="text-center py-6">Loading...</div>
          ) : (
            <div className="grid grid-cols-2 gap-4 mt-4">
              {errorMessage && <div className="col-span-2 bg-red-100 text-red-700 p-3 rounded text-sm whitespace-pre-line">{errorMessage}</div>}

              {/* Left column */}
              <div>
                <label className="text-sm font-medium">Code</label>
                <Input value={selectedCustomer.code ?? ""} onChange={(e) => setSelectedCustomer({ ...selectedCustomer, code: e.target.value })} />
              </div>

              <div>
                <label className="text-sm font-medium">Name</label>
                <Input value={selectedCustomer.name ?? ""} onChange={(e) => setSelectedCustomer({ ...selectedCustomer, name: e.target.value })} />
              </div>

              <div>
                <label className="text-sm font-medium">Type (label)</label>
                <Input value={selectedCustomer.type ?? ""} onChange={(e) => setSelectedCustomer({ ...selectedCustomer, type: e.target.value })} />
              </div>

              <div>
                <label className="text-sm font-medium">Type (select)</label>
                <select className="border rounded p-2 w-full" value={selectedCustomer.typeId ?? ""} onChange={(e) => setSelectedCustomer({ ...selectedCustomer, typeId: e.target.value })}>
                  <option value="">Select Type</option>
                  {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>

              <div className="col-span-2">
                <label className="text-sm font-medium">Address</label>
                <Input value={selectedCustomer.address ?? ""} onChange={(e) => setSelectedCustomer({ ...selectedCustomer, address: e.target.value })} />
              </div>

              <div>
                <label className="text-sm font-medium">Email</label>
                <Input value={selectedCustomer.email ?? ""} onChange={(e) => setSelectedCustomer({ ...selectedCustomer, email: e.target.value })} />
              </div>

              <div>
                <label className="text-sm font-medium">Contact Person</label>
                <Input value={selectedCustomer.contactPerson ?? ""} onChange={(e) => setSelectedCustomer({ ...selectedCustomer, contactPerson: e.target.value })} />
              </div>

              <div>
                <label className="text-sm font-medium">WhatsApp</label>
                <Input value={selectedCustomer.whatsapp ?? ""} onChange={(e) => setSelectedCustomer({ ...selectedCustomer, whatsapp: e.target.value })} />
              </div>

              <div>
                <label className="text-sm font-medium">Phone</label>
                <Input value={selectedCustomer.phone ?? ""} onChange={(e) => setSelectedCustomer({ ...selectedCustomer, phone: e.target.value })} />
              </div>

              <div>
                <label className="text-sm font-medium">GST Number</label>
                <Input value={selectedCustomer.gstNumber ?? ""} onChange={(e) => setSelectedCustomer({ ...selectedCustomer, gstNumber: e.target.value })} />
              </div>

              <div>
                <label className="text-sm font-medium">PAN Number</label>
                <Input value={selectedCustomer.panNumber ?? ""} onChange={(e) => setSelectedCustomer({ ...selectedCustomer, panNumber: e.target.value })} />
              </div>

              <div>
                <label className="text-sm font-medium">Payment Terms (days)</label>
                <Input type="number" value={selectedCustomer.paymentTerms ?? 0} onChange={(e) => setSelectedCustomer({ ...selectedCustomer, paymentTerms: Number(e.target.value) })} />
              </div>

              <div>
                <label className="text-sm font-medium">Account Manager (select)</label>
                <select className="border rounded p-2 w-full" value={selectedCustomer.accountManagerId ?? ""} onChange={(e) => setSelectedCustomer({ ...selectedCustomer, accountManagerId: e.target.value })}>
                  <option value="">Select Manager</option>
                  {managers.map((m) => <option key={m.id} value={m.id}>{managerLabel(m)}</option>)}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Account Manager (label)</label>
                <Input value={selectedCustomer.accountManager ?? ""} onChange={(e) => setSelectedCustomer({ ...selectedCustomer, accountManager: e.target.value })} />
              </div>

              <div className="col-span-2 flex items-center justify-between border p-3 rounded">
                <div>
                  <label className="text-sm font-medium">Active</label>
                  <div className="text-xs text-muted-foreground">Toggle to activate/deactivate</div>
                </div>
                <Switch checked={!!selectedCustomer.isActive} onCheckedChange={(v) => setSelectedCustomer({ ...selectedCustomer, isActive: v })} />
              </div>

              {/* read-only meta */}
              <div>
                <label className="text-sm font-medium">Created At</label>
                <Input value={selectedCustomer.createdAt ?? ""} readOnly />
              </div>

              <div>
                <label className="text-sm font-medium">Updated At</label>
                <Input value={selectedCustomer.updatedAt ?? ""} readOnly />
              </div>

              {/* action buttons */}
              <div className="col-span-2 flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
