import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Eye, Pencil, Printer, MessageCircle, PlusCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { bookingsQuery } from "@/lib/data";
import { BOOKING_STATUSES, formatINR, paymentStatus } from "@/lib/booking";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard – Idol Bookings" }, { name: "description", content: "Booking totals, collections and pending balances." }, { property: "og:title", content: "Booking Dashboard" }, { property: "og:description", content: "Booking totals and recent bookings." }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(bookingsQuery),
  component: Dashboard,
});

function Dashboard() {
  const { data } = useSuspenseQuery(bookingsQuery);
  const [q, setQ] = useState("");
  const [date, setDate] = useState("");
  const [pay, setPay] = useState("all");
  const [status, setStatus] = useState("all");
  const today = new Date().toLocaleDateString("en-CA");

  const active = data.filter((b) => b.status !== "Cancelled");
  const stats = [
    { label: "Total Bookings", value: String(active.length) },
    { label: "Today's Bookings", value: String(active.filter((b) => b.booking_date === today).length) },
    { label: "Total Amount", value: formatINR(active.reduce((s, b) => s + Number(b.total_amount), 0)) },
    { label: "Advance Collected", value: formatINR(active.reduce((s, b) => s + Number(b.advance_amount), 0)) },
    { label: "Pending Balance", value: formatINR(active.reduce((s, b) => s + Number(b.balance_amount ?? 0), 0)), hi: true },
  ];

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return data.filter((b) =>
      (!t || [b.booking_no, b.customer_name, b.customer_phone].some((x) => (x ?? "").toLowerCase().includes(t))) &&
      (!date || b.booking_date === date) &&
      (pay === "all" || paymentStatus(Number(b.total_amount), Number(b.advance_amount)) === pay) &&
      (status === "all" || b.status === status));
  }, [data, q, date, pay, status]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-3xl text-maroon">Dashboard</h1><p className="text-muted-foreground">गणपती बाप्पा मोरया 🙏</p></div>
        <Button variant="hero" size="xl" asChild><Link to="/new"><PlusCircle />New Booking</Link></Button>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {stats.map((s) => (
          <div key={s.label} className={`rounded-2xl border p-4 shadow-sm ${s.hi ? "bg-saffron text-primary-foreground" : "bg-card"}`}>
            <p className={`text-xs uppercase tracking-wide ${s.hi ? "" : "text-muted-foreground"}`}>{s.label}</p>
            <p className="mt-1 text-2xl font-semibold">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-2 rounded-2xl border bg-card p-3 sm:grid-cols-[1fr_auto_auto_auto]">
        <div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="h-10 pl-9" placeholder="Booking no, name or mobile" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <Input type="date" className="h-10" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Booking date" />
        <Select value={pay} onValueChange={setPay}><SelectTrigger className="h-10 sm:w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All payments</SelectItem><SelectItem value="Unpaid">Unpaid</SelectItem><SelectItem value="Partially Paid">Partially Paid</SelectItem><SelectItem value="Paid">Paid</SelectItem></SelectContent></Select>
        <Select value={status} onValueChange={setStatus}><SelectTrigger className="h-10 sm:w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem>{BOOKING_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
      </div>

      <div className="overflow-x-auto rounded-2xl border bg-card">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-secondary text-left text-xs uppercase tracking-wide text-secondary-foreground">
            <tr>{["Booking No", "Customer", "Mobile", "Date", "Idol", "Total", "Advance", "Balance", "Status", "Actions"].map((h) => <th key={h} className="px-3 py-3 font-semibold">{h}</th>)}</tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={10} className="px-3 py-10 text-center text-muted-foreground">No bookings found</td></tr>}
            {rows.map((b) => (
              <tr key={b.id} className="border-t hover:bg-muted/50">
                <td className="px-3 py-2 font-mono">{b.booking_no}</td>
                <td className="px-3 py-2 font-medium">{b.customer_name}</td>
                <td className="px-3 py-2">{b.customer_phone}</td>
                <td className="px-3 py-2">{new Date(b.booking_date).toLocaleDateString("en-IN")}</td>
                <td className="px-3 py-2">{b.idol_name}</td>
                <td className="px-3 py-2">{formatINR(b.total_amount)}</td>
                <td className="px-3 py-2">{formatINR(b.advance_amount)}</td>
                <td className="px-3 py-2 font-semibold text-maroon">{formatINR(b.balance_amount)}</td>
                <td className="px-3 py-2"><span className="rounded-full bg-accent px-2 py-0.5 text-xs">{b.status}</span></td>
                <td className="px-3 py-2">
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" asChild aria-label="View"><Link to="/bookings/$id" params={{ id: b.id }}><Eye /></Link></Button>
                    <Button size="icon" variant="ghost" asChild aria-label="Edit"><Link to="/edit/$id" params={{ id: b.id }}><Pencil /></Link></Button>
                    <Button size="icon" variant="ghost" asChild aria-label="Print"><Link to="/bookings/$id" params={{ id: b.id }} search={{ print: true }}><Printer /></Link></Button>
                    <Button size="icon" variant="ghost" asChild aria-label="WhatsApp"><Link to="/bookings/$id" params={{ id: b.id }} search={{ wa: true }}><MessageCircle className="text-whatsapp" /></Link></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
