import { describe, expect, it } from "vitest";

import { catalogPaths, productJsonLd, serializeJsonLd } from "@/features/catalog/seo";
import type { CatalogProduct } from "@/features/catalog/types";

const SITE = "https://melange.example";

const product: CatalogProduct = {
  id: "p1",
  name: "Torta de chocolate",
  slug: "torta-de-chocolate",
  description: "Húmeda",
  isFeatured: true,
  category: { name: "Tortas", slug: "tortas" },
  images: [],
  variants: [
    { id: "v1", name: "8 porciones", price: 65000 },
    { id: "v2", name: "16 porciones", price: 120000 },
  ],
  minPrice: 65000,
};

describe("catalogPaths", () => {
  it("incluye inicio, catálogo, categorías y productos", () => {
    expect(catalogPaths(["tortas"], ["brownie"])).toEqual([
      "/",
      "/productos",
      "/categorias/tortas",
      "/productos/brownie",
    ]);
  });
});

describe("productJsonLd", () => {
  it("usa un rango de precios en COP con varias presentaciones", () => {
    const data = productJsonLd(product, SITE);
    expect(data.url).toBe(`${SITE}/productos/torta-de-chocolate`);
    expect(data.image[0]).toMatch(/^https:\/\/melange\.example\/images\//);
    expect(data.offers).toMatchObject({
      "@type": "AggregateOffer",
      lowPrice: 65000,
      highPrice: 120000,
      offerCount: 2,
      priceCurrency: "COP",
    });
  });

  it("usa una oferta simple con una sola presentación", () => {
    const single = { ...product, variants: [product.variants[0]] };
    expect(productJsonLd(single, SITE).offers).toMatchObject({
      "@type": "Offer",
      price: 65000,
      priceCurrency: "COP",
    });
  });

  it("respeta URLs absolutas de imágenes (Cloudinary)", () => {
    const withImage = {
      ...product,
      images: [{ url: "https://res.cloudinary.com/x/torta.jpg", alt: "Torta" }],
    };
    expect(productJsonLd(withImage, SITE).image).toEqual([
      "https://res.cloudinary.com/x/torta.jpg",
    ]);
  });
});

describe("serializeJsonLd", () => {
  it("escapa < para que no cierre la etiqueta script", () => {
    expect(serializeJsonLd({ name: "</script><script>alert(1)" })).not.toContain("</script>");
  });
});
