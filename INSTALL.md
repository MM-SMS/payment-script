# Установка на другой сайт

Репозиторий: [github.com/MM-SMS/payment-script](https://github.com/MM-SMS/payment-script)

Пакет живёт в `packages/orione-pay`. На бренд-сайт ставится из GitHub, checkout с нуля не пишется.

## Промпт — вставить в Cursor на другом Next.js сайте

```
Подключи payment module из git@github.com:MM-SMS/payment-script.git
на этот Next.js App Router сайт. Нужен только фронт + тонкие API routes этого же проекта.
Отдельный бекенд не поднимай.

Сделай так:

1. Установи пакет из подпапки репо:
   npm install git+ssh://git@github.com:MM-SMS/payment-script.git#path:packages/orione-pay
   Если path-синтаксис не сработает — клонируй репо рядом и ставь
   npm install ../payment-script/packages/orione-pay
   Либо в package.json:
   "orione-pay": "git+ssh://git@github.com:MM-SMS/payment-script.git#path:packages/orione-pay"

2. В next.config добавь transpilePackages: ["orione-pay"] если Next ругается на ESM.

3. Создай lib/payment.ts через definePaymentConfig + toPublicPaymentConfig.
   brandId / brandName / products / theme — этого бренда, не копируй VELA.
   amount в центах. currency вроде usd.
   urls: success /purchase/success, cancel /purchase/cancel, checkout /payment.

4. Env этого бренда (Vercel + .env.local). Не коммить секреты.
   PAYMENT_FLOW=custom
   Для Stripe:
   PAYMENT_FLOW=stripe
   STRIPE_SECRET_KEY=
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
   STRIPE_ACCOUNT_ID=
   STRIPE_PRICE_ID=
   BINCODES_API_KEY=   # опционально, иначе binlist.net

5. В app/layout.tsx:
   import "orione-pay/styles.css"
   оберни body в PaymentProvider config={publicPaymentConfig}

6. На каждой товарной странице цена + CTA:
   import { BuyButton } from "orione-pay/react"
   <BuyButton productId="ID_ИЗ_КОНФИГА">Buy / Purchase</BuyButton>
   Страницы публичные, без auth / login.

7. Добавь routes:
   app/api/orione-pay/checkout/route.ts
     export const { POST } = createCheckoutRouteHandlers(() => serverPaymentConfig)
   app/api/orione-pay/custom/route.ts
     export const { POST } = createCustomPaymentRouteHandlers(() => serverPaymentConfig)
   app/api/orione-pay/bin/route.ts
     export const { GET } = createBinLookupRouteHandlers()
   app/api/orione-pay/intent/route.ts
     export const { POST } = createStripeIntentRouteHandlers(() => serverPaymentConfig)

8. app/payment/page.tsx — <CheckoutPage />
   app/purchase/success/page.tsx — <PaymentSuccess href="/" />
   app/purchase/cancel/page.tsx — <PaymentCancel href="/" />
   /payment не закрывать middleware авторизацией.

9. Не дублируй checkout UI. Не хардкодь Stripe account другого бренда.
   Переключение Stripe ↔ custom только через PAYMENT_FLOW.
   Stripe: Buy открывает /payment на текущем домене, слева hostname, справа Payment Element.
   Custom — эмуляция: карта валидируется на фронте, полный PAN на сервер не уходит,
   после Pay показывается Order received, Back возвращает на product page.

10. Проверь без логина: товар → Buy → custom form или Stripe, success/back.
    Если PAYMENT_FLOW=custom — тестовая карта 4242424242424242 / 12/29 / 123.
```

## Команды

```bash
npm install git+ssh://git@github.com:MM-SMS/payment-script.git#path:packages/orione-pay
```

Если GitHub по HTTPS:

```bash
npm install git+https://github.com/MM-SMS/payment-script.git#path:packages/orione-pay
```

Запасной вариант — локальный path после clone:

```bash
git clone git@github.com:MM-SMS/payment-script.git
cd your-brand-site
npm install ../payment-script/packages/orione-pay
```

## Файлы на бренде

Минимум:

```
lib/payment.ts
app/layout.tsx                         # PaymentProvider + styles
app/payment/page.tsx
app/purchase/success/page.tsx
app/purchase/cancel/page.tsx
app/api/orione-pay/checkout/route.ts
app/api/orione-pay/custom/route.ts
app/api/orione-pay/bin/route.ts
app/api/orione-pay/intent/route.ts
```

На товар: цена и `<BuyButton productId="..." />`.

Готовый пример: `apps/demo` в этом репо и `packages/orione-pay/README.md`.
