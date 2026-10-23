import Link from "next/link";

import { formatCOP } from "@/lib/format";

import type { CatalogProduct } from "../types";
import { ProductImage } from "./product-image";

export function ProductCard({ product }: { product: CatalogProduct }) {
  const hasOptions = product.variants.length > 1;
  return (
    <Link href={`/productos/${product.slug}`} className="group flex flex-col gap-3">
      <ProductImage
        product={product}
        sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
      />
      <div>
        <p className="text-xs tracking-wide text-zinc-500 uppercase">{product.category.name}</p>
        <h3 className="font-medium group-hover:underline">{product.name}</h3>
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          {hasOptions ? "Desde " : ""}
          {formatCOP(product.minPrice)}
        </p>
      </div>
    </Link>
  );
}

export function ProductGrid({ products }: { products: CatalogProduct[] }) {
  if (products.length === 0) {
    return (
      <p className="text-zinc-600 dark:text-zinc-400">No hay productos disponibles por ahora.</p>
    );
  }
  return (
    <ul className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <li key={product.id}>
          <ProductCard product={product} />
        </li>
      ))}
    </ul>
  );
}
