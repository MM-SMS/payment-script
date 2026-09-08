"use client";

interface ConfirmationProps {
  confirmationId: string;
  email: string;
  onBack: () => void;
}

export function Confirmation({ confirmationId, email, onBack }: ConfirmationProps) {
  return (
    <section className="op-confirm" aria-live="polite">
      <p className="op-kicker">Order received</p>
      <h1>Thank you.</h1>
      <p>
        We’ve received your order request. Our support team will review the details and contact you
        at <strong>{email}</strong> regarding the next steps.
      </p>
      <p className="op-confirm-id">Reference {confirmationId}</p>
      <button type="button" className="op-secondary" onClick={onBack}>
        Back
      </button>
    </section>
  );
}
