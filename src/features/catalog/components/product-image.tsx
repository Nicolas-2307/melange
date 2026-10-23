import Image from "next/image";

import { productCoverImage } from "../mappers";
import type { CatalogProduct } from "../types";

type ProductImageProps = {
  product: Pick<CatalogProduct, "name" | "images" | "category">;
  sizes: string;
  priority?: boolean;
};

export function ProductImage({ product, sizes, priority }: ProductImageProps) {
  const image = productCoverImage(product);
  return (
    <div className="relative aspect-square overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-900">
      <Image
        src={image.url}
        alt={image.alt}
        fill
        sizes={sizes}
        priority={priority}
        // Local SVG placeholders don't need (and can't use) the image optimizer.
        unoptimized={image.url.endsWith(".svg")}
        className="object-cover"
      />
    </div>
  );
}
