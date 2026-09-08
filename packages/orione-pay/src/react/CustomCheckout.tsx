"use client";

import { Suspense, useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { getProduct } from "../config";
import { COUNTRIES } from "../countries";
import type { CustomPaymentResponse, FieldErrors } from "../types";
import { hasFieldErrors, toCardSummary, validateCheckoutForm } from "../validation/checkout";
import { CardFields } from "./CardFields";
import { Confirmation } from "./Confirmation";
import { usePaymentConfig } from "./context";
import { OrderSummary } from "./OrderSummary";

interface CustomCheckoutFormProps {
  productId?: string;
  returnUrl?: string;
}

export function CustomCheckout(props: CustomCheckoutFormProps) {
  return (
    <Suspense fallback={<div className="op-shell">Loading checkout…</div>}>
      <CustomCheckoutInner {...props} />
    </Suspense>
  );
}

function CustomCheckoutInner({ productId, returnUrl }: CustomCheckoutFormProps) {
  const config = usePaymentConfig();
  const searchParams = useSearchParams();
  const resolvedProductId = productId ?? searchParams.get("product") ?? config.products[0]?.id ?? "";
  const resolvedReturnUrl =
    returnUrl ?? searchParams.get("returnUrl") ?? config.urls.cancel ?? "/";
  const product = getProduct(config.products, resolvedProductId);

  const [email, setEmail] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardholderName, setCardholderName] = useState("");
  const [country, setCountry] = useState("");
  const [address, setAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<{ id: string; email: string } | null>(null);

  const values = useMemo(
    () => ({
      email,
      cardNumber,
      expiry,
      cvv,
      cardholderName,
      country,
      address,
      postalCode,
    }),
    [address, cardNumber, cardholderName, country, cvv, email, expiry, postalCode],
  );

  if (!product) {
    return (
      <div className="op-shell">
        <section className="op-card">
          <h1>Product unavailable</h1>
          <p>This checkout link does not match a product configured for {config.brandName}.</p>
          <a className="op-secondary" href={resolvedReturnUrl}>
            Back
          </a>
        </section>
      </div>
    );
  }

  function goBack() {
    window.location.assign(resolvedReturnUrl);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
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
            postalCode: postalCode.trim(),
          },
          card: toCardSummary(values),
          returnUrl: resolvedReturnUrl,
        }),
      });
      const data = (await response.json()) as CustomPaymentResponse & { error?: string };
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

  return (
    <div className="op-shell">
      <div className="op-checkout">
        <OrderSummary product={product} brandName={config.brandName} />
        <section className="op-card">
          {confirmation ? (
            <Confirmation
              confirmationId={confirmation.id}
              email={confirmation.email}
              onBack={goBack}
            />
          ) : (
            <form className="op-form" onSubmit={handleSubmit} noValidate>
              <fieldset className="op-fieldset" disabled={isSubmitting}>
                <legend>Contact</legend>
                <label className="op-field">
                  <span>Email</span>
                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    aria-invalid={Boolean(errors.email)}
                  />
                  {errors.email ? <em className="op-field-error">{errors.email}</em> : null}
                </label>
              </fieldset>

              <CardFields
                cardNumber={cardNumber}
                expiry={expiry}
                cvv={cvv}
                cardholderName={cardholderName}
                errors={errors}
                disabled={isSubmitting}
                onChange={(field, value) => {
                  if (field === "cardNumber") setCardNumber(value);
                  if (field === "expiry") setExpiry(value);
                  if (field === "cvv") setCvv(value);
                  if (field === "cardholderName") setCardholderName(value);
                }}
              />

              <fieldset className="op-fieldset" disabled={isSubmitting}>
                <legend>Billing</legend>
                <label className="op-field">
                  <span>Country</span>
                  <select
                    name="country"
                    value={country}
                    onChange={(event) => setCountry(event.target.value)}
                    aria-invalid={Boolean(errors.country)}
                  >
                    <option value="">Select country</option>
                    {COUNTRIES.map((item) => (
                      <option key={item.code} value={item.code}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                  {errors.country ? <em className="op-field-error">{errors.country}</em> : null}
                </label>
                <label className="op-field">
                  <span>Address</span>
                  <input
                    name="address"
                    autoComplete="street-address"
                    placeholder="Street address"
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                    aria-invalid={Boolean(errors.address)}
                  />
                  {errors.address ? <em className="op-field-error">{errors.address}</em> : null}
                </label>
                <label className="op-field">
                  <span>Postal / ZIP code</span>
                  <input
                    name="postalCode"
                    autoComplete="postal-code"
                    placeholder="ZIP / postal code"
                    value={postalCode}
                    onChange={(event) => setPostalCode(event.target.value)}
                    aria-invalid={Boolean(errors.postalCode)}
                  />
                  {errors.postalCode ? <em className="op-field-error">{errors.postalCode}</em> : null}
                </label>
              </fieldset>

              {submitError ? (
                <p className="op-field-error" role="alert">
                  {submitError}
                </p>
              ) : null}

              <button type="submit" className="op-buy-button" disabled={isSubmitting}>
                {isSubmitting ? "Processing…" : "Pay / Purchase"}
              </button>
              <button type="button" className="op-text-button" onClick={goBack} disabled={isSubmitting}>
                Back
              </button>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}
