import { S as ServerPaymentConfig } from '../types-D3q3Z2Lx.js';

declare function createBinLookupRouteHandlers(): {
    GET(request: Request): Promise<Response>;
};

type ConfigFactory$1 = () => ServerPaymentConfig;
declare function createCheckoutRouteHandlers(getConfig: ConfigFactory$1): {
    POST(request: Request): Promise<Response>;
};

type ConfigFactory = () => ServerPaymentConfig;
declare function createCustomPaymentRouteHandlers(getConfig: ConfigFactory): {
    POST(request: Request): Promise<Response>;
};

export { createBinLookupRouteHandlers, createCheckoutRouteHandlers, createCustomPaymentRouteHandlers };
