import Link from "next/link";

import { requireAdmin } from "@/features/auth/session";
import { listOrders, type OrderFilter } from "@/features/orders/admin";
import { OrdersTable } from "@/features/orders/components/orders-table";
import { ORDER_STATUS_LABEL } from "@/features/orders/status";

const FILTERS: { value: OrderFilter; label: string }[] = [
  { value: "abiertos", label: "Abiertos" },
  { value: "PENDING", label: ORDER_STATUS_LABEL.PENDING },
  { value: "COMPLETED", label: "Entregados" },
  { value: "CANCELLED", label: "Cancelados" },
  { value: "todos", label: "Todos" },
];

function parseFilter(value: string | string[] | undefined): OrderFilter {
  return FILTERS.find((filter) => filter.value === value)?.value ?? "abiertos";
}

export default async function AdminOrdersPage({ searchParams }: PageProps<"/admin/pedidos">) {
  await requireAdmin();
  const filter = parseFilter((await searchParams).estado);
  const orders = await listOrders(filter);

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Pedidos</h1>
      <nav aria-label="Filtrar pedidos" className="flex flex-wrap gap-2">
        {FILTERS.map(({ value, label }) => (
          <Link
            key={value}
            href={value === "abiertos" ? "/admin/pedidos" : `/admin/pedidos?estado=${value}`}
            aria-current={filter === value ? "page" : undefined}
            className={`rounded-full border px-3 py-1 text-sm ${
              filter === value
                ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                : "border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>
      <OrdersTable orders={orders} />
    </>
  );
}
