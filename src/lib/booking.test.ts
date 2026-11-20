import { describe, expect, it } from "vitest";
import { calcBalance, paymentStatus, normalizePhone, formatINR } from "./booking";

describe("booking rules", () => {
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
});
