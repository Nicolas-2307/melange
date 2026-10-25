import Link from "next/link";

import { ProductGrid } from "@/features/catalog/components/product-card";
import { getCategories, getFeaturedProducts } from "@/features/catalog/queries";

export default async function HomePage() {
  const [featured, categories] = await Promise.all([getFeaturedProducts(), getCategories()]);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-16 px-4 py-12">
      <section className="flex flex-col items-start gap-4 py-8">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Melange</h1>
        <p className="max-w-xl text-lg text-zinc-600 dark:text-zinc-400">
          Postres, galletas y tortas hechos con cariño, por encargo y para cada celebración.
        </p>
        <Link
          href="/productos"
          className="rounded-lg bg-zinc-900 px-5 py-3 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Ver productos
        </Link>
      </section>

      {featured.length > 0 && (
        <section aria-labelledby="featured-title" className="flex flex-col gap-6">
          <h2 id="featured-title" className="text-2xl font-semibold tracking-tight">
            Destacados
          </h2>
          <ProductGrid products={featured} />
        </section>
      )}

      {categories.length > 0 && (
        <section aria-labelledby="categories-title" className="flex flex-col gap-6">
          <h2 id="categories-title" className="text-2xl font-semibold tracking-tight">
            Categorías
          </h2>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {categories.map((category) => (
              <li key={category.slug}>
                <Link
                  href={`/categorias/${category.slug}`}
                  className="flex h-full flex-col gap-1 rounded-xl border border-zinc-200 p-5 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
                >
                  <span className="font-medium">{category.name}</span>
                  {category.description && (
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">
                      {category.description}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
