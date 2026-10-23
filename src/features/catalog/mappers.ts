import type { CatalogImage, CatalogProduct, CatalogVariant } from "./types";

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  description: string;
  isFeatured: boolean;
  category: { name: string; slug: string };
  images: CatalogImage[];
  variants: CatalogVariant[];
};

/** Shapes a DB row for the UI. Returns null when the product has nothing to sell. */
export function toCatalogProduct(row: ProductRow): CatalogProduct | null {
  if (row.variants.length === 0) return null;
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    isFeatured: row.isFeatured,
    category: { name: row.category.name, slug: row.category.slug },
    images: row.images.map(({ url, alt }) => ({ url, alt })),
    variants: row.variants.map(({ id, name, price }) => ({ id, name, price })),
    minPrice: Math.min(...row.variants.map((variant) => variant.price)),
  };
}

const PLACEHOLDERS: Record<string, string> = {
  tortas: "/images/placeholders/torta.svg",
  galletas: "/images/placeholders/galleta.svg",
  postres: "/images/placeholders/postre.svg",
};

/** First product photo, or a category illustration until real photos are uploaded (Paso 5). */
export function productCoverImage(product: Pick<CatalogProduct, "name" | "images" | "category">) {
  const [first] = product.images;
  if (first) return first;
  return {
    url: PLACEHOLDERS[product.category.slug] ?? "/images/placeholders/postre.svg",
    alt: `Ilustración de ${product.name}`,
  };
}
