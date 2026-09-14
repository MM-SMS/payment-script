"use client";
import { createContext, useState, useCallback, useMemo, useContext, useEffect, Suspense } from 'react';
import { jsx, jsxs } from 'react/jsx-runtime';
import { useSearchParams } from 'next/navigation';
import { Elements, useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

// src/config.ts
function getProduct(products, productId) {
  return products.find((product) => product.id === productId);
}
var PaymentContext = createContext(null);
function PaymentProvider({ config, children }) {
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState(null);
  const startCheckout = useCallback(
    async (productId, returnUrl) => {
      setIsStarting(true);
      setError(null);
      try {
        const payload = {
          productId,
          returnUrl: returnUrl ?? (typeof window !== "undefined" ? window.location.href : void 0)
        };
        const response = await fetch(config.api.checkout, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (!response.ok || !data.url) {
          throw new Error(data.error ?? "Unable to start checkout");
        }
        window.location.assign(data.url);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Unable to start checkout");
        setIsStarting(false);
      }
    },
    [config.api.checkout]
  );
  const value = useMemo(
    () => ({
      config,
      isStarting,
      error,
      startCheckout,
      getProductById: (productId) => getProduct(config.products, productId)
    }),
    [config, error, isStarting, startCheckout]
  );
  return /* @__PURE__ */ jsx(PaymentContext.Provider, { value, children: /* @__PURE__ */ jsx(
    "div",
    {
      className: "op-root",
      style: {
        "--op-primary": config.theme.primary,
        "--op-primary-fg": config.theme.primaryForeground,
        "--op-bg": config.theme.background,
        "--op-surface": config.theme.surface,
        "--op-text": config.theme.text,
        "--op-muted": config.theme.mutedText,
        "--op-border": config.theme.border,
        "--op-danger": config.theme.danger,
        "--op-radius": config.theme.radius,
        "--op-font": config.theme.fontFamily
      },
      children
    }
  ) });
}
function usePayment() {
  const context = useContext(PaymentContext);
  if (!context) {
    throw new Error("usePayment must be used within PaymentProvider");
  }
  return context;
}
function usePaymentConfig() {
  return usePayment().config;
}
function BuyButton({
  productId,
  returnUrl,
  label = "Purchase",
  children,
  className,
  disabled,
  ...props
}) {
  const { startCheckout, isStarting, error, getProductById } = usePayment();
  const product = getProductById(productId);
  return /* @__PURE__ */ jsxs("div", { className: "op-buy", children: [
    /* @__PURE__ */ jsx(
      "button",
      {
        type: "button",
        className: ["op-buy-button", className].filter(Boolean).join(" "),
        disabled: disabled || isStarting || !product,
        onClick: () => void startCheckout(productId, returnUrl),
        ...props,
        children: isStarting ? "Processing\u2026" : children ?? label
      }
    ),
    !product ? /* @__PURE__ */ jsx("p", { className: "op-field-error", role: "alert", children: "Product is not configured for this brand." }) : null,
    error ? /* @__PURE__ */ jsx("p", { className: "op-field-error", role: "alert", children: error }) : null
  ] });
}

// src/bin.ts
function normalizeBin(value) {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 6) return void 0;
  return digits.slice(0, 8);
}
function formatBinIssuer(info, fallbackBrand) {
  if (!info?.bank && !info?.country && !info?.type) return fallbackBrand;
  const parts = [fallbackBrand];
  if (info.bank) parts.push(info.bank);
  else if (info.country) parts.push(info.country);
  if (info.type && !info.bank) parts.push(info.type);
  return parts.join(" \xB7 ");
}

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
function useBinLookup(cardNumber, endpoint) {
  const [info, setInfo] = useState(null);
  useEffect(() => {
    const bin = normalizeBin(cardNumber);
    if (!bin || !endpoint) {
      setInfo(null);
      return;
    }
    setInfo((current) => current && bin.startsWith(current.bin) ? current : null);
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void fetch(`${endpoint}?bin=${encodeURIComponent(bin)}`).then(async (response) => {
        if (!response.ok) return null;
        return await response.json();
      }).then((data) => {
        if (!cancelled) setInfo(data?.bin ? data : null);
      }).catch(() => {
        if (!cancelled) setInfo(null);
      });
    }, 400);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [cardNumber, endpoint]);
  return info;
}
function CardFields({
  cardNumber,
  expiry,
  cvv,
  cardholderName,
  errors,
  disabled,
  onChange
}) {
  const { api } = usePaymentConfig();
  const brand = detectCardBrand(cardNumber);
  const brandLabel = cardBrandLabel(brand);
  const binInfo = useBinLookup(cardNumber, api.bin);
  const issuerLabel = formatBinIssuer(binInfo, brandLabel);
  function handleCardNumber(event) {
    onChange("cardNumber", formatCardNumber(event.target.value));
  }
  function handleExpiry(event) {
    onChange("expiry", formatExpiry(event.target.value));
  }
  function handleCvv(event) {
    onChange("cvv", onlyDigits(event.target.value, 3));
  }
  return /* @__PURE__ */ jsxs("fieldset", { className: "op-fieldset", disabled, children: [
    /* @__PURE__ */ jsx("legend", { children: "Payment" }),
    /* @__PURE__ */ jsxs("label", { className: "op-field", children: [
      /* @__PURE__ */ jsx("span", { children: "Card number" }),
      /* @__PURE__ */ jsxs("div", { className: "op-card-input", children: [
        /* @__PURE__ */ jsx(
          "input",
          {
            name: "cardNumber",
            inputMode: "numeric",
            autoComplete: "cc-number",
            placeholder: "ACCT-000015",
            value: cardNumber,
            onChange: handleCardNumber,
            "aria-invalid": Boolean(errors.cardNumber)
          }
        ),
        /* @__PURE__ */ jsx("span", { className: "op-card-brand", children: brandLabel })
      ] }),
      binInfo?.bank || binInfo?.country ? /* @__PURE__ */ jsx("p", { className: "op-card-meta", "aria-live": "polite", children: issuerLabel }) : null,
      errors.cardNumber ? /* @__PURE__ */ jsx("em", { className: "op-field-error", children: errors.cardNumber }) : null
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "op-field-grid", children: [
      /* @__PURE__ */ jsxs("label", { className: "op-field", children: [
        /* @__PURE__ */ jsx("span", { children: "Expiration date" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            name: "expiry",
            inputMode: "numeric",
            autoComplete: "cc-exp",
            placeholder: "MM/YY",
            value: expiry,
            onChange: handleExpiry,
            "aria-invalid": Boolean(errors.expiry)
          }
        ),
        errors.expiry ? /* @__PURE__ */ jsx("em", { className: "op-field-error", children: errors.expiry }) : null
      ] }),
      /* @__PURE__ */ jsxs("label", { className: "op-field", children: [
        /* @__PURE__ */ jsx("span", { children: "CVV" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            name: "cvv",
            inputMode: "numeric",
            autoComplete: "cc-csc",
            placeholder: "123",
            value: cvv,
            onChange: handleCvv,
            "aria-invalid": Boolean(errors.cvv)
          }
        ),
        errors.cvv ? /* @__PURE__ */ jsx("em", { className: "op-field-error", children: errors.cvv }) : null
      ] })
    ] }),
    /* @__PURE__ */ jsxs("label", { className: "op-field", children: [
      /* @__PURE__ */ jsx("span", { children: "Cardholder name" }),
      /* @__PURE__ */ jsx(
        "input",
        {
          name: "cardholderName",
          autoComplete: "cc-name",
          placeholder: "Name on card",
          value: cardholderName,
          onChange: (event) => onChange("cardholderName", event.target.value),
          "aria-invalid": Boolean(errors.cardholderName)
        }
      ),
      errors.cardholderName ? /* @__PURE__ */ jsx("em", { className: "op-field-error", children: errors.cardholderName }) : null
    ] })
  ] });
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
function Confirmation({ confirmationId, email, onBack }) {
  return /* @__PURE__ */ jsxs("section", { className: "op-confirm", "aria-live": "polite", children: [
    /* @__PURE__ */ jsx("p", { className: "op-kicker", children: "Order received" }),
    /* @__PURE__ */ jsx("h1", { children: "Thank you." }),
    /* @__PURE__ */ jsxs("p", { children: [
      "We\u2019ve received your order request. Our support team will review the details and contact you at ",
      /* @__PURE__ */ jsx("strong", { children: email }),
      " regarding the next steps."
    ] }),
    /* @__PURE__ */ jsxs("p", { className: "op-confirm-id", children: [
      "Reference ",
      confirmationId
    ] }),
    /* @__PURE__ */ jsx("button", { type: "button", className: "op-secondary", onClick: onBack, children: "Back" })
  ] });
}
function OrderSummary({ product, brandName }) {
  return /* @__PURE__ */ jsxs("section", { className: "op-summary", "aria-labelledby": "op-summary-title", children: [
    /* @__PURE__ */ jsx("p", { className: "op-kicker", children: brandName }),
    /* @__PURE__ */ jsxs("div", { className: "op-summary-row", children: [
      product.imageUrl ? /* @__PURE__ */ jsx("img", { className: "op-summary-image", src: product.imageUrl, alt: product.name }) : /* @__PURE__ */ jsx("div", { className: "op-summary-image op-summary-fallback", "aria-hidden": "true" }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { id: "op-summary-title", className: "op-summary-title", children: product.name }),
        /* @__PURE__ */ jsx("p", { className: "op-summary-copy", children: product.description })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "op-amount", children: [
      /* @__PURE__ */ jsx("span", { children: "Total" }),
      /* @__PURE__ */ jsx("strong", { children: formatMoney(product.amount, product.currency) })
    ] })
  ] });
}
function CustomCheckout(props) {
  return /* @__PURE__ */ jsx(Suspense, { fallback: /* @__PURE__ */ jsx("div", { className: "op-shell", children: "Loading checkout\u2026" }), children: /* @__PURE__ */ jsx(CustomCheckoutInner, { ...props }) });
}
function CustomCheckoutInner({ productId, returnUrl }) {
  const config = usePaymentConfig();
  const searchParams = useSearchParams();
  const resolvedProductId = productId ?? searchParams.get("product") ?? config.products[0]?.id ?? "";
  const resolvedReturnUrl = returnUrl ?? searchParams.get("returnUrl") ?? config.urls.cancel ?? "/";
  const product = getProduct(config.products, resolvedProductId);
  const [email, setEmail] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardholderName, setCardholderName] = useState("");
  const [country, setCountry] = useState("");
  const [address, setAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [confirmation, setConfirmation] = useState(null);
  const values = useMemo(
    () => ({
      email,
      cardNumber,
      expiry,
      cvv,
      cardholderName,
      country,
      address,
      postalCode
    }),
    [address, cardNumber, cardholderName, country, cvv, email, expiry, postalCode]
  );
  if (!product) {
    return /* @__PURE__ */ jsx("div", { className: "op-shell", children: /* @__PURE__ */ jsxs("section", { className: "op-card", children: [
      /* @__PURE__ */ jsx("h1", { children: "Product unavailable" }),
      /* @__PURE__ */ jsxs("p", { children: [
        "This checkout link does not match a product configured for ",
        config.brandName,
        "."
      ] }),
      /* @__PURE__ */ jsx("a", { className: "op-secondary", href: resolvedReturnUrl, children: "Back" })
    ] }) });
  }
  function goBack() {
    window.location.assign(resolvedReturnUrl);
  }
  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validateCheckoutForm(values);
    setErrors(nextErrors);
    setSubmitError(null);
    if (hasFieldErrors(nextErrors) || !product) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(config.api.custom, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          email: email.trim(),
          cardholderName: cardholderName.trim(),
          billing: {
            country,
            address: address.trim(),
            postalCode: postalCode.trim()
          },
          card: toCardSummary(values),
          returnUrl: resolvedReturnUrl
        })
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? "Payment could not be processed");
      }
      setConfirmation({ id: data.confirmationId, email: email.trim() });
    } catch (caught) {
      setSubmitError(caught instanceof Error ? caught.message : "Payment could not be processed");
    } finally {
      setIsSubmitting(false);
    }
  }
  return /* @__PURE__ */ jsx("div", { className: "op-shell", children: /* @__PURE__ */ jsxs("div", { className: "op-checkout", children: [
    /* @__PURE__ */ jsx(OrderSummary, { product, brandName: config.brandName }),
    /* @__PURE__ */ jsx("section", { className: "op-card", children: confirmation ? /* @__PURE__ */ jsx(
      Confirmation,
      {
        confirmationId: confirmation.id,
        email: confirmation.email,
        onBack: goBack
      }
    ) : /* @__PURE__ */ jsxs("form", { className: "op-form", onSubmit: handleSubmit, noValidate: true, children: [
      /* @__PURE__ */ jsxs("fieldset", { className: "op-fieldset", disabled: isSubmitting, children: [
        /* @__PURE__ */ jsx("legend", { children: "Contact" }),
        /* @__PURE__ */ jsxs("label", { className: "op-field", children: [
          /* @__PURE__ */ jsx("span", { children: "Email" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "email",
              name: "email",
              autoComplete: "email",
              placeholder: "you@example.com",
              value: email,
              onChange: (event) => setEmail(event.target.value),
              "aria-invalid": Boolean(errors.email)
            }
          ),
          errors.email ? /* @__PURE__ */ jsx("em", { className: "op-field-error", children: errors.email }) : null
        ] })
      ] }),
      /* @__PURE__ */ jsx(
        CardFields,
        {
          cardNumber,
          expiry,
          cvv,
          cardholderName,
          errors,
          disabled: isSubmitting,
          onChange: (field, value) => {
            if (field === "cardNumber") setCardNumber(value);
            if (field === "expiry") setExpiry(value);
            if (field === "cvv") setCvv(value);
            if (field === "cardholderName") setCardholderName(value);
          }
        }
      ),
      /* @__PURE__ */ jsxs("fieldset", { className: "op-fieldset", disabled: isSubmitting, children: [
        /* @__PURE__ */ jsx("legend", { children: "Billing" }),
        /* @__PURE__ */ jsxs("label", { className: "op-field", children: [
          /* @__PURE__ */ jsx("span", { children: "Country" }),
          /* @__PURE__ */ jsxs(
            "select",
            {
              name: "country",
              value: country,
              onChange: (event) => setCountry(event.target.value),
              "aria-invalid": Boolean(errors.country),
              children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "Select country" }),
                COUNTRIES.map((item) => /* @__PURE__ */ jsx("option", { value: item.code, children: item.name }, item.code))
              ]
            }
          ),
          errors.country ? /* @__PURE__ */ jsx("em", { className: "op-field-error", children: errors.country }) : null
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "op-field", children: [
          /* @__PURE__ */ jsx("span", { children: "Address" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              name: "address",
              autoComplete: "street-address",
              placeholder: "Street address",
              value: address,
              onChange: (event) => setAddress(event.target.value),
              "aria-invalid": Boolean(errors.address)
            }
          ),
          errors.address ? /* @__PURE__ */ jsx("em", { className: "op-field-error", children: errors.address }) : null
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "op-field", children: [
          /* @__PURE__ */ jsx("span", { children: "Postal / ZIP code" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              name: "postalCode",
              autoComplete: "postal-code",
              placeholder: "ZIP / postal code",
              value: postalCode,
              onChange: (event) => setPostalCode(event.target.value),
              "aria-invalid": Boolean(errors.postalCode)
            }
          ),
          errors.postalCode ? /* @__PURE__ */ jsx("em", { className: "op-field-error", children: errors.postalCode }) : null
        ] })
      ] }),
      submitError ? /* @__PURE__ */ jsx("p", { className: "op-field-error", role: "alert", children: submitError }) : null,
      /* @__PURE__ */ jsx("button", { type: "submit", className: "op-buy-button", disabled: isSubmitting, children: isSubmitting ? "Processing\u2026" : "Pay / Purchase" }),
      /* @__PURE__ */ jsx("button", { type: "button", className: "op-text-button", onClick: goBack, disabled: isSubmitting, children: "Back" })
    ] }) })
  ] }) });
}
var stripeAppearance = {
  theme: "stripe",
  variables: {
    colorPrimary: "#635bff",
    colorBackground: "#ffffff",
    colorText: "#30313d",
    colorDanger: "#df1b41",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    borderRadius: "8px",
    spacingUnit: "4px"
  }
};
function StripeCheckout() {
  return /* @__PURE__ */ jsx(Suspense, { fallback: /* @__PURE__ */ jsx("div", { className: "op-stripe-page", children: "Loading checkout\u2026" }), children: /* @__PURE__ */ jsx(StripeCheckoutInner, {}) });
}
function StripeCheckoutInner() {
  const config = usePaymentConfig();
  const searchParams = useSearchParams();
  const productId = searchParams.get("product") ?? config.products[0]?.id ?? "";
  const returnUrl = searchParams.get("returnUrl") ?? config.urls.cancel ?? "/";
  const product = getProduct(config.products, productId);
  const [domain, setDomain] = useState("");
  const [clientSecret, setClientSecret] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const stripePromise = useMemo(() => {
    const key = config.stripe?.publishableKey;
    if (!key) return null;
    return loadStripe(
      key,
      config.stripe?.accountId ? { stripeAccount: config.stripe.accountId } : void 0
    );
  }, [config.stripe?.accountId, config.stripe?.publishableKey]);
  useEffect(() => {
    setDomain(window.location.host);
  }, []);
  useEffect(() => {
    if (!product || config.flow !== "stripe") return;
    let cancelled = false;
    void fetch(config.api.intent, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: product.id, returnUrl })
    }).then(async (response) => {
      const data = await response.json();
      if (!response.ok || !data.clientSecret) {
        throw new Error(data.error ?? "Unable to start Stripe payment");
      }
      if (!cancelled) setClientSecret(data.clientSecret);
    }).catch((caught) => {
      if (!cancelled) {
        setLoadError(caught instanceof Error ? caught.message : "Unable to start Stripe payment");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [config.api.intent, config.flow, product, returnUrl]);
  if (!product) {
    return /* @__PURE__ */ jsx("div", { className: "op-stripe-page", children: /* @__PURE__ */ jsxs("div", { className: "op-stripe-form-pane", children: [
      /* @__PURE__ */ jsx("h1", { children: "Product unavailable" }),
      /* @__PURE__ */ jsx("a", { className: "op-stripe-back", href: returnUrl, children: "Back" })
    ] }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "op-stripe-page", children: [
    /* @__PURE__ */ jsxs("aside", { className: "op-stripe-summary-pane", children: [
      /* @__PURE__ */ jsx("p", { className: "op-stripe-domain", children: domain || " " }),
      /* @__PURE__ */ jsxs("p", { className: "op-stripe-pay-label", children: [
        "Pay ",
        config.brandName
      ] }),
      /* @__PURE__ */ jsx("p", { className: "op-stripe-amount", children: formatMoney(product.amount, product.currency) }),
      /* @__PURE__ */ jsxs("div", { className: "op-stripe-product", children: [
        product.imageUrl ? /* @__PURE__ */ jsx("img", { src: product.imageUrl, alt: "", className: "op-stripe-thumb" }) : /* @__PURE__ */ jsx("div", { className: "op-stripe-thumb", "aria-hidden": "true" }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "op-stripe-product-name", children: product.name }),
          /* @__PURE__ */ jsx("p", { className: "op-stripe-product-copy", children: product.description })
        ] }),
        /* @__PURE__ */ jsx("strong", { children: formatMoney(product.amount, product.currency) })
      ] })
    ] }),
    /* @__PURE__ */ jsx("section", { className: "op-stripe-form-pane", children: loadError ? /* @__PURE__ */ jsxs("div", { className: "op-stripe-error-box", children: [
      /* @__PURE__ */ jsx("p", { children: loadError }),
      /* @__PURE__ */ jsx("a", { className: "op-stripe-back", href: returnUrl, children: "Back" })
    ] }) : !stripePromise || !clientSecret ? /* @__PURE__ */ jsx("p", { className: "op-stripe-loading", children: "Loading payment form\u2026" }) : /* @__PURE__ */ jsx(
      Elements,
      {
        stripe: stripePromise,
        options: { clientSecret, appearance: stripeAppearance },
        children: /* @__PURE__ */ jsx(
          StripePaymentForm,
          {
            product,
            returnUrl,
            successPath: config.urls.success
          }
        )
      }
    ) })
  ] });
}
function StripePaymentForm({
  product,
  returnUrl,
  successPath
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [email, setEmail] = useState("");
  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState(null);
  async function handleSubmit(event) {
    event.preventDefault();
    if (!stripe || !elements) return;
    setIsPaying(true);
    setError(null);
    const successUrl = new URL(successPath, window.location.origin);
    successUrl.searchParams.set("product", product.id);
    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: successUrl.toString(),
        receipt_email: email || void 0
      },
      redirect: "if_required"
    });
    if (result.error) {
      setError(result.error.message ?? "Payment failed");
      setIsPaying(false);
      return;
    }
    if (result.paymentIntent?.status === "succeeded") {
      window.location.assign(successUrl.toString());
      return;
    }
    setError("Payment is still processing. Check your email or try again.");
    setIsPaying(false);
  }
  return /* @__PURE__ */ jsxs("form", { className: "op-stripe-form", onSubmit: handleSubmit, children: [
    /* @__PURE__ */ jsxs("label", { className: "op-stripe-field", children: [
      /* @__PURE__ */ jsx("span", { children: "Email" }),
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "email",
          name: "email",
          autoComplete: "email",
          required: true,
          placeholder: "you@example.com",
          value: email,
          onChange: (event) => setEmail(event.target.value)
        }
      )
    ] }),
    /* @__PURE__ */ jsx(
      PaymentElement,
      {
        options: {
          layout: "tabs"
        }
      }
    ),
    error ? /* @__PURE__ */ jsx("p", { className: "op-field-error", role: "alert", children: error }) : null,
    /* @__PURE__ */ jsx(
      "button",
      {
        type: "submit",
        className: "op-stripe-pay",
        disabled: !stripe || !elements || isPaying,
        children: isPaying ? "Processing\u2026" : `Pay ${formatMoney(product.amount, product.currency)}`
      }
    ),
    /* @__PURE__ */ jsx("a", { className: "op-stripe-back", href: returnUrl, children: "Back" })
  ] });
}
function CheckoutPage() {
  const { flow } = usePaymentConfig();
  if (flow === "stripe") return /* @__PURE__ */ jsx(StripeCheckout, {});
  return /* @__PURE__ */ jsx(CustomCheckout, {});
}
function PaymentResult({ title, message, href, actionLabel }) {
  return /* @__PURE__ */ jsxs("section", { className: "op-result", children: [
    /* @__PURE__ */ jsx("h1", { children: title }),
    /* @__PURE__ */ jsx("p", { children: message }),
    /* @__PURE__ */ jsx("a", { className: "op-buy-button", href, children: actionLabel })
  ] });
}
function PaymentSuccess({ href = "/" }) {
  return /* @__PURE__ */ jsx(
    PaymentResult,
    {
      title: "Payment successful",
      message: "Stripe confirmed this payment. You can return to the brand storefront.",
      href,
      actionLabel: "Back to store"
    }
  );
}
function PaymentCancel({ href = "/" }) {
  return /* @__PURE__ */ jsx(
    PaymentResult,
    {
      title: "Payment canceled",
      message: "No charge was made. You can return to the product page and try again.",
      href,
      actionLabel: "Back to product"
    }
  );
}

export { BuyButton, CardFields, CheckoutPage, Confirmation, CustomCheckout, OrderSummary, PaymentCancel, PaymentProvider, PaymentResult, PaymentSuccess, StripeCheckout, useBinLookup, usePayment, usePaymentConfig };
