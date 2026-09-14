"use client";

import type { ChangeEvent } from "react";
import { formatBinIssuer } from "../bin";
import { formatCardNumber, formatExpiry, onlyDigits } from "../format";
import { cardBrandLabel, detectCardBrand } from "../validation/card";
import type { FieldErrors } from "../types";
import { usePaymentConfig } from "./context";
import { useBinLookup } from "./useBinLookup";

interface CardFieldsProps {
  cardNumber: string;
  expiry: string;
  cvv: string;
  cardholderName: string;
  errors: FieldErrors;
  disabled?: boolean;
  onChange: (field: "cardNumber" | "expiry" | "cvv" | "cardholderName", value: string) => void;
}

export function CardFields({
  cardNumber,
  expiry,
  cvv,
  cardholderName,
  errors,
  disabled,
  onChange,
}: CardFieldsProps) {
  const { api } = usePaymentConfig();
  const brand = detectCardBrand(cardNumber);
  const brandLabel = cardBrandLabel(brand);
  const binInfo = useBinLookup(cardNumber, api.bin);
  const issuerLabel = formatBinIssuer(binInfo, brandLabel);

  function handleCardNumber(event: ChangeEvent<HTMLInputElement>) {
    onChange("cardNumber", formatCardNumber(event.target.value));
  }

  function handleExpiry(event: ChangeEvent<HTMLInputElement>) {
    onChange("expiry", formatExpiry(event.target.value));
  }

  function handleCvv(event: ChangeEvent<HTMLInputElement>) {
    onChange("cvv", onlyDigits(event.target.value, 3));
  }

  return (
    <fieldset className="op-fieldset" disabled={disabled}>
      <legend>Payment</legend>
      <label className="op-field">
        <span>Card number</span>
        <div className="op-card-input">
          <input
            name="cardNumber"
            inputMode="numeric"
            autoComplete="cc-number"
            placeholder="ACCT-000015"
            value={cardNumber}
            onChange={handleCardNumber}
            aria-invalid={Boolean(errors.cardNumber)}
          />
          <span className="op-card-brand">{brandLabel}</span>
        </div>
        {binInfo?.bank || binInfo?.country ? (
          <p className="op-card-meta" aria-live="polite">
            {issuerLabel}
          </p>
        ) : null}
        {errors.cardNumber ? <em className="op-field-error">{errors.cardNumber}</em> : null}
      </label>

      <div className="op-field-grid">
        <label className="op-field">
          <span>Expiration date</span>
          <input
            name="expiry"
            inputMode="numeric"
            autoComplete="cc-exp"
            placeholder="MM/YY"
            value={expiry}
            onChange={handleExpiry}
            aria-invalid={Boolean(errors.expiry)}
          />
          {errors.expiry ? <em className="op-field-error">{errors.expiry}</em> : null}
        </label>
        <label className="op-field">
          <span>CVV</span>
          <input
            name="cvv"
            inputMode="numeric"
            autoComplete="cc-csc"
            placeholder="123"
            value={cvv}
            onChange={handleCvv}
            aria-invalid={Boolean(errors.cvv)}
          />
          {errors.cvv ? <em className="op-field-error">{errors.cvv}</em> : null}
        </label>
      </div>

      <label className="op-field">
        <span>Cardholder name</span>
        <input
          name="cardholderName"
          autoComplete="cc-name"
          placeholder="Name on card"
          value={cardholderName}
          onChange={(event) => onChange("cardholderName", event.target.value)}
          aria-invalid={Boolean(errors.cardholderName)}
        />
        {errors.cardholderName ? <em className="op-field-error">{errors.cardholderName}</em> : null}
      </label>
    </fieldset>
  );
}
