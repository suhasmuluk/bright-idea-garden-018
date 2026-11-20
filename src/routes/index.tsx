import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ganesh Idol Booking Manager" },
      { name: "description", content: "Book Ganesh idols, track advance and balance, send WhatsApp confirmations and print receipts." },
      { property: "og:title", content: "Ganesh Idol Booking Manager" },
      { property: "og:description", content: "Quick idol bookings with WhatsApp confirmations and printable receipts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
});
