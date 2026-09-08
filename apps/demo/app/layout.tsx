import type { Metadata } from "next";
import { PaymentProvider } from "orione-pay/react";
import "orione-pay/styles.css";
import { publicPaymentConfig } from "../lib/payment";
import "./globals.css";

export const metadata: Metadata = {
  title: "VELA — Public purchase demo",
  description: "Unauthenticated brand purchase flow powered by orione-pay.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <PaymentProvider config={publicPaymentConfig}>
          <header className="site-header">
            <a className="brand-mark" href="/">
              VELA
            </a>
            <span className="nav-note">Public checkout · no login</span>
          </header>
          {children}
          <footer className="site-footer">
            <span>VELA Atelier</span>
            <span>orione-pay demo</span>
          </footer>
        </PaymentProvider>
      </body>
    </html>
  );
}
