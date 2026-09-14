import { lookupLocalBin, normalizeBin, type BinInfo } from "./bin";

const cache = new Map<string, BinInfo>();

interface BinListPayload {
  scheme?: string;
  brand?: string;
  type?: string;
  prepaid?: boolean;
  bank?: { name?: string };
  country?: { name?: string };
}

interface BinCodesPayload {
  bank?: string;
  card?: string;
  type?: string;
  country?: string;
  valid?: string;
}

async function fetchJson(url: string, init?: RequestInit): Promise<unknown> {
  const response = await fetch(url, {
    ...init,
    signal: AbortSignal.timeout(2500),
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`BIN lookup failed (${response.status})`);
  return response.json();
}

async function lookupBinlist(bin: string): Promise<BinInfo | undefined> {
  const payload = (await fetchJson(`https://lookup.binlist.net/${bin}`, {
    headers: { "Accept-Version": "3" },
  })) as BinListPayload | null;
  if (!payload) return undefined;
  return {
    bin: bin.slice(0, 6),
    scheme: payload.scheme,
    brand: payload.brand,
    type: payload.type,
    bank: payload.bank?.name || undefined,
    country: payload.country?.name || undefined,
    prepaid: payload.prepaid,
    source: "binlist",
  };
}

async function lookupBincodes(bin: string, apiKey: string): Promise<BinInfo | undefined> {
  const payload = (await fetchJson(
    `https://api.bincodes.com/bin/?format=json&api_key=${encodeURIComponent(apiKey)}&bin=${bin.slice(0, 6)}`,
  )) as BinCodesPayload | null;
  if (!payload || payload.valid === "false") return undefined;
  return {
    bin: bin.slice(0, 6),
    scheme: payload.card?.toLowerCase(),
    type: payload.type?.toLowerCase(),
    bank: payload.bank || undefined,
    country: payload.country || undefined,
    source: "bincodes",
  };
}

export async function lookupBin(cardOrBin: string): Promise<BinInfo | undefined> {
  const bin = normalizeBin(cardOrBin);
  if (!bin) return undefined;

  const cached = cache.get(bin) ?? cache.get(bin.slice(0, 6));
  if (cached) return cached;

  const local = lookupLocalBin(bin);
  if (local?.bank) {
    cache.set(bin, local);
    return local;
  }

  const apiKey = process.env.BINCODES_API_KEY;
  try {
    const remote = apiKey ? await lookupBincodes(bin, apiKey) : await lookupBinlist(bin);
    const resolved = remote ?? local;
    if (resolved) cache.set(bin, resolved);
    return resolved;
  } catch {
    if (local) cache.set(bin, local);
    return local;
  }
}

export function resetBinCache(): void {
  cache.clear();
}
