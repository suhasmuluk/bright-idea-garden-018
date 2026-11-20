import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { BookingForm } from "@/components/BookingForm";

export const Route = createFileRoute("/_authenticated/new")({
  head: () => ({ meta: [{ title: "New Booking – Idol Bookings" }, { name: "description", content: "Create a new idol booking." }, { property: "og:title", content: "New Booking" }, { property: "og:description", content: "Create a new idol booking." }] }),
  component: NewBooking,
});

function NewBooking() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-1 text-3xl text-maroon">New Booking</h1>
      <p className="mb-6 text-muted-foreground">नवीन मूर्ती बुकिंग</p>
      <BookingForm
        bookingNo="Auto-generated"
        submitLabel="Submit Booking"
        onSubmit={async (v) => {
          const { data: u } = await supabase.auth.getUser();
          const { data, error } = await supabase.from("bookings").insert({ ...v, created_by: u.user?.id ?? null }).select("id, booking_no").single();
          if (error) throw error;
          await qc.invalidateQueries({ queryKey: ["bookings"] });
          toast.success(`Booking ${data.booking_no} saved!`);
          navigate({ to: "/bookings/$id", params: { id: data.id }, search: { created: true } });
        }}
      />
    </div>
  );
}
