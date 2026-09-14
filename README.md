# payment-script

GitHub: [MM-SMS/payment-script](https://github.com/MM-SMS/payment-script)

Единый frontend payment layer для бренд-сайтов на Next.js. Подключается как пакет из этого репо: на товары вешается `BuyButton`, а Stripe или кастомный checkout выбирается feature flag в Vercel.

**Промпт и шаги для другого сайта:** [INSTALL.md](INSTALL.md)

```
Brand → Product → Buy CTA → Payment Router → /payment Stripe Elements
                                           → /payment Custom form
```

## Что внутри

| Пакет | Назначение |
| --- | --- |
| `packages/orione-pay` | Публикуемый NPM-модуль |
| `apps/demo` | Публичный бренд VELA без авторизации |

Пакет закрывает Phase 1:

- публичная покупка без login
- отдельный Stripe account на бренд (`STRIPE_ACCOUNT_ID`)
- CTA `Buy / Purchase` на product page
- централизованный конфиг: provider, account, product/price, success/cancel, flag
- backup custom checkout в дизайне бренда
- переключение `PAYMENT_FLOW=stripe|custom` без правок товарных страниц

## Быстрый старт демо

```bash
npm install
npm test
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000). Демо сразу в `PAYMENT_FLOW=custom`, Stripe-ключи не нужны.

Тестовая карта для custom form: `4242 4242 4242 4242`, срок `12/29`, CVV `123`.

## Подключить к бренду

```bash
npm install git+ssh://git@github.com:MM-SMS/payment-script.git#path:packages/orione-pay
```

1. Скопировать env из `apps/demo/.env.example` в Vercel проекта бренда.
2. Описать бренд через `definePaymentConfig` — products, theme, URLs.
3. Обернуть layout в `PaymentProvider`.
4. Поставить `BuyButton` на товар.
5. Добавить API routes и страницу `/payment`.

Полный пример: [`packages/orione-pay/README.md`](packages/orione-pay/README.md) и `apps/demo`.

Новый бренд = новый Next.js деплой + свои Vercel env. Логика checkout не копируется.

## Env (Vercel)

```bash
PAYMENT_FLOW=stripe          # или custom / backup
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_ACCOUNT_ID=           # connected account только этого бренда
STRIPE_PRICE_ID=             # опционально
BINCODES_API_KEY=            # опционально, платная BIN-база
```

Секреты не попадают в клиентский бандл. Custom flow не отправляет полный номер карты на сервер — только last4, billing и BIN (6–8 цифр) для названия банка.

## Переключение провайдера

В Vercel бренда:

```
PAYMENT_FLOW=stripe
→
PAYMENT_FLOW=custom
```

Все существующие `Buy / Purchase` автоматически идут в выбранный flow.

## Публикация пакета

```bash
npm run build
cd packages/orione-pay
npm publish --access public
```

Если имя `orione-pay` занято, смените `name` в `packages/orione-pay/package.json` на scoped, например `@orione/pay`.
