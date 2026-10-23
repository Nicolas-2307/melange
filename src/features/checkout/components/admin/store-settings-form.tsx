"use client";

import { useState, useTransition, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";

import { saveStoreSettings } from "../../settings-actions";
import { WEEKDAYS } from "../../settings-schemas";

type StoreSettingsFormProps = {
  settings: {
    pickupAddress: string;
    minLeadDays: number;
    openWeekdays: number[];
    maxOrdersPerDay: number | null;
  };
};

export function StoreSettingsForm({ settings }: StoreSettingsFormProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaved(false);
    startTransition(async () => {
      const result = await saveStoreSettings({
        pickupAddress: form.get("pickupAddress"),
        minLeadDays: form.get("minLeadDays"),
        openWeekdays: form.getAll("openWeekdays"),
        maxOrdersPerDay: form.get("maxOrdersPerDay"),
      });
      if (!result.ok) {
        setErrors({ ...result.fieldErrors, form: result.error });
        return;
      }
      setErrors({});
      setSaved(true);
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-label="Disponibilidad y sede"
      className="flex max-w-2xl flex-col gap-5"
    >
      <TextField
        label="Dirección de la sede (para recoger)"
        name="pickupAddress"
        defaultValue={settings.pickupAddress}
        error={errors.pickupAddress}
      />

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium">Días en que entregas o atiendes</legend>
        <div className="flex flex-wrap gap-2">
          {WEEKDAYS.map((day) => (
            <label
              key={day.value}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-300 px-3 py-2 text-sm has-checked:border-zinc-900 has-checked:bg-zinc-900 has-checked:text-white dark:border-zinc-700 dark:has-checked:border-zinc-100 dark:has-checked:bg-zinc-100 dark:has-checked:text-zinc-900"
            >
              <input
                type="checkbox"
                name="openWeekdays"
                value={day.value}
                defaultChecked={settings.openWeekdays.includes(day.value)}
                className="sr-only"
              />
              {day.label}
            </label>
          ))}
        </div>
        {errors.openWeekdays && <p className="text-sm text-red-600">{errors.openWeekdays}</p>}
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <TextField
            label="Anticipación mínima (días)"
            name="minLeadDays"
            type="number"
            min={0}
            max={30}
            defaultValue={settings.minLeadDays}
            error={errors.minLeadDays}
          />
          <p className="text-xs text-zinc-500">0 = se puede pedir para hoy. 1 = desde mañana.</p>
        </div>
        <div className="flex flex-col gap-1">
          <TextField
            label="Máximo de pedidos por día"
            name="maxOrdersPerDay"
            type="number"
            min={1}
            defaultValue={settings.maxOrdersPerDay ?? ""}
            placeholder="Sin límite"
            error={errors.maxOrdersPerDay}
          />
          <p className="text-xs text-zinc-500">Déjalo vacío para no limitar.</p>
        </div>
      </div>

      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Las fechas puntuales (festivos, vacaciones) se bloquean desde el Calendario.
      </p>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando…" : "Guardar disponibilidad"}
        </Button>
        <span aria-live="polite" className="text-sm">
          {saved && <span className="text-green-700 dark:text-green-400">Guardado.</span>}
          {errors.form && <span className="text-red-600">{errors.form}</span>}
        </span>
      </div>
    </form>
  );
}
