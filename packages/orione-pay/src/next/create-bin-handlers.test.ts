import { describe, expect, it } from "vitest";
import { createBinLookupRouteHandlers } from "./create-bin-handlers";

describe("BIN route", () => {
  it("rejects a short value", async () => {
    const { GET } = createBinLookupRouteHandlers();
    const response = await GET(new Request("http://brand.test/api/orione-pay/bin?bin=4242"));
    expect(response.status).toBe(400);
  });

  it("returns the local Stripe test issuer without a remote call", async () => {
    const { GET } = createBinLookupRouteHandlers();
    const response = await GET(
      new Request("http://brand.test/api/orione-pay/bin?bin=4242424242424242"),
    );
    const data = (await response.json()) as { bank?: string; source?: string };
    expect(response.status).toBe(200);
    expect(data.bank).toBe("Stripe Test");
    expect(data.source).toBe("local");
  });
});
