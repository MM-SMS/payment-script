import { P as PublicPaymentConfig, C as CreatePaymentConfigInput, S as ServerPaymentConfig, a as Product, b as PaymentFlow, c as CardBrand, F as FieldErrors } from './types-BV3ipef2.cjs';
export { B as BillingDetails, d as BrandTheme, e as CardSummary, f as CheckoutRequest, g as CheckoutResponse, h as CustomPaymentRequest, i as CustomPaymentResponse, D as DEFAULT_API_PATHS, j as DEFAULT_THEME, k as DEFAULT_URLS, l as PaymentApiPaths, m as PaymentErrorBody, n as PaymentUrls, o as StripeIntentResponse, p as StripePublicConfig, q as StripeServerConfig } from './types-BV3ipef2.cjs';
export { B as BinInfo, f as formatBinIssuer, l as lookupLocalBin, n as normalizeBin } from './bin-B3UV-FYt.cjs';

declare function resolvePaymentFlow(raw?: string): PaymentFlow;
declare function getProduct(products: Product[], productId: string): Product | undefined;
declare function requireProduct(products: Product[], productId: string): Product;
declare function assertBrandIsolation(config: PublicPaymentConfig, brandId: string): void;
declare function createServerPaymentConfig(input: CreatePaymentConfigInput): ServerPaymentConfig;
declare function toPublicPaymentConfig(config: ServerPaymentConfig): PublicPaymentConfig;
declare function definePaymentConfig(input: CreatePaymentConfigInput): ServerPaymentConfig;

interface CountryOption {
    code: string;
    name: string;
}
declare const COUNTRIES: CountryOption[];

declare function formatMoney(amount: number, currency: string, locale?: string): string;
declare function formatCardNumber(value: string): string;
declare function formatExpiry(value: string): string;
declare function onlyDigits(value: string, maxLength: number): string;
declare function createConfirmationId(brandId: string): string;

declare function luhnCheck(cardNumber: string): boolean;
declare function detectCardBrand(cardNumber: string): CardBrand;
declare function cardBrandLabel(brand: CardBrand): string;
declare function validateCardNumber(cardNumber: string): string | undefined;
declare function validateExpiry(expiry: string, now?: Date): string | undefined;
declare function validateCvv(cvv: string): string | undefined;
declare function validateCardholderName(name: string): string | undefined;
declare function parseExpiry(expiry: string): {
    month: string;
    year: string;
};

interface CheckoutFormValues {
    email: string;
    cardNumber: string;
    expiry: string;
    cvv: string;
    cardholderName: string;
    country: string;
    address: string;
    postalCode: string;
}
declare function validateEmail(email: string): string | undefined;
declare function validateCountry(country: string): string | undefined;
declare function validateAddress(address: string): string | undefined;
declare function validatePostalCode(postalCode: string): string | undefined;
declare function validateCheckoutForm(values: CheckoutFormValues): FieldErrors;
declare function hasFieldErrors(errors: FieldErrors): boolean;
declare function toCardSummary(values: CheckoutFormValues): {
    brand: CardBrand;
    last4: string;
    expiryMonth: string;
    expiryYear: string;
};

export { COUNTRIES, CardBrand, type CheckoutFormValues, type CountryOption, CreatePaymentConfigInput, FieldErrors, PaymentFlow, Product, PublicPaymentConfig, ServerPaymentConfig, assertBrandIsolation, cardBrandLabel, createConfirmationId, createServerPaymentConfig, definePaymentConfig, detectCardBrand, formatCardNumber, formatExpiry, formatMoney, getProduct, hasFieldErrors, luhnCheck, onlyDigits, parseExpiry, requireProduct, resolvePaymentFlow, toCardSummary, toPublicPaymentConfig, validateAddress, validateCardNumber, validateCardholderName, validateCheckoutForm, validateCountry, validateCvv, validateEmail, validateExpiry, validatePostalCode };
