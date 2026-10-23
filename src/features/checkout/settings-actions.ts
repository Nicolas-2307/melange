"use server";

import { refresh } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/features/auth/session";
import { issuesToFieldErrors } from "@/features/catalog/admin-schemas";
import { db } from "@/lib/db";

import { deliveryZoneSchema, storeSettingsSchema } from "./settings-schemas";

export type SettingsResult =
  { ok: true } | { ok: false; error: string; fieldErrors?: Record<string, string> };

const invalid = (error: z.ZodError): SettingsResult => ({
  ok: false,
  error: "Revisa los datos.",
  fieldErrors: issuesToFieldErrors(error),
});

/** Availability rules and pickup point. The checkout reads them on every visit. */
export async function saveStoreSettings(input: unknown): Promise<SettingsResult> {
  await requireAdmin();
  const parsed = storeSettingsSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  await db.storeSettings.upsert({
    where: { id: 1 },
    update: parsed.data,
    create: { id: 1, ...parsed.data },
  });
  refresh();
  return { ok: true };
}

export async function saveDeliveryZone(input: unknown): Promise<SettingsResult> {
  await requireAdmin();
  const parsed = deliveryZoneSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const { id, ...data } = parsed.data;
  if (id) {
    await db.deliveryZone.update({ where: { id }, data });
  } else {
    await db.deliveryZone.create({ data });
  }
  refresh();
  return { ok: true };
}

/** Orders keep a copy of the zone name, so deleting a zone never changes past orders. */
export async function deleteDeliveryZone(zoneId: string): Promise<SettingsResult> {
  await requireAdmin();
  const id = z.string().min(1).max(64).safeParse(zoneId);
  if (!id.success) return { ok: false, error: "Datos no válidos." };

  await db.deliveryZone.deleteMany({ where: { id: id.data } });
  refresh();
  return { ok: true };
}
