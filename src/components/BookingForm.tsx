import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Camera, ImagePlus, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BOOKING_STATUSES, PRODUCTION_STATUSES, PAYMENT_MODES, calcBalance, formatINR, paymentStatus } from "@/lib/booking";
import { DateField } from "@/components/DateField";
import { uploadPhoto, usePhotoUrl, type Booking } from "@/lib/data";

const schema = z
  .object({
    customer_name: z.string().trim().min(1, "Customer name is required").max(100),
    customer_phone: z.string().trim().regex(/^[+\d][\d\s-]{9,14}$/, "Enter a valid mobile number"),
    booking_date: z.string().min(1, "Booking date is required"),
    idol_name: z.string().trim().max(150),
    requirements: z.string().trim().max(2000),
    total_amount: z.number({ message: "Enter idol amount" }).min(0),
    advance_amount: z.number().min(0),
    status: z.enum(BOOKING_STATUSES),
    production_status: z.enum(PRODUCTION_STATUSES),
    delivery_date: z.string().nullable(),
    delivery_time: z.string().nullable(),
    initial_payment_mode: z.enum(PAYMENT_MODES),
  })
  .refine((v) => v.advance_amount <= v.total_amount, { path: ["advance_amount"], message: "Advance cannot exceed total amount" });

export type BookingInput = z.infer<typeof schema> & { photo_url: string | null };

const today = () => new Date().toLocaleDateString("en-CA");

export function BookingForm({ initial, bookingNo, onSubmit, submitLabel }: {
  initial?: Booking;
  bookingNo: string;
  onSubmit: (v: BookingInput) => Promise<void>;
  submitLabel: string;
}) {
  const [f, setF] = useState({
    customer_name: initial?.customer_name ?? "",
    customer_phone: initial?.customer_phone ?? "",
    booking_date: initial?.booking_date ?? today(),
    idol_name: initial?.idol_name ?? "",
    requirements: initial?.requirements ?? "",
    total_amount: initial ? String(initial.total_amount) : "",
    advance_amount: initial ? String(initial.advance_amount) : "",
    status: (initial?.status ?? "Booked") as (typeof BOOKING_STATUSES)[number],
    production_status: initial?.production_status ?? "Booked",
    delivery_date: initial?.delivery_date ?? "",
    delivery_time: initial?.delivery_time?.slice(0, 5) ?? "",
    initial_payment_mode: initial?.initial_payment_mode ?? "Cash",
  });
  const [photoPath, setPhotoPath] = useState<string | null>(initial?.photo_url ?? null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const { data: storedUrl } = usePhotoUrl(file ? null : photoPath);

  const total = Number(f.total_amount) || 0;
  const advance = Number(f.advance_amount) || 0;
  const overAdvance = advance > total;
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const fl = e.target.files?.[0];
    if (!fl) return;
    if (!fl.type.startsWith("image/")) { toast.error("Please choose an image"); return; }
    setFile(fl);
    setPreview(URL.createObjectURL(fl));
    e.target.value = "";
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({
      ...f,
      total_amount: f.total_amount === "" ? undefined : Number(f.total_amount),
      advance_amount: Number(f.advance_amount) || 0,
      delivery_date: f.delivery_date || null,
      delivery_time: f.delivery_date && f.delivery_time ? f.delivery_time : null,
    });
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => { errs[String(i.path[0])] ??= i.message; });
      setErrors(errs);
      toast.error("Please fix the highlighted fields");
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      let path = photoPath;
      if (file) path = await uploadPhoto(file);
      await onSubmit({ ...parsed.data, photo_url: path });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const err = (k: string) => errors[k] && <p className="text-sm text-destructive">{errors[k]}</p>;
  const shown = preview ?? storedUrl ?? null;

  return (
    <form onSubmit={submit} className="space-y-6">
      <section className="rounded-2xl border bg-card p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl text-maroon">Customer</h2>
          <span className="rounded-full bg-secondary px-3 py-1 font-mono text-sm">{bookingNo}</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">Customer Name *</Label>
            <Input id="name" className="h-11" value={f.customer_name} onChange={set("customer_name")} />
            {err("customer_name")}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Mobile Number *</Label>
            <Input id="phone" className="h-11" type="tel" inputMode="tel" placeholder="98765 43210" value={f.customer_phone} onChange={set("customer_phone")} />
            {err("customer_phone")}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="date">Booking Date</Label>
            <Input id="date" className="h-11" type="date" value={f.booking_date} onChange={set("booking_date")} />
            {err("booking_date")}
          </div>
          <div className="space-y-1.5">
            <Label>Booking Status</Label>
            <Select value={f.status} onValueChange={(v) => setF({ ...f, status: v as typeof f.status })}>
              <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
              <SelectContent>{BOOKING_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Production Status</Label>
            <Select value={f.production_status} onValueChange={(v) => setF({ ...f, production_status: v })}><SelectTrigger className="h-11" aria-label="Production status"><SelectValue /></SelectTrigger><SelectContent>{PRODUCTION_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
          </div>
          <div className="space-y-1.5"><Label>Expected Delivery / Pickup Date</Label><DateField label="Delivery / pickup date" value={f.delivery_date} onChange={(value) => setF({ ...f, delivery_date: value, delivery_time: value ? f.delivery_time : "" })} /></div>
          <div className="space-y-1.5"><Label htmlFor="delivery-time">Expected Delivery / Pickup Time</Label><Input id="delivery-time" className="h-11" type="time" disabled={!f.delivery_date} value={f.delivery_time} onChange={set("delivery_time")} /></div>
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-5 shadow-sm">
        <h2 className="mb-4 text-xl text-maroon">Idol / मूर्ती</h2>
        <div className="grid gap-4 sm:grid-cols-[1fr_200px]">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="idol">Idol Name / मूर्तीचे नाव</Label>
              <Input id="idol" className="h-11" placeholder="e.g. Lalbaug Raja 3 ft" value={f.idol_name} onChange={set("idol_name")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="req">Additional Requirements / मूर्तीच्या अतिरिक्त आवश्यकता</Label>
              <Textarea id="req" rows={4} placeholder="Size, colours, decoration, customisation…" value={f.requirements} onChange={set("requirements")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Idol Photo</Label>
            <div className="relative grid aspect-square place-items-center overflow-hidden rounded-xl border-2 border-dashed bg-muted">
              {shown ? (
                <>
                  <img src={shown} alt="Idol" className="h-full w-full object-cover" />
                  <button type="button" aria-label="Remove photo" onClick={() => { setFile(null); setPreview(null); setPhotoPath(null); }} className="absolute right-2 top-2 rounded-full bg-card p-1 shadow">
                    <X className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <span className="text-sm text-muted-foreground">No photo</span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant="outline" asChild>
                <label className="cursor-pointer"><Camera />Camera<input type="file" accept="image/*" capture="environment" className="sr-only" onChange={pick} /></label>
              </Button>
              <Button type="button" variant="outline" asChild>
                <label className="cursor-pointer"><ImagePlus />Upload<input type="file" accept="image/*" className="sr-only" onChange={pick} /></label>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-5 shadow-sm">
        <h2 className="mb-4 text-xl text-maroon">Payment</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="total">Idol Amount (₹) *</Label>
            <Input id="total" className="h-11 text-lg" type="number" inputMode="decimal" min={0} value={f.total_amount} onChange={set("total_amount")} />
            {err("total_amount")}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="adv">{initial ? "Total Paid (₹)" : "Advance Amount (₹)"}</Label>
            <Input id="adv" className="h-11 text-lg" type="number" inputMode="decimal" min={0} step="0.01" readOnly={Boolean(initial)} value={f.advance_amount} onChange={set("advance_amount")} aria-invalid={overAdvance} />
            {overAdvance ? <p className="text-sm text-destructive">Advance cannot exceed total amount</p> : err("advance_amount")}
          </div>
          <div className="space-y-1.5">
            <Label>Balance Amount</Label>
            <div className="flex h-11 items-center justify-between rounded-md bg-secondary px-3">
              <span className="text-lg font-semibold">{formatINR(calcBalance(total, advance))}</span>
              <span className="text-xs text-muted-foreground">{paymentStatus(total, advance)}</span>
            </div>
          </div>
        </div>
        {!initial && <div className="mt-4 space-y-1.5"><Label>Advance Payment Mode</Label><Select value={f.initial_payment_mode} onValueChange={(v) => setF({ ...f, initial_payment_mode: v })}><SelectTrigger aria-label="Advance payment mode"><SelectValue /></SelectTrigger><SelectContent>{PAYMENT_MODES.map((mode) => <SelectItem key={mode} value={mode}>{mode}</SelectItem>)}</SelectContent></Select></div>}
      </section>

      <Button type="submit" variant="hero" size="xl" className="h-14 w-full text-lg" disabled={busy || overAdvance}>
        {busy && <Loader2 className="animate-spin" />}{submitLabel}
      </Button>
    </form>
  );
}
