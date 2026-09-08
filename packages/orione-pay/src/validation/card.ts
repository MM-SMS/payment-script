import type { CardBrand } from "../types";

export function luhnCheck(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\D/g, "");
  if (digits.length < 13 || digits.length > 19) return false;

  let sum = 0;
  let shouldDouble = false;

  for (let index = digits.length - 1; index >= 0; index -= 1) {
    let digit = Number(digits[index]);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

export function detectCardBrand(cardNumber: string): CardBrand {
  const digits = cardNumber.replace(/\D/g, "");

  if (/^4/.test(digits)) return "visa";
  if (/^(5[1-5]|2(2[2-9]|[3-6]\d|7[01]|720))/.test(digits)) return "mastercard";
  if (/^3[47]/.test(digits)) return "amex";
  if (/^(6011|65|64[4-9])/.test(digits)) return "discover";
  if (/^3(0[0-5]|[68])/.test(digits)) return "diners";
  if (/^35/.test(digits)) return "jcb";
  if (/^62/.test(digits)) return "unionpay";
  return "unknown";
}

export function cardBrandLabel(brand: CardBrand): string {
  const labels: Record<CardBrand, string> = {
    visa: "Visa",
    mastercard: "Mastercard",
    amex: "American Express",
    discover: "Discover",
    diners: "Diners Club",
    jcb: "JCB",
    unionpay: "UnionPay",
    unknown: "Card",
  };
  return labels[brand];
}

export function validateCardNumber(cardNumber: string): string | undefined {
  const digits = cardNumber.replace(/\D/g, "");
  if (!digits) return "Enter a card number";
  if (digits.length < 13) return "Card number is too short";
  if (!luhnCheck(digits)) return "Card number is invalid";
  return undefined;
}

export function validateExpiry(expiry: string, now = new Date()): string | undefined {
  const match = expiry.replace(/\s/g, "").match(/^(\d{2})\/(\d{2})$/);
  if (!match) return "Use MM/YY format";

  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  if (month < 1 || month > 12) return "Expiration month is invalid";

  const expiryDate = new Date(year, month, 0, 23, 59, 59);
  if (expiryDate < now) return "Card has expired";
  return undefined;
}

export function validateCvv(cvv: string): string | undefined {
  if (!/^\d{3}$/.test(cvv)) return "CVV must be 3 digits";
  return undefined;
}

export function validateCardholderName(name: string): string | undefined {
  const trimmed = name.trim();
  if (trimmed.length < 2) return "Enter the cardholder name";
  if (!/^[\p{L} .'-]{2,80}$/u.test(trimmed)) return "Cardholder name contains invalid characters";
  return undefined;
}

export function parseExpiry(expiry: string): { month: string; year: string } {
  const [month = "", year = ""] = expiry.split("/");
  return { month, year };
}
