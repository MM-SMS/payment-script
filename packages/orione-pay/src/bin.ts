export interface BinInfo {
  bin: string;
  scheme?: string;
  brand?: string;
  type?: string;
  bank?: string;
  country?: string;
  prepaid?: boolean;
  source: "local" | "binlist" | "bincodes";
}

const LOCAL_BINS: Record<string, Omit<BinInfo, "bin" | "source">> = {
  "400000": { scheme: "visa", bank: "Stripe Test", country: "United States" },
  "400005": { scheme: "visa", type: "debit", bank: "Stripe Test", country: "United States" },
  "424242": { scheme: "visa", bank: "Stripe Test", country: "United States" },
  "555555": { scheme: "mastercard", bank: "Stripe Test", country: "United States" },
  "520082": { scheme: "mastercard", bank: "Stripe Test", country: "United States" },
  "378282": { scheme: "amex", bank: "Stripe Test", country: "United States" },
  "371449": { scheme: "amex", bank: "Stripe Test", country: "United States" },
  "601111": { scheme: "discover", bank: "Stripe Test", country: "United States" },
};

export function normalizeBin(value: string): string | undefined {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 6) return undefined;
  return digits.slice(0, 8);
}

export function lookupLocalBin(bin: string): BinInfo | undefined {
  const eight = bin.slice(0, 8);
  const six = bin.slice(0, 6);
  const match = LOCAL_BINS[eight] ?? LOCAL_BINS[six];
  if (!match) return undefined;
  return { bin: six, source: "local", ...match };
}

export function formatBinIssuer(info: BinInfo | null, fallbackBrand: string): string {
  if (!info?.bank && !info?.country && !info?.type) return fallbackBrand;

  const parts = [fallbackBrand];
  if (info.bank) parts.push(info.bank);
  else if (info.country) parts.push(info.country);
  if (info.type && !info.bank) parts.push(info.type);
  return parts.join(" · ");
}
