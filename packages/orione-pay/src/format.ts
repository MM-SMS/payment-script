export function formatMoney(amount: number, currency: string, locale = "en-US"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

export function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 19);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

export function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export function onlyDigits(value: string, maxLength: number): string {
  return value.replace(/\D/g, "").slice(0, maxLength);
}

export function createConfirmationId(brandId: string): string {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${brandId.slice(0, 4).toUpperCase()}-${stamp}-${rand}`;
}
