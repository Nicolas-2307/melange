import Link from "next/link";

import { requireAdmin } from "@/features/auth/session";
import { listProductsAdmin } from "@/features/catalog/admin-queries";
import { ProductActiveToggle } from "@/features/catalog/components/admin/product-active-toggle";
import { formatCOP } from "@/lib/format";

export default async function AdminProductsPage() {
  await requireAdmin();
  const products = await listProductsAdmin();

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Productos</h1>
        <div className="flex gap-2">
          <Link
            href="/admin/categorias"
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Categorías
          </Link>
          <Link
            href="/admin/productos/nuevo"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
          >
            Nuevo producto
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-800">
            <tr>
              <th scope="col" className="py-2 pr-3 font-medium">
                Producto
              </th>
              <th scope="col" className="py-2 pr-3 font-medium">
                Categoría
              </th>
              <th scope="col" className="py-2 pr-3 font-medium">
                Precio
              </th>
              <th scope="col" className="py-2 pr-3 font-medium">
                Fotos
              </th>
              <th scope="col" className="py-2 font-medium">
                En la tienda
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {products.map((product) => {
              const prices = product.variants.filter((v) => v.isActive).map((v) => v.price);
              return (
                <tr key={product.id}>
                  <td className="py-2 pr-3">
                    <Link href={`/admin/productos/${product.id}`} className="font-medium underline">
                      {product.name}
                    </Link>
                    {product.isFeatured && (
                      <span className="ml-2 text-xs text-amber-600">★ Destacado</span>
                    )}
                  </td>
                  <td className="py-2 pr-3">{product.category.name}</td>
                  <td className="py-2 pr-3 tabular-nums">
                    {prices.length === 0
                      ? "Sin presentaciones"
                      : `${prices.length > 1 ? "Desde " : ""}${formatCOP(Math.min(...prices))}`}
                  </td>
                  <td className="py-2 pr-3 tabular-nums">{product._count.images}</td>
                  <td className="py-2">
                    <ProductActiveToggle productId={product.id} isActive={product.isActive} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
