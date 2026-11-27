import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, CalendarClock, Inbox, ListChecks } from "lucide-react";
import { bookingsQuery, settingsQuery } from "@/lib/data";
import { localDate } from "@/lib/booking";
import { BookingsTable } from "@/components/BookingsTable";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Home – Idol Bookings" }, { name: "description", content: "Welcome, today's pickup and delivery schedule, and the complete searchable booking table." }, { property: "og:title", content: "Home – Idol Bookings" }, { property: "og:description", content: "Today's pickup and delivery schedule at a glance." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  loader: ({ context }) => Promise.all([
    context.queryClient.ensureQueryData(settingsQuery),
    context.queryClient.ensureQueryData(bookingsQuery),
  ]),
  component: Home,
});

function Home() {
  const { data: s } = useSuspenseQuery(settingsQuery);
  const { data } = useSuspenseQuery(bookingsQuery);
  const today = localDate();

  const todays = data
    .filter((b) => b.delivery_date === today && b.status !== "Cancelled" && b.production_status !== "Cancelled")
    .sort((a, b) => (a.delivery_time ?? "").localeCompare(b.delivery_time ?? ""));

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border bg-card px-6 py-8 shadow-warm sm:px-10 sm:py-12">
        <div className="gold-rule absolute inset-x-0 top-0" />
        <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:gap-7">
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-saffron font-display text-4xl text-primary-foreground">ॐ</span>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{s.shop_name}</p>
            <h1 className="mt-1 text-4xl text-maroon sm:text-5xl">Ganpati Bappa Morya 🙏</h1>
            <p className="mt-2 max-w-xl text-muted-foreground">
              {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border bg-card">
        <div className="flex items-center gap-2 border-b px-5 py-4">
          <CalendarClock className="h-5 w-5 text-maroon" />
          <h2 className="text-xl text-maroon">Today's Pickup &amp; Delivery</h2>
          <span className="ml-auto rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">{todays.length}</span>
        </div>

        {todays.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-5 py-12 text-center">
            <Inbox className="h-8 w-8 text-muted-foreground" />
            <p className="text-muted-foreground">Nothing scheduled for today.</p>
          </div>
        ) : (
          <ul className="divide-y">
            {todays.map((b) => (
              <li key={b.id}>
                <Link to="/bookings/$id" params={{ id: b.id }} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3 hover:bg-muted/50">
                  <span className="w-24 shrink-0 font-mono text-xs text-muted-foreground">{b.booking_no}</span>
                  <span className="font-medium">{b.customer_name}</span>
                  <span className="text-muted-foreground">{b.idol_name || "-"}</span>
                  <span className="ml-auto whitespace-nowrap text-sm text-maroon">{b.delivery_time ? b.delivery_time.slice(0, 5) : "Any time"}</span>
                  <span className="rounded-full bg-accent px-2 py-0.5 text-xs">{b.production_status}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <BookingsTable />

      <div className="flex flex-wrap gap-3">
        <Link to="/bookings" className="inline-flex items-center gap-2 rounded-2xl border bg-card px-5 py-3 text-sm font-medium hover:border-primary hover:bg-secondary/60">
          <ListChecks className="h-4 w-4 text-maroon" />All Bookings
          <ArrowRight className="h-4 w-4 text-primary" />
        </Link>
        <Link to="/settings" className="inline-flex items-center gap-2 rounded-2xl border bg-card px-5 py-3 text-sm font-medium hover:border-primary hover:bg-secondary/60">
          Shop Settings
          <ArrowRight className="h-4 w-4 text-primary" />
        </Link>
      </div>
    </div>
  );
}
