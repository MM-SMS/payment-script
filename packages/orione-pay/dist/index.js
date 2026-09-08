// src/types.ts
var DEFAULT_API_PATHS = {
  checkout: "/api/orione-pay/checkout",
  custom: "/api/orione-pay/custom"
};
var DEFAULT_URLS = {
  success: "/purchase/success",
  cancel: "/purchase/cancel",
  checkout: "/payment"
};
var DEFAULT_THEME = {
  name: "Default",
  primary: "#111111",
  primaryForeground: "#ffffff",
  background: "#f6f4f1",
  surface: "#ffffff",
  text: "#161412",
  mutedText: "#6b6560",
  border: "#e4dfd8",
  danger: "#b42318",
  radius: "12px",
  fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
};

// src/config.ts
function resolvePaymentFlow(raw) {
  const value = (raw ?? process.env.PAYMENT_FLOW ?? process.env.NEXT_PUBLIC_PAYMENT_FLOW ?? "custom").trim().toLowerCase();
  if (value === "stripe") return "stripe";
  if (value === "custom" || value === "backup") return "custom";
  throw new Error(
    `Invalid PAYMENT_FLOW "${raw}". Use "stripe" or "custom" (alias: "backup").`
  );
}
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
function assertBrandIsolation(config, brandId) {
  if (config.brandId !== brandId) {
    throw new Error(
      `Brand isolation error: config belongs to "${config.brandId}", requested "${brandId}".`
    );
  }
}
function createServerPaymentConfig(input) {
  const flow = resolvePaymentFlow(input.flow);
  const stripePublishable = input.stripe?.publishableKey ?? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  const stripeSecret = input.stripe?.secretKey ?? process.env.STRIPE_SECRET_KEY;
  const stripeAccount = input.stripe?.accountId ?? process.env.STRIPE_ACCOUNT_ID;
  return {
    brandId: input.brandId,
    brandName: input.brandName,
    flow,
    products: input.products,
    urls: { ...DEFAULT_URLS, ...input.urls },
    api: { ...DEFAULT_API_PATHS, ...input.api },
    theme: { ...DEFAULT_THEME, name: input.brandName, ...input.theme },
    stripe: stripePublishable || stripeSecret ? {
      publishableKey: stripePublishable ?? "",
      secretKey: stripeSecret ?? "",
      accountId: stripeAccount || void 0
    } : void 0
  };
}
function toPublicPaymentConfig(config) {
  return {
    brandId: config.brandId,
    brandName: config.brandName,
    flow: config.flow,
    products: config.products,
    urls: config.urls,
    api: config.api,
    theme: config.theme,
    stripe: config.stripe ? {
      publishableKey: config.stripe.publishableKey,
      accountId: config.stripe.accountId
    } : void 0
  };
}
function definePaymentConfig(input) {
  return createServerPaymentConfig(input);
}

// src/countries.ts
var COUNTRIES = [
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "IT", name: "Italy" },
  { code: "ES", name: "Spain" },
  { code: "NL", name: "Netherlands" },
  { code: "BE", name: "Belgium" },
  { code: "AT", name: "Austria" },
  { code: "CH", name: "Switzerland" },
  { code: "SE", name: "Sweden" },
  { code: "NO", name: "Norway" },
  { code: "DK", name: "Denmark" },
  { code: "FI", name: "Finland" },
  { code: "IE", name: "Ireland" },
  { code: "PT", name: "Portugal" },
  { code: "PL", name: "Poland" },
  { code: "CZ", name: "Czechia" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "QA", name: "Qatar" },
  { code: "IL", name: "Israel" },
  { code: "TR", name: "Turkey" },
  { code: "CA", name: "Canada" },
  { code: "MX", name: "Mexico" },
  { code: "BR", name: "Brazil" },
  { code: "AU", name: "Australia" },
  { code: "NZ", name: "New Zealand" },
  { code: "JP", name: "Japan" },
  { code: "KR", name: "South Korea" },
  { code: "SG", name: "Singapore" },
  { code: "HK", name: "Hong Kong" },
  { code: "IN", name: "India" }
];

// src/format.ts
function formatMoney(amount, currency, locale = "en-US") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency.toUpperCase()
  }).format(amount / 100);
}
function formatCardNumber(value) {
  const digits = value.replace(/\D/g, "").slice(0, 19);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}
function formatExpiry(value) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}
function onlyDigits(value, maxLength) {
  return value.replace(/\D/g, "").slice(0, maxLength);
}
function createConfirmationId(brandId) {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${brandId.slice(0, 4).toUpperCase()}-${stamp}-${rand}`;
}

// src/validation/card.ts
function luhnCheck(cardNumber) {
  const digits = cardNumber.replace(/\D/g, "");
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let shouldDouble = false;
  for (let index = digits.length - 1; index >= 0; index -= 1) {
    let digit = Number(digits[index]);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}
function detectCardBrand(cardNumber) {
  const digits = cardNumber.replace(/\D/g, "");
  if (/^4/.test(digits)) return "visa";
  if (/^(5[1-5]|2(2[2-9]|[3-6]\d|7[01]|720))/.test(digits)) return "mastercard";
  if (/^3[47]/.test(digits)) return "amex";
  if (/^(6011|65|64[4-9])/.test(digits)) return "discover";
  if (/^3(0[0-5]|[68])/.test(digits)) return "diners";
  if (/^35/.test(digits)) return "jcb";
  if (/^62/.test(digits)) return "unionpay";
  return "unknown";
}
function cardBrandLabel(brand) {
  const labels = {
    visa: "Visa",
    mastercard: "Mastercard",
    amex: "American Express",
    discover: "Discover",
    diners: "Diners Club",
    jcb: "JCB",
    unionpay: "UnionPay",
    unknown: "Card"
  };
  return labels[brand];
}
function validateCardNumber(cardNumber) {
  const digits = cardNumber.replace(/\D/g, "");
  if (!digits) return "Enter a card number";
  if (digits.length < 13) return "Card number is too short";
  if (!luhnCheck(digits)) return "Card number is invalid";
  return void 0;
}
function validateExpiry(expiry, now = /* @__PURE__ */ new Date()) {
  const match = expiry.replace(/\s/g, "").match(/^(\d{2})\/(\d{2})$/);
  if (!match) return "Use MM/YY format";
  const month = Number(match[1]);
  const year = 2e3 + Number(match[2]);
  if (month < 1 || month > 12) return "Expiration month is invalid";
  const expiryDate = new Date(year, month, 0, 23, 59, 59);
  if (expiryDate < now) return "Card has expired";
  return void 0;
}
function validateCvv(cvv) {
  if (!/^\d{3}$/.test(cvv)) return "CVV must be 3 digits";
  return void 0;
}
function validateCardholderName(name) {
  const trimmed = name.trim();
  if (trimmed.length < 2) return "Enter the cardholder name";
  if (!/^[\p{L} .'-]{2,80}$/u.test(trimmed)) return "Cardholder name contains invalid characters";
  return void 0;
}
function parseExpiry(expiry) {
  const [month = "", year = ""] = expiry.split("/");
  return { month, year };
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
function validateCheckoutForm(values) {
  return {
    email: validateEmail(values.email),
    cardNumber: validateCardNumber(values.cardNumber),
    expiry: validateExpiry(values.expiry),
    cvv: validateCvv(values.cvv),
    cardholderName: validateCardholderName(values.cardholderName),
    country: validateCountry(values.country),
    address: validateAddress(values.address),
    postalCode: validatePostalCode(values.postalCode)
  };
}
function hasFieldErrors(errors) {
  return Object.values(errors).some(Boolean);
}
function toCardSummary(values) {
  const expiry = parseExpiry(values.expiry);
  const digits = values.cardNumber.replace(/\D/g, "");
  return {
    brand: detectCardBrand(digits),
    last4: digits.slice(-4),
    expiryMonth: expiry.month,
    expiryYear: expiry.year
  };
}

export { COUNTRIES, DEFAULT_API_PATHS, DEFAULT_THEME, DEFAULT_URLS, assertBrandIsolation, cardBrandLabel, createConfirmationId, createServerPaymentConfig, definePaymentConfig, detectCardBrand, formatCardNumber, formatExpiry, formatMoney, getProduct, hasFieldErrors, luhnCheck, onlyDigits, parseExpiry, requireProduct, resolvePaymentFlow, toCardSummary, toPublicPaymentConfig, validateAddress, validateCardNumber, validateCardholderName, validateCheckoutForm, validateCountry, validateCvv, validateEmail, validateExpiry, validatePostalCode };
