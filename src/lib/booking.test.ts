import { describe, expect, it } from "vitest";
import { calcBalance, paymentStatus, normalizePhone, formatINR, whatsappMessage, notificationMessage, matchesBooking, validPayment, PRODUCTION_STATUSES, PAYMENT_MODES, IDOL_HEIGHTS, localDate, extraWorkDetails } from "./booking";

describe("booking rules", () => {
  it("keeps the customer's extra-work details when Yes is selected", () => {
    expect(extraWorkDetails(true, "  Add a golden crown  ")).toBe("Add a golden crown");
  });
  it("saves no extra-work details when No is selected", () => {
    expect(extraWorkDetails(false, "Add a golden crown")).toBe("");
  });
  it("offers exactly the eight requested idol heights", () => {
    expect(IDOL_HEIGHTS).toEqual(["1 Foot", "1.5 Foot", "2 Foot", "2.5 Foot", "3 Foot", "3.5 Foot", "4 Foot", "4.5 Foot"]);
  });
  it("balance = total - advance", () => {
    expect(calcBalance(15000, 5000)).toBe(10000);
  });
  it("payment status follows amounts", () => {
    expect(paymentStatus(1000, 0)).toBe("Unpaid");
    expect(paymentStatus(1000, 400)).toBe("Partially Paid");
    expect(paymentStatus(1000, 1000)).toBe("Paid");
  });
  it("10-digit Indian mobile gets 91 prefix for WhatsApp", () => {
    expect(normalizePhone("98765 43210")).toBe("919876543210");
  });
  it("formats rupees in Indian grouping", () => {
    expect(formatINR(125000)).toBe("₹1,25,000");
  });
  it("WhatsApp message includes the idol photo link when given", () => {
    const b = { booking_no: "BK-2026-0001", customer_name: "Suhas", booking_date: "2026-08-20", idol_name: "Raja 3ft", requirements: "", total_amount: 15000, advance_amount: 5000 };
    const withPhoto = whatsappMessage(b, "Shop", [], "https://example.com/photo.jpg");
    expect(withPhoto).toContain("Idol Photo: https://example.com/photo.jpg");
    expect(whatsappMessage(b, "Shop", [])).not.toContain("Idol Photo:");
  });
});

describe("booking enhancements", () => {
  const booking = { booking_no: "BK-2026-0001", customer_name: "Suhas", customer_phone: "9876543210", booking_date: "2026-08-20", idol_name: "Raja 3ft", requirements: "", total_amount: 15000, advance_amount: 5000, delivery_date: "2026-08-25", delivery_time: "16:30:00", production_status: "In Production", status: "Advance Paid" };
  const filters = { query: "", date: "", delivery: "", year: "all", payment: "all", production: "all", status: "all" };
  it("permits multiple payments up to the remaining balance", () => {
    expect(validPayment(3000, calcBalance(15000, 5000))).toBe(true);
    expect(calcBalance(15000, 5000 + 3000 + 2000)).toBe(5000);
    expect(validPayment(10001, 10000)).toBe(false);
    expect(validPayment(0, 10000)).toBe(false);
    expect(validPayment(-1, 10000)).toBe(false);
    expect(validPayment(1.001, 10000)).toBe(false);
  });
  it("supports Cash, UPI and Bank", () => { expect(PAYMENT_MODES).toEqual(["Cash", "UPI", "Bank"]); });
  it("uses the separate five-stage production workflow", () => { expect(PRODUCTION_STATUSES).toEqual(["Booked", "In Production", "Ready for Pickup", "Delivered", "Cancelled"]); });
  it("filters delivery independently of booking date", () => {
    expect(matchesBooking(booking, { ...filters, delivery: "2026-08-25" })).toBe(true);
    expect(matchesBooking(booking, { ...filters, delivery: "2026-08-20" })).toBe(false);
  });
  it("filters booking year", () => {
    expect(matchesBooking(booking, { ...filters, year: "2026" })).toBe(true);
    expect(matchesBooking(booking, { ...filters, year: "2025" })).toBe(false);
  });
  it("filters production independently of payment status", () => {
    expect(matchesBooking(booking, { ...filters, production: "In Production", payment: "Partially Paid" })).toBe(true);
    expect(matchesBooking(booking, { ...filters, production: "Ready for Pickup" })).toBe(false);
    expect(matchesBooking(booking, { ...filters, payment: "Paid" })).toBe(false);
  });
  it("includes the specific received payment and current balance", () => {
    const message = notificationMessage("payment", { ...booking, advance_amount: 8000 }, "Shop", [], null, { amount: 3000, payment_date: "2026-08-21", payment_mode: "UPI" });
    expect(message).toContain("₹3,000"); expect(message).toContain("₹7,000"); expect(message).toContain("UPI"); expect(message).toContain("2026-08-21");
  });
  it("reminder uses current pending balance", () => { expect(notificationMessage("balance", booking, "Shop", [])).toContain("₹10,000"); });
  it("ready notification includes pickup schedule and photo", () => {
    const message = notificationMessage("ready", booking, "Shop", [], "https://example.com/idol.jpg");
    expect(message).toContain("16:30"); expect(message).toContain("https://example.com/idol.jpg"); expect(message).toContain("BK-2026-0001");
  });
  it("preserves booking confirmation with pickup schedule", () => { expect(notificationMessage("booking", booking, "Shop", [])).toBe(whatsappMessage(booking, "Shop", [])); });
  it("stores calendar dates without UTC conversion", () => { expect(localDate(new Date(2026, 7, 25, 23, 30))).toBe("2026-08-25"); });
});
