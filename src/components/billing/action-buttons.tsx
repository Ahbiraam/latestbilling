import { Button } from "@/components/ui/button";
import { Save, FileText, X } from "lucide-react";
import { Link } from "react-router-dom";

export function ActionButtons() {
  return (
    <div className="flex justify-end gap-4">
      <Button variant="outline" asChild>
        <Link to="/billing">
          <X className="mr-2 h-4 w-4" />
          Cancel
        </Link>
      </Button>
      <Button variant="outline" type="button">
        <Save className="mr-2 h-4 w-4" />
        Save Draft
      </Button>
      <Button type="submit">
        <FileText className="mr-2 h-4 w-4" />
        Generate Invoice
      </Button>
    </div>
  );
} 