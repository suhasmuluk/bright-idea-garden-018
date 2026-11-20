import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Eye, Pencil, Printer, MessageCircle, PlusCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateField } from "@/components/DateField";
import { ProductionSelect } from "@/components/ProductionSelect";
import { bookingsQuery } from "@/lib/data";
import { BOOKING_STATUSES, PRODUCTION_STATUSES, formatINR, formatDelivery, localDate, matchesBooking } from "@/lib/booking";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard – Idol Bookings" }, { name: "description", content: "Booking totals, production, deliveries and pending balances." }, { property: "og:title", content: "Booking Dashboard – Idol Bookings" }, { property: "og:description", content: "Booking totals, production and deliveries." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(bookingsQuery),
  component: Dashboard,
});

function Dashboard() {
  const { data } = useSuspenseQuery(bookingsQuery);
  const [q, setQ] = useState("");
  const [date, setDate] = useState("");
  const [pay, setPay] = useState("all");
  const [status, setStatus] = useState("all");
  const [production, setProduction] = useState("all");
  const [delivery, setDelivery] = useState("");
  const [year, setYear] = useState("all");
  const today = localDate();
  const years = [...new Set(data.map((b) => b.booking_date.slice(0, 4)))].sort().reverse();

  const active = data.filter((b) => b.status !== "Cancelled" && b.production_status !== "Cancelled");
  const stats = [
    { label: "Total Bookings", value: String(active.length) },
    { label: "Today's Bookings", value: String(active.filter((b) => b.booking_date === today).length) },
    { label: "Total Amount", value: formatINR(active.reduce((s, b) => s + Number(b.total_amount), 0)) },
    { label: "Advance Collected", value: formatINR(active.reduce((s, b) => s + Number(b.advance_amount), 0)) },
    { label: "Pending Balance", value: formatINR(active.reduce((s, b) => s + Number(b.balance_amount ?? 0), 0)), hi: true },
    { label: "Bookings In Production", value: String(active.filter((b) => b.production_status === "In Production").length) },
    { label: "Ready for Pickup", value: String(active.filter((b) => b.production_status === "Ready for Pickup").length) },
    { label: "Deliveries Due Today", value: String(active.filter((b) => b.delivery_date === today && b.production_status !== "Delivered").length) },
    { label: "Total Pending Payments", value: formatINR(active.reduce((s, b) => s + Number(b.balance_amount ?? 0), 0)) },
  ];

  const rows = useMemo(() => {
    return data.filter((b) => matchesBooking(b, { query: q, date, delivery, year, payment: pay, production, status }));
  }, [data, q, date, pay, status, delivery, year, production]);

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

      <div className="grid gap-2 rounded-2xl border bg-card p-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="h-10 pl-9" placeholder="Booking no, name or mobile" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <DateField label="Booking date" value={date} onChange={setDate} />
        <Select value={pay} onValueChange={setPay}><SelectTrigger aria-label="Payment status filter" className="h-11"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All payments</SelectItem><SelectItem value="Unpaid">Unpaid</SelectItem><SelectItem value="Partially Paid">Partially Paid</SelectItem><SelectItem value="Paid">Paid</SelectItem></SelectContent></Select>
        <Select value={status} onValueChange={setStatus}><SelectTrigger aria-label="Booking status filter" className="h-11"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All booking statuses</SelectItem>{BOOKING_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
        <DateField label="Delivery date" value={delivery} onChange={setDelivery} />
        <Select value={production} onValueChange={setProduction}><SelectTrigger aria-label="Production status filter" className="h-11"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All production statuses</SelectItem>{PRODUCTION_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
        <Select value={year} onValueChange={setYear}><SelectTrigger aria-label="Booking year" className="h-11"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All years</SelectItem>{years.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select>
        <Button variant="ghost" className="h-11" onClick={() => { setQ(""); setDate(""); setPay("all"); setStatus("all"); setProduction("all"); setDelivery(""); setYear("all"); }}>Clear Filters</Button>
      </div>

      <div className="overflow-x-auto rounded-2xl border bg-card">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-secondary text-left text-xs uppercase tracking-wide text-secondary-foreground">
            <tr>{["Booking No", "Customer", "Mobile", "Date", "Delivery / Pickup", "Idol", "Total", "Total Paid", "Balance", "Status", "Production", "Actions"].map((h) => <th key={h} className="px-3 py-3 font-semibold">{h}</th>)}</tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={12} className="px-3 py-10 text-center text-muted-foreground">No bookings found</td></tr>}
            {rows.map((b) => (
              <tr key={b.id} className="border-t hover:bg-muted/50">
                <td className="px-3 py-2 font-mono">{b.booking_no}</td>
                <td className="px-3 py-2 font-medium">{b.customer_name}</td>
                <td className="px-3 py-2">{b.customer_phone}</td>
                <td className="px-3 py-2">{new Date(b.booking_date).toLocaleDateString("en-IN")}</td>
                <td className="px-3 py-2 whitespace-nowrap">{formatDelivery(b.delivery_date, b.delivery_time)}</td>
                <td className="px-3 py-2">{b.idol_name}</td>
                <td className="px-3 py-2">{formatINR(b.total_amount)}</td>
                <td className="px-3 py-2">{formatINR(b.advance_amount)}</td>
                <td className="px-3 py-2 font-semibold text-maroon">{formatINR(b.balance_amount)}</td>
                <td className="px-3 py-2"><span className="rounded-full bg-accent px-2 py-0.5 text-xs">{b.status}</span></td>
                <td className="px-3 py-2"><ProductionSelect id={b.id} value={b.production_status} /></td>
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
