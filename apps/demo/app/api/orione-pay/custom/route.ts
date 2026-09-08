import { createCustomPaymentRouteHandlers } from "orione-pay/next";
import { serverPaymentConfig } from "../../../../lib/payment";

export const { POST } = createCustomPaymentRouteHandlers(() => serverPaymentConfig);
