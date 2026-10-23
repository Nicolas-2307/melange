import { describe, expect, it } from "vitest";

import { deliveryZoneSchema, storeSettingsSchema } from "@/features/checkout/settings-schemas";

describe("storeSettingsSchema", () => {
  const valid = {
    pickupAddress: "Parque de La Floresta, Medellín",
    minLeadDays: "1",
    openWeekdays: ["2", "3", "0", "2"],
    maxOrdersPerDay: "",
  };

  it("convierte los valores del formulario", () => {
    const settings = storeSettingsSchema.parse(valid);
    expect(settings.minLeadDays).toBe(1);
    expect(settings.openWeekdays).toEqual([0, 2, 3]); // sin repetidos y ordenados
    expect(settings.maxOrdersPerDay).toBeNull(); // vacío = sin límite
  });

  it("exige al menos un día de trabajo", () => {
    expect(storeSettingsSchema.safeParse({ ...valid, openWeekdays: [] }).success).toBe(false);
  });

  it("acepta un límite diario y rechaza valores inválidos", () => {
    expect(storeSettingsSchema.parse({ ...valid, maxOrdersPerDay: "8" }).maxOrdersPerDay).toBe(8);
    expect(storeSettingsSchema.safeParse({ ...valid, maxOrdersPerDay: "0" }).success).toBe(false);
    expect(storeSettingsSchema.safeParse({ ...valid, minLeadDays: "-1" }).success).toBe(false);
  });
});

describe("deliveryZoneSchema", () => {
  it("acepta valores con puntos y permite domicilio gratis", () => {
    expect(deliveryZoneSchema.parse({ name: "Laureles", fee: "8.000", isActive: true }).fee).toBe(
      8000,
    );
    expect(deliveryZoneSchema.parse({ name: "La Floresta", fee: "0", isActive: true }).fee).toBe(0);
  });

  it("exige nombre y valor", () => {
    expect(deliveryZoneSchema.safeParse({ name: "", fee: "5000", isActive: true }).success).toBe(
      false,
    );
    expect(deliveryZoneSchema.safeParse({ name: "Belén", fee: "", isActive: true }).success).toBe(
      false,
    );
  });
});
