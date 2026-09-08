# VELA demo

Публичный бренд-сайт без авторизации. Показывает, как подключается `orione-pay`.

```bash
# из корня репозитория
npm install
npm run build
npm run dev
```

- Витрина: http://localhost:3000
- Товар: http://localhost:3000/products/no-01
- Custom checkout: `PAYMENT_FLOW=custom` в `.env.local`

Для Stripe положите ключи в `.env.local` и смените флаг:

```bash
PAYMENT_FLOW=stripe
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_ACCOUNT_ID=acct_...
```

Тестовая карта custom form: `4242424242424242`, `12/29`, `123`.
