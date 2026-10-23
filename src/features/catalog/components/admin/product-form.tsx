"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";

import { saveProduct } from "../../admin-actions";
import type { ProductAdmin } from "../../admin-queries";
import { slugify } from "../../admin-schemas";

type VariantRow = { key: string; id?: string; name: string; price: string; isActive: boolean };

type ProductFormProps = {
  categories: { id: string; name: string }[];
  product?: ProductAdmin;
};

const fieldClass =
  "rounded-lg border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 aria-invalid:border-red-600 dark:border-zinc-700 dark:bg-zinc-900";

// Shown as "65.000"; parseCopInput accepts it back.
const priceFormatter = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 });

let nextKey = 0;
const newRow = (row?: Partial<VariantRow>): VariantRow => ({
  key: `row-${nextKey++}`,
  name: "",
  price: "",
  isActive: true,
  ...row,
});

export function ProductForm({ categories, product }: ProductFormProps) {
  const router = useRouter();
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  // New products derive the URL from the name until the owner edits it by hand.
  const [slugTouched, setSlugTouched] = useState(Boolean(product));
  const [variants, setVariants] = useState<VariantRow[]>(
    product?.variants.map((v) =>
      newRow({
        id: v.id,
        name: v.name,
        price: priceFormatter.format(v.price),
        isActive: v.isActive,
      }),
    ) ?? [newRow()],
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  const updateVariant = (key: string, patch: Partial<VariantRow>) =>
    setVariants((rows) => rows.map((row) => (row.key === key ? { ...row, ...patch } : row)));

  const moveVariant = (index: number, delta: -1 | 1) =>
    setVariants((rows) => {
      const next = [...rows];
      const [row] = next.splice(index, 1);
      next.splice(index + delta, 0, row!);
      return next;
    });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const input = {
      id: product?.id,
      name,
      slug,
      description: form.get("description"),
      categoryId: form.get("categoryId"),
      isActive: form.get("isActive") === "on",
      isFeatured: form.get("isFeatured") === "on",
      variants: variants.map(({ id, name, price, isActive }) => ({ id, name, price, isActive })),
    };
    setSaved(false);
    startTransition(async () => {
      const result = await saveProduct(input);
      if (!result.ok) {
        setErrors({ ...result.fieldErrors, form: result.error });
        return;
      }
      setErrors({});
      if (product) {
        setSaved(true);
        router.refresh();
      } else {
        router.push(`/admin/productos/${result.id}?creado=1`);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex max-w-2xl flex-col gap-6">
      <TextField
        label="Nombre"
        name="name"
        value={name}
        onChange={(event) => {
          setName(event.target.value);
          if (!slugTouched) setSlug(slugify(event.target.value));
        }}
        error={errors.name}
      />
      <TextField
        label="Dirección en la tienda (slug)"
        name="slug"
        value={slug}
        onChange={(event) => {
          setSlugTouched(true);
          setSlug(event.target.value);
        }}
        error={errors.slug}
      />
      <p className="-mt-4 text-xs text-zinc-500">
        Se verá como /productos/{slug || "…"}. Cambiarla rompe los enlaces ya compartidos.
      </p>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="description" className="text-sm font-medium">
          Descripción
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={product?.description}
          aria-invalid={errors.description ? true : undefined}
          className={`${fieldClass} p-3`}
        />
        {errors.description && <p className="text-sm text-red-600">{errors.description}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="categoryId" className="text-sm font-medium">
          Categoría
        </label>
        <select
          id="categoryId"
          name="categoryId"
          defaultValue={product?.categoryId ?? ""}
          aria-invalid={errors.categoryId ? true : undefined}
          className={`${fieldClass} h-10`}
        >
          <option value="">Elige una categoría</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        {errors.categoryId && <p className="text-sm text-red-600">{errors.categoryId}</p>}
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-sm font-medium">Presentaciones y precios</legend>
        <p className="text-xs text-zinc-500">
          Ej. «8 porciones» $ 65.000, «Caja x12» $ 33.000. El orden es el que verá el cliente.
        </p>
        {variants.map((variant, index) => (
          <div
            key={variant.key}
            className="flex flex-wrap items-start gap-2 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
          >
            <div className="min-w-40 flex-1">
              <TextField
                label="Presentación"
                value={variant.name}
                onChange={(event) => updateVariant(variant.key, { name: event.target.value })}
                error={errors[`variants.${index}.name`]}
              />
            </div>
            <div className="w-36">
              <TextField
                label="Precio (COP)"
                inputMode="numeric"
                value={variant.price}
                onChange={(event) => updateVariant(variant.key, { price: event.target.value })}
                error={errors[`variants.${index}.price`]}
              />
            </div>
            <label className="mt-8 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={variant.isActive}
                onChange={(event) => updateVariant(variant.key, { isActive: event.target.checked })}
              />
              Disponible
            </label>
            <div className="mt-7 flex gap-1">
              <Button
                type="button"
                variant="ghost"
                aria-label={`Subir ${variant.name || "presentación"}`}
                disabled={index === 0}
                onClick={() => moveVariant(index, -1)}
              >
                ↑
              </Button>
              <Button
                type="button"
                variant="ghost"
                aria-label={`Bajar ${variant.name || "presentación"}`}
                disabled={index === variants.length - 1}
                onClick={() => moveVariant(index, 1)}
              >
                ↓
              </Button>
              <Button
                type="button"
                variant="ghost"
                aria-label={`Quitar ${variant.name || "presentación"}`}
                disabled={variants.length === 1}
                onClick={() => setVariants((rows) => rows.filter((row) => row.key !== variant.key))}
              >
                ✕
              </Button>
            </div>
          </div>
        ))}
        {errors.variants && <p className="text-sm text-red-600">{errors.variants}</p>}
        <Button
          type="button"
          variant="secondary"
          className="w-fit"
          disabled={variants.length >= 10}
          onClick={() => setVariants((rows) => [...rows, newRow()])}
        >
          + Agregar presentación
        </Button>
      </fieldset>

      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isActive" defaultChecked={product?.isActive ?? true} />
          Visible en la tienda
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isFeatured" defaultChecked={product?.isFeatured ?? false} />
          Destacado en la página de inicio
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending} className="h-11 px-6">
          {pending ? "Guardando…" : product ? "Guardar cambios" : "Crear producto"}
        </Button>
        <div aria-live="polite" className="text-sm">
          {saved && <span className="text-green-700 dark:text-green-400">Cambios guardados.</span>}
          {errors.form && <span className="text-red-600">{errors.form}</span>}
        </div>
      </div>
    </form>
  );
}
