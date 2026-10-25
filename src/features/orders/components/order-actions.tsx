"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import type { OrderStatus } from "@/generated/prisma/client";

import { markPaymentReceived, updateOrderStatus, type AdminActionResult } from "../actions";
import { ORDER_STATUS_ACTION } from "../status";

type OrderActionsProps = {
  orderId: string;
  next: OrderStatus[];
  canMarkPaid: boolean;
};

/** Status buttons for the owner. Cancelling asks for confirmation. */
export function OrderActions({ orderId, next, canMarkPaid }: OrderActionsProps) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const run = (action: () => Promise<AdminActionResult>) =>
    startTransition(async () => {
      const result = await action();
      setError(result.ok ? null : result.error);
    });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {next.map((status) => (
          <Button
            key={status}
            variant={status === "CANCELLED" ? "secondary" : "primary"}
            disabled={pending}
            onClick={() => {
              if (
                status === "CANCELLED" &&
                !window.confirm("¿Cancelar este pedido? No se puede deshacer.")
              ) {
                return;
              }
              run(() => updateOrderStatus(orderId, status));
            }}
          >
            {ORDER_STATUS_ACTION[status]}
          </Button>
        ))}
        {canMarkPaid && (
          <Button
            variant="secondary"
            disabled={pending}
            onClick={() => run(() => markPaymentReceived(orderId))}
          >
            Registrar pago recibido
          </Button>
        )}
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
