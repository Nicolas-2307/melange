import { db } from "@/lib/db";

/** Owner-side catalog reads: include inactive items. Callers must check `requireAdmin()`. */

export async function listCategoriesAdmin() {
  return db.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      sortOrder: true,
      isActive: true,
      _count: { select: { products: true } },
    },
  });
}

export async function listProductsAdmin() {
  return db.product.findMany({
    orderBy: [{ category: { sortOrder: "asc" } }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      isActive: true,
      isFeatured: true,
      category: { select: { name: true } },
      variants: { orderBy: { sortOrder: "asc" }, select: { price: true, isActive: true } },
      _count: { select: { images: true } },
    },
  });
}

export async function getProductAdmin(id: string) {
  return db.product.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      categoryId: true,
      isActive: true,
      isFeatured: true,
      variants: {
        orderBy: { sortOrder: "asc" },
        select: { id: true, name: true, price: true, isActive: true },
      },
    },
  });
}

export type ProductAdmin = NonNullable<Awaited<ReturnType<typeof getProductAdmin>>>;
