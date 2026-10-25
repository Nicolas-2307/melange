/** Pure cart rules (no database), shared by server actions and tests. */

export const MAX_QUANTITY_PER_ITEM = 20;

/** Keeps a quantity within 1..MAX_QUANTITY_PER_ITEM. */
export function clampQuantity(quantity: number): number {
  if (!Number.isFinite(quantity)) return 1;
  return Math.min(MAX_QUANTITY_PER_ITEM, Math.max(1, Math.trunc(quantity)));
}

type Line = { variantId: string; quantity: number };

/**
 * Combines a guest cart into a user's cart (on sign-in). Same variant → quantities add up,
 * capped at the maximum. Returns the final quantity per variant.
 */
export function mergeLines(target: Line[], source: Line[]): Line[] {
  const merged = new Map(target.map((line) => [line.variantId, line.quantity]));
  for (const line of source) {
    merged.set(line.variantId, clampQuantity((merged.get(line.variantId) ?? 0) + line.quantity));
  }
  return [...merged].map(([variantId, quantity]) => ({ variantId, quantity }));
}

/** Subtotal in COP and number of units. */
export function cartTotals(lines: { unitPrice: number; quantity: number }[]) {
  return lines.reduce(
    (totals, line) => ({
      subtotal: totals.subtotal + line.unitPrice * line.quantity,
      itemCount: totals.itemCount + line.quantity,
    }),
    { subtotal: 0, itemCount: 0 },
  );
}
