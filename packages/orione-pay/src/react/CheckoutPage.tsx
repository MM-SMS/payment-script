"use client";

import { usePaymentConfig } from "./context";
import { CustomCheckout } from "./CustomCheckout";
import { StripeCheckout } from "./StripeCheckout";

export function CheckoutPage() {
  const { flow } = usePaymentConfig();
  if (flow === "stripe") return <StripeCheckout />;
  return <CustomCheckout />;
}
