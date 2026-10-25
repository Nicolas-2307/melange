"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";

import { setDateBlocked } from "../actions";

type BlockDayToggleProps = {
  day: string;
  blocked: boolean;
  reason: string | null;
  orderCount: number;
};

/** Block or unblock a day for new orders. Existing orders are not affected. */
export function BlockDayToggle({ day, blocked, reason, orderCount }: BlockDayToggleProps) {
  const [newReason, setNewReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      const result = await setDateBlocked(day, !blocked, blocked ? undefined : newReason);
      setError(result.ok ? null : result.error);
      if (result.ok) setNewReason("");
    });
  }

  if (blocked) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm">
          Este día está <strong>bloqueado</strong>
          {reason ? ` (${reason})` : ""}: los clientes no lo pueden elegir.
        </p>
        <Button variant="secondary" onClick={toggle} disabled={pending} className="w-fit">
          Desbloquear día
        </Button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {orderCount > 0 && (
        <p className="text-sm text-amber-700 dark:text-amber-300">
          Ya hay {orderCount} {orderCount === 1 ? "pedido" : "pedidos"} este día. Bloquearlo solo
          evita pedidos nuevos.
        </p>
      )}
      <div className="flex flex-wrap items-end gap-2">
        <div className="w-full max-w-xs">
          <TextField
            label="Motivo (opcional)"
            value={newReason}
            onChange={(event) => setNewReason(event.target.value)}
            placeholder="Festivo, vacaciones…"
            maxLength={100}
          />
        </div>
        <Button variant="secondary" onClick={toggle} disabled={pending}>
          Bloquear día
        </Button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
