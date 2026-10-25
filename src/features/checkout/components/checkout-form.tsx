"use client";

import { useState, useTransition, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { PrivacyConsent } from "@/components/ui/privacy-consent";
import { TextField } from "@/components/ui/text-field";
import { formatCOP } from "@/lib/format";

import { placeOrder } from "../actions";
import type { DeliveryZoneOption } from "../store";
import { DateCalendar } from "./date-calendar";

type CheckoutFormProps = {
  zones: DeliveryZoneOption[];
  /** Selectable delivery days, "YYYY-MM-DD". */
  availableDates: string[];
  today: string;
  pickupAddress: string;
  subtotal: number;
  defaults: { name: string; email: string };
};

const selectClass =
  "h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 aria-invalid:border-red-600 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-100";

export function CheckoutForm({
  zones,
  availableDates,
  today,
  pickupAddress,
  subtotal,
  defaults,
}: CheckoutFormProps) {
  const [fulfillment, setFulfillment] = useState<"DELIVERY" | "PICKUP">("DELIVERY");
  const [zoneId, setZoneId] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  // Display only: the server recomputes every amount before saving the order.
  const shipping =
    fulfillment === "DELIVERY" ? (zones.find((zone) => zone.id === zoneId)?.fee ?? 0) : 0;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = Object.fromEntries(new FormData(event.currentTarget));
    startTransition(async () => {
      const result = await placeOrder({ ...form, fulfillmentType: fulfillment });
      if (result.ok) {
        // Full load: the header's cart counter must reflect the now-empty cart.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.assign(`/pedidos/${result.token}`);
        return;
      }
      setErrors({ ...result.fieldErrors, form: result.error });
    });
  }

  const fieldError = (name: string) => errors[name];

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-10 md:grid-cols-[1fr_18rem]">
      <div className="flex flex-col gap-8">
        <fieldset className="flex flex-col gap-4">
          <legend className="mb-2 text-lg font-semibold">Tus datos</legend>
          <TextField
            label="Nombre"
            name="name"
            autoComplete="name"
            defaultValue={defaults.name}
            error={fieldError("name")}
          />
          <TextField
            label="Celular (WhatsApp)"
            name="phone"
            type="tel"
            autoComplete="tel-national"
            placeholder="3001234567"
            error={fieldError("phone")}
          />
          <TextField
            label="Correo"
            name="email"
            type="email"
            autoComplete="email"
            defaultValue={defaults.email}
            error={fieldError("email")}
          />
        </fieldset>

        <fieldset className="flex flex-col gap-4">
          <legend className="mb-2 text-lg font-semibold">Entrega</legend>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Tipo de entrega">
            {(
              [
                ["DELIVERY", "Domicilio"],
                ["PICKUP", "Recoger en la sede"],
              ] as const
            ).map(([value, label]) => (
              <label
                key={value}
                className="cursor-pointer rounded-lg border border-zinc-300 px-4 py-2 text-sm has-checked:border-zinc-900 has-checked:bg-zinc-900 has-checked:text-white has-focus-visible:ring-2 has-focus-visible:ring-zinc-900/40 dark:border-zinc-700 dark:has-checked:border-zinc-100 dark:has-checked:bg-zinc-100 dark:has-checked:text-zinc-900"
              >
                <input
                  type="radio"
                  name="fulfillmentChoice"
                  value={value}
                  checked={fulfillment === value}
                  onChange={() => setFulfillment(value)}
                  className="sr-only"
                />
                {label}
              </label>
            ))}
          </div>

          {fulfillment === "DELIVERY" ? (
            <>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="zoneId" className="text-sm font-medium">
                  Zona
                </label>
                <select
                  id="zoneId"
                  name="zoneId"
                  value={zoneId}
                  onChange={(event) => setZoneId(event.target.value)}
                  aria-invalid={fieldError("zoneId") ? true : undefined}
                  className={selectClass}
                >
                  <option value="">Elige tu zona</option>
                  {zones.map((zone) => (
                    <option key={zone.id} value={zone.id}>
                      {zone.name} · {formatCOP(zone.fee)}
                    </option>
                  ))}
                </select>
                {fieldError("zoneId") && (
                  <p className="text-sm text-red-600">{fieldError("zoneId")}</p>
                )}
              </div>
              <TextField
                label="Dirección"
                name="address"
                autoComplete="street-address"
                placeholder="Calle, número, apartamento, barrio"
                error={fieldError("address")}
              />
            </>
          ) : (
            <p className="rounded-lg bg-zinc-100 p-3 text-sm dark:bg-zinc-900">
              Recoges tu pedido en <strong>{pickupAddress}</strong>. Te confirmaremos la hora por
              WhatsApp.
            </p>
          )}

          <DateCalendar
            label={fulfillment === "DELIVERY" ? "Fecha de entrega" : "Fecha de recogida"}
            availableDates={availableDates}
            today={today}
            value={deliveryDate}
            onChange={setDeliveryDate}
            error={fieldError("deliveryDate")}
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="notes" className="text-sm font-medium">
              Notas (opcional)
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              maxLength={500}
              placeholder="Mensaje para la torta, alergias, indicaciones…"
              className="rounded-lg border border-zinc-300 bg-white p-3 text-sm outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>
        </fieldset>

        <PrivacyConsent error={fieldError("privacyAccepted")} />
      </div>

      <aside className="flex h-fit flex-col gap-3 rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
        <h2 className="text-lg font-semibold">Resumen</h2>
        <div className="flex justify-between text-sm">
          <span>Subtotal</span>
          <span>{formatCOP(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Domicilio</span>
          <span>{fulfillment === "PICKUP" ? "Gratis" : zoneId ? formatCOP(shipping) : "—"}</span>
        </div>
        <div className="flex justify-between border-t border-zinc-200 pt-3 font-semibold dark:border-zinc-800">
          <span>Total</span>
          <span data-testid="checkout-total">{formatCOP(subtotal + shipping)}</span>
        </div>
        {errors.form && (
          <p role="alert" className="text-sm text-red-600">
            {errors.form}
          </p>
        )}
        <Button type="submit" disabled={pending} className="h-12">
          {pending ? "Creando pedido…" : "Hacer pedido"}
        </Button>
        <p className="text-xs text-zinc-500">
          Después de crear el pedido lo envías por WhatsApp y acordamos el pago.
        </p>
      </aside>
    </form>
  );
}
