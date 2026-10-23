"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { addToCart } from "@/features/cart/actions";
import { formatCOP } from "@/lib/format";

import type { CatalogVariant } from "../types";

type Status = { kind: "idle" } | { kind: "added" } | { kind: "error"; message: string };

/** Lets the customer choose a size/presentation, shows its price and adds it to the cart. */
export function VariantPicker({ variants }: { variants: CatalogVariant[] }) {
  const [selectedId, setSelectedId] = useState(variants[0]?.id);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [pending, startTransition] = useTransition();
  const selected = variants.find((variant) => variant.id === selectedId) ?? variants[0];

  function handleAdd() {
    if (!selected) return;
    startTransition(async () => {
      const result = await addToCart(selected.id);
      setStatus(result.ok ? { kind: "added" } : { kind: "error", message: result.error });
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-2xl font-semibold" aria-live="polite">
        {selected && formatCOP(selected.price)}
      </p>

      {variants.length > 1 && (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-medium">Presentación</legend>
          <div className="flex flex-wrap gap-2">
            {variants.map((variant) => (
              <label
                key={variant.id}
                className="cursor-pointer rounded-lg border border-zinc-300 px-4 py-2 text-sm has-checked:border-zinc-900 has-checked:bg-zinc-900 has-checked:text-white has-focus-visible:ring-2 has-focus-visible:ring-zinc-900/40 dark:border-zinc-700 dark:has-checked:border-zinc-100 dark:has-checked:bg-zinc-100 dark:has-checked:text-zinc-900"
              >
                <input
                  type="radio"
                  name="variant"
                  value={variant.id}
                  checked={variant.id === selectedId}
                  onChange={() => {
                    setSelectedId(variant.id);
                    setStatus({ kind: "idle" });
                  }}
                  className="sr-only"
                />
                {variant.name}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <Button onClick={handleAdd} disabled={pending || !selected} className="h-12 sm:w-fit sm:px-8">
        {pending ? "Agregando…" : "Agregar al carrito"}
      </Button>

      <div aria-live="polite" className="min-h-6 text-sm">
        {status.kind === "added" && (
          <p className="text-green-700 dark:text-green-400">
            Agregado al carrito.{" "}
            <Link href="/carrito" className="font-medium underline">
              Ver carrito
            </Link>
          </p>
        )}
        {status.kind === "error" && <p className="text-red-600">{status.message}</p>}
      </div>
    </div>
  );
}
