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
import { Search, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Customer } from "@/lib/types";

// ---------------------------
// Mock Data (Sample)
// ---------------------------
const mockCustomers: Customer[] = [
  {
    id: "1",
    code: "ACME001",
    name: "Acme Corporation",
    shortName: "ACME",
    type: "Corporate",
    address1: "123 Business Ave",
    address2: "Suite 100",
    address3: "Business City",
    state: "California",
    country: "USA",
    pinCode: "12345",
    gstStateCode: "CA01",
    gstExempted: false,
    gstExemptReason: "",
    sezCode: "",
    gstNumber: "GST123456789",
    panNumber: "PAN1234567",
    email: "contact@acme.com",
    whatsapp: "+1234567890",
    contactPerson: "John Smith",
    mobile: "+1234567890",
    paymentTerms: 30,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    code: "TECH001",
    name: "Tech Startups Inc",
    shortName: "TECH",
    type: "Startup",
    address1: "456 Innovation Street",
    address2: "Tech Park",
    address3: "Innovation City",
    state: "Texas",
    country: "USA",
    pinCode: "67890",
    gstStateCode: "TX07",
    gstExempted: true,
    gstExemptReason: "SEZ Unit",
    sezCode: "SEZ9999",
    gstNumber: "GST987654321",
    panNumber: "PAN7654321",
    email: "info@techstartups.com",
    whatsapp: "+1234567891",
    contactPerson: "Jane Doe",
    mobile: "+1234567891",
    paymentTerms: 15,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export default function CustomersPage() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  const [searchQuery, setSearchQuery] = useState("");

  // ---------------------------
  // Filter Logic
  // ---------------------------
  const filteredCustomers = customers.filter((customer) => {
    const query = searchQuery.toLowerCase();
    return (
      customer.name.toLowerCase().includes(query) ||
      customer.code.toLowerCase().includes(query) ||
      customer.shortName.toLowerCase().includes(query) ||
      customer.mobile.toLowerCase().includes(query) ||
      customer.gstNumber.toLowerCase().includes(query) ||
      customer.contactPerson.toLowerCase().includes(query)
    );
  });

  // ---------------------------
  // Delete Handler
  // ---------------------------
  async function handleDelete(id: string) {
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setCustomers(customers.filter((c) => c.id !== id));
      toast.success("Customer deleted successfully");
    } catch (error) {
      toast.error("Failed to delete customer");
    }
  }

  // ---------------------------
  // Render
  // ---------------------------
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
      <div className="flex items-center justify-between mb-6">
        <div className="relative w-[320px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, code, mobile or GST..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
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
              <TableHead className="w-[100px] text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredCustomers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-6 text-muted-foreground">
                  No customers found.
                </TableCell>
              </TableRow>
            ) : (
              filteredCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.code}</TableCell>
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
                  <TableCell>
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/customers/${customer.id}/edit`)}
                      >
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
                            <AlertDialogTitle>Delete Customer</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this customer? This action
                              cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(customer.id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
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
