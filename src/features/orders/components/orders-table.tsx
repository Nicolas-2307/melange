import Link from "next/link";

import { formatDeliveryDate } from "@/features/checkout/availability";
import { formatCOP } from "@/lib/format";

import type { AdminOrderRow } from "../admin";
import { StatusBadge } from "./status-badge";

export function OrdersTable({ orders }: { orders: AdminOrderRow[] }) {
  if (orders.length === 0) {
    return <p className="py-6 text-zinc-600 dark:text-zinc-400">No hay pedidos aquí.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[40rem] text-left text-sm">
        <thead className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-800">
          <tr>
            <th scope="col" className="py-2 pr-3 font-medium">
              Pedido
            </th>
            <th scope="col" className="py-2 pr-3 font-medium">
              Fecha
            </th>
            <th scope="col" className="py-2 pr-3 font-medium">
              Cliente
            </th>
            <th scope="col" className="py-2 pr-3 font-medium">
              Entrega
            </th>
            <th scope="col" className="py-2 pr-3 text-right font-medium">
              Total
            </th>
            <th scope="col" className="py-2 font-medium">
              Estado
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {orders.map((order) => (
            <tr key={order.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900">
              <td className="py-2 pr-3">
                <Link href={`/admin/pedidos/${order.id}`} className="font-medium underline">
                  #{order.number}
                </Link>
              </td>
              <td className="py-2 pr-3 first-letter:uppercase">
                {formatDeliveryDate(order.deliveryDate.toISOString().slice(0, 10))}
              </td>
              <td className="py-2 pr-3">{order.customerName}</td>
              <td className="py-2 pr-3">
                {order.fulfillmentType === "PICKUP" ? "Recoge en la sede" : order.deliveryZoneName}
              </td>
              <td className="py-2 pr-3 text-right tabular-nums">{formatCOP(order.total)}</td>
              <td className="py-2">
                <StatusBadge status={order.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
