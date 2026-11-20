import { useState } from "react";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { MessageCircle, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateField } from "@/components/DateField";
import { supabase } from "@/integrations/supabase/client";
import { paymentsQuery, type Booking, type Payment } from "@/lib/data";
import { calcBalance, formatINR, localDate, PAYMENT_MODES, validPayment } from "@/lib/booking";

export function PaymentHistory({ booking, onNotify }: { booking: Booking; onNotify: (payment: Payment) => void }) {
  const { data: payments } = useSuspenseQuery(paymentsQuery(booking.id));
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(localDate());
  const [mode, setMode] = useState("Cash");
  const [busy, setBusy] = useState(false);
  const balance = calcBalance(Number(booking.total_amount), Number(booking.advance_amount));
  const valid = validPayment(Number(amount), balance) && Boolean(date);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!valid || busy) return;
    setBusy(true);
    try {
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!auth.user) throw new Error("Please sign in again");
      const { error } = await supabase.from("booking_payments").insert({ booking_id: booking.id, amount: Number(amount), payment_date: date, payment_mode: mode, created_by: auth.user.id });
      if (error) throw error;
      await Promise.all([qc.invalidateQueries({ queryKey: ["bookings"] }), qc.invalidateQueries({ queryKey: ["payments", booking.id] })]);
      setOpen(false); setAmount("");
      toast.success("Payment recorded");
    } catch (error) { toast.error((error as Error).message); }
    finally { setBusy(false); }
  }

  return <section className="no-print mt-6 space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-xl text-maroon">Payment History</h2><Button variant="hero" disabled={balance <= 0} onClick={() => { setDate(localDate()); setOpen(true); }}><Plus />Add Payment</Button></div>
    <p className="text-sm">Total paid: <strong>{formatINR(booking.advance_amount)}</strong> · Balance: <strong>{formatINR(balance)}</strong></p>
    <div className="overflow-x-auto rounded-xl border bg-card"><table className="w-full text-sm"><thead className="bg-secondary text-left"><tr><th className="p-3">Date</th><th className="p-3">Mode</th><th className="p-3 text-right">Amount</th><th className="p-3"><span className="sr-only">Actions</span></th></tr></thead><tbody>
      {payments.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-muted-foreground">No payments recorded</td></tr>}
      {payments.map((payment) => <tr key={payment.id} className="border-t"><td className="p-3 whitespace-nowrap">{new Date(`${payment.payment_date}T00:00:00`).toLocaleDateString("en-IN")}{payment.is_opening_balance && <span className="block text-xs text-muted-foreground">Existing advance</span>}</td><td className="p-3">{payment.payment_mode ?? "Not recorded"}</td><td className="p-3 text-right font-medium">{formatINR(payment.amount)}</td><td className="p-3"><Button variant="ghost" size="icon" title="Payment received confirmation" aria-label={`Payment confirmation ${formatINR(payment.amount)}`} onClick={() => onNotify(payment)}><MessageCircle className="text-whatsapp" /></Button></td></tr>)}
    </tbody></table></div>
    <Dialog open={open} onOpenChange={(value) => { if (!busy) setOpen(value); }}><DialogContent><DialogHeader><DialogTitle>Add Payment</DialogTitle></DialogHeader><form onSubmit={save} className="space-y-4">
      <p className="text-sm text-muted-foreground">Remaining balance: {formatINR(balance)}</p>
      <div className="space-y-1.5"><Label htmlFor="payment-amount">Payment Amount (₹)</Label><Input id="payment-amount" type="number" inputMode="decimal" min="0.01" max={balance} step="0.01" required value={amount} onChange={(event) => setAmount(event.target.value)} />{amount && !validPayment(Number(amount), balance) && <p className="text-sm text-destructive">Enter an amount above zero, up to {formatINR(balance)}, with at most two decimal places.</p>}</div>
      <div className="space-y-1.5"><Label>Payment Date</Label><DateField value={date} onChange={setDate} label="Payment date" clearable={false} /></div>
      <div className="space-y-1.5"><Label>Payment Mode</Label><Select value={mode} onValueChange={setMode}><SelectTrigger aria-label="Payment mode"><SelectValue /></SelectTrigger><SelectContent>{PAYMENT_MODES.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select></div>
      <DialogFooter><Button type="submit" variant="hero" disabled={!valid || busy}>{busy && <Loader2 className="animate-spin" />}Record Payment</Button></DialogFooter>
    </form></DialogContent></Dialog>
  </section>;
}