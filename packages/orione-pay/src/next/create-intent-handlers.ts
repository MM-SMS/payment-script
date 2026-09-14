import Stripe from "stripe";
import { requireProduct } from "../config";
import type {
  CheckoutRequest,
  PaymentErrorBody,
  ServerPaymentConfig,
  StripeIntentResponse,
} from "../types";

type ConfigFactory = () => ServerPaymentConfig;

function json(body: StripeIntentResponse | PaymentErrorBody, status = 200) {
  return Response.json(body, { status });
}

export function createStripeIntentRouteHandlers(getConfig: ConfigFactory) {
  return {
    async POST(request: Request) {
      try {
        const config = getConfig();
        const body = (await request.json()) as CheckoutRequest;
        if (!body?.productId) {
          return json({ error: "productId is required" }, 400);
        }

        const product = requireProduct(config.products, body.productId);

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

        const paymentIntent = await stripe.paymentIntents.create(
          {
            amount: product.amount,
            currency: product.currency,
            automatic_payment_methods: { enabled: true },
            metadata: {
              brandId: config.brandId,
              productId: product.id,
            },
            description: `${product.name} · ${config.brandName}`,
          },
          requestOptions,
        );

        if (!paymentIntent.client_secret) {
          return json({ error: "Stripe did not return a client secret" }, 502);
        }

        return json({
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
          amount: product.amount,
          currency: product.currency,
        });
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
            error: caught instanceof Error ? caught.message : "Unable to start Stripe payment",
          },
          400,
        );
      }
    },
  };
}
