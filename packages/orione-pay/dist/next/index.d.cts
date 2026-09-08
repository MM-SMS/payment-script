import { S as ServerPaymentConfig } from '../types-B_cE4ZYQ.cjs';

type ConfigFactory$1 = () => ServerPaymentConfig;
declare function createCheckoutRouteHandlers(getConfig: ConfigFactory$1): {
    POST(request: Request): Promise<Response>;
};

type ConfigFactory = () => ServerPaymentConfig;
declare function createCustomPaymentRouteHandlers(getConfig: ConfigFactory): {
    POST(request: Request): Promise<Response>;
};

export { createCheckoutRouteHandlers, createCustomPaymentRouteHandlers };
