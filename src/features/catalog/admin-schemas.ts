import { z } from "zod";

/** "Torta de Maracuyá & Café" → "torta-de-maracuya-cafe" */
export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip accents
    .toLowerCase()
    .replace(/ñ/g, "n")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Accepts "65000", "65.000" or "$ 65.000" and returns 65000 (COP, integer). */
export function parseCopInput(value: unknown): unknown {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return value;
  const digits = value.replace(/[^\d]/g, "");
  return digits === "" ? undefined : Number(digits);
}

const slug = z
  .string()
  .trim()
  .min(2, "Mínimo 2 caracteres")
  .max(80, "Máximo 80 caracteres")
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Solo minúsculas, números y guiones (ej. torta-de-chocolate)");

const id = z.string().min(1).max(64);

export const categorySchema = z.object({
  id: id.optional(),
  name: z.string().trim().min(2, "Escribe el nombre").max(60, "Máximo 60 caracteres"),
  slug,
  description: z.string().trim().max(200, "Máximo 200 caracteres").optional(),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
  isActive: z.boolean(),
});

export const variantSchema = z.object({
  id: id.optional(),
  name: z.string().trim().min(1, "Escribe la presentación").max(60, "Máximo 60 caracteres"),
  price: z.preprocess(
    parseCopInput,
    z
      .number({ error: "Escribe el precio" })
      .int()
      .min(500, "El precio mínimo es $ 500")
      .max(10_000_000, "Precio demasiado alto"),
  ),
  isActive: z.boolean(),
});

export const productSchema = z.object({
  id: id.optional(),
  name: z.string().trim().min(2, "Escribe el nombre").max(80, "Máximo 80 caracteres"),
  slug,
  description: z.string().trim().min(10, "Describe el producto (mínimo 10 caracteres)").max(1000),
  categoryId: id.or(z.literal("")).refine((value) => value !== "", "Elige una categoría"),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
  variants: z
    .array(variantSchema)
    .min(1, "Agrega al menos una presentación")
    .max(10, "Máximo 10 presentaciones"),
});

export type CategoryInput = z.input<typeof categorySchema>;
export type ProductInput = z.input<typeof productSchema>;

/** Flattens Zod issues to "field" / "variants.0.price" → message (first message wins). */
export function issuesToFieldErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    errors[issue.path.join(".") || "form"] ??= issue.message;
  }
  return errors;
}
