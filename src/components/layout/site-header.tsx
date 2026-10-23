import Link from "next/link";
import { Suspense } from "react";

import { SignOutButton } from "@/features/auth/components/sign-out-button";
import { getSession } from "@/features/auth/session";

export function SiteHeader() {
  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Melange
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          {/* Session is per-request: stream it in so the rest of the page can be prerendered. */}
          <Suspense fallback={<span className="h-10 w-24" />}>
            <UserMenu />
          </Suspense>
        </nav>
      </div>
    </header>
  );
}

async function UserMenu() {
  const session = await getSession();

  if (!session) {
    return (
      <>
        <Link
          href="/ingresar"
          className="rounded-lg px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          Ingresar
        </Link>
        <Link
          href="/registro"
          className="rounded-lg bg-zinc-900 px-3 py-2 text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
        >
          Crear cuenta
        </Link>
      </>
    );
  }

  return (
    <>
      <span className="text-zinc-600 dark:text-zinc-400">Hola, {session.user.name}</span>
      {session.user.role === "ADMIN" && (
        <Link
          href="/admin"
          className="rounded-lg px-3 py-2 font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          Panel
        </Link>
      )}
      <SignOutButton />
    </>
  );
}
