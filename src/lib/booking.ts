export const BOOKING_STATUSES = ["Booked", "Advance Paid", "Fully Paid", "Delivered", "Cancelled"] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];
export type PaymentStatus = "Unpaid" | "Partially Paid" | "Paid";

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
