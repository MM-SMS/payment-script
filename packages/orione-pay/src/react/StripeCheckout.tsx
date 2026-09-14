"use client";

import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Suspense, useEffect, useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { getProduct } from "../config";
import { formatMoney } from "../format";
import type { Product, StripeIntentResponse } from "../types";
import { usePaymentConfig } from "./context";

const stripeAppearance = {
  theme: "stripe" as const,
  variables: {
    colorPrimary: "#635bff",
    colorBackground: "#ffffff",
    colorText: "#30313d",
    colorDanger: "#df1b41",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    borderRadius: "8px",
    spacingUnit: "4px",
  },
};

export function StripeCheckout() {
  return (
    <Suspense fallback={<div className="op-stripe-page">Loading checkout…</div>}>
      <StripeCheckoutInner />
    </Suspense>
  );
}

function StripeCheckoutInner() {
  const config = usePaymentConfig();
  const searchParams = useSearchParams();
  const productId = searchParams.get("product") ?? config.products[0]?.id ?? "";
  const returnUrl = searchParams.get("returnUrl") ?? config.urls.cancel ?? "/";
  const product = getProduct(config.products, productId);
  const [domain, setDomain] = useState("");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const stripePromise = useMemo(() => {
    const key = config.stripe?.publishableKey;
    if (!key) return null;
    return loadStripe(
      key,
      config.stripe?.accountId ? { stripeAccount: config.stripe.accountId } : undefined,
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
      body: JSON.stringify({ productId: product.id, returnUrl }),
    })
      .then(async (response) => {
        const data = (await response.json()) as StripeIntentResponse & { error?: string };
        if (!response.ok || !data.clientSecret) {
          throw new Error(data.error ?? "Unable to start Stripe payment");
        }
        if (!cancelled) setClientSecret(data.clientSecret);
      })
      .catch((caught: unknown) => {
        if (!cancelled) {
          setLoadError(caught instanceof Error ? caught.message : "Unable to start Stripe payment");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [config.api.intent, config.flow, product, returnUrl]);

  if (!product) {
    return (
      <div className="op-stripe-page">
        <div className="op-stripe-form-pane">
          <h1>Product unavailable</h1>
          <a className="op-stripe-back" href={returnUrl}>
            Back
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="op-stripe-page">
      <aside className="op-stripe-summary-pane">
        <p className="op-stripe-domain">{domain || " "}</p>
        <p className="op-stripe-pay-label">Pay {config.brandName}</p>
        <p className="op-stripe-amount">{formatMoney(product.amount, product.currency)}</p>
        <div className="op-stripe-product">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt="" className="op-stripe-thumb" />
          ) : (
            <div className="op-stripe-thumb" aria-hidden="true" />
          )}
          <div>
            <p className="op-stripe-product-name">{product.name}</p>
            <p className="op-stripe-product-copy">{product.description}</p>
          </div>
          <strong>{formatMoney(product.amount, product.currency)}</strong>
        </div>
      </aside>

      <section className="op-stripe-form-pane">
        {loadError ? (
          <div className="op-stripe-error-box">
            <p>{loadError}</p>
            <a className="op-stripe-back" href={returnUrl}>
              Back
            </a>
          </div>
        ) : !stripePromise || !clientSecret ? (
          <p className="op-stripe-loading">Loading payment form…</p>
        ) : (
          <Elements
            stripe={stripePromise}
            options={{ clientSecret, appearance: stripeAppearance }}
          >
            <StripePaymentForm
              product={product}
              returnUrl={returnUrl}
              successPath={config.urls.success}
            />
          </Elements>
        )}
      </section>
    </div>
  );
}

function StripePaymentForm({
  product,
  returnUrl,
  successPath,
}: {
  product: Product;
  returnUrl: string;
  successPath: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [email, setEmail] = useState("");
  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
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
        receipt_email: email || undefined,
      },
      redirect: "if_required",
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

  return (
    <form className="op-stripe-form" onSubmit={handleSubmit}>
      <label className="op-stripe-field">
        <span>Email</span>
        <input
          type="email"
          name="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>
      <PaymentElement
        options={{
          layout: "tabs",
        }}
      />
      {error ? (
        <p className="op-field-error" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        className="op-stripe-pay"
        disabled={!stripe || !elements || isPaying}
      >
        {isPaying ? "Processing…" : `Pay ${formatMoney(product.amount, product.currency)}`}
      </button>
      <a className="op-stripe-back" href={returnUrl}>
        Back
      </a>
    </form>
  );
}
