"use client";

import { useState } from "react";

import { formatDeliveryDate } from "../availability";
import {
  formatMonth,
  monthGrid,
  monthOf,
  shiftMonth,
  WEEKDAY_LABELS,
  WEEKDAY_NAMES,
} from "../calendar";

type DateCalendarProps = {
  /** Selectable days ("YYYY-MM-DD"), sorted. Everything else is disabled. */
  availableDates: string[];
  value: string;
  onChange: (day: string) => void;
  /** Today in Bogotá, highlighted for reference. */
  today: string;
  label: string;
  error?: string;
};

/** Month calendar where only available delivery days can be picked. */
export function DateCalendar({
  availableDates,
  value,
  onChange,
  today,
  label,
  error,
}: DateCalendarProps) {
  const available = new Set(availableDates);
  const firstMonth = monthOf(availableDates[0] ?? today);
  const lastMonth = monthOf(availableDates.at(-1) ?? today);
  const [month, setMonth] = useState(monthOf(value || firstMonth));

  const navButton =
    "flex size-9 items-center justify-center rounded-lg text-lg hover:bg-zinc-100 disabled:opacity-30 disabled:hover:bg-transparent dark:hover:bg-zinc-800";

  return (
    <div className="flex flex-col gap-1.5">
      <span id="delivery-date-label" className="text-sm font-medium">
        {label}
      </span>

      <div
        role="group"
        aria-labelledby="delivery-date-label"
        aria-describedby={error ? "delivery-date-error" : undefined}
        data-invalid={error ? true : undefined}
        className="w-full max-w-sm rounded-xl border border-zinc-300 p-3 data-invalid:border-red-600 dark:border-zinc-700"
      >
        <div className="mb-2 flex items-center justify-between">
          <button
            type="button"
            className={navButton}
            onClick={() => setMonth(shiftMonth(month, -1))}
            disabled={month <= firstMonth}
            aria-label="Mes anterior"
          >
            ‹
          </button>
          <p className="font-medium first-letter:uppercase" aria-live="polite">
            {formatMonth(month)}
          </p>
          <button
            type="button"
            className={navButton}
            onClick={() => setMonth(shiftMonth(month, 1))}
            disabled={month >= lastMonth}
            aria-label="Mes siguiente"
          >
            ›
          </button>
        </div>

        <table className="w-full table-fixed border-collapse text-center text-sm">
          <thead>
            <tr>
              {WEEKDAY_LABELS.map((short, index) => (
                <th key={short} scope="col" className="pb-1 font-normal text-zinc-500">
                  <abbr title={WEEKDAY_NAMES[index]} className="no-underline">
                    {short}
                  </abbr>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {monthGrid(month).map((week) => (
              <tr key={week.find(Boolean)}>
                {week.map((day, index) => {
                  if (!day) return <td key={`blank-${index}`} />;
                  const isAvailable = available.has(day);
                  const isSelected = day === value;
                  return (
                    <td key={day} className="p-0.5">
                      <button
                        type="button"
                        disabled={!isAvailable}
                        aria-pressed={isSelected}
                        aria-label={`${formatDeliveryDate(day)}${isAvailable ? "" : ", no disponible"}`}
                        onClick={() => onChange(day)}
                        className={[
                          "flex aspect-square w-full items-center justify-center rounded-lg tabular-nums transition-colors",
                          isSelected
                            ? "bg-zinc-900 font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
                            : isAvailable
                              ? "font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800"
                              : "cursor-not-allowed text-zinc-400 line-through decoration-zinc-400/50 dark:text-zinc-600",
                          day === today && !isSelected ? "ring-1 ring-zinc-400" : "",
                        ].join(" ")}
                      >
                        {Number(day.slice(8))}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Submitted with the form; the server re-validates the date. */}
      <input type="hidden" name="deliveryDate" value={value} />

      <p className="text-sm text-zinc-600 dark:text-zinc-400" aria-live="polite">
        {value ? (
          <>
            Elegiste:{" "}
            <strong className="first-letter:uppercase">{formatDeliveryDate(value)}</strong>
          </>
        ) : (
          "Toca un día disponible."
        )}
      </p>
      {error && (
        <p id="delivery-date-error" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
