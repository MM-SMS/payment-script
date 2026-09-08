# orione-pay

NPM-пакет для Next.js: публичный purchase flow без логина, единый слой `Brand → Product → Buy CTA → Payment Router`, переключение **Stripe Checkout** / **custom checkout** через feature flag.

## Что даёт пакет

- `BuyButton` на любой товарной странице
- серверный роутер, который решает, куда вести CTA
- Stripe Checkout на connected / brand account
- брендированный custom checkout с валидацией карты и эмуляцией оплаты
- тема бренда через CSS-переменные
- секреты только из env (Vercel)

## Установка

С другого Next.js сайта:

```bash
npm install git+ssh://git@github.com:MM-SMS/payment-script.git#path:packages/orione-pay
```

Промпт целиком: [INSTALL.md](../../INSTALL.md) в корне репо `MM-SMS/payment-script`.

## Vercel / env

Каждый бренд — отдельный Next.js проект со своими переменными.

```bash
# Feature flag
PAYMENT_FLOW=stripe
# или
PAYMENT_FLOW=custom

# Stripe (только для PAYMENT_FLOW=stripe)
STRIPE_SECRET_KEY=sk_live_or_test
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_or_test
STRIPE_ACCOUNT_ID=acct_xxx

# Опционально, если используете готовый Price в Stripe
STRIPE_PRICE_ID=price_xxx
```

`STRIPE_ACCOUNT_ID` — Stripe connected / sub-account этого бренда. Пакет всегда создаёт Checkout Session только с ключами и account id **текущего** бренда. Случайно отправить оплату в чужой Stripe account нельзя: другой бренд живёт в другом деплое и другом env.

## Подключение к сайту

### 1. Конфиг бренда

```ts
// lib/payment.ts
import { definePaymentConfig, toPublicPaymentConfig } from "orione-pay";

export const serverPaymentConfig = definePaymentConfig({
  brandId: "vela",
  brandName: "VELA",
  products: [
    {
      id: "no-01",
      name: "VELA No. 01",
      description: "Eau de parfum, 50ml",
      amount: 14800,
      currency: "usd",
      stripePriceId: process.env.STRIPE_PRICE_ID,
    },
  ],
  urls: {
    success: "/purchase/success",
    cancel: "/purchase/cancel",
    checkout: "/payment",
  },
  theme: {
    primary: "#1b1714",
    primaryForeground: "#f6efe4",
    background: "#f3eee6",
    surface: "#fffaf3",
    text: "#1b1714",
    mutedText: "#7a7168",
    border: "#e6ddd0",
    radius: "14px",
    fontFamily: "Georgia, serif",
  },
});

export const publicPaymentConfig = toPublicPaymentConfig(serverPaymentConfig);
```

`PAYMENT_FLOW` читается автоматически. Меняете флаг в Vercel — все `BuyButton` переключаются без правок product pages.

### 2. Provider

```tsx
// app/layout.tsx
import "orione-pay/styles.css";
import { PaymentProvider } from "orione-pay/react";
import { publicPaymentConfig } from "../lib/payment";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <PaymentProvider config={publicPaymentConfig}>{children}</PaymentProvider>
      </body>
    </html>
  );
}
```

### 3. Кнопка на товаре

```tsx
import { BuyButton } from "orione-pay/react";

<BuyButton productId="no-01">Buy / Purchase</BuyButton>
```

CTA всегда один. Router сам отправит пользователя в Stripe или на `/payment`.

### 4. API routes

```ts
// app/api/orione-pay/checkout/route.ts
import { createCheckoutRouteHandlers } from "orione-pay/next";
import { serverPaymentConfig } from "../../../../lib/payment";

export const { POST } = createCheckoutRouteHandlers(() => serverPaymentConfig);
```

```ts
// app/api/orione-pay/custom/route.ts
import { createCustomPaymentRouteHandlers } from "orione-pay/next";
import { serverPaymentConfig } from "../../../../lib/payment";

export const { POST } = createCustomPaymentRouteHandlers(() => serverPaymentConfig);
```

### 5. Custom checkout page

```tsx
// app/payment/page.tsx
import { CustomCheckout } from "orione-pay/react";

export default function PaymentPage() {
  return <CustomCheckout />;
}
```

Страница должна быть публичной, без auth middleware.

## Как работает переключение

```
Product page → BuyButton → POST /api/orione-pay/checkout
                              ├─ PAYMENT_FLOW=stripe → Stripe Checkout Session
                              └─ PAYMENT_FLOW=custom → /payment?product=…&returnUrl=…
```

Для Stripe:

`Product → Buy → Stripe Checkout → success/cancel → brand`

Для custom:

`Product → Buy → /payment → validation → processing → Order received → Back`

`Back` возвращает на `returnUrl` — ту product page, с которой начали checkout.

## Custom checkout

Форма:

- Contact: email
- Payment: card number, expiry, CVV (3 цифры), cardholder name
- Billing: country, address, postal/ZIP

Карта:

- определение Visa / Mastercard / Amex / и др.
- Luhn-проверка номера
- проверка срока
- inline-ошибки

Полный номер карты **не уходит на сервер**. На API уходит только `brand + last4 + expiry` и billing. Это эмуляция оплаты / заявка на заказ, не PCI-списание.

После `Pay / Purchase`:

1. валидация
2. processing state
3. confirmation: *Thank you. We’ve received your order request…*
4. `Back` на исходный product URL

## Stripe

Пакет создаёт Checkout Session через secret key бренда. Если задан `STRIPE_ACCOUNT_ID`, запрос идёт в connected account.

Ошибки неактивированного аккаунта, refund и ограничения верификации отдаются текстом Stripe as-is — UI показывает фактический ответ провайдера.

Можно либо передать `stripePriceId`, либо оставить `amount + currency` — тогда session собирается через `price_data`.

## Новый бренд

1. Поставить `orione-pay`
2. Заполнить env в Vercel
3. Описать products / theme в `definePaymentConfig`
4. Повесить `BuyButton` на товар
5. Добавить два API route и `/payment`

Отдельную checkout-логику писать не нужно.

## Публичный API

```ts
import {
  definePaymentConfig,
  toPublicPaymentConfig,
  resolvePaymentFlow,
} from "orione-pay";

import { PaymentProvider, BuyButton, CustomCheckout } from "orione-pay/react";
import {
  createCheckoutRouteHandlers,
  createCustomPaymentRouteHandlers,
} from "orione-pay/next";
import "orione-pay/styles.css";
```
