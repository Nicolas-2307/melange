import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { formatDeliveryDate } from "@/features/checkout/availability";
import { getPickupAddress } from "@/features/checkout/store";
import { getOrderByToken, toPaymentOrder } from "@/features/orders/queries";
import { formatCOP } from "@/lib/format";
import { getPaymentProvider } from "@/services/payments";

// Contains personal data: never index or cache in shared caches.
export const metadata: Metadata = { title: "Tu pedido · Melange", robots: { index: false } };

export default function OrderPage({ params }: PageProps<"/pedidos/[token]">) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-12">
      <Suspense fallback={<p className="text-zinc-500">Cargando…</p>}>
        <OrderContent params={params} />
      </Suspense>
    </main>
  );
}

const STATUS_LABEL = {
  PENDING: "Pendiente de confirmación",
  CONFIRMED: "Confirmado",
  PREPARING: "En preparación",
  READY: "Listo",
  COMPLETED: "Entregado",
  CANCELLED: "Cancelado",
} as const;

async function OrderContent({ params }: Pick<PageProps<"/pedidos/[token]">, "params">) {
  const order = await getOrderByToken((await params).token);
  if (!order) notFound();

  const pickupAddress = await getPickupAddress();
  const paymentPending = order.status === "PENDING" && order.payments[0]?.status === "PENDING";
  const action = paymentPending
    ? await getPaymentProvider().createPaymentAction(toPaymentOrder(order, pickupAddress))
    : null;
  const date = formatDeliveryDate(order.deliveryDate.toISOString().slice(0, 10));

  return (
    <>
      <div className="flex flex-col gap-2">
        <p className="text-sm text-zinc-500">{STATUS_LABEL[order.status]}</p>
        <h1 className="text-3xl font-semibold tracking-tight">Pedido #{order.number}</h1>
        <p className="text-zinc-600 dark:text-zinc-400">Gracias, {order.customerName}.</p>
      </div>

      {action && (
        <section className="flex flex-col items-start gap-3 rounded-xl border border-green-600/30 bg-green-50 p-5 dark:bg-green-950/30">
          <p>{action.description}</p>
          <a
            href={action.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-12 items-center rounded-lg bg-green-700 px-6 text-sm font-medium text-white hover:bg-green-800"
          >
            {action.label}
          </a>
        </section>
      )}

      <section aria-labelledby="items-title" className="flex flex-col gap-3">
        <h2 id="items-title" className="text-lg font-semibold">
          Productos
        </h2>
        <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {order.items.map((item) => (
            <li
              key={`${item.productName}-${item.variantName}`}
              className="flex justify-between gap-4 py-3"
            >
              <span>
                {item.quantity} × {item.productName}{" "}
                <span className="text-zinc-500">({item.variantName})</span>
              </span>
              <span>{formatCOP(item.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <dl className="flex flex-col gap-1 border-t border-zinc-200 pt-3 text-sm dark:border-zinc-800">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd>{formatCOP(order.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Domicilio</dt>
            <dd>{order.fulfillmentType === "PICKUP" ? "Gratis" : formatCOP(order.shippingCost)}</dd>
          </div>
          <div className="flex justify-between text-base font-semibold">
            <dt>Total</dt>
            <dd data-testid="order-total">{formatCOP(order.total)}</dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="delivery-title" className="flex flex-col gap-1">
        <h2 id="delivery-title" className="text-lg font-semibold">
          {order.fulfillmentType === "DELIVERY" ? "Entrega" : "Recogida"}
        </h2>
        <p className="first-letter:uppercase">{date}</p>
        <p className="text-zinc-600 dark:text-zinc-400">
          {order.fulfillmentType === "DELIVERY"
            ? `${order.deliveryAddress} · ${order.deliveryZoneName}`
            : pickupAddress}
        </p>
        {order.notes && <p className="text-zinc-600 dark:text-zinc-400">Notas: {order.notes}</p>}
      </section>

      <p className="text-sm text-zinc-500">
        Guarda este enlace para consultar tu pedido. También te lo enviamos a {order.customerEmail}.
      </p>
    </>
  );
}
