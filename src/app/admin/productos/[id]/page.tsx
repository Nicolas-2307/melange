import Link from "next/link";
import { notFound } from "next/navigation";

import { requireAdmin } from "@/features/auth/session";
import { getProductAdmin, listCategoriesAdmin } from "@/features/catalog/admin-queries";
import { ProductForm } from "@/features/catalog/components/admin/product-form";

export default async function EditProductPage({
  params,
  searchParams,
}: PageProps<"/admin/productos/[id]">) {
  await requireAdmin();
  const [product, categories] = await Promise.all([
    getProductAdmin((await params).id),
    listCategoriesAdmin(),
  ]);
  if (!product) notFound();
  const justCreated = (await searchParams).creado === "1";

  return (
    <>
      <div className="flex flex-col gap-2">
        <Link href="/admin/productos" className="text-sm text-zinc-500 hover:underline">
          ← Productos
        </Link>
        <div className="flex flex-wrap items-baseline gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{product.name}</h1>
          <Link href={`/productos/${product.slug}`} target="_blank" className="text-sm underline">
            Ver en la tienda
          </Link>
        </div>
        {justCreated && (
          <p role="status" className="text-sm text-green-700 dark:text-green-400">
            Producto creado. Las fotos se agregan en el siguiente paso (Cloudinary).
          </p>
        )}
      </div>
      <ProductForm key={product.id} categories={categories} product={product} />
    </>
  );
}
