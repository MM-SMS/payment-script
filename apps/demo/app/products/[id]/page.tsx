import { formatMoney } from "orione-pay";
import { BuyButton } from "orione-pay/react";
import { notFound } from "next/navigation";
import { publicPaymentConfig } from "../../../lib/payment";

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export function generateStaticParams() {
  return publicPaymentConfig.products.map((product) => ({ id: product.id }));
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const product = publicPaymentConfig.products.find((item) => item.id === id);
  if (!product) notFound();

  return (
    <main className="pdp">
      <div className="pdp-visual" />
      <section>
        <p className="flow-chip">Buy routes through {publicPaymentConfig.flow}</p>
        <h1>{product.name}</h1>
        <p className="pdp-copy">{product.description}</p>
        <p className="price">{formatMoney(product.amount, product.currency)}</p>
        <BuyButton productId={product.id}>Buy / Purchase</BuyButton>
      </section>
    </main>
  );
}
