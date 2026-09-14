import { requireProduct } from "../config";
import type {
  CheckoutRequest,
  CheckoutResponse,
  PaymentErrorBody,
  ServerPaymentConfig,
} from "../types";

type ConfigFactory = () => ServerPaymentConfig;

function json(body: CheckoutResponse | PaymentErrorBody, status = 200) {
  return Response.json(body, { status });
}

function resolveAbsoluteUrl(baseUrl: string, path: string, extra: Record<string, string>) {
  const url = path.startsWith("http") ? new URL(path) : new URL(path, baseUrl);
  for (const [key, value] of Object.entries(extra)) {
    url.searchParams.set(key, value);
  }
  return url.toString();
}

export function createCheckoutRouteHandlers(getConfig: ConfigFactory) {
  return {
    async POST(request: Request) {
      try {
        const config = getConfig();
        const body = (await request.json()) as CheckoutRequest;
        if (!body?.productId) {
          return json({ error: "productId is required" }, 400);
        }

        const product = requireProduct(config.products, body.productId);
        const origin = new URL(request.url).origin;
        const returnUrl = body.returnUrl || `${origin}/`;

        if (config.flow === "stripe") {
          if (!config.stripe?.secretKey) {
            return json(
              {
                error: `Stripe is enabled for ${config.brandName}, but STRIPE_SECRET_KEY is not set.`,
                code: "missing_stripe_secret",
              },
              400,
            );
          }
          if (!config.stripe.publishableKey) {
            return json(
              {
                error: `Stripe is enabled for ${config.brandName}, but NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set.`,
                code: "missing_stripe_publishable",
              },
              400,
            );
          }
        }

        const url = resolveAbsoluteUrl(origin, config.urls.checkout, {
          product: product.id,
          returnUrl,
          brand: config.brandId,
        });
        return json({ url, flow: config.flow });
      } catch (caught) {
        return json(
          {
            error: caught instanceof Error ? caught.message : "Unable to start checkout",
          },
          400,
        );
      }
    },
  };
}
