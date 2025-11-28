import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSidebarStore } from "@/lib/store";
import {
  Building2,
  Receipt,
  Settings,
  Users,
  FileText,
  CreditCard,
  PieChart,
  // Menu,
  X,
  FileMinusIcon
} from "lucide-react";
import { NavLink } from "react-router-dom";

const navigation = [
  { name: "Company Creation", href: "/company", icon: Building2 },
  { name: "GST Settings", href: "/gst", icon: Settings },
  { name: "Service/Client Types", href: "/service-types", icon: FileText },
  { name: "Customer Management", href: "/customers", icon: Users },
  { name: "Billing", href: "/billing", icon: CreditCard },
  { name: "Receipts", href: "/receipts", icon: Receipt },
  { name: "Credit Notes", href: "/credit-notes", icon: FileMinusIcon },
  { name: "Reports", href: "/reports", icon: PieChart },
];

export function Sidebar() {
  const { isOpen, toggle } = useSidebarStore();

  return (
    <div
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-card shadow-custom transition-transform duration-300 ease-in-out lg:translate-x-0",
        !isOpen && "-translate-x-full"
      )}
    >
      <div className="flex h-16 items-center justify-between px-4 py-4">
        <h2 className="text-lg font-semibold">RMS</h2>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={toggle}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
      <ScrollArea className="flex-1 px-4">
        <nav className="flex flex-col gap-1">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                )
              }
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </ScrollArea>
    </div>
  );
}