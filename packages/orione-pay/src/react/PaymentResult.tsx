"use client";

interface PaymentResultProps {
  title: string;
  message: string;
  href: string;
  actionLabel: string;
}

export function PaymentResult({ title, message, href, actionLabel }: PaymentResultProps) {
  return (
    <section className="op-result">
      <h1>{title}</h1>
      <p>{message}</p>
      <a className="op-buy-button" href={href}>
        {actionLabel}
      </a>
    </section>
  );
}

export function PaymentSuccess({ href = "/" }: { href?: string }) {
  return (
    <PaymentResult
      title="Payment successful"
      message="Stripe confirmed this payment. You can return to the brand storefront."
      href={href}
      actionLabel="Back to store"
    />
  );
}

export function PaymentCancel({ href = "/" }: { href?: string }) {
  return (
    <PaymentResult
      title="Payment canceled"
      message="No charge was made. You can return to the product page and try again."
      href={href}
      actionLabel="Back to product"
    />
  );
}
