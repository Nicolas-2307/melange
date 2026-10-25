import { describe, expect, it } from "vitest";

import { canTransition, nextStatuses } from "@/features/orders/status";

describe("estados del pedido", () => {
  it("avanza un paso a la vez", () => {
    expect(nextStatuses("PENDING")).toEqual(["CONFIRMED", "CANCELLED"]);
    expect(canTransition("CONFIRMED", "PREPARING")).toBe(true);
    expect(canTransition("PREPARING", "READY")).toBe(true);
    expect(canTransition("READY", "COMPLETED")).toBe(true);
  });

  it("no permite saltarse pasos ni retroceder", () => {
    expect(canTransition("PENDING", "COMPLETED")).toBe(false);
    expect(canTransition("READY", "PREPARING")).toBe(false);
  });

  it("se puede cancelar hasta antes de entregar", () => {
    expect(canTransition("READY", "CANCELLED")).toBe(true);
    expect(canTransition("COMPLETED", "CANCELLED")).toBe(false);
  });

  it("entregado y cancelado son finales", () => {
    expect(nextStatuses("COMPLETED")).toEqual([]);
    expect(nextStatuses("CANCELLED")).toEqual([]);
  });
});
