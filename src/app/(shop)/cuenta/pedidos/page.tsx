import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { requireUser } from "@/features/auth/session";
import { formatDeliveryDate } from "@/features/checkout/availability";
import { StatusBadge } from "@/features/orders/components/status-badge";
import { listOrdersForUser } from "@/features/orders/customer";
import { formatCOP } from "@/lib/format";

export const metadata: Metadata = { title: "Mis pedidos · Melange", robots: { index: false } };

export default function MyOrdersPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Mis pedidos</h1>
      {/* The list depends on the session: request-time data. */}
      <Suspense fallback={<p className="text-zinc-500">Cargando…</p>}>
        <MyOrders />
      </Suspense>
    </main>
  );
}

async function MyOrders() {
  const { user } = await requireUser("/cuenta/pedidos");
  const orders = await listOrdersForUser(user.id);

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="text-zinc-600 dark:text-zinc-400">Aún no tienes pedidos con esta cuenta.</p>
        <Link href="/productos" className="font-medium underline">
          Ver productos
        </Link>
      </div>
    );
  }

  return (
    <>
      <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
        {orders.map((order) => (
          <li key={order.id}>
            <Link
              href={`/pedidos/${order.publicToken}`}
              className="flex flex-wrap items-center justify-between gap-3 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-900"
            >
              <div className="flex flex-col gap-1">
                <span className="font-medium">Pedido #{order.number}</span>
                <span className="text-sm text-zinc-600 first-letter:uppercase dark:text-zinc-400">
                  {order.fulfillmentType === "DELIVERY" ? "Entrega" : "Recogida"} ·{" "}
                  {formatDeliveryDate(order.deliveryDate.toISOString().slice(0, 10))} ·{" "}
                  {order._count.items} {order._count.items === 1 ? "producto" : "productos"}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-medium tabular-nums">{formatCOP(order.total)}</span>
                <StatusBadge status={order.status} />
              </div>
            </Link>
          </li>
        ))}
      </ul>
      <p className="text-sm text-zinc-500">
        Aquí aparecen los pedidos hechos con tu cuenta. Los que hiciste sin ingresar los encuentras
        en el enlace que te enviamos por correo.
      </p>
    </>
  );
}
