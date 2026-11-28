import { Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Eye, Pencil, Printer, MessageCircle, Search, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateField } from "@/components/DateField";
import { ProductionSelect } from "@/components/ProductionSelect";
import { bookingsQuery } from "@/lib/data";
import { BOOKING_STATUSES, PRODUCTION_STATUSES, formatINR, matchesBooking } from "@/lib/booking";

function shortDate(value: string | null | undefined) {
  if (!value) return "-";
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

export function BookingsTable() {
  const { data } = useSuspenseQuery(bookingsQuery);
  const [q, setQ] = useState("");
  const [date, setDate] = useState("");
  const [pay, setPay] = useState("all");
  const [status, setStatus] = useState("all");
  const [production, setProduction] = useState("all");
  const [delivery, setDelivery] = useState("");
  const [year, setYear] = useState("all");
  const years = [...new Set(data.map((b) => b.booking_date.slice(0, 4)))].sort().reverse();

  const rows = useMemo(() => {
    return data.filter((b) => matchesBooking(b, { query: q, date, delivery, year, payment: pay, production, status }));
  }, [data, q, date, pay, status, delivery, year, production]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl text-maroon">Bookings</h1>
          <p className="text-muted-foreground">{rows.length} of {data.length} bookings shown</p>
        </div>
        <Button asChild className="shrink-0 gap-1.5">
          <Link to="/new"><PlusCircle className="h-4 w-4" />New Booking</Link>
        </Button>
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
        <table className="w-full text-xs">
          <thead className="bg-secondary text-left text-[11px] uppercase tracking-wide text-secondary-foreground">
            <tr>{["No", "Customer", "Booked", "Pickup", "Idol", "Total", "Paid", "Balance", "Status", "Production", "Actions"].map((h) => <th key={h} className="px-2 py-2 font-semibold whitespace-nowrap">{h}</th>)}</tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={11} className="px-2 py-10 text-center text-muted-foreground">No bookings found</td></tr>}
            {rows.map((b) => (
              <tr key={b.id} className="border-t hover:bg-muted/50">
                <td className="px-1.5 py-1.5 font-mono text-[11px] whitespace-nowrap">{b.booking_no}</td>
                <td className="px-2 py-1.5">
                  <div className="max-w-[150px] truncate font-medium" title={b.customer_name}>{b.customer_name}</div>
                  <div className="max-w-[150px] truncate text-[11px] text-muted-foreground" title={b.customer_phone}>{b.customer_phone}</div>
                </td>
                <td className="px-2 py-1.5 whitespace-nowrap">{shortDate(b.booking_date)}</td>
                <td className="px-2 py-1.5 whitespace-nowrap">
                  {b.delivery_date ? (
                    <>
                      <div>{shortDate(b.delivery_date)}</div>
                      <div className="text-[11px] text-muted-foreground">{b.delivery_time ? b.delivery_time.slice(0, 5) : "Any time"}</div>
                    </>
                  ) : (
                    <span className="text-muted-foreground">Not set</span>
                  )}
                </td>
                <td className="px-2 py-1.5">
                  <div className="max-w-[100px] truncate" title={b.idol_name || "-"}>{b.idol_name || "-"}</div>
                  {b.idol_height && <div className="max-w-[100px] truncate text-[11px] text-muted-foreground" title={b.idol_height}>{b.idol_height}</div>}
                </td>
                <td className="px-1.5 py-1.5 whitespace-nowrap">{formatINR(b.total_amount)}</td>
                <td className="px-1.5 py-1.5 whitespace-nowrap">{formatINR(b.advance_amount)}</td>
                <td className="px-1.5 py-1.5 font-semibold whitespace-nowrap text-maroon">{formatINR(b.balance_amount)}</td>
                <td className="px-1.5 py-1.5 whitespace-nowrap"><span className="rounded-full bg-accent px-1.5 py-0.5 text-[10px]">{b.status}</span></td>
                <td className="px-2 py-1.5"><ProductionSelect id={b.id} value={b.production_status} compact /></td>
                <td className="px-2 py-1.5">
                  <div className="flex gap-0">
                    <Button size="icon" variant="ghost" asChild aria-label="View" className="h-6 w-6"><Link to="/bookings/$id" params={{ id: b.id }}><Eye className="h-3.5 w-3.5" /></Link></Button>
                    <Button size="icon" variant="ghost" asChild aria-label="Edit" className="h-6 w-6"><Link to="/edit/$id" params={{ id: b.id }}><Pencil className="h-3.5 w-3.5" /></Link></Button>
                    <Button size="icon" variant="ghost" asChild aria-label="Print" className="h-6 w-6"><Link to="/bookings/$id" params={{ id: b.id }} search={{ print: true }}><Printer className="h-3.5 w-3.5" /></Link></Button>
                    <Button size="icon" variant="ghost" asChild aria-label="WhatsApp" className="h-6 w-6"><Link to="/bookings/$id" params={{ id: b.id }} search={{ wa: true }}><MessageCircle className="h-3.5 w-3.5 text-whatsapp" /></Link></Button>
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
