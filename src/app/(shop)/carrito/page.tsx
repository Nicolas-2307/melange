import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { getCart } from "@/features/cart/cart";
import { CartLines } from "@/features/cart/components/cart-lines";
import { formatCOP } from "@/lib/format";

export const metadata: Metadata = { title: "Carrito · Melange", robots: { index: false } };

export default function CartPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Tu carrito</h1>
      {/* The cart depends on the visitor's cookie/session: request-time data. */}
      <Suspense fallback={<p className="text-zinc-500">Cargando…</p>}>
        <CartContent />
      </Suspense>
    </main>
  );
}

async function CartContent() {
  const cart = await getCart();

  if (cart.lines.length === 0) {
    return (
      <div className="flex flex-col items-start gap-4">
        <p className="text-zinc-600 dark:text-zinc-400">Tu carrito está vacío.</p>
        <Link href="/productos" className="font-medium underline">
          Ver productos
        </Link>
      </div>
    );
  }

  return (
    <>
      <CartLines lines={cart.lines} />
      <div className="flex flex-col gap-4 border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <div className="flex justify-between text-lg">
          <span>Subtotal</span>
          <span className="font-semibold" data-testid="cart-subtotal">
            {formatCOP(cart.subtotal)}
          </span>
        </div>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          El domicilio y la fecha de entrega se eligen en el siguiente paso.
        </p>
        {/* Checkout arrives in Paso 4.3. */}
        <span
          aria-disabled="true"
          className="inline-flex h-12 items-center justify-center rounded-lg bg-zinc-300 px-8 text-sm font-medium text-zinc-600 sm:w-fit dark:bg-zinc-800 dark:text-zinc-400"
        >
          Continuar al pago (próximamente)
        </span>
      </div>
    </>
  );
}
