"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";

import { saveCategory } from "../../admin-actions";
import { slugify } from "../../admin-schemas";

type CategoryFormProps = {
  category?: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    sortOrder: number;
    isActive: boolean;
  };
};

/** Create (no `category`) or edit one category. */
export function CategoryForm({ category }: CategoryFormProps) {
  const router = useRouter();
  const [name, setName] = useState(category?.name ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(category));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setSaved(false);
    startTransition(async () => {
      const result = await saveCategory({
        id: category?.id,
        name,
        slug,
        description: form.get("description"),
        sortOrder: form.get("sortOrder"),
        isActive: form.get("isActive") === "on",
      });
      if (!result.ok) {
        setErrors({ ...result.fieldErrors, form: result.error });
        return;
      }
      setErrors({});
      setSaved(true);
      if (!category) {
        setName("");
        setSlug("");
        setSlugTouched(false);
        formElement.reset();
      }
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-label={category ? `Editar ${category.name}` : "Nueva categoría"}
      className="grid gap-3 rounded-xl border border-zinc-200 p-4 sm:grid-cols-2 dark:border-zinc-800"
    >
      <TextField
        label="Nombre"
        value={name}
        onChange={(event) => {
          setName(event.target.value);
          if (!slugTouched) setSlug(slugify(event.target.value));
        }}
        error={errors.name}
      />
      <TextField
        label="Dirección (slug)"
        value={slug}
        onChange={(event) => {
          setSlugTouched(true);
          setSlug(event.target.value);
        }}
        error={errors.slug}
      />
      <TextField
        label="Descripción (opcional)"
        name="description"
        defaultValue={category?.description ?? ""}
        error={errors.description}
      />
      <TextField
        label="Orden"
        name="sortOrder"
        type="number"
        min={0}
        defaultValue={category?.sortOrder ?? 0}
        error={errors.sortOrder}
      />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isActive" defaultChecked={category?.isActive ?? true} />
        Visible en la tienda
      </label>
      <div className="flex items-center gap-3 sm:justify-end">
        <span aria-live="polite" className="text-sm">
          {saved && <span className="text-green-700 dark:text-green-400">Guardado.</span>}
          {errors.form && <span className="text-red-600">{errors.form}</span>}
        </span>
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando…" : category ? "Guardar" : "Crear categoría"}
        </Button>
      </div>
    </form>
  );
}
