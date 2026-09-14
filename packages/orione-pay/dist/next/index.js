import Stripe from 'stripe';

// src/bin.ts
var LOCAL_BINS = {
  "400000": { scheme: "visa", bank: "Stripe Test", country: "United States" },
  "400005": { scheme: "visa", type: "debit", bank: "Stripe Test", country: "United States" },
  "424242": { scheme: "visa", bank: "Stripe Test", country: "United States" },
  "555555": { scheme: "mastercard", bank: "Stripe Test", country: "United States" },
  "520082": { scheme: "mastercard", bank: "Stripe Test", country: "United States" },
  "378282": { scheme: "amex", bank: "Stripe Test", country: "United States" },
  "371449": { scheme: "amex", bank: "Stripe Test", country: "United States" },
  "601111": { scheme: "discover", bank: "Stripe Test", country: "United States" }
};
function normalizeBin(value) {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 6) return void 0;
  return digits.slice(0, 8);
}
function lookupLocalBin(bin) {
  const eight = bin.slice(0, 8);
  const six = bin.slice(0, 6);
  const match = LOCAL_BINS[eight] ?? LOCAL_BINS[six];
  if (!match) return void 0;
  return { bin: six, source: "local", ...match };
}

// src/bin-lookup.ts
var cache = /* @__PURE__ */ new Map();
async function fetchJson(url, init) {
  const response = await fetch(url, {
    ...init,
    signal: AbortSignal.timeout(2500)
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`BIN lookup failed (${response.status})`);
  return response.json();
}
async function lookupBinlist(bin) {
  const payload = await fetchJson(`https://lookup.binlist.net/${bin}`, {
    headers: { "Accept-Version": "3" }
  });
  if (!payload) return void 0;
  return {
    bin: bin.slice(0, 6),
    scheme: payload.scheme,
    brand: payload.brand,
    type: payload.type,
    bank: payload.bank?.name || void 0,
    country: payload.country?.name || void 0,
    prepaid: payload.prepaid,
    source: "binlist"
  };
}
async function lookupBincodes(bin, apiKey) {
  const payload = await fetchJson(
    `https://api.bincodes.com/bin/?format=json&api_key=${encodeURIComponent(apiKey)}&bin=${bin.slice(0, 6)}`
  );
  if (!payload || payload.valid === "false") return void 0;
  return {
    bin: bin.slice(0, 6),
    scheme: payload.card?.toLowerCase(),
    type: payload.type?.toLowerCase(),
    bank: payload.bank || void 0,
    country: payload.country || void 0,
    source: "bincodes"
  };
}
async function lookupBin(cardOrBin) {
  const bin = normalizeBin(cardOrBin);
  if (!bin) return void 0;
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

// src/next/create-bin-handlers.ts
function json(body, status = 200) {
  return Response.json(body, { status });
}
function createBinLookupRouteHandlers() {
  return {
    async GET(request) {
      const raw = new URL(request.url).searchParams.get("bin") ?? "";
      const bin = normalizeBin(raw);
      if (!bin) {
        return json({ error: "Provide 6\u20138 card digits (BIN only)." }, 400);
      }
      if (!/^\d{6,8}$/.test(raw.replace(/\D/g, "").slice(0, 8))) {
        return json({ error: "BIN must be numeric." }, 400);
      }
      const info = await lookupBin(bin);
      if (!info) {
        return json({ bin: bin.slice(0, 6) });
      }
      return json(info);
    }
  };
}

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
function json2(body, status = 200) {
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
          return json2({ error: "productId is required" }, 400);
        }
        const product = requireProduct(config.products, body.productId);
        const origin = new URL(request.url).origin;
        const returnUrl = body.returnUrl || `${origin}/`;
        if (config.flow === "stripe") {
          if (!config.stripe?.secretKey) {
            return json2(
              {
                error: `Stripe is enabled for ${config.brandName}, but STRIPE_SECRET_KEY is not set.`,
                code: "missing_stripe_secret"
              },
              400
            );
          }
          if (!config.stripe.publishableKey) {
            return json2(
              {
                error: `Stripe is enabled for ${config.brandName}, but NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set.`,
                code: "missing_stripe_publishable"
              },
              400
            );
          }
        }
        const url = resolveAbsoluteUrl(origin, config.urls.checkout, {
          product: product.id,
          returnUrl,
          brand: config.brandId
        });
        return json2({ url, flow: config.flow });
      } catch (caught) {
        return json2(
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
function json3(body, status = 200) {
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
          return json3(
            {
              error: emailError ?? countryError ?? addressError ?? postalError ?? "Invalid checkout data"
            },
            400
          );
        }
        if (!body.card?.last4 || body.card.last4.length !== 4) {
          return json3({ error: "Card summary is incomplete" }, 400);
        }
        await new Promise((resolve) => setTimeout(resolve, 700));
        return json3({
          ok: true,
          confirmationId: createConfirmationId(config.brandId),
          message: "Thank you. We\u2019ve received your order request. Our support team will review the details and contact you at the email provided regarding the next steps."
        });
      } catch (caught) {
        return json3(
          {
            error: caught instanceof Error ? caught.message : "Unable to process custom payment"
          },
          400
        );
      }
    }
  };
}
function json4(body, status = 200) {
  return Response.json(body, { status });
}
function createStripeIntentRouteHandlers(getConfig) {
  return {
    async POST(request) {
      try {
        const config = getConfig();
        const body = await request.json();
        if (!body?.productId) {
          return json4({ error: "productId is required" }, 400);
        }
        const product = requireProduct(config.products, body.productId);
        if (!config.stripe?.secretKey) {
          return json4(
            {
              error: `Stripe is enabled for ${config.brandName}, but STRIPE_SECRET_KEY is not set.`,
              code: "missing_stripe_secret"
            },
            400
          );
        }
        const stripe = new Stripe(config.stripe.secretKey);
        const requestOptions = config.stripe.accountId ? { stripeAccount: config.stripe.accountId } : void 0;
        const paymentIntent = await stripe.paymentIntents.create(
          {
            amount: product.amount,
            currency: product.currency,
            automatic_payment_methods: { enabled: true },
            metadata: {
              brandId: config.brandId,
              productId: product.id
            },
            description: `${product.name} \xB7 ${config.brandName}`
          },
          requestOptions
        );
        if (!paymentIntent.client_secret) {
          return json4({ error: "Stripe did not return a client secret" }, 502);
        }
        return json4({
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
          amount: product.amount,
          currency: product.currency
        });
      } catch (caught) {
        if (caught instanceof Stripe.errors.StripeError) {
          return json4(
            {
              error: caught.message,
              code: caught.code,
              type: caught.type
            },
            400
          );
        }
        return json4(
          {
            error: caught instanceof Error ? caught.message : "Unable to start Stripe payment"
          },
          400
        );
      }
    }
  };
}

export { createBinLookupRouteHandlers, createCheckoutRouteHandlers, createCustomPaymentRouteHandlers, createStripeIntentRouteHandlers };
