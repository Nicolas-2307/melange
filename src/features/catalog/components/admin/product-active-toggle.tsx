"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { setProductActive } from "../../admin-actions";

export function ProductActiveToggle({
  productId,
  isActive,
}: {
  productId: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await setProductActive(productId, !isActive);
          router.refresh();
        })
      }
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
        isActive
          ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200"
          : "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
      }`}
      aria-label={isActive ? "Visible: toca para ocultar" : "Oculto: toca para mostrar"}
    >
      {pending ? "…" : isActive ? "Visible" : "Oculto"}
    </button>
  );
}
