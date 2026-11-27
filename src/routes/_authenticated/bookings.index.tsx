import { createFileRoute } from "@tanstack/react-router";
import { BookingsTable } from "@/components/BookingsTable";
import { bookingsQuery } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/bookings/")({
  head: () => ({ meta: [{ title: "Bookings – Idol Bookings" }, { name: "description", content: "Search and filter every idol booking, with production status and quick actions." }, { property: "og:title", content: "Bookings – Idol Bookings" }, { property: "og:description", content: "Search and filter every idol booking." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(bookingsQuery),
  component: BookingsTable,
});
