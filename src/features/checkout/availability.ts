import { TIME_ZONE } from "@/lib/format";

/**
 * Delivery dates are plain calendar days ("YYYY-MM-DD") in Bogotá time.
 * Pure functions: the server re-checks the chosen date with the same rules before saving.
 */

export type AvailabilityRules = {
  minLeadDays: number;
  /** 0 = Sunday … 6 = Saturday. */
  openWeekdays: number[];
  /** Blocked days, "YYYY-MM-DD". */
  blockedDates: string[];
  maxOrdersPerDay: number | null;
  /** Orders already booked per day, "YYYY-MM-DD" → count. */
  ordersPerDay: Record<string, number>;
};

/** Today's date in Bogotá, "YYYY-MM-DD" (en-CA formats as ISO). */
export function todayInBogota(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(now);
}

export function addDays(day: string, days: number): string {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function weekday(day: string): number {
  return new Date(`${day}T00:00:00Z`).getUTCDay();
}

export function isDateAvailable(day: string, today: string, rules: AvailabilityRules): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return false;
  if (day < addDays(today, rules.minLeadDays)) return false;
  if (!rules.openWeekdays.includes(weekday(day))) return false;
  if (rules.blockedDates.includes(day)) return false;
  if (rules.maxOrdersPerDay !== null && (rules.ordersPerDay[day] ?? 0) >= rules.maxOrdersPerDay) {
    return false;
  }
  return true;
}

/** Available days from today up to `horizonDays` ahead, in order. */
export function availableDates(
  today: string,
  rules: AvailabilityRules,
  horizonDays = 30,
): string[] {
  const days: string[] = [];
  for (let offset = 0; offset <= horizonDays; offset++) {
    const day = addDays(today, offset);
    if (isDateAvailable(day, today, rules)) days.push(day);
  }
  return days;
}

/** "sábado, 25 de octubre" */
export function formatDeliveryDate(day: string): string {
  return new Intl.DateTimeFormat("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(`${day}T00:00:00Z`));
}
