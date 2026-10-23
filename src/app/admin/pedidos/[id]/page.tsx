import Link from "next/link";
import { notFound } from "next/navigation";

import { requireAdmin } from "@/features/auth/session";
import { formatDeliveryDate } from "@/features/checkout/availability";
import { getPickupAddress } from "@/features/checkout/store";
import { getAdminOrder } from "@/features/orders/admin";
import { OrderActions } from "@/features/orders/components/order-actions";
import { StatusBadge } from "@/features/orders/components/status-badge";
import { nextStatuses } from "@/features/orders/status";
import { formatCOP, formatDateTime } from "@/lib/format";

const PAYMENT_LABEL = {
  PENDING: "Pendiente",
  APPROVED: "Recibido",
  DECLINED: "Rechazado",
  VOIDED: "Anulado",
  ERROR: "Error",
} as const;

const PROVIDER_LABEL = { WHATSAPP: "Acordado por WhatsApp", WOMPI: "Wompi" } as const;

export default async function AdminOrderPage({ params }: PageProps<"/admin/pedidos/[id]">) {
  await requireAdmin();
  const order = await getAdminOrder((await params).id);
  if (!order) notFound();

  const pickupAddress = order.fulfillmentType === "PICKUP" ? await getPickupAddress() : null;
  const payment = order.payments[0];
  const day = order.deliveryDate.toISOString().slice(0, 10);
  const whatsapp = `https://wa.me/57${order.customerPhone}`;

  const section = "flex flex-col gap-2 rounded-xl border border-zinc-200 p-5 dark:border-zinc-800";

  return (
    <>
      <div className="flex flex-col gap-2">
        <Link href="/admin/pedidos" className="text-sm text-zinc-500 hover:underline">
          ← Pedidos
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">Pedido #{order.number}</h1>
          <StatusBadge status={order.status} />
        </div>
        <p className="text-sm text-zinc-500">Recibido el {formatDateTime(order.createdAt)}</p>
      </div>

      <OrderActions
        orderId={order.id}
        next={nextStatuses(order.status)}
        canMarkPaid={
          payment?.provider === "WHATSAPP" &&
          payment.status === "PENDING" &&
          order.status !== "CANCELLED"
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        <section className={section} aria-labelledby="delivery">
          <h2 id="delivery" className="font-semibold">
            {order.fulfillmentType === "DELIVERY" ? "Domicilio" : "Recoge en la sede"}
          </h2>
          <p className="first-letter:uppercase">
            <Link
              href={`/admin/calendario?mes=${day.slice(0, 7)}&dia=${day}`}
              className="underline"
            >
              {formatDeliveryDate(day)}
            </Link>
          </p>
          <p className="text-zinc-600 dark:text-zinc-400">
            {order.fulfillmentType === "DELIVERY"
              ? `${order.deliveryAddress} · ${order.deliveryZoneName}`
              : pickupAddress}
          </p>
          {order.notes && (
            <p className="rounded-lg bg-amber-50 p-3 text-sm dark:bg-amber-950/30">
              <strong>Notas:</strong> {order.notes}
            </p>
          )}
        </section>

        <section className={section} aria-labelledby="customer">
          <h2 id="customer" className="font-semibold">
            Cliente
          </h2>
          <p>{order.customerName}</p>
          <p>
            <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="underline">
              WhatsApp {order.customerPhone}
            </a>
            {" · "}
            <a href={`tel:+57${order.customerPhone}`} className="underline">
              Llamar
            </a>
          </p>
          <p>
            <a href={`mailto:${order.customerEmail}`} className="underline">
              {order.customerEmail}
            </a>
          </p>
          <p className="text-sm text-zinc-500">
            {order.user ? "Cliente con cuenta" : "Compra como invitado"}
          </p>
        </section>
      </div>

      <section className={section} aria-labelledby="items">
        <h2 id="items" className="font-semibold">
          Productos
        </h2>
        <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-4 py-2">
              <span>
                {item.quantity} × {item.productName}{" "}
                <span className="text-zinc-500">({item.variantName})</span>
              </span>
              <span className="tabular-nums">{formatCOP(item.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <dl className="flex flex-col gap-1 border-t border-zinc-200 pt-2 text-sm dark:border-zinc-800">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd className="tabular-nums">{formatCOP(order.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Domicilio</dt>
            <dd className="tabular-nums">{formatCOP(order.shippingCost)}</dd>
          </div>
          <div className="flex justify-between text-base font-semibold">
            <dt>Total</dt>
            <dd className="tabular-nums">{formatCOP(order.total)}</dd>
          </div>
        </dl>
      </section>

      {payment && (
        <section className={section} aria-labelledby="payment">
          <h2 id="payment" className="font-semibold">
            Pago
          </h2>
          <p>
            {PROVIDER_LABEL[payment.provider]} · <strong>{PAYMENT_LABEL[payment.status]}</strong>
          </p>
          <p className="text-sm text-zinc-500">Referencia {payment.reference}</p>
        </section>
      )}
    </>
  );
}
