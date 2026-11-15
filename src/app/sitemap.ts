import type { MetadataRoute } from "next";

import { getCategories, getProducts } from "@/features/catalog/queries";
import { catalogPaths } from "@/features/catalog/seo";
import { env } from "@/lib/env";

// Built from the cached catalog reads: admin changes (updateTag) refresh it too.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, products] = await Promise.all([getCategories(), getProducts()]);
  return catalogPaths(
    categories.map((category) => category.slug),
    products.map((product) => product.slug),
  ).map((path) => ({ url: new URL(path, env.SITE_URL).toString() }));
}
