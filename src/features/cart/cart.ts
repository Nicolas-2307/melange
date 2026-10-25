import { cookies } from "next/headers";

import { getSession } from "@/features/auth/session";
import { productCoverImage } from "@/features/catalog/mappers";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { clientIp, consumeRateLimit } from "@/lib/rate-limit";

import { cartTotals } from "./rules";

export class CartRateLimitError extends Error {
  constructor() {
    super("Too many guest carts from this IP");
  }
}

/**
 * Guest carts are identified by an unguessable id in an httpOnly cookie.
 * Signed-in customers use the cart linked to their user (one per user).
 */
const CART_COOKIE = "melange_cart";
const CART_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export type CartLine = {
  id: string;
  variantId: string;
  productName: string;
  productSlug: string;
  variantName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  image: { url: string; alt: string };
};

export type CartView = { lines: CartLine[]; subtotal: number; itemCount: number };

const EMPTY_CART: CartView = { lines: [], subtotal: 0, itemCount: 0 };

async function guestCartId() {
  return (await cookies()).get(CART_COOKIE)?.value;
}

/** Cart id for reading. Never creates anything (safe in Server Components). */
async function findCartId(): Promise<string | null> {
  const session = await getSession();
  if (session) {
    const cart = await db.cart.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    return cart?.id ?? null;
  }
  const id = await guestCartId();
  if (!id) return null;
  const cart = await db.cart.findFirst({ where: { id, userId: null }, select: { id: true } });
  return cart?.id ?? null;
}

/** Cart id for writing; creates the cart (and guest cookie) if needed. Server Actions only. */
export async function getOrCreateCartId(): Promise<string> {
  const session = await getSession();
  if (session) {
    const cart = await db.cart.upsert({
      where: { userId: session.user.id },
      update: {},
      create: { userId: session.user.id },
      select: { id: true },
    });
    return cart.id;
  }

  const existing = await findCartId();
  if (existing) return existing;

  // Guest carts cost nothing to create: cap them per IP so a script cannot fill the database.
  const allowed =
    env.NODE_ENV !== "production" ||
    (await consumeRateLimit(`cart:${await clientIp()}`, 20, 60 * 60));
  if (!allowed) throw new CartRateLimitError();

  const cart = await db.cart.create({ data: {}, select: { id: true } });
  (await cookies()).set(CART_COOKIE, cart.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    path: "/",
    maxAge: CART_COOKIE_MAX_AGE,
  });
  return cart.id;
}

/** The guest cart (if any) and a function to forget it. Used when merging on sign-in. */
export async function takeGuestCart() {
  const id = await guestCartId();
  const cart = id
    ? await db.cart.findFirst({
        where: { id, userId: null },
        select: { id: true, items: { select: { variantId: true, quantity: true } } },
      })
    : null;
  return {
    cart,
    forget: async () => (await cookies()).delete(CART_COOKIE),
  };
}

/** Cart contents with current prices. Items whose product/variant is no longer sold are hidden. */
export async function getCart(): Promise<CartView> {
  const cartId = await findCartId();
  if (!cartId) return EMPTY_CART;

  const items = await db.cartItem.findMany({
    where: {
      cartId,
      variant: { isActive: true, product: { isActive: true, category: { isActive: true } } },
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      quantity: true,
      variant: {
        select: {
          id: true,
          name: true,
          price: true,
          product: {
            select: {
              name: true,
              slug: true,
              category: { select: { name: true, slug: true } },
              images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true, alt: true } },
            },
          },
        },
      },
    },
  });

  const lines: CartLine[] = items.map(({ id, quantity, variant }) => ({
    id,
    variantId: variant.id,
    productName: variant.product.name,
    productSlug: variant.product.slug,
    variantName: variant.name,
    unitPrice: variant.price,
    quantity,
    lineTotal: variant.price * quantity,
    image: productCoverImage(variant.product),
  }));

  return { lines, ...cartTotals(lines) };
}
