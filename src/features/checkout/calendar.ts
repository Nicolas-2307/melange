/** Pure helpers for the month calendar. Days are "YYYY-MM-DD"; months are "YYYY-MM". */

export const WEEKDAY_LABELS = ["L", "M", "X", "J", "V", "S", "D"] as const;
export const WEEKDAY_NAMES = [
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
  "domingo",
] as const;

export function monthOf(day: string): string {
  return day.slice(0, 7);
}

export function shiftMonth(month: string, delta: number): string {
  const [year, monthIndex] = month.split("-").map(Number) as [number, number];
  const date = new Date(Date.UTC(year, monthIndex - 1 + delta, 1));
  return date.toISOString().slice(0, 7);
}

/**
 * Weeks of a month, Monday first (as calendars are read in Colombia).
 * Cells outside the month are null.
 */
export function monthGrid(month: string): (string | null)[][] {
  const [year, monthIndex] = month.split("-").map(Number) as [number, number];
  const first = new Date(Date.UTC(year, monthIndex - 1, 1));
  const daysInMonth = new Date(Date.UTC(year, monthIndex, 0)).getUTCDate();
  const leadingBlanks = (first.getUTCDay() + 6) % 7; // Sunday=0 → 6, Monday=1 → 0

  const cells: (string | null)[] = Array.from({ length: leadingBlanks }, () => null);
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(`${month}-${String(day).padStart(2, "0")}`);
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

/** "octubre de 2026" */
export function formatMonth(month: string): string {
  return new Intl.DateTimeFormat("es-CO", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${month}-01T00:00:00Z`));
}
