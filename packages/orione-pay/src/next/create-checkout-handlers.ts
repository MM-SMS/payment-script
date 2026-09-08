import Stripe from "stripe";
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

        if (config.flow === "custom") {
          const url = resolveAbsoluteUrl(origin, config.urls.checkout, {
            product: product.id,
            returnUrl,
            brand: config.brandId,
          });
          return json({ url, flow: "custom" });
        }

        if (!config.stripe?.secretKey) {
          return json(
            {
              error: `Stripe is enabled for ${config.brandName}, but STRIPE_SECRET_KEY is not set.`,
              code: "missing_stripe_secret",
            },
            400,
          );
        }

        const stripe = new Stripe(config.stripe.secretKey);
        const requestOptions = config.stripe.accountId
          ? { stripeAccount: config.stripe.accountId }
          : undefined;

        const successUrl = resolveAbsoluteUrl(origin, config.urls.success, {
          session_id: "{CHECKOUT_SESSION_ID}",
          product: product.id,
          brand: config.brandId,
        }).replace("%7BCHECKOUT_SESSION_ID%7D", "{CHECKOUT_SESSION_ID}");

        const cancelUrl = resolveAbsoluteUrl(origin, config.urls.cancel, {
          product: product.id,
          brand: config.brandId,
          returnUrl,
        });

        const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = product.stripePriceId
          ? [{ price: product.stripePriceId, quantity: 1 }]
          : [
              {
                quantity: 1,
                price_data: {
                  currency: product.currency,
                  unit_amount: product.amount,
                  product_data: {
                    name: product.name,
                    description: product.description,
                    images: product.imageUrl ? [product.imageUrl] : undefined,
                  },
                },
              },
            ];

        const session = await stripe.checkout.sessions.create(
          {
            mode: "payment",
            line_items: lineItems,
            success_url: successUrl,
            cancel_url: cancelUrl,
            metadata: {
              brandId: config.brandId,
              productId: product.id,
            },
            payment_intent_data: {
              metadata: {
                brandId: config.brandId,
                productId: product.id,
              },
            },
          },
          requestOptions,
        );

        if (!session.url) {
          return json({ error: "Stripe did not return a checkout URL" }, 502);
        }

        return json({ url: session.url, flow: "stripe" });
      } catch (caught) {
        if (caught instanceof Stripe.errors.StripeError) {
          return json(
            {
              error: caught.message,
              code: caught.code,
              type: caught.type,
            },
            400,
          );
        }

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
