import { describe, expect, it } from "vitest";
import { formatBinIssuer, lookupLocalBin, normalizeBin } from "./bin";

describe("BIN helpers", () => {
  it("takes the first 6–8 digits only", () => {
    expect(normalizeBin("4242")).toBeUndefined();
    expect(normalizeBin("4242 4242 4242 4242")).toBe("42424242");
    expect(normalizeBin("5555555555554444")).toBe("55555555");
  });

  it("knows Stripe test cards locally", () => {
    const info = lookupLocalBin("424242");
    expect(info?.bank).toBe("Stripe Test");
    expect(info?.scheme).toBe("visa");
  });

  it("formats issuer next to the brand", () => {
    expect(
      formatBinIssuer(
        { bin: "424242", bank: "Stripe Test", country: "United States", source: "local" },
        "Visa",
      ),
    ).toBe("Visa · Stripe Test");
    expect(formatBinIssuer(null, "Visa")).toBe("Visa");
  });
});
