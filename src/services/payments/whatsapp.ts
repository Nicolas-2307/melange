import { formatCOP } from "@/lib/format";

import type { PaymentAction, PaymentOrder, PaymentProvider } from "./types";

/** Message the customer sends to the store; the owner confirms and agrees how to pay. */
export function buildWhatsAppMessage(order: PaymentOrder): string {
  const lines = [
    `Hola, Melange. Quiero confirmar mi pedido #${order.number}:`,
    "",
    ...order.items.map(
      (item) =>
        `• ${item.quantity} × ${item.productName} (${item.variantName}): ${formatCOP(item.lineTotal)}`,
    ),
    "",
    `Subtotal: ${formatCOP(order.subtotal)}`,
    order.fulfillment.type === "DELIVERY"
      ? `Domicilio (${order.fulfillment.zone}): ${formatCOP(order.shippingCost)}`
      : "Recojo en la sede",
    `Total: ${formatCOP(order.total)}`,
    "",
    order.fulfillment.type === "DELIVERY"
      ? `Entrega: ${order.deliveryDate} en ${order.fulfillment.address}`
      : `Recogida: ${order.deliveryDate} en ${order.fulfillment.address}`,
    `A nombre de: ${order.customer.name} · ${order.customer.phone}`,
  ];
  if (order.notes) lines.push(`Notas: ${order.notes}`);
  lines.push("", `Detalle: ${order.orderUrl}`);
  // wa.me renders "$ 12.000" fine; normalize the non-breaking space Intl inserts.
  return lines.join("\n").replace(/ /g, " ");
}

export class WhatsAppPaymentProvider implements PaymentProvider {
  readonly id = "WHATSAPP" as const;

  constructor(private readonly storeNumber: string) {}

  async createPaymentAction(order: PaymentOrder): Promise<PaymentAction> {
    const text = encodeURIComponent(buildWhatsAppMessage(order));
    return {
      url: `https://wa.me/${this.storeNumber}?text=${text}`,
      label: "Enviar pedido por WhatsApp",
      description:
        "Último paso: envía el pedido por WhatsApp. Te confirmaremos la disponibilidad y la forma de pago.",
    };
  }
}
