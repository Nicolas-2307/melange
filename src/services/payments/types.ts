/** Everything a payment provider needs to know about an order. Amounts in COP (integers). */
export type PaymentOrder = {
  number: number;
  /** Unique per payment attempt (Wompi requires a new one for each try). */
  reference: string;
  total: number;
  subtotal: number;
  shippingCost: number;
  customer: { name: string; email: string; phone: string };
  items: { productName: string; variantName: string; quantity: number; lineTotal: number }[];
  fulfillment:
    { type: "DELIVERY"; zone: string; address: string } | { type: "PICKUP"; address: string };
  /** Human-readable date, e.g. "sábado, 25 de octubre". */
  deliveryDate: string;
  notes?: string | null;
  /** Absolute URL of the order page, for providers that redirect back. */
  orderUrl: string;
};

/** What the customer must do next to complete the order. */
export type PaymentAction = {
  url: string;
  /** Button text, e.g. "Enviar pedido por WhatsApp". */
  label: string;
  /** Short explanation shown above the button. */
  description: string;
};

/** Provider-agnostic payment step. One implementation per provider, chosen by PAYMENT_PROVIDER. */
export interface PaymentProvider {
  readonly id: "WHATSAPP" | "WOMPI";
  createPaymentAction(order: PaymentOrder): Promise<PaymentAction>;
}
