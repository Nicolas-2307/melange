import Link from "next/link";
import { connection } from "next/server";

import { requireAdmin } from "@/features/auth/session";
import { todayInBogota } from "@/features/checkout/availability";
import { getDashboardSummary } from "@/features/orders/admin";
import { OrdersTable } from "@/features/orders/components/orders-table";

export default async function AdminHomePage() {
  const { user } = await requireAdmin();
  await connection();
  const summary = await getDashboardSummary(todayInBogota());

  const card = "flex flex-col gap-1 rounded-xl border border-zinc-200 p-5 dark:border-zinc-800";

  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Hola, {user.name}</h1>
        <p className="text-zinc-600 dark:text-zinc-400">Esto es lo que tienes pendiente.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/pedidos?estado=PENDING"
          className={`${card} hover:bg-zinc-50 dark:hover:bg-zinc-900`}
        >
          <span className="text-sm text-zinc-600 dark:text-zinc-400">Por confirmar</span>
          <span className="text-3xl font-semibold tabular-nums" data-testid="pending-count">
            {summary.pending}
          </span>
        </Link>
        <Link href="/admin/pedidos" className={`${card} hover:bg-zinc-50 dark:hover:bg-zinc-900`}>
          <span className="text-sm text-zinc-600 dark:text-zinc-400">Pedidos abiertos</span>
          <span className="text-3xl font-semibold tabular-nums">{summary.open}</span>
        </Link>
      </div>

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">Próximas entregas</h2>
          <Link href="/admin/calendario" className="text-sm underline">
            Ver calendario
          </Link>
        </div>
        <OrdersTable orders={summary.upcoming} />
      </section>
    </>
  );
}
