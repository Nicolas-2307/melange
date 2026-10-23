import { z } from "zod";

/** Colombian mobile number: 10 digits starting with 3. Spaces, dashes and +57 are accepted. */
const phone = z
  .string()
  .transform((value) => value.replace(/[\s-]/g, "").replace(/^\+?57(?=3\d{9}$)/, ""))
  .pipe(
    z.string().regex(/^3\d{9}$/, "Escribe un celular colombiano de 10 dígitos (ej. 3001234567)"),
  );

const base = {
  name: z.string().trim().min(2, "Escribe tu nombre").max(80, "Máximo 80 caracteres"),
  phone,
  email: z.string().trim().toLowerCase().pipe(z.email("Escribe un correo válido")),
  deliveryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Elige una fecha"),
  notes: z.string().trim().max(500, "Máximo 500 caracteres").optional(),
};

export const checkoutSchema = z.discriminatedUnion("fulfillmentType", [
  z.object({
    ...base,
    fulfillmentType: z.literal("DELIVERY"),
    zoneId: z.string().min(1, "Elige tu zona"),
    address: z
      .string()
      .trim()
      .min(5, "Escribe la dirección completa")
      .max(200, "Máximo 200 caracteres"),
  }),
  z.object({ ...base, fulfillmentType: z.literal("PICKUP") }),
]);

export type CheckoutInput = z.infer<typeof checkoutSchema>;
