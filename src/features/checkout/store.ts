import { db } from "@/lib/db";

import { availableDates, todayInBogota, type AvailabilityRules } from "./availability";

export type DeliveryZoneOption = { id: string; name: string; fee: number };

/** All zones, including hidden ones (admin only). */
export async function getAllDeliveryZones() {
  return db.deliveryZone.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, fee: true, sortOrder: true, isActive: true },
  });
}

/** Active delivery zones, in the owner's order. */
export async function getDeliveryZones(): Promise<DeliveryZoneOption[]> {
  return db.deliveryZone.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true, fee: true },
  });
}

export async function getStoreSettings() {
  const settings = await db.storeSettings.findUnique({ where: { id: 1 } });
  if (!settings) throw new Error("Store settings missing: run `npm run db:seed`.");
  return settings;
}

export async function getPickupAddress(): Promise<string> {
  return (await getStoreSettings()).pickupAddress;
}

/** Availability rules with today's bookings, ready for the pure functions in availability.ts. */
export async function getAvailability(today = todayInBogota()) {
  const settings = await getStoreSettings();
  const from = new Date(`${today}T00:00:00Z`);

  const [blocked, booked] = await Promise.all([
    db.blockedDate.findMany({ where: { date: { gte: from } }, select: { date: true } }),
    settings.maxOrdersPerDay === null
      ? Promise.resolve([])
      : db.order.groupBy({
          by: ["deliveryDate"],
          where: { deliveryDate: { gte: from }, status: { not: "CANCELLED" } },
          _count: { _all: true },
        }),
  ]);

  const rules: AvailabilityRules = {
    minLeadDays: settings.minLeadDays,
    openWeekdays: settings.openWeekdays,
    blockedDates: blocked.map(({ date }) => date.toISOString().slice(0, 10)),
    maxOrdersPerDay: settings.maxOrdersPerDay,
    ordersPerDay: Object.fromEntries(
      booked.map((row) => [row.deliveryDate.toISOString().slice(0, 10), row._count._all]),
    ),
  };

  return {
    today,
    rules,
    dates: availableDates(today, rules),
    pickupAddress: settings.pickupAddress,
  };
}
