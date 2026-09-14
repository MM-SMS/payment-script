type PaymentFlow = "stripe" | "custom";
interface Product {
    id: string;
    name: string;
    description: string;
    amount: number;
    currency: string;
    imageUrl?: string;
    stripePriceId?: string;
}
interface BrandTheme {
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
interface PaymentUrls {
    success: string;
    cancel: string;
    checkout: string;
}
interface PaymentApiPaths {
    checkout: string;
    custom: string;
    bin: string;
    intent: string;
}
interface StripePublicConfig {
    publishableKey: string;
    accountId?: string;
}
interface StripeServerConfig extends StripePublicConfig {
    secretKey: string;
}
interface PublicPaymentConfig {
    brandId: string;
    brandName: string;
    flow: PaymentFlow;
    products: Product[];
    urls: PaymentUrls;
    api: PaymentApiPaths;
    theme: BrandTheme;
    stripe?: StripePublicConfig;
}
interface ServerPaymentConfig extends PublicPaymentConfig {
    stripe?: StripeServerConfig;
}
interface CreatePaymentConfigInput {
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
interface CheckoutRequest {
    productId: string;
    returnUrl?: string;
}
interface CheckoutResponse {
    url: string;
    flow: PaymentFlow;
}
interface PaymentErrorBody {
    error: string;
    code?: string;
    type?: string;
}
interface BillingDetails {
    country: string;
    address: string;
    postalCode: string;
}
interface CardSummary {
    brand: CardBrand;
    last4: string;
    expiryMonth: string;
    expiryYear: string;
}
interface CustomPaymentRequest {
    productId: string;
    email: string;
    cardholderName: string;
    billing: BillingDetails;
    card: CardSummary;
    returnUrl?: string;
}
interface CustomPaymentResponse {
    ok: true;
    confirmationId: string;
    message: string;
}
interface StripeIntentResponse {
    clientSecret: string;
    paymentIntentId: string;
    amount: number;
    currency: string;
}
type CardBrand = "visa" | "mastercard" | "amex" | "discover" | "diners" | "jcb" | "unionpay" | "unknown";
interface FieldErrors {
    [field: string]: string | undefined;
}
declare const DEFAULT_API_PATHS: PaymentApiPaths;
declare const DEFAULT_URLS: PaymentUrls;
declare const DEFAULT_THEME: BrandTheme;

export { type BillingDetails as B, type CreatePaymentConfigInput as C, DEFAULT_API_PATHS as D, type FieldErrors as F, type PublicPaymentConfig as P, type ServerPaymentConfig as S, type Product as a, type PaymentFlow as b, type CardBrand as c, type BrandTheme as d, type CardSummary as e, type CheckoutRequest as f, type CheckoutResponse as g, type CustomPaymentRequest as h, type CustomPaymentResponse as i, DEFAULT_THEME as j, DEFAULT_URLS as k, type PaymentApiPaths as l, type PaymentErrorBody as m, type PaymentUrls as n, type StripeIntentResponse as o, type StripePublicConfig as p, type StripeServerConfig as q };
