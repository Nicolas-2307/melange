import type { Metadata } from "next";
import { Suspense } from "react";

import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";

export const metadata: Metadata = { title: "Nueva contraseña · Melange", robots: { index: false } };

export default function ResetPasswordPage() {
  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Nueva contraseña</h1>
      {/* The form reads ?token= from the URL: request-time data. */}
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </>
  );
}
