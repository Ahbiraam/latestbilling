import { useState } from "react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Search, Plus, Pencil } from "lucide-react";
import { toast } from "sonner";
import type { Customer } from "@/lib/types";

// ---------------------------
// Mock Data (5 Records)
// ---------------------------
const mockCustomers: Customer[] = [
  {
    id: "1",
    code: "ACME001",
    name: "Acme Corporation",
    shortName: "ACME",
    type: "Corporate",
    contactPerson: "John Smith",
    email: "contact@acme.com",
    mobile: "+1234567890",
    gstNumber: "GST123456789",
    isActive: true,
  },
  {
    id: "2",
    code: "TECH001",
    name: "Tech Startups Inc",
    shortName: "TECH",
    type: "Startup",
    contactPerson: "Jane Doe",
    email: "info@techstartups.com",
    mobile: "+1234567891",
    gstNumber: "GST987654321",
    isActive: false,
  },
  {
    id: "3",
    code: "FOOD001",
    name: "FreshBite Foods",
    shortName: "FRSH",
    type: "Retail",
    contactPerson: "David Lee",
    email: "hello@freshbite.com",
    mobile: "+1999888777",
    gstNumber: "GST223344556",
    isActive: true,
  },
  {
    id: "4",
    code: "CONS001",
    name: "BrightBuild Constructions",
    shortName: "BRGT",
    type: "Corporate",
    contactPerson: "Samuel Green",
    email: "info@brightbuild.com",
    mobile: "+1345678912",
    gstNumber: "GST667788990",
    isActive: true,
  },
  {
    id: "5",
    code: "MEDIA001",
    name: "Pixel Media Works",
    shortName: "PIXL",
    type: "Small Business",
    contactPerson: "Emily Carter",
    email: "support@pixelmedia.com",
    mobile: "+1456789123",
    gstNumber: "GST998877665",
    isActive: false,
  },
];

// Customer types dropdown
const customerTypes = [
  "Corporate",
  "Startup",
  "Retail",
  "Small Business",
  "Agency",
  "Individual",
];

export default function CustomersPage() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  const [searchQuery, setSearchQuery] = useState("");
  const [showActive, setShowActive] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [open, setOpen] = useState(false);

  // ---------------------------
  // Filter Logic
  // ---------------------------
  const filteredCustomers = customers.filter((customer) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      customer.name.toLowerCase().includes(query) ||
      customer.code.toLowerCase().includes(query) ||
      customer.shortName.toLowerCase().includes(query) ||
      customer.mobile.toLowerCase().includes(query) ||
      customer.gstNumber.toLowerCase().includes(query) ||
      customer.contactPerson.toLowerCase().includes(query);
    const matchesStatus = showActive ? customer.isActive : !customer.isActive;
    return matchesSearch && matchesStatus;
  });

  // ---------------------------
  // Save Edited Data
  // ---------------------------
  const handleSave = () => {
    if (!selectedCustomer) return;
    setCustomers((prev) =>
      prev.map((c) => (c.id === selectedCustomer.id ? selectedCustomer : c))
    );
    toast.success("Customer details updated successfully!");
    setOpen(false);
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">Customers</h1>
        <p className="text-muted-foreground">
          Manage your customer database and details.
        </p>
      </div>

      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
        <div className="relative w-[320px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, code, mobile or GST..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <Switch checked={showActive} onCheckedChange={setShowActive} />
          <span className="text-sm text-muted-foreground">
            {showActive
              ? "Showing Active Customers"
              : "Showing Inactive Customers"}
          </span>
        </div>

        <Button onClick={() => navigate("/customers/create")}>
          <Plus className="mr-2 h-4 w-4" />
          Add Customer
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Short Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Contact Person</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Mobile</TableHead>
              <TableHead>GST No</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Edit</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredCustomers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={10}
                  className="text-center py-6 text-muted-foreground"
                >
                  No customers found.
                </TableCell>
              </TableRow>
            ) : (
              filteredCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>{customer.code}</TableCell>
                  <TableCell>{customer.name}</TableCell>
                  <TableCell>{customer.shortName}</TableCell>
                  <TableCell>{customer.type}</TableCell>
                  <TableCell>{customer.contactPerson}</TableCell>
                  <TableCell>{customer.email}</TableCell>
                  <TableCell>{customer.mobile}</TableCell>
                  <TableCell>{customer.gstNumber}</TableCell>
                  <TableCell>
                    <Switch checked={customer.isActive} disabled />
                  </TableCell>
                  <TableCell className="text-center">
                    <Dialog
                      open={open && selectedCustomer?.id === customer.id}
                      onOpenChange={(val) => {
                        if (!val) setSelectedCustomer(null);
                        setOpen(val);
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedCustomer(customer)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg">
                        <DialogHeader>
                          <DialogTitle>Edit Customer</DialogTitle>
                          <DialogDescription>
                            Update full customer details below.
                          </DialogDescription>
                        </DialogHeader>

                        {selectedCustomer && (
                          <div className="space-y-3 mt-4">
                            <Input
                              value={selectedCustomer.name}
                              onChange={(e) =>
                                setSelectedCustomer({
                                  ...selectedCustomer,
                                  name: e.target.value,
                                })
                              }
                              placeholder="Customer Name"
                            />

                            <Input
                              value={selectedCustomer.shortName}
                              onChange={(e) =>
                                setSelectedCustomer({
                                  ...selectedCustomer,
                                  shortName: e.target.value,
                                })
                              }
                              placeholder="Short Name"
                            />

                            <Select
                              onValueChange={(val) =>
                                setSelectedCustomer({
                                  ...selectedCustomer,
                                  type: val,
                                })
                              }
                              defaultValue={selectedCustomer.type}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select Type" />
                              </SelectTrigger>
                              <SelectContent>
                                {customerTypes.map((t) => (
                                  <SelectItem key={t} value={t}>
                                    {t}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            <Input
                              value={selectedCustomer.contactPerson}
                              onChange={(e) =>
                                setSelectedCustomer({
                                  ...selectedCustomer,
                                  contactPerson: e.target.value,
                                })
                              }
                              placeholder="Contact Person"
                            />

                            <Input
                              value={selectedCustomer.email}
                              onChange={(e) =>
                                setSelectedCustomer({
                                  ...selectedCustomer,
                                  email: e.target.value,
                                })
                              }
                              placeholder="Email"
                            />

                            <Input
                              value={selectedCustomer.mobile}
                              onChange={(e) =>
                                setSelectedCustomer({
                                  ...selectedCustomer,
                                  mobile: e.target.value,
                                })
                              }
                              placeholder="Mobile"
                            />

                            <Input
                              value={selectedCustomer.gstNumber}
                              onChange={(e) =>
                                setSelectedCustomer({
                                  ...selectedCustomer,
                                  gstNumber: e.target.value,
                                })
                              }
                              placeholder="GST Number"
                            />

                            <div className="flex items-center justify-between border rounded-lg p-2">
                              <span className="text-sm">
                                Active Status
                              </span>
                              <Switch
                                checked={selectedCustomer.isActive}
                                onCheckedChange={(val) =>
                                  setSelectedCustomer({
                                    ...selectedCustomer,
                                    isActive: val,
                                  })
                                }
                              />
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                              <Button
                                variant="outline"
                                onClick={() => setOpen(false)}
                              >
                                Cancel
                              </Button>
                              <Button onClick={handleSave}>Save</Button>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
