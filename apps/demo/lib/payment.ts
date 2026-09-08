import { definePaymentConfig, toPublicPaymentConfig } from "orione-pay";

export const serverPaymentConfig = definePaymentConfig({
  brandId: "vela",
  brandName: "VELA",
  products: [
    {
      id: "no-01",
      name: "VELA No. 01",
      description: "A dry cedar and bitter orange eau de parfum. 50ml.",
      amount: 14800,
      currency: "usd",
      stripePriceId: process.env.STRIPE_PRICE_ID,
    },
    {
      id: "discovery",
      name: "Discovery Set",
      description: "Five 2ml chapters from the VELA archive.",
      amount: 4200,
      currency: "usd",
    },
  ],
  urls: {
    success: "/purchase/success",
    cancel: "/purchase/cancel",
    checkout: "/payment",
  },
  theme: {
    primary: "#2a2118",
    primaryForeground: "#f6efe4",
    background: "#f4efe6",
    surface: "#fffaf2",
    text: "#1c1712",
    mutedText: "#7a7166",
    border: "#e4dacb",
    danger: "#9b2c2c",
    radius: "14px",
    fontFamily: '"Iowan Old Style", "Palatino Linotype", Palatino, serif',
  },
});

export const publicPaymentConfig = toPublicPaymentConfig(serverPaymentConfig);
