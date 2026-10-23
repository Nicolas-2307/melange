import { cacheLife, cacheTag } from "next/cache";

import { db } from "@/lib/db";

import { toCatalogProduct } from "./mappers";
import type { CatalogCategory, CatalogProduct } from "./types";

/**
 * Catalog reads are cached (saves Neon compute on the free plan). Every admin change to
 * products/categories must call `updateTag(CATALOG_TAG)` so customers see it right away.
 */
export const CATALOG_TAG = "catalog";

const productInclude = {
  category: { select: { name: true, slug: true } },
  images: { orderBy: { sortOrder: "asc" }, select: { url: true, alt: true } },
  variants: {
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true, price: true },
  },
} as const;

const visibleProduct = { isActive: true, category: { isActive: true } } as const;

function compact(rows: Parameters<typeof toCatalogProduct>[0][]): CatalogProduct[] {
  return rows.map(toCatalogProduct).filter((product) => product !== null);
}

export async function getCategories(): Promise<CatalogCategory[]> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("hours");

  return db.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { name: true, slug: true, description: true },
  });
}

export async function getCategory(slug: string): Promise<CatalogCategory | null> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("hours");

  return db.category.findFirst({
    where: { slug, isActive: true },
    select: { name: true, slug: true, description: true },
  });
}

export async function getProducts(categorySlug?: string): Promise<CatalogProduct[]> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("hours");

  const rows = await db.product.findMany({
    where: {
      ...visibleProduct,
      ...(categorySlug ? { category: { slug: categorySlug, isActive: true } } : {}),
    },
    orderBy: [{ category: { sortOrder: "asc" } }, { name: "asc" }],
    include: productInclude,
  });
  return compact(rows);
}

export async function getFeaturedProducts(): Promise<CatalogProduct[]> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("hours");

  const rows = await db.product.findMany({
    where: { ...visibleProduct, isFeatured: true },
    orderBy: { name: "asc" },
    take: 6,
    include: productInclude,
  });
  return compact(rows);
}

export async function getProductBySlug(slug: string): Promise<CatalogProduct | null> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("hours");

  const row = await db.product.findFirst({
    where: { ...visibleProduct, slug },
    include: productInclude,
  });
  return row ? toCatalogProduct(row) : null;
}
