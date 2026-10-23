import type { Metadata } from "next";
import { Suspense } from "react";

import { SignInForm } from "@/features/auth/components/sign-in-form";

export const metadata: Metadata = { title: "Ingresar · Melange" };

export default function SignInPage() {
  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Ingresar</h1>
      {/* The form reads ?next= from the URL, which is request-time data. */}
      <Suspense>
        <SignInForm />
      </Suspense>
    </>
  );
}
