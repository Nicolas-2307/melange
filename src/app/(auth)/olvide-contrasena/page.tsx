import type { Metadata } from "next";

import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";

export const metadata: Metadata = { title: "Recuperar contraseña · Melange" };

export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Recuperar contraseña</h1>
      <ForgotPasswordForm />
    </>
  );
}
