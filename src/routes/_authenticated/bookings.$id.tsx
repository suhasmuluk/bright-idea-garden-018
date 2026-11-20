import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { CheckCircle2, MessageCircle, Printer, Pencil, ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { bookingQuery, settingsQuery, usePhotoUrl } from "@/lib/data";
import { calcBalance, formatINR, paymentStatus, whatsappMessage, whatsappUrl } from "@/lib/booking";

export const Route = createFileRoute("/_authenticated/bookings/$id")({
  validateSearch: z.object({ created: z.boolean().optional(), print: z.boolean().optional(), wa: z.boolean().optional() }),
  head: () => ({ meta: [{ title: "Booking Receipt – Idol Bookings" }, { name: "description", content: "Booking details, WhatsApp and print receipt." }, { property: "og:title", content: "Booking Receipt" }, { property: "og:description", content: "Booking details and receipt." }] }),
  loader: async ({ context, params }) => {
    await Promise.all([context.queryClient.ensureQueryData(bookingQuery(params.id)), context.queryClient.ensureQueryData(settingsQuery)]);
  },
  component: BookingView,
});

function BookingView() {
  const { id } = Route.useParams();
  const search = Route.useSearch();
  const { data: b } = useSuspenseQuery(bookingQuery(id));
  const { data: s } = useSuspenseQuery(settingsQuery);
  const { data: photo } = usePhotoUrl(b.photo_url);
  const { data: logo } = usePhotoUrl(s.logo_url);
  const [waOpen, setWaOpen] = useState(!!search.wa);
  const [msg, setMsg] = useState(() => whatsappMessage(b, s.shop_name, s.rules, photo));
  const [msgEdited, setMsgEdited] = useState(false);
  const total = Number(b.total_amount), adv = Number(b.advance_amount);

  useEffect(() => {
    if (photo && !msgEdited) setMsg(whatsappMessage(b, s.shop_name, s.rules, photo));
  }, [photo, msgEdited, b, s]);

  useEffect(() => {
    if (!search.print) return;
    const ready = !b.photo_url || photo;
    if (ready) { const t = setTimeout(() => window.print(), 400); return () => clearTimeout(t); }
    return undefined;
  }, [search.print, photo, b.photo_url]);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="no-print mb-4 space-y-4">
        <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4" />Dashboard</Link>
        {search.created && (
          <div className="flex items-center gap-3 rounded-xl border border-success/40 bg-success/10 p-4">
            <CheckCircle2 className="h-6 w-6 text-success" />
            <div><p className="font-semibold">Booking saved successfully</p><p className="text-sm text-muted-foreground">Send confirmation on WhatsApp or print the receipt.</p></div>
          </div>
        )}
        <div className="grid gap-3 sm:grid-cols-3">
          <Button variant="whatsapp" size="xl" onClick={() => { setMsg(whatsappMessage(b, s.shop_name, s.rules, photo)); setWaOpen(true); }}><MessageCircle />Send via WhatsApp</Button>
          <Button variant="hero" size="xl" onClick={() => window.print()}><Printer />Print Booking</Button>
          <Button variant="outline" size="xl" asChild><Link to="/edit/$id" params={{ id }}><Pencil />Edit</Link></Button>
        </div>
      </div>

      <article className="print-sheet rounded-2xl border bg-card p-6 shadow-warm sm:p-8">
        <header className="flex items-start gap-4">
          {logo ? <img src={logo} alt="" className="h-16 w-16 rounded-full object-cover" /> : <div className="grid h-16 w-16 place-items-center rounded-full bg-saffron font-display text-3xl text-primary-foreground">ॐ</div>}
          <div className="flex-1">
            <h1 className="text-3xl leading-tight text-maroon">{s.shop_name}</h1>
            {s.shop_address && <p className="text-sm text-muted-foreground">{s.shop_address}</p>}
            {s.shop_phone && <p className="text-sm text-muted-foreground">📞 {s.shop_phone}</p>}
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Booking No.</p>
            <p className="font-mono text-lg font-semibold">{b.booking_no}</p>
            <p className="mt-1 rounded-full bg-secondary px-2 py-0.5 text-xs">{b.status}</p>
          </div>
        </header>
        <div className="gold-rule my-5" />
        <h2 className="mb-4 text-center text-xl">Booking Receipt</h2>

        <div className="grid gap-6 sm:grid-cols-[1fr_180px]">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Customer</dt><dd className="font-medium">{b.customer_name}</dd>
            <dt className="text-muted-foreground">Mobile</dt><dd>{b.customer_phone}</dd>
            <dt className="text-muted-foreground">Booking Date</dt><dd>{new Date(b.booking_date).toLocaleDateString("en-IN")}</dd>
            <dt className="text-muted-foreground">Idol / मूर्ती</dt><dd className="font-medium">{b.idol_name || "—"}</dd>
            <dt className="text-muted-foreground">Requirements</dt><dd className="whitespace-pre-wrap">{b.requirements || "—"}</dd>
          </dl>
          {photo && <img src={photo} alt="Idol" className="aspect-square w-full rounded-xl border object-cover" />}
        </div>

        <table className="mt-6 w-full text-sm">
          <tbody>
            <tr className="border-b"><td className="py-2">Total Amount</td><td className="py-2 text-right font-medium">{formatINR(total)}</td></tr>
            <tr className="border-b"><td className="py-2">Advance Received</td><td className="py-2 text-right font-medium">{formatINR(adv)}</td></tr>
            <tr><td className="py-2 text-base font-semibold">Balance Amount</td><td className="py-2 text-right text-lg font-bold text-maroon">{formatINR(calcBalance(total, adv))}</td></tr>
          </tbody>
        </table>
        <p className="text-right text-xs text-muted-foreground">Payment: {paymentStatus(total, adv)}</p>

        <section className="mt-6 rounded-xl bg-secondary/60 p-4">
          <h3 className="mb-2 text-base">Terms & Conditions / नियम व अटी</h3>
          <ol className="list-decimal space-y-1 pl-5 text-xs">{s.rules.map((r, i) => <li key={i}>{r}</li>)}</ol>
        </section>

        <div className="mt-14 grid grid-cols-2 gap-10 text-center text-sm">
          <div className="border-t pt-2">Customer Signature</div>
          <div className="border-t pt-2">For {s.shop_name}</div>
        </div>
      </article>

      <Dialog open={waOpen} onOpenChange={setWaOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>WhatsApp to {b.customer_name}</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Review or edit the message before sending to {b.customer_phone}.</p>
          <Textarea rows={14} value={msg} onChange={(e) => { setMsgEdited(true); setMsg(e.target.value); }} className="text-sm" />
          <DialogFooter>
            <Button variant="whatsapp" size="xl" asChild>
              <a href={whatsappUrl(b.customer_phone, msg)} target="_blank" rel="noreferrer" onClick={() => setWaOpen(false)}><MessageCircle />Open WhatsApp</a>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
