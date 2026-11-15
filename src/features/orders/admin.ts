import type { OrderStatus, Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";

import { OPEN_STATUSES } from "./status";

/**
 * Owner-side order reads. Callers MUST check `requireAdmin()` first: these functions
 * return customers' personal data.
 */

const listSelect = {
  id: true,
  number: true,
  status: true,
  customerName: true,
  fulfillmentType: true,
  deliveryZoneName: true,
  deliveryDate: true,
  total: true,
  createdAt: true,
} as const satisfies Prisma.OrderSelect;

export type AdminOrderRow = Prisma.OrderGetPayload<{ select: typeof listSelect }>;

export type OrderFilter = "abiertos" | "todos" | OrderStatus;

export async function listOrders(filter: OrderFilter): Promise<AdminOrderRow[]> {
  const where: Prisma.OrderWhereInput =
    filter === "todos"
      ? {}
      : filter === "abiertos"
        ? { status: { in: OPEN_STATUSES } }
        : { status: filter };
  return db.order.findMany({
    where,
    // Open work is ordered by delivery date; history by most recent first.
    orderBy:
      filter === "abiertos" ? [{ deliveryDate: "asc" }, { number: "asc" }] : { number: "desc" },
    take: 200,
    select: listSelect,
  });
}

export async function getAdminOrder(id: string) {
  return db.order.findUnique({
    where: { id },
    select: {
      ...listSelect,
      publicToken: true,
      customerEmail: true,
      customerPhone: true,
      deliveryAddress: true,
      notes: true,
      subtotal: true,
      shippingCost: true,
      updatedAt: true,
      user: { select: { email: true } },
      items: {
        orderBy: { productName: "asc" },
        select: {
          id: true,
          productName: true,
          variantName: true,
          unitPrice: true,
          quantity: true,
          lineTotal: true,
        },
      },
      payments: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          provider: true,
          status: true,
          amount: true,
          reference: true,
          createdAt: true,
        },
      },
    },
  });
}

export type AdminOrderDetail = NonNullable<Awaited<ReturnType<typeof getAdminOrder>>>;

/** Orders and blocked days of one month ("YYYY-MM"), for the owner's calendar. */
export async function getMonthCalendar(month: string) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new Error(`Invalid month: ${month}`);
  const [year, monthIndex] = month.split("-").map(Number) as [number, number];
  const from = new Date(Date.UTC(year, monthIndex - 1, 1));
  const to = new Date(Date.UTC(year, monthIndex, 1));

  const [orders, blocked] = await Promise.all([
    db.order.findMany({
      where: { deliveryDate: { gte: from, lt: to }, status: { not: "CANCELLED" } },
      orderBy: [{ deliveryDate: "asc" }, { number: "asc" }],
      select: listSelect,
    }),
    db.blockedDate.findMany({
      where: { date: { gte: from, lt: to } },
      select: { date: true, reason: true },
    }),
  ]);

  const ordersByDay = new Map<string, AdminOrderRow[]>();
  for (const order of orders) {
    const day = order.deliveryDate.toISOString().slice(0, 10);
    ordersByDay.set(day, [...(ordersByDay.get(day) ?? []), order]);
  }
  const blockedByDay = new Map(blocked.map((b) => [b.date.toISOString().slice(0, 10), b.reason]));

  return { ordersByDay, blockedByDay };
}

/** Numbers for the dashboard. */
export async function getDashboardSummary(today: string) {
  const todayDate = new Date(`${today}T00:00:00Z`);
  const [pending, open, upcoming] = await Promise.all([
    db.order.count({ where: { status: "PENDING" } }),
    db.order.count({ where: { status: { in: OPEN_STATUSES } } }),
    db.order.findMany({
      where: { status: { in: OPEN_STATUSES }, deliveryDate: { gte: todayDate } },
      orderBy: [{ deliveryDate: "asc" }, { number: "asc" }],
      take: 8,
      select: listSelect,
    }),
  ]);
  return { pending, open, upcoming };
}
