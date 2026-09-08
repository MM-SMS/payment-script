import { describe, expect, it } from "vitest";
import { detectCardBrand, luhnCheck, validateCvv, validateExpiry } from "./card";
import { hasFieldErrors, validateCheckoutForm } from "./checkout";

describe("card validation", () => {
  it("accepts a valid Visa number", () => {
    expect(luhnCheck("4242424242424242")).toBe(true);
    expect(detectCardBrand("4242424242424242")).toBe("visa");
  });

  it("rejects a number that fails Luhn", () => {
    expect(luhnCheck("4242424242424241")).toBe(false);
  });

  it("detects Mastercard and Amex prefixes", () => {
    expect(detectCardBrand("5555555555554444")).toBe("mastercard");
    expect(detectCardBrand("378282246310005")).toBe("amex");
  });

  it("requires a 3-digit CVV", () => {
    expect(validateCvv("12")).toBeTruthy();
    expect(validateCvv("1234")).toBeTruthy();
    expect(validateCvv("123")).toBeUndefined();
  });

  it("rejects expired cards", () => {
    expect(validateExpiry("01/20", new Date("2026-09-08"))).toBe("Card has expired");
    expect(validateExpiry("12/29", new Date("2026-09-08"))).toBeUndefined();
  });

  it("validates a complete checkout form", () => {
    const errors = validateCheckoutForm({
      email: "guest@example.com",
      cardNumber: "4242424242424242",
      expiry: "12/29",
      cvv: "123",
      cardholderName: "Ada Lovelace",
      country: "US",
      address: "12 Market Street",
      postalCode: "94103",
    });
    expect(hasFieldErrors(errors)).toBe(false);
  });
});
