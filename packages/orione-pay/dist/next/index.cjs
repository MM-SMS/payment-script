'use strict';

var Stripe = require('stripe');

function _interopDefault (e) { return e && e.__esModule ? e : { default: e }; }

var Stripe__default = /*#__PURE__*/_interopDefault(Stripe);

// src/next/create-checkout-handlers.ts

// src/config.ts
function getProduct(products, productId) {
  return products.find((product) => product.id === productId);
}
function requireProduct(products, productId) {
  const product = getProduct(products, productId);
  if (!product) {
    throw new Error(`Unknown product "${productId}" for the configured brand.`);
  }
  return product;
}

// src/next/create-checkout-handlers.ts
function json(body, status = 200) {
  return Response.json(body, { status });
}
function resolveAbsoluteUrl(baseUrl, path, extra) {
  const url = path.startsWith("http") ? new URL(path) : new URL(path, baseUrl);
  for (const [key, value] of Object.entries(extra)) {
    url.searchParams.set(key, value);
  }
  return url.toString();
}
function createCheckoutRouteHandlers(getConfig) {
  return {
    async POST(request) {
      try {
        const config = getConfig();
        const body = await request.json();
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
            brand: config.brandId
          });
          return json({ url, flow: "custom" });
        }
        if (!config.stripe?.secretKey) {
          return json(
            {
              error: `Stripe is enabled for ${config.brandName}, but STRIPE_SECRET_KEY is not set.`,
              code: "missing_stripe_secret"
            },
            400
          );
        }
        const stripe = new Stripe__default.default(config.stripe.secretKey);
        const requestOptions = config.stripe.accountId ? { stripeAccount: config.stripe.accountId } : void 0;
        const successUrl = resolveAbsoluteUrl(origin, config.urls.success, {
          session_id: "{CHECKOUT_SESSION_ID}",
          product: product.id,
          brand: config.brandId
        }).replace("%7BCHECKOUT_SESSION_ID%7D", "{CHECKOUT_SESSION_ID}");
        const cancelUrl = resolveAbsoluteUrl(origin, config.urls.cancel, {
          product: product.id,
          brand: config.brandId,
          returnUrl
        });
        const lineItems = product.stripePriceId ? [{ price: product.stripePriceId, quantity: 1 }] : [
          {
            quantity: 1,
            price_data: {
              currency: product.currency,
              unit_amount: product.amount,
              product_data: {
                name: product.name,
                description: product.description,
                images: product.imageUrl ? [product.imageUrl] : void 0
              }
            }
          }
        ];
        const session = await stripe.checkout.sessions.create(
          {
            mode: "payment",
            line_items: lineItems,
            success_url: successUrl,
            cancel_url: cancelUrl,
            metadata: {
              brandId: config.brandId,
              productId: product.id
            },
            payment_intent_data: {
              metadata: {
                brandId: config.brandId,
                productId: product.id
              }
            }
          },
          requestOptions
        );
        if (!session.url) {
          return json({ error: "Stripe did not return a checkout URL" }, 502);
        }
        return json({ url: session.url, flow: "stripe" });
      } catch (caught) {
        if (caught instanceof Stripe__default.default.errors.StripeError) {
          return json(
            {
              error: caught.message,
              code: caught.code,
              type: caught.type
            },
            400
          );
        }
        return json(
          {
            error: caught instanceof Error ? caught.message : "Unable to start checkout"
          },
          400
        );
      }
    }
  };
}

// src/format.ts
function createConfirmationId(brandId) {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${brandId.slice(0, 4).toUpperCase()}-${stamp}-${rand}`;
}

// src/validation/checkout.ts
var EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function validateEmail(email) {
  if (!email.trim()) return "Enter an email address";
  if (!EMAIL_PATTERN.test(email.trim())) return "Email address is invalid";
  return void 0;
}
function validateCountry(country) {
  if (!country) return "Select a country";
  return void 0;
}
function validateAddress(address) {
  if (address.trim().length < 5) return "Enter a billing address";
  return void 0;
}
function validatePostalCode(postalCode) {
  if (!/^[A-Za-z0-9][A-Za-z0-9 \-]{2,11}$/.test(postalCode.trim())) {
    return "Enter a valid postal / ZIP code";
  }
  return void 0;
}

// src/next/create-custom-handlers.ts
function json2(body, status = 200) {
  return Response.json(body, { status });
}
function createCustomPaymentRouteHandlers(getConfig) {
  return {
    async POST(request) {
      try {
        const config = getConfig();
        const body = await request.json();
        requireProduct(config.products, body.productId);
        const emailError = validateEmail(body.email);
        const countryError = validateCountry(body.billing?.country);
        const addressError = validateAddress(body.billing?.address ?? "");
        const postalError = validatePostalCode(body.billing?.postalCode ?? "");
        if (emailError || countryError || addressError || postalError) {
          return json2(
            {
              error: emailError ?? countryError ?? addressError ?? postalError ?? "Invalid checkout data"
            },
            400
          );
        }
        if (!body.card?.last4 || body.card.last4.length !== 4) {
          return json2({ error: "Card summary is incomplete" }, 400);
        }
        await new Promise((resolve) => setTimeout(resolve, 700));
        return json2({
          ok: true,
          confirmationId: createConfirmationId(config.brandId),
          message: "Thank you. We\u2019ve received your order request. Our support team will review the details and contact you at the email provided regarding the next steps."
        });
      } catch (caught) {
        return json2(
          {
            error: caught instanceof Error ? caught.message : "Unable to process custom payment"
          },
          400
        );
      }
    }
  };
}

exports.createCheckoutRouteHandlers = createCheckoutRouteHandlers;
exports.createCustomPaymentRouteHandlers = createCustomPaymentRouteHandlers;
