import { describe, expect, it } from "vitest";

import { formatCOP, formatDate } from "@/lib/format";

// Intl uses a non-breaking space between "$" and the number; normalize it for readable assertions.
const normalize = (s: string) => s.replace(/\s/g, " ");

describe("formatCOP", () => {
  it("formats integers with dot thousands separator and no decimals", () => {
    expect(normalize(formatCOP(12500))).toBe("$ 12.500");
    expect(normalize(formatCOP(1250000))).toBe("$ 1.250.000");
  });

  it("rejects non-integer amounts", () => {
    expect(() => formatCOP(10.5)).toThrow();
  });
});

describe("formatDate", () => {
  it("uses Bogotá time zone (UTC-5)", () => {
    // 2026-01-01 03:00 UTC is still Dec 31 in Bogotá
    expect(formatDate(new Date("2026-01-01T03:00:00Z"))).toBe("31 de diciembre de 2025");
  });
});
