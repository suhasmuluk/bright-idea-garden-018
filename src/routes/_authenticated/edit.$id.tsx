import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { BookingForm } from "@/components/BookingForm";
import { bookingQuery } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/edit/$id")({
  head: () => ({ meta: [{ title: "Edit Booking – Idol Bookings" }, { name: "description", content: "Edit an idol booking." }, { property: "og:title", content: "Edit Booking" }, { property: "og:description", content: "Edit an idol booking." }] }),
  loader: ({ context, params }) => context.queryClient.ensureQueryData(bookingQuery(params.id)),
  component: EditBooking,
});

function EditBooking() {
  const { id } = Route.useParams();
  const { data: b } = useSuspenseQuery(bookingQuery(id));
  const navigate = useNavigate();
  const qc = useQueryClient();
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-3xl text-maroon">Edit Booking</h1>
      <BookingForm
        initial={b}
        bookingNo={b.booking_no ?? ""}
        submitLabel="Save Changes"
        onSubmit={async (v) => {
          const { error } = await supabase.from("bookings").update(v).eq("id", id);
          if (error) throw error;
          await qc.invalidateQueries({ queryKey: ["bookings"] });
          toast.success("Booking updated");
          navigate({ to: "/bookings/$id", params: { id } });
        }}
      />
    </div>
  );
}
