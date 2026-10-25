"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";

import { authClient } from "../client";
import { authErrorMessage } from "../errors";
import { fieldErrors, resetPasswordSchema } from "../schemas";

/** Reached from the email link: Better Auth redirects here with ?token=… or ?error=INVALID_TOKEN. */
export function ResetPasswordForm() {
  const params = useSearchParams();
  const token = params.get("token");
  const linkError = params.get("error");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  if (!token || linkError) {
    return (
      <div role="alert" className="flex flex-col gap-4">
        <p>El enlace no es válido o ya venció. Pide uno nuevo.</p>
        <Link href="/olvide-contrasena" className="font-medium underline">
          Pedir otro enlace
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div role="status" className="flex flex-col gap-4">
        <p>Listo, tu contraseña cambió. Por seguridad cerramos las sesiones abiertas.</p>
        <Link href="/ingresar" className="font-medium underline">
          Ingresar con la contraseña nueva
        </Link>
      </div>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = resetPasswordSchema.safeParse(
      Object.fromEntries(new FormData(event.currentTarget)),
    );
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));

    setErrors({});
    setPending(true);
    const { error } = await authClient.resetPassword({
      newPassword: parsed.data.password,
      token: token!,
    });
    setPending(false);
    if (error) return setErrors({ form: authErrorMessage(error) });
    setDone(true);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <TextField
        label="Contraseña nueva"
        name="password"
        type="password"
        autoComplete="new-password"
        error={errors.password}
      />
      <TextField
        label="Confirmar contraseña"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        error={errors.confirmPassword}
      />
      {errors.form && (
        <p role="alert" className="text-sm text-red-600">
          {errors.form}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? "Guardando…" : "Guardar contraseña"}
      </Button>
    </form>
  );
}
