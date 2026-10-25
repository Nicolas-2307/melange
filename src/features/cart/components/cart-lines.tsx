"use client";

import Image from "next/image";
import Link from "next/link";
import { useTransition } from "react";

import { formatCOP } from "@/lib/format";

import { removeCartItem, updateCartItem } from "../actions";
import type { CartLine } from "../cart";
import { MAX_QUANTITY_PER_ITEM } from "../rules";

export function CartLines({ lines }: { lines: CartLine[] }) {
  return (
    <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
      {lines.map((line) => (
        <CartLineRow key={line.id} line={line} />
      ))}
    </ul>
  );
}

function CartLineRow({ line }: { line: CartLine }) {
  const [pending, startTransition] = useTransition();
  const run = (action: () => Promise<unknown>) =>
    startTransition(async () => void (await action()));

  const stepButton =
    "flex size-8 items-center justify-center rounded-md border border-zinc-300 text-lg disabled:opacity-40 dark:border-zinc-700";

  return (
    <li className={`flex gap-4 py-4 ${pending ? "opacity-60" : ""}`} aria-busy={pending}>
      <Link
        href={`/productos/${line.productSlug}`}
        className="relative size-20 shrink-0 overflow-hidden rounded-lg"
      >
        <Image
          src={line.image.url}
          alt={line.image.alt}
          fill
          sizes="80px"
          unoptimized={line.image.url.endsWith(".svg")}
          className="object-cover"
        />
      </Link>

      <div className="flex flex-1 flex-col gap-2">
        <div className="flex justify-between gap-4">
          <div>
            <Link href={`/productos/${line.productSlug}`} className="font-medium hover:underline">
              {line.productName}
            </Link>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {line.variantName} · {formatCOP(line.unitPrice)}
            </p>
          </div>
          <p className="font-medium">{formatCOP(line.lineTotal)}</p>
        </div>

        <div className="flex items-center justify-between">
          <div
            className="flex items-center gap-3"
            role="group"
            aria-label={`Cantidad de ${line.productName}`}
          >
            <button
              type="button"
              className={stepButton}
              aria-label="Quitar una unidad"
              disabled={pending || line.quantity <= 1}
              onClick={() => run(() => updateCartItem(line.id, line.quantity - 1))}
            >
              −
            </button>
            <span className="w-6 text-center tabular-nums" aria-live="polite">
              {line.quantity}
            </span>
            <button
              type="button"
              className={stepButton}
              aria-label="Agregar una unidad"
              disabled={pending || line.quantity >= MAX_QUANTITY_PER_ITEM}
              onClick={() => run(() => updateCartItem(line.id, line.quantity + 1))}
            >
              +
            </button>
          </div>
          <button
            type="button"
            className="text-sm text-zinc-600 underline hover:text-red-600 dark:text-zinc-400"
            disabled={pending}
            onClick={() => run(() => removeCartItem(line.id))}
          >
            Eliminar
          </button>
        </div>
      </div>
    </li>
  );
}
