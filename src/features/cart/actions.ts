"use server";

import { refresh } from "next/cache";
import { z } from "zod";

import { getSession } from "@/features/auth/session";
import { db } from "@/lib/db";

import { CartRateLimitError, getOrCreateCartId, takeGuestCart } from "./cart";
import { clampQuantity, mergeLines, MAX_QUANTITY_PER_ITEM } from "./rules";

export type CartActionResult = { ok: true } | { ok: false; error: string };

const idSchema = z.string().min(1).max(64);
const quantitySchema = z.number().int().min(1).max(MAX_QUANTITY_PER_ITEM);

/** Adds units of a variant. Only active variants of visible products can be added. */
export async function addToCart(variantId: string, quantity = 1): Promise<CartActionResult> {
  const parsed = z.object({ variantId: idSchema, quantity: quantitySchema }).safeParse({
    variantId,
    quantity,
  });
  if (!parsed.success) return { ok: false, error: "Datos no válidos." };

  const variant = await db.productVariant.findFirst({
    where: {
      id: parsed.data.variantId,
      isActive: true,
      product: { isActive: true, category: { isActive: true } },
    },
    select: { id: true },
  });
  if (!variant) return { ok: false, error: "Este producto ya no está disponible." };

  let cartId: string;
  try {
    cartId = await getOrCreateCartId();
  } catch (error) {
    if (error instanceof CartRateLimitError) {
      return { ok: false, error: "Demasiadas solicitudes. Inténtalo de nuevo en un rato." };
    }
    throw error;
  }
  const existing = await db.cartItem.findUnique({
    where: { cartId_variantId: { cartId, variantId: variant.id } },
    select: { quantity: true },
  });
  const newQuantity = clampQuantity((existing?.quantity ?? 0) + parsed.data.quantity);

  await db.cartItem.upsert({
    where: { cartId_variantId: { cartId, variantId: variant.id } },
    update: { quantity: newQuantity },
    create: { cartId, variantId: variant.id, quantity: newQuantity },
  });

  refresh();
  return { ok: true };
}

/** Sets the quantity of a line in the current visitor's cart. */
export async function updateCartItem(itemId: string, quantity: number): Promise<CartActionResult> {
  const parsed = z.object({ itemId: idSchema, quantity: quantitySchema }).safeParse({
    itemId,
    quantity,
  });
  if (!parsed.success) return { ok: false, error: "Cantidad no válida." };

  const cartId = await getOrCreateCartId();
  // Scoped by cartId: a visitor can only touch lines of their own cart.
  await db.cartItem.updateMany({
    where: { id: parsed.data.itemId, cartId },
    data: { quantity: parsed.data.quantity },
  });

  refresh();
  return { ok: true };
}

export async function removeCartItem(itemId: string): Promise<CartActionResult> {
  const parsed = idSchema.safeParse(itemId);
  if (!parsed.success) return { ok: false, error: "Datos no válidos." };

  const cartId = await getOrCreateCartId();
  await db.cartItem.deleteMany({ where: { id: parsed.data, cartId } });

  refresh();
  return { ok: true };
}

/** After sign-in/sign-up: moves the guest cart's items into the user's cart. */
export async function mergeGuestCart(): Promise<void> {
  const session = await getSession();
  if (!session) return;

  const { cart: guestCart, forget } = await takeGuestCart();
  if (!guestCart) return;

  if (guestCart.items.length > 0) {
    const userCartId = await getOrCreateCartId();
    const userItems = await db.cartItem.findMany({
      where: { cartId: userCartId },
      select: { variantId: true, quantity: true },
    });
    const lines = mergeLines(userItems, guestCart.items);

    await db.$transaction(
      lines.map((line) =>
        db.cartItem.upsert({
          where: { cartId_variantId: { cartId: userCartId, variantId: line.variantId } },
          update: { quantity: line.quantity },
          create: { cartId: userCartId, variantId: line.variantId, quantity: line.quantity },
        }),
      ),
    );
  }

  await db.cart.delete({ where: { id: guestCart.id } });
  await forget();
}
