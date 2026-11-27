import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { bookingsQuery } from "@/lib/data";
import { formatINR, localDate } from "@/lib/booking";

export const Route = createFileRoute("/_authenticated/amounts")({
  head: () => ({ meta: [{ title: "Amounts – Idol Bookings" }, { name: "description", content: "Booking amounts, advance collected, pending balances and production totals." }, { property: "og:title", content: "Amounts – Idol Bookings" }, { property: "og:description", content: "View collected advances, pending balances and booking totals." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(bookingsQuery),
  component: AmountsPage,
});

function AmountsPage() {
  const { data } = useSuspenseQuery(bookingsQuery);
  const today = localDate();
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

  return (
    <div className="space-y-6">
      <h1 className="text-3xl text-maroon">Amounts</h1>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className={`min-w-0 rounded-2xl border p-4 shadow-sm ${s.hi ? "bg-saffron text-primary-foreground" : "bg-card"}`}>
            <p className={`text-xs uppercase tracking-wide ${s.hi ? "" : "text-muted-foreground"}`}>{s.label}</p>
            <p className="mt-1 break-words text-2xl font-semibold">{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}