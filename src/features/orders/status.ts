import type { OrderStatus } from "@/generated/prisma/client";

/** Labels shown to customers and the owner. */
export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "Pendiente de confirmación",
  CONFIRMED: "Confirmado",
  PREPARING: "En preparación",
  READY: "Listo",
  COMPLETED: "Entregado",
  CANCELLED: "Cancelado",
};

/** Short labels for the owner's buttons. */
export const ORDER_STATUS_ACTION: Record<OrderStatus, string> = {
  PENDING: "Volver a pendiente",
  CONFIRMED: "Confirmar",
  PREPARING: "Empezar preparación",
  READY: "Marcar como listo",
  COMPLETED: "Marcar como entregado",
  CANCELLED: "Cancelar pedido",
};

/**
 * Allowed transitions. Orders move forward one step at a time and can be cancelled
 * until delivered. Delivered and cancelled orders are final.
 */
const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY", "CANCELLED"],
  READY: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

export function nextStatuses(status: OrderStatus): OrderStatus[] {
  return TRANSITIONS[status];
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

/** Orders that still need work (shown first and counted in the dashboard). */
export const OPEN_STATUSES: OrderStatus[] = ["PENDING", "CONFIRMED", "PREPARING", "READY"];

/** Badge colors by status (Tailwind classes). */
export const ORDER_STATUS_STYLE: Record<OrderStatus, string> = {
  PENDING: "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200",
  CONFIRMED: "bg-sky-100 text-sky-900 dark:bg-sky-900/40 dark:text-sky-200",
  PREPARING: "bg-violet-100 text-violet-900 dark:bg-violet-900/40 dark:text-violet-200",
  READY: "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200",
  COMPLETED: "bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200",
  CANCELLED: "bg-red-100 text-red-900 dark:bg-red-900/40 dark:text-red-200",
};
