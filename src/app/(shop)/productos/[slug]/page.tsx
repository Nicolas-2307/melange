import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ProductImage } from "@/features/catalog/components/product-image";
import { VariantPicker } from "@/features/catalog/components/variant-picker";
import { productCoverImage } from "@/features/catalog/mappers";
import { getProductBySlug } from "@/features/catalog/queries";
import { productJsonLd, serializeJsonLd } from "@/features/catalog/seo";
import { env } from "@/lib/env";

export async function generateMetadata({
  params,
}: PageProps<"/productos/[slug]">): Promise<Metadata> {
  const product = await getProductBySlug((await params).slug);
  if (!product) return {};
  const image = productCoverImage(product);
  return {
    title: `${product.name} · Melange`,
    description: product.description,
    alternates: { canonical: `/productos/${product.slug}` },
    openGraph: { title: product.name, description: product.description, images: [image.url] },
  };
}

export default function ProductPage({ params }: PageProps<"/productos/[slug]">) {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-12">
      <Suspense fallback={<p className="text-zinc-500">Cargando…</p>}>
        <ProductDetail params={params} />
      </Suspense>
    </main>
  );
}

async function ProductDetail({ params }: Pick<PageProps<"/productos/[slug]">, "params">) {
  const product = await getProductBySlug((await params).slug);
  if (!product) notFound();

  return (
    <div className="grid gap-10 md:grid-cols-2">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(productJsonLd(product, env.SITE_URL)) }}
      />
      <ProductImage product={product} sizes="(min-width: 768px) 50vw, 100vw" priority />
      <div className="flex flex-col gap-6">
        <nav aria-label="Ruta" className="text-sm text-zinc-500">
          <Link href="/productos" className="hover:underline">
            Productos
          </Link>
          {" / "}
          <Link href={`/categorias/${product.category.slug}`} className="hover:underline">
            {product.category.name}
          </Link>
        </nav>
        <h1 className="text-3xl font-semibold tracking-tight">{product.name}</h1>
        <p className="text-zinc-700 dark:text-zinc-300">{product.description}</p>
        <VariantPicker variants={product.variants} />
      </div>
    </div>
  );
}
