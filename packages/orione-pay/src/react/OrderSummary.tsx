"use client";

import { formatMoney } from "../format";
import type { Product } from "../types";

interface OrderSummaryProps {
  product: Product;
  brandName: string;
}

export function OrderSummary({ product, brandName }: OrderSummaryProps) {
  return (
    <section className="op-summary" aria-labelledby="op-summary-title">
      <p className="op-kicker">{brandName}</p>
      <div className="op-summary-row">
        {product.imageUrl ? (
          <img className="op-summary-image" src={product.imageUrl} alt={product.name} />
        ) : (
          <div className="op-summary-image op-summary-fallback" aria-hidden="true" />
        )}
        <div>
          <h1 id="op-summary-title" className="op-summary-title">
            {product.name}
          </h1>
          <p className="op-summary-copy">{product.description}</p>
        </div>
      </div>
      <div className="op-amount">
        <span>Total</span>
        <strong>{formatMoney(product.amount, product.currency)}</strong>
      </div>
    </section>
  );
}
