import Link from "next/link";
import { connection } from "next/server";

import { requireAdmin } from "@/features/auth/session";
import { formatDeliveryDate, todayInBogota } from "@/features/checkout/availability";
import {
  formatMonth,
  monthGrid,
  monthOf,
  shiftMonth,
  WEEKDAY_LABELS,
  WEEKDAY_NAMES,
} from "@/features/checkout/calendar";
import { getMonthCalendar } from "@/features/orders/admin";
import { BlockDayToggle } from "@/features/orders/components/block-day-toggle";
import { OrdersTable } from "@/features/orders/components/orders-table";

const isMonth = (value: unknown): value is string =>
  typeof value === "string" && /^\d{4}-\d{2}$/.test(value);
const isDay = (value: unknown): value is string =>
  typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);

export default async function AdminCalendarPage({ searchParams }: PageProps<"/admin/calendario">) {
  await requireAdmin();
  await connection();
  const params = await searchParams;
  const today = todayInBogota();
  const month = isMonth(params.mes) ? params.mes : monthOf(today);
  const selected = isDay(params.dia) && monthOf(params.dia) === month ? params.dia : null;

  const { ordersByDay, blockedByDay } = await getMonthCalendar(month);
  const selectedOrders = selected ? (ordersByDay.get(selected) ?? []) : [];
  const monthLink = (target: string) => `/admin/calendario?mes=${target}`;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight first-letter:uppercase">
          {formatMonth(month)}
        </h1>
        <nav aria-label="Cambiar mes" className="flex items-center gap-2 text-sm">
          <Link
            href={monthLink(shiftMonth(month, -1))}
            className="rounded-lg border px-3 py-1.5 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            ‹ Anterior
          </Link>
          <Link
            href={monthLink(monthOf(today))}
            className="rounded-lg border px-3 py-1.5 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Hoy
          </Link>
          <Link
            href={monthLink(shiftMonth(month, 1))}
            className="rounded-lg border px-3 py-1.5 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Siguiente ›
          </Link>
        </nav>
      </div>

      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Cada día muestra cuántos pedidos tiene. Toca un día para ver sus pedidos o bloquearlo.
      </p>

      <table className="w-full table-fixed border-collapse text-sm">
        <thead>
          <tr>
            {WEEKDAY_LABELS.map((short, index) => (
              <th key={short} scope="col" className="pb-2 font-normal text-zinc-500">
                <abbr title={WEEKDAY_NAMES[index]} className="no-underline">
                  {short}
                </abbr>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {monthGrid(month).map((week) => (
            <tr key={week.find(Boolean)}>
              {week.map((day, index) => {
                if (!day) return <td key={`blank-${index}`} />;
                const count = ordersByDay.get(day)?.length ?? 0;
                const blocked = blockedByDay.has(day);
                const isSelected = day === selected;
                const label = `${formatDeliveryDate(day)}: ${count} ${count === 1 ? "pedido" : "pedidos"}${blocked ? ", bloqueado" : ""}`;
                return (
                  <td key={day} className="p-0.5 align-top">
                    <Link
                      href={`${monthLink(month)}&dia=${day}`}
                      aria-label={label}
                      aria-current={isSelected ? "date" : undefined}
                      className={[
                        "flex h-16 flex-col justify-between rounded-lg border p-1.5 sm:h-20",
                        isSelected
                          ? "border-zinc-900 ring-2 ring-zinc-900/20 dark:border-zinc-100"
                          : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900",
                        blocked ? "bg-zinc-100 dark:bg-zinc-900" : "",
                      ].join(" ")}
                    >
                      <span
                        className={`text-xs tabular-nums ${day === today ? "font-bold underline" : ""} ${blocked ? "text-zinc-400 line-through" : ""}`}
                      >
                        {Number(day.slice(8))}
                      </span>
                      {count > 0 && (
                        <span className="self-end rounded-full bg-zinc-900 px-1.5 text-xs font-medium text-white tabular-nums dark:bg-zinc-100 dark:text-zinc-900">
                          {count}
                        </span>
                      )}
                      {blocked && count === 0 && (
                        <span className="text-[10px] text-zinc-500">Bloqueado</span>
                      )}
                    </Link>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {selected && (
        <section
          aria-labelledby="day-title"
          className="flex flex-col gap-4 rounded-xl border border-zinc-200 p-5 dark:border-zinc-800"
        >
          <h2 id="day-title" className="text-lg font-semibold first-letter:uppercase">
            {formatDeliveryDate(selected)}
          </h2>
          <OrdersTable orders={selectedOrders} />
          <BlockDayToggle
            key={selected}
            day={selected}
            blocked={blockedByDay.has(selected)}
            reason={blockedByDay.get(selected) ?? null}
            orderCount={selectedOrders.length}
          />
        </section>
      )}
    </>
  );
}
