"use server";

import { randomBytes } from "node:crypto";

import { after } from "next/server";

import { getSession } from "@/features/auth/session";
import { getCart, getOrCreateCartId } from "@/features/cart/cart";
import { orderConfirmationEmail } from "@/features/orders/emails";
import { orderUrl } from "@/features/orders/queries";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { clientIp, consumeRateLimit } from "@/lib/rate-limit";
import { getEmailProvider } from "@/services/email";
import { getPaymentProvider } from "@/services/payments";

import { isDateAvailable } from "./availability";
import { checkoutSchema } from "./schemas";
import { getAvailability } from "./store";

export type PlaceOrderResult =
  { ok: true; token: string } | { ok: false; error: string; fieldErrors?: Record<string, string> };

/**
 * Creates the order from the visitor's cart. Everything that costs money is recomputed here
 * from the database: client-side totals are only for display.
 */
export async function placeOrder(input: unknown): Promise<PlaceOrderResult> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[String(issue.path[0] ?? "form")] ??= issue.message;
    }
    return { ok: false, error: "Revisa los datos del formulario.", fieldErrors };
  }
  const data = parsed.data;

  // Anti-spam: fake orders would fill the calendar (daily cap) and send emails to any address.
  if (env.NODE_ENV === "production") {
    const allowed = await consumeRateLimit(`checkout:${await clientIp()}`, 5, 10 * 60);
    if (!allowed) {
      return { ok: false, error: "Demasiados pedidos seguidos. Espera unos minutos." };
    }
  }
  const recentPending = await db.order.count({
    where: {
      status: "PENDING",
      createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
      OR: [{ customerEmail: data.email }, { customerPhone: data.phone }],
    },
  });
  if (recentPending >= 3) {
    return {
      ok: false,
      error: "Ya tienes pedidos pendientes recientes. Escríbenos por WhatsApp para confirmarlos.",
    };
  }

  const cart = await getCart();
  if (cart.lines.length === 0) return { ok: false, error: "Tu carrito está vacío." };

  const { today, rules } = await getAvailability();
  if (!isDateAvailable(data.deliveryDate, today, rules)) {
    return {
      ok: false,
      error: "Esa fecha ya no está disponible.",
      fieldErrors: { deliveryDate: "Elige otra fecha" },
    };
  }

  let shippingCost = 0;
  let zoneName: string | null = null;
  if (data.fulfillmentType === "DELIVERY") {
    const zone = await db.deliveryZone.findFirst({
      where: { id: data.zoneId, isActive: true },
      select: { name: true, fee: true },
    });
    if (!zone)
      return {
        ok: false,
        error: "Elige una zona válida.",
        fieldErrors: { zoneId: "Elige tu zona" },
      };
    shippingCost = zone.fee;
    zoneName = zone.name;
  }

  const session = await getSession();
  const cartId = await getOrCreateCartId();
  const token = randomBytes(24).toString("base64url");
  const total = cart.subtotal + shippingCost;
  const provider = getPaymentProvider();

  const order = await db.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        publicToken: token,
        userId: session?.user.id ?? null,
        customerName: data.name,
        customerEmail: data.email,
        customerPhone: data.phone,
        fulfillmentType: data.fulfillmentType,
        deliveryZoneName: zoneName,
        deliveryAddress: data.fulfillmentType === "DELIVERY" ? data.address : null,
        deliveryDate: new Date(`${data.deliveryDate}T00:00:00Z`),
        notes: data.notes || null,
        privacyAcceptedAt: new Date(),
        subtotal: cart.subtotal,
        shippingCost,
        total,
        items: {
          create: cart.lines.map((line) => ({
            variantId: line.variantId,
            productName: line.productName,
            variantName: line.variantName,
            unitPrice: line.unitPrice,
            quantity: line.quantity,
            lineTotal: line.lineTotal,
          })),
        },
      },
      select: { id: true, number: true },
    });

    await tx.payment.create({
      data: {
        orderId: created.id,
        provider: provider.id,
        reference: `MEL-${created.number}-${randomBytes(4).toString("hex")}`,
        amount: total,
      },
    });

    await tx.cartItem.deleteMany({ where: { cartId } });
    return created;
  });

  after(() =>
    getEmailProvider().send(
      orderConfirmationEmail({
        to: data.email,
        name: data.name,
        number: order.number,
        total,
        url: orderUrl(token),
      }),
    ),
  );

  return { ok: true, token };
}
