import { S as ServerPaymentConfig } from '../types-BV3ipef2.js';

declare function createBinLookupRouteHandlers(): {
    GET(request: Request): Promise<Response>;
};

type ConfigFactory$2 = () => ServerPaymentConfig;
declare function createCheckoutRouteHandlers(getConfig: ConfigFactory$2): {
    POST(request: Request): Promise<Response>;
};

type ConfigFactory$1 = () => ServerPaymentConfig;
declare function createCustomPaymentRouteHandlers(getConfig: ConfigFactory$1): {
    POST(request: Request): Promise<Response>;
};

type ConfigFactory = () => ServerPaymentConfig;
declare function createStripeIntentRouteHandlers(getConfig: ConfigFactory): {
    POST(request: Request): Promise<Response>;
};

export { createBinLookupRouteHandlers, createCheckoutRouteHandlers, createCustomPaymentRouteHandlers, createStripeIntentRouteHandlers };
