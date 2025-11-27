import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

interface SendEmailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string | null;
}

export default function SendEmailModal({
  open,
  onOpenChange,
  invoiceId,
}: SendEmailModalProps) {
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("Invoice PDF");
  const [message, setMessage] = useState("Please find attached invoice.");
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [sending, setSending] = useState(false);

  // ----------------------------------------------------
  // Load customer email
  // ----------------------------------------------------
  useEffect(() => {
    if (!open || !invoiceId) return;

    const loadEmail = async () => {
      setLoadingEmail(true);
      try {
        const response = await apiFetch(`/api/v1/invoices/${invoiceId}`);
        const data = await response.json();
        const invoice = data.data || data;

        const customerEmail =
          invoice.customerEmail ||
          invoice.customer?.email ||
          invoice.customer?.emailId ||
          "";

        setEmail(customerEmail || "");
      } catch (err) {
        console.error("Failed to load customer email", err);
      } finally {
        setLoadingEmail(false);
      }
    };

    loadEmail();
  }, [open, invoiceId]);

  // ----------------------------------------------------
  // Send email
  // ----------------------------------------------------
  const sendEmail = async () => {
    if (!invoiceId) return toast.error("No invoice selected");
    if (!email) return toast.error("Email is required");

    setSending(true);
    try {
      const response = await apiFetch(
        `/api/v1/invoices/${invoiceId}/send-email`,
        {
          method: "POST",
          body: JSON.stringify({
            to: email,
            cc: [],
            subject,
            message,
            includePaymentLink: false,
          }),
        }
      );

      if (!response.ok) {
        const text = await response.text();
        toast.error("Failed: " + text);
        return;
      }

      toast.success("Email sent successfully!");
      onOpenChange(false);
    } catch (err) {
      console.error("Email error:", err);
      toast.error("Network error while sending email");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Send Invoice Email</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <label className="text-sm font-medium">Email Address</label>
          <Input
            type="email"
            placeholder="customer@example.com"
            value={email}
            disabled={loadingEmail}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label className="text-sm font-medium">Subject</label>
          <Input value={subject} onChange={(e) => setSubject(e.target.value)} />

          <label className="text-sm font-medium">Message</label>
          <Input value={message} onChange={(e) => setMessage(e.target.value)} />
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={sending} onClick={sendEmail}>
            {sending ? "Sending..." : "Send Email"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
