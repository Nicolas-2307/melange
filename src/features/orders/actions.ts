"use server";

import { refresh } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/features/auth/session";
import { db } from "@/lib/db";

import { canTransition } from "./status";

export type AdminActionResult = { ok: true } | { ok: false; error: string };

const statusSchema = z.enum([
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "COMPLETED",
  "CANCELLED",
]);

/** Moves an order to its next status. Only allowed transitions are accepted. */
export async function updateOrderStatus(
  orderId: string,
  status: string,
): Promise<AdminActionResult> {
  await requireAdmin();
  const parsed = z
    .object({ orderId: z.string().min(1).max(64), status: statusSchema })
    .safeParse({ orderId, status });
  if (!parsed.success) return { ok: false, error: "Datos no válidos." };

  const order = await db.order.findUnique({
    where: { id: parsed.data.orderId },
    select: { status: true },
  });
  if (!order) return { ok: false, error: "El pedido no existe." };
  if (!canTransition(order.status, parsed.data.status)) {
    return { ok: false, error: "Ese cambio de estado no está permitido." };
  }

  // Conditional update: if someone else changed it meanwhile, nothing is overwritten.
  const { count } = await db.order.updateMany({
    where: { id: parsed.data.orderId, status: order.status },
    data: { status: parsed.data.status },
  });
  if (count === 0)
    return { ok: false, error: "El pedido cambió mientras tanto. Recarga la página." };

  refresh();
  return { ok: true };
}

/** Marks the latest payment as received (WhatsApp orders are paid outside the site). */
export async function markPaymentReceived(orderId: string): Promise<AdminActionResult> {
  await requireAdmin();
  const id = z.string().min(1).max(64).safeParse(orderId);
  if (!id.success) return { ok: false, error: "Datos no válidos." };

  const payment = await db.payment.findFirst({
    where: { orderId: id.data, provider: "WHATSAPP", status: "PENDING" },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  if (!payment) return { ok: false, error: "No hay un pago pendiente por WhatsApp." };

  await db.payment.update({ where: { id: payment.id }, data: { status: "APPROVED" } });
  refresh();
  return { ok: true };
}

const daySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/** Blocks or unblocks a delivery date. Takes effect immediately in the customer's calendar. */
export async function setDateBlocked(
  day: string,
  blocked: boolean,
  reason?: string,
): Promise<AdminActionResult> {
  await requireAdmin();
  const parsed = z
    .object({ day: daySchema, blocked: z.boolean(), reason: z.string().trim().max(100).optional() })
    .safeParse({ day, blocked, reason });
  if (!parsed.success) return { ok: false, error: "Datos no válidos." };

  const date = new Date(`${parsed.data.day}T00:00:00Z`);
  if (parsed.data.blocked) {
    await db.blockedDate.upsert({
      where: { date },
      update: { reason: parsed.data.reason || null },
      create: { date, reason: parsed.data.reason || null },
    });
  } else {
    await db.blockedDate.deleteMany({ where: { date } });
  }

  refresh();
  return { ok: true };
}
