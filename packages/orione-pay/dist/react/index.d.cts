import * as react from 'react';
import { ButtonHTMLAttributes, ReactNode } from 'react';
import { F as FieldErrors, P as PublicPaymentConfig, a as Product } from '../types-B_cE4ZYQ.cjs';

interface BuyButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> {
    productId: string;
    returnUrl?: string;
    label?: string;
    children?: ReactNode;
}
declare function BuyButton({ productId, returnUrl, label, children, className, disabled, ...props }: BuyButtonProps): react.JSX.Element;

interface CardFieldsProps {
    cardNumber: string;
    expiry: string;
    cvv: string;
    cardholderName: string;
    errors: FieldErrors;
    disabled?: boolean;
    onChange: (field: "cardNumber" | "expiry" | "cvv" | "cardholderName", value: string) => void;
}
declare function CardFields({ cardNumber, expiry, cvv, cardholderName, errors, disabled, onChange, }: CardFieldsProps): react.JSX.Element;

interface ConfirmationProps {
    confirmationId: string;
    email: string;
    onBack: () => void;
}
declare function Confirmation({ confirmationId, email, onBack }: ConfirmationProps): react.JSX.Element;

interface CustomCheckoutFormProps {
    productId?: string;
    returnUrl?: string;
}
declare function CustomCheckout(props: CustomCheckoutFormProps): react.JSX.Element;

interface PaymentContextValue {
    config: PublicPaymentConfig;
    isStarting: boolean;
    error: string | null;
    startCheckout: (productId: string, returnUrl?: string) => Promise<void>;
    getProductById: (productId: string) => Product | undefined;
}
interface PaymentProviderProps {
    config: PublicPaymentConfig;
    children: ReactNode;
}
declare function PaymentProvider({ config, children }: PaymentProviderProps): react.JSX.Element;
declare function usePayment(): PaymentContextValue;
declare function usePaymentConfig(): PublicPaymentConfig;

interface OrderSummaryProps {
    product: Product;
    brandName: string;
}
declare function OrderSummary({ product, brandName }: OrderSummaryProps): react.JSX.Element;

interface PaymentResultProps {
    title: string;
    message: string;
    href: string;
    actionLabel: string;
}
declare function PaymentResult({ title, message, href, actionLabel }: PaymentResultProps): react.JSX.Element;
declare function PaymentSuccess({ href }: {
    href?: string;
}): react.JSX.Element;
declare function PaymentCancel({ href }: {
    href?: string;
}): react.JSX.Element;

export { BuyButton, type BuyButtonProps, CardFields, Confirmation, CustomCheckout, OrderSummary, PaymentCancel, PaymentProvider, PaymentResult, PaymentSuccess, usePayment, usePaymentConfig };
