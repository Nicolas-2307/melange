import { formatDeliveryDate } from "@/features/checkout/availability";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import type { PaymentOrder } from "@/services/payments";

const orderSelect = {
  id: true,
  number: true,
  status: true,
  publicToken: true,
  customerName: true,
  customerEmail: true,
  customerPhone: true,
  fulfillmentType: true,
  deliveryZoneName: true,
  deliveryAddress: true,
  deliveryDate: true,
  notes: true,
  subtotal: true,
  shippingCost: true,
  total: true,
  createdAt: true,
  items: {
    orderBy: { productName: "asc" },
    select: {
      productName: true,
      variantName: true,
      unitPrice: true,
      quantity: true,
      lineTotal: true,
    },
  },
  payments: {
    orderBy: { createdAt: "desc" },
    take: 1,
    select: { reference: true, provider: true, status: true },
  },
} as const;

/** Order by its public token (the secret in /pedidos/<token>). */
export async function getOrderByToken(token: string) {
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) return null;
  return db.order.findUnique({ where: { publicToken: token }, select: orderSelect });
}

export type OrderDetail = NonNullable<Awaited<ReturnType<typeof getOrderByToken>>>;

export function orderUrl(token: string) {
  return new URL(`/pedidos/${token}`, env.NEXT_PUBLIC_SITE_URL).toString();
}

/** Shapes an order for the payment provider. */
export function toPaymentOrder(order: OrderDetail, pickupAddress: string): PaymentOrder {
  const payment = order.payments[0];
  return {
    number: order.number,
    reference: payment?.reference ?? `MEL-${order.number}`,
    total: order.total,
    subtotal: order.subtotal,
    shippingCost: order.shippingCost,
    customer: { name: order.customerName, email: order.customerEmail, phone: order.customerPhone },
    items: order.items,
    fulfillment:
      order.fulfillmentType === "DELIVERY"
        ? {
            type: "DELIVERY",
            zone: order.deliveryZoneName ?? "",
            address: order.deliveryAddress ?? "",
          }
        : { type: "PICKUP", address: pickupAddress },
    deliveryDate: formatDeliveryDate(order.deliveryDate.toISOString().slice(0, 10)),
    notes: order.notes,
    orderUrl: orderUrl(order.publicToken),
  };
}
