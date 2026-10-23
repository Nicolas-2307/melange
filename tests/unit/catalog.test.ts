import { describe, expect, it } from "vitest";

import { productCoverImage, toCatalogProduct } from "@/features/catalog/mappers";

const row = {
  id: "p1",
  name: "Torta de chocolate",
  slug: "torta-de-chocolate",
  description: "Húmeda",
  isFeatured: true,
  category: { name: "Tortas", slug: "tortas" },
  images: [],
  variants: [
    { id: "v1", name: "16 porciones", price: 120000 },
    { id: "v2", name: "8 porciones", price: 65000 },
  ],
};

describe("toCatalogProduct", () => {
  it("calcula el precio mínimo entre variantes", () => {
    expect(toCatalogProduct(row)?.minPrice).toBe(65000);
  });

  it("conserva el orden de variantes definido por el dueño", () => {
    expect(toCatalogProduct(row)?.variants.map((v) => v.name)).toEqual([
      "16 porciones",
      "8 porciones",
    ]);
  });

  it("descarta productos sin variantes activas", () => {
    expect(toCatalogProduct({ ...row, variants: [] })).toBeNull();
  });
});

describe("productCoverImage", () => {
  it("usa la primera foto si existe", () => {
    const image = { url: "https://res.cloudinary.com/x/torta.jpg", alt: "Torta" };
    expect(productCoverImage({ ...row, images: [image] })).toEqual(image);
  });

  it("usa la ilustración de la categoría si no hay fotos", () => {
    expect(productCoverImage(row).url).toBe("/images/placeholders/torta.svg");
  });

  it("usa una ilustración genérica para categorías nuevas", () => {
    const product = { ...row, category: { name: "Panes", slug: "panes" } };
    expect(productCoverImage(product).url).toBe("/images/placeholders/postre.svg");
  });
});
