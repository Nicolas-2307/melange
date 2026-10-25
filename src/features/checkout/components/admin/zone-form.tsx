"use client";

import { useState, useTransition, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";

import { deleteDeliveryZone, saveDeliveryZone } from "../../settings-actions";

type ZoneFormProps = {
  zone?: { id: string; name: string; fee: number; sortOrder: number; isActive: boolean };
};

const feeFormatter = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 });

/** Create (no `zone`) or edit/delete one delivery zone. */
export function ZoneForm({ zone }: ZoneFormProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setSaved(false);
    startTransition(async () => {
      const result = await saveDeliveryZone({
        id: zone?.id,
        name: form.get("name"),
        fee: form.get("fee"),
        sortOrder: form.get("sortOrder"),
        isActive: form.get("isActive") === "on",
      });
      if (!result.ok) {
        setErrors({ ...result.fieldErrors, form: result.error });
        return;
      }
      setErrors({});
      setSaved(true);
      if (!zone) formElement.reset();
    });
  }

  function handleDelete() {
    if (
      !zone ||
      !window.confirm(`¿Eliminar la zona "${zone.name}"? Los pedidos ya hechos no cambian.`)
    ) {
      return;
    }
    startTransition(async () => {
      const result = await deleteDeliveryZone(zone.id);
      if (!result.ok) setErrors({ form: result.error });
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-label={zone ? `Zona ${zone.name}` : "Nueva zona"}
      className="grid items-end gap-3 rounded-xl border border-zinc-200 p-4 sm:grid-cols-[1fr_9rem_5rem_auto] dark:border-zinc-800"
    >
      <TextField label="Zona" name="name" defaultValue={zone?.name} error={errors.name} />
      <TextField
        label="Domicilio (COP)"
        name="fee"
        inputMode="numeric"
        defaultValue={zone ? feeFormatter.format(zone.fee) : ""}
        error={errors.fee}
      />
      <TextField
        label="Orden"
        name="sortOrder"
        type="number"
        min={0}
        defaultValue={zone?.sortOrder ?? 0}
      />
      <label className="flex h-10 items-center gap-2 text-sm">
        <input type="checkbox" name="isActive" defaultChecked={zone?.isActive ?? true} />
        Activa
      </label>
      <div className="flex flex-wrap items-center gap-2 sm:col-span-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando…" : zone ? "Guardar" : "Agregar zona"}
        </Button>
        {zone && (
          <Button type="button" variant="ghost" disabled={pending} onClick={handleDelete}>
            Eliminar
          </Button>
        )}
        <span aria-live="polite" className="text-sm">
          {saved && <span className="text-green-700 dark:text-green-400">Guardado.</span>}
          {errors.form && <span className="text-red-600">{errors.form}</span>}
        </span>
      </div>
    </form>
  );
}
