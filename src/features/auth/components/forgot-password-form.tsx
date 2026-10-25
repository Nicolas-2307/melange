"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";

import { authClient } from "../client";
import { authErrorMessage } from "../errors";
import { fieldErrors, forgotPasswordSchema } from "../schemas";

export function ForgotPasswordForm() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = forgotPasswordSchema.safeParse(
      Object.fromEntries(new FormData(event.currentTarget)),
    );
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));

    setErrors({});
    setPending(true);
    const { error } = await authClient.requestPasswordReset({
      email: parsed.data.email,
      redirectTo: "/restablecer",
    });
    setPending(false);
    // Only rate limiting is reported; the answer never reveals whether the email has an account.
    if (error?.status === 429) return setErrors({ form: authErrorMessage(error) });
    setSent(true);
  }

  if (sent) {
    return (
      <div role="status" className="flex flex-col gap-4">
        <p>
          Si existe una cuenta con ese correo, te enviamos un enlace para crear una contraseña
          nueva. Revisa también la carpeta de spam. El enlace vale 1 hora.
        </p>
        <Link href="/ingresar" className="font-medium underline">
          Volver a ingresar
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Escribe el correo de tu cuenta y te enviaremos un enlace para crear una contraseña nueva.
      </p>
      <TextField
        label="Correo"
        name="email"
        type="email"
        autoComplete="email"
        error={errors.email}
      />
      {errors.form && (
        <p role="alert" className="text-sm text-red-600">
          {errors.form}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? "Enviando…" : "Enviar enlace"}
      </Button>
      <Link href="/ingresar" className="text-center text-sm underline">
        Volver a ingresar
      </Link>
    </form>
  );
}
