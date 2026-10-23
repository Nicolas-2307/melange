import { describe, expect, it } from "vitest";

import {
  addDays,
  availableDates,
  formatDeliveryDate,
  isDateAvailable,
  todayInBogota,
  type AvailabilityRules,
} from "@/features/checkout/availability";
import { checkoutSchema } from "@/features/checkout/schemas";
import { buildWhatsAppMessage, WhatsAppPaymentProvider } from "@/services/payments/whatsapp";
import type { PaymentOrder } from "@/services/payments/types";

// 2026-10-26 is a Monday.
const MONDAY = "2026-10-26";
const rules: AvailabilityRules = {
  minLeadDays: 1,
  openWeekdays: [0, 2, 3, 4, 5, 6], // closed on Mondays
  blockedDates: ["2026-10-29"],
  maxOrdersPerDay: 2,
  ordersPerDay: { "2026-10-30": 2, "2026-10-31": 1 },
};

describe("todayInBogota", () => {
  it("usa la hora de Bogotá (UTC-5)", () => {
    // 03:00 UTC on the 27th is still the 26th in Bogotá.
    expect(todayInBogota(new Date("2026-10-27T03:00:00Z"))).toBe("2026-10-26");
  });
});

describe("isDateAvailable", () => {
  it("respeta la anticipación mínima", () => {
    expect(isDateAvailable(MONDAY, MONDAY, rules)).toBe(false);
    expect(isDateAvailable(addDays(MONDAY, 1), MONDAY, rules)).toBe(true);
  });

  it("descarta días cerrados, bloqueados y llenos", () => {
    expect(isDateAvailable("2026-11-02", MONDAY, rules)).toBe(false); // Monday
    expect(isDateAvailable("2026-10-29", MONDAY, rules)).toBe(false); // blocked
    expect(isDateAvailable("2026-10-30", MONDAY, rules)).toBe(false); // full (2/2)
    expect(isDateAvailable("2026-10-31", MONDAY, rules)).toBe(true); // 1/2
  });

  it("sin límite diario no cuenta pedidos", () => {
    expect(isDateAvailable("2026-10-30", MONDAY, { ...rules, maxOrdersPerDay: null })).toBe(true);
  });

  it("rechaza formatos inválidos", () => {
    expect(isDateAvailable("30/10/2026", MONDAY, rules)).toBe(false);
  });
});

describe("availableDates", () => {
  it("lista solo los días disponibles, en orden", () => {
    expect(availableDates(MONDAY, rules, 6)).toEqual([
      "2026-10-27",
      "2026-10-28",
      "2026-10-31",
      "2026-11-01",
    ]);
  });
});

describe("formatDeliveryDate", () => {
  it("muestra el día en español", () => {
    expect(formatDeliveryDate("2026-10-31")).toBe("sábado, 31 de octubre");
  });
});

describe("checkoutSchema", () => {
  const base = {
    name: "Ana",
    phone: "+57 300 123 4567",
    email: "ANA@correo.com",
    deliveryDate: "2026-10-31",
  };

  it("normaliza el celular y exige zona y dirección para domicilio", () => {
    const ok = checkoutSchema.parse({
      ...base,
      fulfillmentType: "DELIVERY",
      zoneId: "z1",
      address: "Cra 80 # 45-10",
    });
    expect(ok.phone).toBe("3001234567");
    expect(ok.email).toBe("ana@correo.com");

    const missing = checkoutSchema.safeParse({ ...base, fulfillmentType: "DELIVERY" });
    expect(missing.success).toBe(false);
  });

  it("para recoger no pide dirección", () => {
    expect(checkoutSchema.safeParse({ ...base, fulfillmentType: "PICKUP" }).success).toBe(true);
  });

  it("rechaza celulares que no son colombianos", () => {
    expect(
      checkoutSchema.safeParse({ ...base, phone: "6041234567", fulfillmentType: "PICKUP" }).success,
    ).toBe(false);
  });
});

describe("WhatsApp", () => {
  const order: PaymentOrder = {
    number: 1001,
    reference: "MEL-1001-abcd",
    subtotal: 126500,
    shippingCost: 5000,
    total: 131500,
    customer: { name: "Ana", email: "ana@correo.com", phone: "3001234567" },
    items: [
      {
        productName: "Torta de chocolate",
        variantName: "16 porciones",
        quantity: 1,
        lineTotal: 120000,
      },
      { productName: "Brownie", variantName: "Unidad", quantity: 1, lineTotal: 6500 },
    ],
    fulfillment: {
      type: "DELIVERY",
      zone: "La Floresta, La América, Calasanz",
      address: "Cra 80 # 45-10",
    },
    deliveryDate: "sábado, 31 de octubre",
    notes: "Feliz cumpleaños, Juan",
    orderUrl: "https://melange.test/pedidos/tok",
  };

  it("el mensaje incluye número, productos, total y entrega", () => {
    const message = buildWhatsAppMessage(order);
    expect(message).toContain("pedido #1001");
    expect(message).toContain("1 × Torta de chocolate (16 porciones): $ 120.000");
    expect(message).toContain("Domicilio (La Floresta, La América, Calasanz): $ 5.000");
    expect(message).toContain("Total: $ 131.500");
    expect(message).toContain("Entrega: sábado, 31 de octubre en Cra 80 # 45-10");
    expect(message).toContain("Notas: Feliz cumpleaños, Juan");
    expect(message).not.toContain(" ");
  });

  it("arma el enlace wa.me con el número de la tienda", async () => {
    const action = await new WhatsAppPaymentProvider("573001112233").createPaymentAction(order);
    expect(action.url.startsWith("https://wa.me/573001112233?text=")).toBe(true);
    expect(decodeURIComponent(action.url.split("text=")[1]!)).toContain("pedido #1001");
  });
});
