export const LOCALE = "es-CO";
export const TIME_ZONE = "America/Bogota";

const copFormatter = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
});

/** Formats an integer amount of COP (no cents), e.g. 12500 → "$ 12.500". */
export function formatCOP(amount: number): string {
  if (!Number.isInteger(amount)) {
    throw new Error(`COP amounts must be integers, received ${amount}`);
  }
  return copFormatter.format(amount);
}

const dateFormatter = new Intl.DateTimeFormat(LOCALE, {
  dateStyle: "long",
  timeZone: TIME_ZONE,
});

const dateTimeFormatter = new Intl.DateTimeFormat(LOCALE, {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: TIME_ZONE,
});

/** Date in Colombian time, e.g. "23 de octubre de 2026". */
export function formatDate(date: Date): string {
  return dateFormatter.format(date);
}

/** Date and time in Colombian time. */
export function formatDateTime(date: Date): string {
  return dateTimeFormatter.format(date);
}
