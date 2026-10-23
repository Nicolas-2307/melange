"use client";

import { useState } from "react";

import { formatCOP } from "@/lib/format";

import type { CatalogVariant } from "../types";

/** Lets the customer choose a size/presentation and shows its price. */
export function VariantPicker({ variants }: { variants: CatalogVariant[] }) {
  const [selectedId, setSelectedId] = useState(variants[0]?.id);
  const selected = variants.find((variant) => variant.id === selectedId) ?? variants[0];

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
                  onChange={() => setSelectedId(variant.id)}
                  className="sr-only"
                />
                {variant.name}
              </label>
            ))}
          </div>
        </fieldset>
      )}
    </div>
  );
}
