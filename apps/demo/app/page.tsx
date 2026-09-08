import { formatMoney } from "orione-pay";
import { publicPaymentConfig } from "../lib/payment";

export default function HomePage() {
  return (
    <main>
      <section className="hero">
        <p className="flow-chip">Active flow · {publicPaymentConfig.flow}</p>
        <h1>Fragrance, written in cedar.</h1>
        <p>
          A public storefront. Buy without an account. The same CTA routes to Stripe or the branded
          backup checkout, depending on this brand’s payment flag.
        </p>
      </section>
      <section className="catalog">
        {publicPaymentConfig.products.map((product) => (
          <a className="product-card" key={product.id} href={`/products/${product.id}`}>
            <p className="meta">{formatMoney(product.amount, product.currency)}</p>
            <h2>{product.name}</h2>
            <p>{product.description}</p>
          </a>
        ))}
      </section>
    </main>
  );
}
