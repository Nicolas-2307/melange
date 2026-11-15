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

/** How far ahead customers can book: the calendar shows these days and the server enforces it. */
export const BOOKING_HORIZON_DAYS = 30;

/**
 * True for a real calendar day written as "YYYY-MM-DD". JavaScript quietly turns impossible
 * days into later ones ("2027-04-31" becomes May 1st), which would skip blocked days and the
 * daily limit, so the text must survive a round trip unchanged.
 */
export function isRealDay(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

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
  if (!isRealDay(day)) return false;
  if (day < addDays(today, rules.minLeadDays)) return false;
  if (day > addDays(today, BOOKING_HORIZON_DAYS)) return false;
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
  horizonDays = BOOKING_HORIZON_DAYS,
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
