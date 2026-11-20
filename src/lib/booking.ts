export const BOOKING_STATUSES = ["Booked", "Advance Paid", "Fully Paid", "Delivered", "Cancelled"] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];
export type PaymentStatus = "Unpaid" | "Partially Paid" | "Paid";
export const PRODUCTION_STATUSES = ["Booked", "In Production", "Ready for Pickup", "Delivered", "Cancelled"] as const;
export const PAYMENT_MODES = ["Cash", "UPI", "Bank"] as const;
export const IDOL_HEIGHTS = ["1 Foot", "1.5 Foot", "2 Foot", "2.5 Foot", "3 Foot", "3.5 Foot", "4 Foot", "4.5 Foot"] as const;
export type NotificationKind = "booking" | "payment" | "balance" | "ready";

export function extraWorkDetails(requested: boolean, details: string): string {
  return requested ? details.trim() : "";
}

export function localDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function formatDelivery(date: string | null | undefined, time?: string | null): string {
  if (!date) return "Not scheduled";
  return `${new Date(`${date}T00:00:00`).toLocaleDateString("en-IN")}${time ? `, ${time.slice(0, 5)}` : ""}`;
}

export function validPayment(amount: number, balance: number): boolean {
  return Number.isFinite(amount) && amount > 0 && amount <= balance && Math.abs(amount * 100 - Math.round(amount * 100)) < 0.000001;
}

export interface BookingFilters { query: string; date: string; delivery: string; year: string; payment: string; production: string; status: string }
export function matchesBooking(b: BookingLike & { customer_phone: string; delivery_date: string | null; production_status: string; status: string }, filters: BookingFilters): boolean {
  const query = filters.query.trim().toLowerCase();
  return (!query || [b.booking_no, b.customer_name, b.customer_phone].some((value) => (value ?? "").toLowerCase().includes(query))) &&
    (!filters.date || b.booking_date === filters.date) &&
    (!filters.delivery || b.delivery_date === filters.delivery) &&
    (filters.year === "all" || b.booking_date.slice(0, 4) === filters.year) &&
    (filters.payment === "all" || paymentStatus(Number(b.total_amount), Number(b.advance_amount)) === filters.payment) &&
    (filters.production === "all" || b.production_status === filters.production) &&
    (filters.status === "all" || b.status === filters.status);
}

export function calcBalance(total: number, advance: number): number {
  return Math.max(0, Math.round((total - advance) * 100) / 100);
}

export function paymentStatus(total: number, advance: number): PaymentStatus {
  if (advance <= 0) return "Unpaid";
  if (advance >= total) return "Paid";
  return "Partially Paid";
}

export function formatINR(n: number | string | null | undefined): string {
  const v = Number(n ?? 0);
  return "₹" + v.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

export function normalizePhone(phone: string): string {
  const d = phone.replace(/\D/g, "");
  if (d.length === 10) return "91" + d;
  return d;
}

export interface BookingLike {
  booking_no: string | null;
  customer_name: string;
  booking_date: string;
  idol_name: string;
  requirements: string;
  total_amount: number | string;
  advance_amount: number | string;
  delivery_date?: string | null;
  delivery_time?: string | null;
}

export function whatsappMessage(b: BookingLike, shopName: string, rules: string[], photoUrl?: string | null): string {
  const total = Number(b.total_amount);
  const adv = Number(b.advance_amount);
  const lines = [
    `🙏 *${shopName}* 🙏`,
    `*Booking Confirmation*`,
    ``,
    `Booking No: *${b.booking_no ?? ""}*`,
    `Name: ${b.customer_name}`,
    `Date: ${b.booking_date}`,
    `Idol: ${b.idol_name || "-"}`,
  ];
  if (b.requirements.trim()) lines.push(`Requirements: ${b.requirements.trim()}`);
  if (photoUrl) lines.push(`Idol Photo: ${photoUrl}`);
  if (b.delivery_date) lines.push(`Delivery / Pickup: ${formatDelivery(b.delivery_date, b.delivery_time)}`);
  lines.push(
    ``,
    `Total Amount: ${formatINR(total)}`,
    `Advance Paid: ${formatINR(adv)}`,
    `*Balance: ${formatINR(calcBalance(total, adv))}*`,
  );
  if (rules.length) {
    lines.push(``, `*Terms & Conditions*`);
    rules.forEach((r, i) => lines.push(`${i + 1}. ${r}`));
  }
  lines.push(``, `Ganpati Bappa Morya! 🌺`);
  return lines.join("\n");
}

export function whatsappUrl(phone: string, message: string): string {
  return `https://wa.me/${normalizePhone(phone)}?text=${encodeURIComponent(message)}`;
}

export function notificationMessage(kind: NotificationKind, b: BookingLike, shopName: string, rules: string[], photoUrl?: string | null, payment?: { amount: number; payment_date: string; payment_mode: string | null }): string {
  if (kind === "booking") return whatsappMessage(b, shopName, rules, photoUrl);
  const heading = kind === "payment" ? "Payment Received Confirmation" : kind === "balance" ? "Pending Balance Reminder" : "Idol Ready for Pickup";
  const lines = [`🙏 *${shopName}* 🙏`, `*${heading}*`, "", `Booking No: *${b.booking_no ?? ""}*`, `Name: ${b.customer_name}`, `Idol: ${b.idol_name || "-"}`];
  if (kind === "payment" && payment) lines.push(`Payment Received: ${formatINR(payment.amount)}`, `Payment Date: ${payment.payment_date}`, `Payment Mode: ${payment.payment_mode ?? "Not recorded"}`);
  lines.push(`Total Amount: ${formatINR(b.total_amount)}`, `Total Paid: ${formatINR(b.advance_amount)}`, `*Balance: ${formatINR(calcBalance(Number(b.total_amount), Number(b.advance_amount)))}*`);
  if (kind === "balance") lines.push("Please arrange payment of the pending balance before delivery / pickup.");
  if (kind === "ready") lines.push("Your Ganpati idol is ready for pickup.");
  if (b.delivery_date) lines.push(`Delivery / Pickup: ${formatDelivery(b.delivery_date, b.delivery_time)}`);
  if (photoUrl) lines.push(`Idol Photo: ${photoUrl}`);
  lines.push("", "Ganpati Bappa Morya! 🌺");
  return lines.join("\n");
}
