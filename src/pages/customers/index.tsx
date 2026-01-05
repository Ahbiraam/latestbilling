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

// Mock data
const mockCustomers: Customer[] = [
  {
    id: "1",
    name: "Acme Corporation",
    code: "ACME001",
    type: "Corporate",
    address: "123 Business Ave, Suite 100, Business City, 12345",
    email: "contact@acme.com",
    whatsapp: "+1234567890",
    phone: "+1234567890",
    contactPerson: "John Smith",
    gstNumber: "GST123456789",
    panNumber: "PAN1234567",
    paymentTerms: 30,
    accountManager: "1",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    name: "Tech Startups Inc",
    code: "TECH001",
    type: "Startup",
    address: "456 Innovation Street, Tech Hub, 67890",
    email: "info@techstartups.com",
    whatsapp: "+1234567891",
    phone: "+1234567891",
    contactPerson: "Jane Doe",
    gstNumber: "GST987654321",
    panNumber: "PAN7654321",
    paymentTerms: 15,
    accountManager: "2",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export default function CustomersPage() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState(mockCustomers);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  async function handleDelete(id: string) {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setCustomers(customers.filter((c) => c.id !== id));
      toast.success("Customer deleted successfully");
    } catch (error) {
      toast.error("Failed to delete customer");
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1>Customers</h1>
        <p className="text-muted-foreground">
          Manage your customer database
        </p>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="relative w-[300px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search customers..."
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

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Contact Person</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCustomers.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell className="font-medium">{customer.code}</TableCell>
                <TableCell>{customer.name}</TableCell>
                <TableCell>{customer.type}</TableCell>
                <TableCell>{customer.contactPerson}</TableCell>
                <TableCell>{customer.email}</TableCell>
                <TableCell>{customer.phone}</TableCell>
                <TableCell>
                  <Switch checked={customer.isActive} disabled />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
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
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}