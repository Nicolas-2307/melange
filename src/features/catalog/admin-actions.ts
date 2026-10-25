"use server";

import { updateTag } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/features/auth/session";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";

import { categorySchema, issuesToFieldErrors, productSchema } from "./admin-schemas";
import { CATALOG_TAG } from "./queries";

export type SaveResult =
  { ok: true; id: string } | { ok: false; error: string; fieldErrors?: Record<string, string> };

const DUPLICATE_SLUG: SaveResult = {
  ok: false,
  error: "Ya existe otro con esa dirección (slug).",
  fieldErrors: { slug: "Ya está en uso, elige otra" },
};

const isUniqueViolation = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";

export async function saveCategory(input: unknown): Promise<SaveResult> {
  await requireAdmin();
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisa los datos.",
      fieldErrors: issuesToFieldErrors(parsed.error),
    };
  }
  const { id, description, ...data } = parsed.data;
  const values = { ...data, description: description || null };

  try {
    const saved = id
      ? await db.category.update({ where: { id }, data: values, select: { id: true } })
      : await db.category.create({ data: values, select: { id: true } });
    updateTag(CATALOG_TAG);
    return { ok: true, id: saved.id };
  } catch (error) {
    if (isUniqueViolation(error)) return DUPLICATE_SLUG;
    throw error;
  }
}

/**
 * Creates or updates a product with its presentations (variants), in one transaction.
 * A removed variant that was already ordered is deactivated instead of deleted, so order
 * history keeps pointing at it.
 */
export async function saveProduct(input: unknown): Promise<SaveResult> {
  await requireAdmin();
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisa los datos.",
      fieldErrors: issuesToFieldErrors(parsed.error),
    };
  }
  const { id, variants, ...product } = parsed.data;

  const category = await db.category.findUnique({
    where: { id: product.categoryId },
    select: { id: true },
  });
  if (!category)
    return {
      ok: false,
      error: "Elige una categoría válida.",
      fieldErrors: { categoryId: "Elige una categoría" },
    };

  try {
    const savedId = await db.$transaction(async (tx) => {
      const saved = id
        ? await tx.product.update({ where: { id }, data: product, select: { id: true } })
        : await tx.product.create({ data: product, select: { id: true } });

      const existing = await tx.productVariant.findMany({
        where: { productId: saved.id },
        select: { id: true, _count: { select: { orderItems: true } } },
      });
      const keptIds = new Set(variants.flatMap((variant) => (variant.id ? [variant.id] : [])));

      for (const old of existing) {
        if (keptIds.has(old.id)) continue;
        if (old._count.orderItems > 0) {
          await tx.productVariant.update({ where: { id: old.id }, data: { isActive: false } });
        } else {
          await tx.productVariant.delete({ where: { id: old.id } });
        }
      }

      const existingIds = new Set(existing.map((variant) => variant.id));
      for (const [sortOrder, variant] of variants.entries()) {
        const data = {
          name: variant.name,
          price: variant.price,
          isActive: variant.isActive,
          sortOrder,
        };
        if (variant.id && existingIds.has(variant.id)) {
          await tx.productVariant.update({ where: { id: variant.id }, data });
        } else {
          await tx.productVariant.create({ data: { ...data, productId: saved.id } });
        }
      }
      return saved.id;
    });

    updateTag(CATALOG_TAG);
    return { ok: true, id: savedId };
  } catch (error) {
    if (isUniqueViolation(error)) return DUPLICATE_SLUG;
    throw error;
  }
}

/** Quick show/hide from the products list. */
export async function setProductActive(productId: string, isActive: boolean): Promise<SaveResult> {
  await requireAdmin();
  const parsed = z
    .object({ productId: z.string().min(1).max(64), isActive: z.boolean() })
    .safeParse({ productId, isActive });
  if (!parsed.success) return { ok: false, error: "Datos no válidos." };

  await db.product.update({
    where: { id: parsed.data.productId },
    data: { isActive: parsed.data.isActive },
  });
  updateTag(CATALOG_TAG);
  return { ok: true, id: parsed.data.productId };
}
