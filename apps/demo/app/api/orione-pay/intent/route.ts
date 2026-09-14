import { createStripeIntentRouteHandlers } from "orione-pay/next";
import { serverPaymentConfig } from "../../../../lib/payment";

export const { POST } = createStripeIntentRouteHandlers(() => serverPaymentConfig);
