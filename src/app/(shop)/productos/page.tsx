import type { Metadata } from "next";

import { CategoryNav } from "@/features/catalog/components/category-nav";
import { ProductGrid } from "@/features/catalog/components/product-card";
import { getCategories, getProducts } from "@/features/catalog/queries";

export const metadata: Metadata = {
  title: "Productos · Melange",
  description: "Tortas, galletas y postres por encargo.",
};

export default async function ProductsPage() {
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Productos</h1>
      <CategoryNav categories={categories} />
      <ProductGrid products={products} />
    </main>
  );
}
