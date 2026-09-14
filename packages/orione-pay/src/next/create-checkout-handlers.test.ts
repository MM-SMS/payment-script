import { describe, expect, it } from "vitest";
import { definePaymentConfig } from "../config";
import { createCheckoutRouteHandlers } from "./create-checkout-handlers";
import { createCustomPaymentRouteHandlers } from "./create-custom-handlers";

function makeConfig(flow: "stripe" | "custom") {
  return definePaymentConfig({
    brandId: "vela",
    brandName: "VELA",
    flow,
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
}

function post(url: string, body: unknown) {
  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("checkout router", () => {
  it("routes custom flow to the brand checkout page", async () => {
    const { POST } = createCheckoutRouteHandlers(() => makeConfig("custom"));
    const response = await POST(
      post("http://brand.test/api/orione-pay/checkout", {
        productId: "no-01",
        returnUrl: "http://brand.test/products/no-01",
      }),
    );
    const data = (await response.json()) as { url: string; flow: string };
    expect(response.status).toBe(200);
    expect(data.flow).toBe("custom");
    expect(data.url).toContain("/payment?product=no-01");
    expect(data.url).toContain("brand=vela");
  });

  it("rejects products that do not belong to the brand config", async () => {
    const { POST } = createCheckoutRouteHandlers(() => makeConfig("custom"));
    const response = await POST(
      post("http://brand.test/api/orione-pay/checkout", { productId: "other-brand" }),
    );
    const data = (await response.json()) as { error: string };
    expect(response.status).toBe(400);
    expect(data.error).toContain("Unknown product");
  });

  it("routes stripe flow to the on-domain checkout page", async () => {
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
      stripe: {
        secretKey: "sk_test_placeholder",
        publishableKey: "pk_test_placeholder",
      },
    });
    const { POST } = createCheckoutRouteHandlers(() => config);
    const response = await POST(
      post("http://brand.test/api/orione-pay/checkout", {
        productId: "no-01",
        returnUrl: "http://brand.test/products/no-01",
      }),
    );
    const data = (await response.json()) as { url: string; flow: string };
    expect(response.status).toBe(200);
    expect(data.flow).toBe("stripe");
    expect(data.url).toContain("/payment?product=no-01");
    expect(data.url).not.toContain("checkout.stripe.com");
  });

  it("does not start Stripe without this brand's secret key", async () => {
    const { POST } = createCheckoutRouteHandlers(() => makeConfig("stripe"));
    const response = await POST(
      post("http://brand.test/api/orione-pay/checkout", { productId: "no-01" }),
    );
    const data = (await response.json()) as { error: string; code?: string };
    expect(response.status).toBe(400);
    expect(data.code).toBe("missing_stripe_secret");
    expect(data.error).toContain("VELA");
  });
});

describe("custom payment emulate", () => {
  it("accepts a sanitized card summary and returns a confirmation", async () => {
    const { POST } = createCustomPaymentRouteHandlers(() => makeConfig("custom"));
    const response = await POST(
      post("http://brand.test/api/orione-pay/custom", {
        productId: "no-01",
        email: "guest@example.com",
        cardholderName: "Ada Lovelace",
        billing: { country: "US", address: "12 Market Street", postalCode: "94103" },
        card: { brand: "visa", last4: "4242", expiryMonth: "12", expiryYear: "29" },
      }),
    );
    const data = (await response.json()) as { ok: boolean; confirmationId: string };
    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.confirmationId.startsWith("VELA-")).toBe(true);
  });
});
