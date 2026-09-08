"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { getProduct } from "../config";
import type { CheckoutRequest, CheckoutResponse, Product, PublicPaymentConfig } from "../types";

interface PaymentContextValue {
  config: PublicPaymentConfig;
  isStarting: boolean;
  error: string | null;
  startCheckout: (productId: string, returnUrl?: string) => Promise<void>;
  getProductById: (productId: string) => Product | undefined;
}

const PaymentContext = createContext<PaymentContextValue | null>(null);

interface PaymentProviderProps {
  config: PublicPaymentConfig;
  children: ReactNode;
}

export function PaymentProvider({ config, children }: PaymentProviderProps) {
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCheckout = useCallback(
    async (productId: string, returnUrl?: string) => {
      setIsStarting(true);
      setError(null);

      try {
        const payload: CheckoutRequest = {
          productId,
          returnUrl: returnUrl ?? (typeof window !== "undefined" ? window.location.href : undefined),
        };

        const response = await fetch(config.api.checkout, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = (await response.json()) as CheckoutResponse & { error?: string };

        if (!response.ok || !data.url) {
          throw new Error(data.error ?? "Unable to start checkout");
        }

        window.location.assign(data.url);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Unable to start checkout");
        setIsStarting(false);
      }
    },
    [config.api.checkout],
  );

  const value = useMemo<PaymentContextValue>(
    () => ({
      config,
      isStarting,
      error,
      startCheckout,
      getProductById: (productId) => getProduct(config.products, productId),
    }),
    [config, error, isStarting, startCheckout],
  );

  return (
    <PaymentContext.Provider value={value}>
      <div
        className="op-root"
        style={
          {
            "--op-primary": config.theme.primary,
            "--op-primary-fg": config.theme.primaryForeground,
            "--op-bg": config.theme.background,
            "--op-surface": config.theme.surface,
            "--op-text": config.theme.text,
            "--op-muted": config.theme.mutedText,
            "--op-border": config.theme.border,
            "--op-danger": config.theme.danger,
            "--op-radius": config.theme.radius,
            "--op-font": config.theme.fontFamily,
          } as CSSProperties
        }
      >
        {children}
      </div>
    </PaymentContext.Provider>
  );
}

export function usePayment(): PaymentContextValue {
  const context = useContext(PaymentContext);
  if (!context) {
    throw new Error("usePayment must be used within PaymentProvider");
  }
  return context;
}

export function usePaymentConfig(): PublicPaymentConfig {
  return usePayment().config;
}
