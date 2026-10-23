import { z } from "zod";

import { parseCopInput } from "@/features/catalog/admin-schemas";

const optionalLimit = z.preprocess(
  (value) => (value === "" || value === null || value === undefined ? null : value),
  z.coerce
    .number({ error: "Escribe un número" })
    .int("Escribe un número entero")
    .min(1, "Mínimo 1 pedido por día")
    .max(500, "Máximo 500")
    .nullable(),
);

export const storeSettingsSchema = z.object({
  pickupAddress: z.string().trim().min(5, "Escribe la dirección de la sede").max(200),
  minLeadDays: z.coerce
    .number({ error: "Escribe un número" })
    .int()
    .min(0, "Mínimo 0 (el mismo día)")
    .max(30, "Máximo 30 días"),
  openWeekdays: z
    .array(z.coerce.number().int().min(0).max(6))
    .min(1, "Elige al menos un día de trabajo")
    .transform((days) => [...new Set(days)].sort()),
  maxOrdersPerDay: optionalLimit,
});

export const deliveryZoneSchema = z.object({
  id: z.string().min(1).max(64).optional(),
  name: z.string().trim().min(2, "Escribe el nombre de la zona").max(80, "Máximo 80 caracteres"),
  fee: z.preprocess(
    parseCopInput,
    z
      .number({ error: "Escribe el valor del domicilio" })
      .int()
      .min(0, "No puede ser negativo")
      .max(500_000, "Valor demasiado alto"),
  ),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
  isActive: z.boolean(),
});

/** Monday-first, as shown to the owner. */
export const WEEKDAYS = [
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
  { value: 0, label: "Domingo" },
] as const;
