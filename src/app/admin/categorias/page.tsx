import Link from "next/link";
import { Suspense } from "react";

import { AdminSkeleton } from "@/components/layout/admin-skeleton";
import { requireAdmin } from "@/features/auth/session";
import { listCategoriesAdmin } from "@/features/catalog/admin-queries";
import { CategoryForm } from "@/features/catalog/components/admin/category-form";

export default function AdminCategoriesPage() {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <AdminCategoriesPageContent />
    </Suspense>
  );
}

// Session + database reads stay inside Suspense so panel navigation can be instant.
async function AdminCategoriesPageContent() {
  await requireAdmin();
  const categories = await listCategoriesAdmin();

  return (
    <>
      <div className="flex flex-col gap-2">
        <Link href="/admin/productos" className="text-sm text-zinc-500 hover:underline">
          ← Productos
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Categorías</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Las categorías ocultas no aparecen en la tienda, ni tampoco sus productos.
        </p>
      </div>

      <section aria-labelledby="new-category" className="flex flex-col gap-3">
        <h2 id="new-category" className="text-lg font-semibold">
          Nueva categoría
        </h2>
        <CategoryForm />
      </section>

      <section aria-labelledby="existing-categories" className="flex flex-col gap-3">
        <h2 id="existing-categories" className="text-lg font-semibold">
          Categorías existentes
        </h2>
        {categories.map((category) => (
          <div key={category.id} className="flex flex-col gap-1">
            <p className="text-sm text-zinc-500">
              {category._count.products} {category._count.products === 1 ? "producto" : "productos"}
            </p>
            <CategoryForm category={category} />
          </div>
        ))}
      </section>
    </>
  );
}
