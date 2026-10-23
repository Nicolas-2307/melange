import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { CategoryNav } from "@/features/catalog/components/category-nav";
import { ProductGrid } from "@/features/catalog/components/product-card";
import { getCategories, getCategory, getProducts } from "@/features/catalog/queries";

export async function generateMetadata({
  params,
}: PageProps<"/categorias/[slug]">): Promise<Metadata> {
  const category = await getCategory((await params).slug);
  return category
    ? { title: `${category.name} · Melange`, description: category.description ?? undefined }
    : {};
}

export default function CategoryPage({ params }: PageProps<"/categorias/[slug]">) {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-12">
      {/* params are read inside Suspense so the page shell can be prerendered (Cache Components). */}
      <Suspense fallback={<p className="text-zinc-500">Cargando…</p>}>
        <CategoryContent params={params} />
      </Suspense>
    </main>
  );
}

async function CategoryContent({ params }: Pick<PageProps<"/categorias/[slug]">, "params">) {
  const { slug } = await params;
  const [category, categories, products] = await Promise.all([
    getCategory(slug),
    getCategories(),
    getProducts(slug),
  ]);
  if (!category) notFound();

  return (
    <>
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">{category.name}</h1>
        {category.description && (
          <p className="text-zinc-600 dark:text-zinc-400">{category.description}</p>
        )}
      </div>
      <CategoryNav categories={categories} current={category.slug} />
      <ProductGrid products={products} />
    </>
  );
}
