"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";

import { authClient } from "../client";
import { authErrorMessage } from "../errors";
import { safeRedirectPath } from "../redirect";
import { fieldErrors, signInSchema } from "../schemas";

export function SignInForm() {
  const next = safeRedirectPath(useSearchParams().get("next"));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = signInSchema.safeParse(Object.fromEntries(new FormData(event.currentTarget)));
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));

    setErrors({});
    setPending(true);
    const { error } = await authClient.signIn.email(parsed.data);
    if (error) {
      setPending(false);
      return setErrors({ form: authErrorMessage(error) });
    }

    // Full page load so every server component re-renders with the new session.
    window.location.assign(next);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <TextField
        label="Correo"
        name="email"
        type="email"
        autoComplete="email"
        error={errors.email}
      />
      <TextField
        label="Contraseña"
        name="password"
        type="password"
        autoComplete="current-password"
        error={errors.password}
      />
      {errors.form && (
        <p role="alert" className="text-sm text-red-600">
          {errors.form}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? "Ingresando…" : "Ingresar"}
      </Button>
      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        ¿No tienes cuenta?{" "}
        <Link href={`/registro?next=${encodeURIComponent(next)}`} className="font-medium underline">
          Crea una
        </Link>
      </p>
    </form>
  );
}
