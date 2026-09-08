import { createConfirmationId } from "../format";
import { requireProduct } from "../config";
import { validateAddress, validateCountry, validateEmail, validatePostalCode } from "../validation/checkout";
import type {
  CustomPaymentRequest,
  CustomPaymentResponse,
  PaymentErrorBody,
  ServerPaymentConfig,
} from "../types";

type ConfigFactory = () => ServerPaymentConfig;

function json(body: CustomPaymentResponse | PaymentErrorBody, status = 200) {
  return Response.json(body, { status });
}

export function createCustomPaymentRouteHandlers(getConfig: ConfigFactory) {
  return {
    async POST(request: Request) {
      try {
        const config = getConfig();
        const body = (await request.json()) as CustomPaymentRequest;

        requireProduct(config.products, body.productId);

        const emailError = validateEmail(body.email);
        const countryError = validateCountry(body.billing?.country);
        const addressError = validateAddress(body.billing?.address ?? "");
        const postalError = validatePostalCode(body.billing?.postalCode ?? "");

        if (emailError || countryError || addressError || postalError) {
          return json(
            {
              error: emailError ?? countryError ?? addressError ?? postalError ?? "Invalid checkout data",
            },
            400,
          );
        }

        if (!body.card?.last4 || body.card.last4.length !== 4) {
          return json({ error: "Card summary is incomplete" }, 400);
        }

        await new Promise((resolve) => setTimeout(resolve, 700));

        return json({
          ok: true,
          confirmationId: createConfirmationId(config.brandId),
          message:
            "Thank you. We’ve received your order request. Our support team will review the details and contact you at the email provided regarding the next steps.",
        });
      } catch (caught) {
        return json(
          {
            error: caught instanceof Error ? caught.message : "Unable to process custom payment",
          },
          400,
        );
      }
    },
  };
}
