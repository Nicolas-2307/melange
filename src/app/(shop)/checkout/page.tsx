import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { getSession } from "@/features/auth/session";
import { getCart } from "@/features/cart/cart";
import { CheckoutForm } from "@/features/checkout/components/checkout-form";
import { getAvailability, getDeliveryZones } from "@/features/checkout/store";

export const metadata: Metadata = { title: "Finalizar pedido · Melange", robots: { index: false } };

export default function CheckoutPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Finalizar pedido</h1>
      <Suspense fallback={<p className="text-zinc-500">Cargando…</p>}>
        <CheckoutContent />
      </Suspense>
    </main>
  );
}

async function CheckoutContent() {
  // Available dates depend on "today": always render at request time.
  await connection();
  const [cart, zones, availability, session] = await Promise.all([
    getCart(),
    getDeliveryZones(),
    getAvailability(),
    getSession(),
  ]);
  if (cart.lines.length === 0) redirect("/carrito");

  return (
    <CheckoutForm
      zones={zones}
      availableDates={availability.dates}
      today={availability.today}
      pickupAddress={availability.pickupAddress}
      subtotal={cart.subtotal}
      defaults={{ name: session?.user.name ?? "", email: session?.user.email ?? "" }}
    />
  );
}
