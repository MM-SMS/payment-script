import { createCheckoutRouteHandlers } from "orione-pay/next";
import { serverPaymentConfig } from "../../../../lib/payment";

export const { POST } = createCheckoutRouteHandlers(() => serverPaymentConfig);
