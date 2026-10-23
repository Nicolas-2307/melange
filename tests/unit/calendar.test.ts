import { describe, expect, it } from "vitest";

import { formatMonth, monthGrid, monthOf, shiftMonth } from "@/features/checkout/calendar";

describe("monthGrid", () => {
  it("empieza la semana en lunes", () => {
    // October 2026 starts on a Thursday → 3 blanks (Mon, Tue, Wed).
    const [firstWeek] = monthGrid("2026-10");
    expect(firstWeek).toEqual([
      null,
      null,
      null,
      "2026-10-01",
      "2026-10-02",
      "2026-10-03",
      "2026-10-04",
    ]);
  });

  it("incluye todos los días del mes en semanas completas", () => {
    const weeks = monthGrid("2026-02");
    const days = weeks.flat().filter(Boolean);
    expect(days).toHaveLength(28);
    expect(days.at(-1)).toBe("2026-02-28");
    expect(weeks.every((week) => week.length === 7)).toBe(true);
  });

  it("un mes que empieza en domingo deja seis espacios", () => {
    // November 2026 starts on a Sunday.
    expect(monthGrid("2026-11")[0]?.filter((cell) => cell === null)).toHaveLength(6);
  });
});

describe("shiftMonth y monthOf", () => {
  it("avanza y retrocede cruzando años", () => {
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
    expect(monthOf("2026-10-31")).toBe("2026-10");
  });
});

describe("formatMonth", () => {
  it("muestra el mes en español", () => {
    expect(formatMonth("2026-10")).toBe("octubre de 2026");
  });
});
