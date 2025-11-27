import { useState } from "react";
import { useNavigate } from "react-router-dom";
import CreateCustomerModal from "./CreateCustomerModal";

export default function CreateCustomerPage() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);

  // When modal closes → go back to /customers
  const handleClose = (value: boolean) => {
    setOpen(value);
    if (!value) navigate("/customers");
  };

  return (
    <CreateCustomerModal
      open={open}
      onOpenChange={handleClose}
      onCustomerCreated={() => navigate("/customers")}
    />
  );
}
