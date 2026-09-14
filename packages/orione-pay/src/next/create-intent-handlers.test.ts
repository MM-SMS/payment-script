import { describe, expect, it } from "vitest";
import { definePaymentConfig } from "../config";
import { createStripeIntentRouteHandlers } from "./create-intent-handlers";

describe("Stripe intent", () => {
  it("does not create a PaymentIntent without this brand's secret key", async () => {
    const config = definePaymentConfig({
      brandId: "vela",
      brandName: "VELA",
      flow: "stripe",
      products: [
        {
          id: "no-01",
          name: "VELA No. 01",
          description: "Test product",
          amount: 14800,
          currency: "usd",
        },
      ],
    });
    const { POST } = createStripeIntentRouteHandlers(() => config);
    const response = await POST(
      new Request("http://brand.test/api/orione-pay/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: "no-01" }),
      }),
    );
    const data = (await response.json()) as { error: string; code?: string };
    expect(response.status).toBe(400);
    expect(data.code).toBe("missing_stripe_secret");
  });
});
