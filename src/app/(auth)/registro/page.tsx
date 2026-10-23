import type { Metadata } from "next";
import { Suspense } from "react";

import { SignUpForm } from "@/features/auth/components/sign-up-form";

export const metadata: Metadata = { title: "Crear cuenta · Melange" };

export default function SignUpPage() {
  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Crear cuenta</h1>
      <Suspense>
        <SignUpForm />
      </Suspense>
    </>
  );
}
