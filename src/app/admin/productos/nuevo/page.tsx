import Link from "next/link";
import { Suspense } from "react";

import { AdminSkeleton } from "@/components/layout/admin-skeleton";
import { requireAdmin } from "@/features/auth/session";
import { listCategoriesAdmin } from "@/features/catalog/admin-queries";
import { ProductForm } from "@/features/catalog/components/admin/product-form";

export default function NewProductPage() {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <NewProductPageContent />
    </Suspense>
  );
}

// Session + database reads stay inside Suspense so panel navigation can be instant.
async function NewProductPageContent() {
  await requireAdmin();
  const categories = await listCategoriesAdmin();

  return (
    <>
      <div className="flex flex-col gap-2">
        <Link href="/admin/productos" className="text-sm text-zinc-500 hover:underline">
          ← Productos
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Nuevo producto</h1>
      </div>
      <ProductForm categories={categories} />
    </>
  );
}
