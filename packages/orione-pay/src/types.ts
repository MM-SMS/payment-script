export type PaymentFlow = "stripe" | "custom";

export interface Product {
  id: string;
  name: string;
  description: string;
  amount: number;
  currency: string;
  imageUrl?: string;
  stripePriceId?: string;
}

export interface BrandTheme {
  name: string;
  logoUrl?: string;
  primary: string;
  primaryForeground: string;
  background: string;
  surface: string;
  text: string;
  mutedText: string;
  border: string;
  danger: string;
  radius: string;
  fontFamily: string;
}

export interface PaymentUrls {
  success: string;
  cancel: string;
  checkout: string;
}

export interface PaymentApiPaths {
  checkout: string;
  custom: string;
  bin: string;
}

export interface StripePublicConfig {
  publishableKey: string;
  accountId?: string;
}

export interface StripeServerConfig extends StripePublicConfig {
  secretKey: string;
}

export interface PublicPaymentConfig {
  brandId: string;
  brandName: string;
  flow: PaymentFlow;
  products: Product[];
  urls: PaymentUrls;
  api: PaymentApiPaths;
  theme: BrandTheme;
  stripe?: StripePublicConfig;
}

export interface ServerPaymentConfig extends PublicPaymentConfig {
  stripe?: StripeServerConfig;
}

export interface CreatePaymentConfigInput {
  brandId: string;
  brandName: string;
  flow?: PaymentFlow | string;
  products: Product[];
  urls?: Partial<PaymentUrls>;
  api?: Partial<PaymentApiPaths>;
  theme?: Partial<BrandTheme>;
  stripe?: {
    publishableKey?: string;
    secretKey?: string;
    accountId?: string;
  };
}

export interface CheckoutRequest {
  productId: string;
  returnUrl?: string;
}

export interface CheckoutResponse {
  url: string;
  flow: PaymentFlow;
}

export interface PaymentErrorBody {
  error: string;
  code?: string;
  type?: string;
}

export interface BillingDetails {
  country: string;
  address: string;
  postalCode: string;
}

export interface CardSummary {
  brand: CardBrand;
  last4: string;
  expiryMonth: string;
  expiryYear: string;
}

export interface CustomPaymentRequest {
  productId: string;
  email: string;
  cardholderName: string;
  billing: BillingDetails;
  card: CardSummary;
  returnUrl?: string;
}

export interface CustomPaymentResponse {
  ok: true;
  confirmationId: string;
  message: string;
}

export type CardBrand =
  | "visa"
  | "mastercard"
  | "amex"
  | "discover"
  | "diners"
  | "jcb"
  | "unionpay"
  | "unknown";

export interface FieldErrors {
  [field: string]: string | undefined;
}

export const DEFAULT_API_PATHS: PaymentApiPaths = {
  checkout: "/api/orione-pay/checkout",
  custom: "/api/orione-pay/custom",
  bin: "/api/orione-pay/bin",
};

export const DEFAULT_URLS: PaymentUrls = {
  success: "/purchase/success",
  cancel: "/purchase/cancel",
  checkout: "/payment",
};

export const DEFAULT_THEME: BrandTheme = {
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
  fontFamily:
    'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};
