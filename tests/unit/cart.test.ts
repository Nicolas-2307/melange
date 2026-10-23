import { describe, expect, it } from "vitest";

import {
  cartTotals,
  clampQuantity,
  MAX_QUANTITY_PER_ITEM,
  mergeLines,
} from "@/features/cart/rules";

describe("clampQuantity", () => {
  it("mantiene la cantidad entre 1 y el máximo", () => {
    expect(clampQuantity(0)).toBe(1);
    expect(clampQuantity(-3)).toBe(1);
    expect(clampQuantity(5)).toBe(5);
    expect(clampQuantity(500)).toBe(MAX_QUANTITY_PER_ITEM);
  });

  it("descarta decimales y valores inválidos", () => {
    expect(clampQuantity(2.7)).toBe(2);
    expect(clampQuantity(Number.NaN)).toBe(1);
  });
});

describe("mergeLines", () => {
  it("suma cantidades de la misma variante y agrega las nuevas", () => {
    const merged = mergeLines(
      [{ variantId: "a", quantity: 2 }],
      [
        { variantId: "a", quantity: 3 },
        { variantId: "b", quantity: 1 },
      ],
    );
    expect(merged).toEqual([
      { variantId: "a", quantity: 5 },
      { variantId: "b", quantity: 1 },
    ]);
  });

  it("no supera el máximo por ítem", () => {
    const merged = mergeLines(
      [{ variantId: "a", quantity: 15 }],
      [{ variantId: "a", quantity: 10 }],
    );
    expect(merged).toEqual([{ variantId: "a", quantity: MAX_QUANTITY_PER_ITEM }]);
  });
});

describe("cartTotals", () => {
  it("calcula subtotal en COP y número de unidades", () => {
    expect(
      cartTotals([
        { unitPrice: 65000, quantity: 2 },
        { unitPrice: 6500, quantity: 3 },
      ]),
    ).toEqual({ subtotal: 149500, itemCount: 5 });
  });

  it("un carrito vacío suma cero", () => {
    expect(cartTotals([])).toEqual({ subtotal: 0, itemCount: 0 });
  });
});
