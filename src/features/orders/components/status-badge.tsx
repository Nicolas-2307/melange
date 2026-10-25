import type { OrderStatus } from "@/generated/prisma/client";

import { ORDER_STATUS_LABEL, ORDER_STATUS_STYLE } from "../status";

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${ORDER_STATUS_STYLE[status]}`}
    >
      {ORDER_STATUS_LABEL[status]}
    </span>
  );
}
