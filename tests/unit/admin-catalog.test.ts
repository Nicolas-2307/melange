import { describe, expect, it } from "vitest";

import {
  issuesToFieldErrors,
  parseCopInput,
  productSchema,
  slugify,
} from "@/features/catalog/admin-schemas";

describe("slugify", () => {
  it("quita tildes, eñes y símbolos", () => {
    expect(slugify("Torta de Maracuyá & Café")).toBe("torta-de-maracuya-cafe");
    expect(slugify("  Piñata   de  Año Nuevo! ")).toBe("pinata-de-ano-nuevo");
  });
});

describe("parseCopInput", () => {
  it("acepta precios escritos de varias formas", () => {
    expect(parseCopInput("65000")).toBe(65000);
    expect(parseCopInput("65.000")).toBe(65000);
    expect(parseCopInput("$ 65.000")).toBe(65000);
    expect(parseCopInput("")).toBeUndefined();
  });
});

describe("productSchema", () => {
  const valid = {
    name: "Torta de prueba",
    slug: "torta-de-prueba",
    description: "Una torta deliciosa de prueba",
    categoryId: "cat1",
    isActive: true,
    isFeatured: false,
    variants: [{ name: "8 porciones", price: "65.000", isActive: true }],
  };

  it("acepta un producto válido y convierte el precio a entero", () => {
    const product = productSchema.parse(valid);
    expect(product.variants[0]?.price).toBe(65000);
  });

  it("exige al menos una presentación y precios válidos", () => {
    expect(productSchema.safeParse({ ...valid, variants: [] }).success).toBe(false);
    const cheap = productSchema.safeParse({
      ...valid,
      variants: [{ name: "x", price: "100", isActive: true }],
    });
    expect(cheap.success).toBe(false);
    expect(issuesToFieldErrors(cheap.error!)["variants.0.price"]).toBe("El precio mínimo es $ 500");
  });

  it("rechaza slugs con mayúsculas o espacios", () => {
    expect(productSchema.safeParse({ ...valid, slug: "Torta de prueba" }).success).toBe(false);
  });

  it("exige elegir categoría", () => {
    const result = productSchema.safeParse({ ...valid, categoryId: "" });
    expect(issuesToFieldErrors(result.error!).categoryId).toBe("Elige una categoría");
  });
});
