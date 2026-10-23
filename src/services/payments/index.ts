import { env } from "@/lib/env";

import type { PaymentProvider } from "./types";
import { WhatsAppPaymentProvider } from "./whatsapp";

export type { PaymentAction, PaymentOrder, PaymentProvider } from "./types";

let provider: PaymentProvider | undefined;

/** Returns the payment provider selected by PAYMENT_PROVIDER. */
export function getPaymentProvider(): PaymentProvider {
  if (!provider) {
    switch (env.PAYMENT_PROVIDER) {
      case "whatsapp":
        provider = new WhatsAppPaymentProvider(env.NEXT_PUBLIC_WHATSAPP_NUMBER);
        break;
      // Paso 4.4 adds: case "wompi": provider = new WompiPaymentProvider(...)
    }
  }
  return provider;
}
