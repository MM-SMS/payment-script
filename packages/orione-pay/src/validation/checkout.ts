import type { FieldErrors } from "../types";
import {
  detectCardBrand,
  parseExpiry,
  validateCardNumber,
  validateCardholderName,
  validateCvv,
  validateExpiry,
} from "./card";

export interface CheckoutFormValues {
  email: string;
  cardNumber: string;
  expiry: string;
  cvv: string;
  cardholderName: string;
  country: string;
  address: string;
  postalCode: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): string | undefined {
  if (!email.trim()) return "Enter an email address";
  if (!EMAIL_PATTERN.test(email.trim())) return "Email address is invalid";
  return undefined;
}

export function validateCountry(country: string): string | undefined {
  if (!country) return "Select a country";
  return undefined;
}

export function validateAddress(address: string): string | undefined {
  if (address.trim().length < 5) return "Enter a billing address";
  return undefined;
}

export function validatePostalCode(postalCode: string): string | undefined {
  if (!/^[A-Za-z0-9][A-Za-z0-9 \-]{2,11}$/.test(postalCode.trim())) {
    return "Enter a valid postal / ZIP code";
  }
  return undefined;
}

export function validateCheckoutForm(values: CheckoutFormValues): FieldErrors {
  return {
    email: validateEmail(values.email),
    cardNumber: validateCardNumber(values.cardNumber),
    expiry: validateExpiry(values.expiry),
    cvv: validateCvv(values.cvv),
    cardholderName: validateCardholderName(values.cardholderName),
    country: validateCountry(values.country),
    address: validateAddress(values.address),
    postalCode: validatePostalCode(values.postalCode),
  };
}

export function hasFieldErrors(errors: FieldErrors): boolean {
  return Object.values(errors).some(Boolean);
}

export function toCardSummary(values: CheckoutFormValues) {
  const expiry = parseExpiry(values.expiry);
  const digits = values.cardNumber.replace(/\D/g, "");
  return {
    brand: detectCardBrand(digits),
    last4: digits.slice(-4),
    expiryMonth: expiry.month,
    expiryYear: expiry.year,
  };
}
