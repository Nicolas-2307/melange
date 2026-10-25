export type CatalogImage = { url: string; alt: string };

export type CatalogVariant = { id: string; name: string; price: number };

export type CatalogCategory = { name: string; slug: string; description: string | null };

export type CatalogProduct = {
  id: string;
  name: string;
  slug: string;
  description: string;
  isFeatured: boolean;
  category: Pick<CatalogCategory, "name" | "slug">;
  images: CatalogImage[];
  /** Active variants, in the order the owner set (sortOrder). */
  variants: CatalogVariant[];
  /** Lowest active variant price (COP), shown as "Desde $X". */
  minPrice: number;
};
