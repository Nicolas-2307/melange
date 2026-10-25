import { productCoverImage } from "./mappers";
import type { CatalogProduct } from "./types";

/** Paths of the store that search engines may list (relative to the site URL). */
export function catalogPaths(categorySlugs: string[], productSlugs: string[]): string[] {
  return [
    "/",
    "/productos",
    ...categorySlugs.map((slug) => `/categorias/${slug}`),
    ...productSlugs.map((slug) => `/productos/${slug}`),
  ];
}

/**
 * schema.org `Product` for rich results. Several presentations become an `AggregateOffer`
 * (price range); prices are whole COP.
 */
export function productJsonLd(product: CatalogProduct, siteUrl: string) {
  const url = new URL(`/productos/${product.slug}`, siteUrl).toString();
  const prices = product.variants.map((variant) => variant.price);
  const availability = "https://schema.org/InStock";

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: [new URL(productCoverImage(product).url, siteUrl).toString()],
    category: product.category.name,
    brand: { "@type": "Brand", name: "Melange" },
    url,
    offers:
      prices.length === 1
        ? { "@type": "Offer", price: prices[0], priceCurrency: "COP", availability, url }
        : {
            "@type": "AggregateOffer",
            lowPrice: Math.min(...prices),
            highPrice: Math.max(...prices),
            offerCount: prices.length,
            priceCurrency: "COP",
            availability,
            url,
          },
  };
}

/** JSON for a `<script type="application/ld+json">`, safe against `</script>` injection. */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
