import { PaymentSuccess } from "orione-pay/react";

export default function SuccessPage() {
  return (
    <div className="op-shell">
      <PaymentSuccess href="/" />
    </div>
  );
}
