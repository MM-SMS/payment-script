import {
  DEFAULT_API_PATHS,
  DEFAULT_THEME,
  DEFAULT_URLS,
  type CreatePaymentConfigInput,
  type PaymentFlow,
  type Product,
  type PublicPaymentConfig,
  type ServerPaymentConfig,
} from "./types";

export function resolvePaymentFlow(raw?: string): PaymentFlow {
  const value = (raw ?? process.env.PAYMENT_FLOW ?? process.env.NEXT_PUBLIC_PAYMENT_FLOW ?? "custom")
    .trim()
    .toLowerCase();

  if (value === "stripe") return "stripe";
  if (value === "custom" || value === "backup") return "custom";

  throw new Error(
    `Invalid PAYMENT_FLOW "${raw}". Use "stripe" or "custom" (alias: "backup").`,
  );
}

export function getProduct(products: Product[], productId: string): Product | undefined {
  return products.find((product) => product.id === productId);
}

export function requireProduct(products: Product[], productId: string): Product {
  const product = getProduct(products, productId);
  if (!product) {
    throw new Error(`Unknown product "${productId}" for the configured brand.`);
  }
  return product;
}

export function assertBrandIsolation(config: PublicPaymentConfig, brandId: string): void {
  if (config.brandId !== brandId) {
    throw new Error(
      `Brand isolation error: config belongs to "${config.brandId}", requested "${brandId}".`,
    );
  }
}

export function createServerPaymentConfig(
  input: CreatePaymentConfigInput,
): ServerPaymentConfig {
  const flow = resolvePaymentFlow(input.flow);
  const stripePublishable =
    input.stripe?.publishableKey ?? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
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
    stripe:
      stripePublishable || stripeSecret
        ? {
            publishableKey: stripePublishable ?? "",
            secretKey: stripeSecret ?? "",
            accountId: stripeAccount || undefined,
          }
        : undefined,
  };
}

export function toPublicPaymentConfig(config: ServerPaymentConfig): PublicPaymentConfig {
  return {
    brandId: config.brandId,
    brandName: config.brandName,
    flow: config.flow,
    products: config.products,
    urls: config.urls,
    api: config.api,
    theme: config.theme,
    stripe: config.stripe
      ? {
          publishableKey: config.stripe.publishableKey,
          accountId: config.stripe.accountId,
        }
      : undefined,
  };
}

export function definePaymentConfig(input: CreatePaymentConfigInput): ServerPaymentConfig {
  return createServerPaymentConfig(input);
}
