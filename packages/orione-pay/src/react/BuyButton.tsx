"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { usePayment } from "./context";

export interface BuyButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> {
  productId: string;
  returnUrl?: string;
  label?: string;
  children?: ReactNode;
}

export function BuyButton({
  productId,
  returnUrl,
  label = "Purchase",
  children,
  className,
  disabled,
  ...props
}: BuyButtonProps) {
  const { startCheckout, isStarting, error, getProductById } = usePayment();
  const product = getProductById(productId);

  return (
    <div className="op-buy">
      <button
        type="button"
        className={["op-buy-button", className].filter(Boolean).join(" ")}
        disabled={disabled || isStarting || !product}
        onClick={() => void startCheckout(productId, returnUrl)}
        {...props}
      >
        {isStarting ? "Processing…" : (children ?? label)}
      </button>
      {!product ? (
        <p className="op-field-error" role="alert">
          Product is not configured for this brand.
        </p>
      ) : null}
      {error ? (
        <p className="op-field-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
