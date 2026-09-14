interface BinInfo {
    bin: string;
    scheme?: string;
    brand?: string;
    type?: string;
    bank?: string;
    country?: string;
    prepaid?: boolean;
    source: "local" | "binlist" | "bincodes";
}
declare function normalizeBin(value: string): string | undefined;
declare function lookupLocalBin(bin: string): BinInfo | undefined;
declare function formatBinIssuer(info: BinInfo | null, fallbackBrand: string): string;

export { type BinInfo as B, formatBinIssuer as f, lookupLocalBin as l, normalizeBin as n };
