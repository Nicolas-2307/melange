import Link from "next/link";
import { Suspense } from "react";

import { AccountMenu } from "@/components/layout/account-menu";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import { getSession } from "@/features/auth/session";
import { getCartItemCount } from "@/features/cart/cart";

export function SiteHeader() {
  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Melange
        </Link>
        <nav className="flex items-center gap-1 text-sm whitespace-nowrap sm:gap-2">
          {/* Session is per-request: stream it in so the rest of the page can be prerendered. */}
          <Suspense fallback={<span className="h-10 w-24" />}>
            <UserMenu />
          </Suspense>
          <Suspense fallback={<CartLink />}>
            <CartLinkWithCount />
          </Suspense>
        </nav>
      </div>
    </header>
  );
}

async function CartLinkWithCount() {
  return <CartLink count={await getCartItemCount()} />;
}

/** Without `count` (while the cart loads) the badge is hidden. */
function CartLink({ count }: { count?: number }) {
  return (
    <Link
      href="/carrito"
      className="flex items-center gap-1.5 rounded-lg px-2 py-2 font-medium hover:bg-zinc-100 sm:px-3 dark:hover:bg-zinc-800"
    >
      Carrito
      {count !== undefined && (
        <span
          data-testid="cart-count"
          aria-label={`${count} productos en el carrito`}
          className="min-w-6 rounded-full bg-zinc-900 px-1.5 text-center text-xs leading-6 text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          {count}
        </span>
      )}
    </Link>
  );
}

async function UserMenu() {
  const session = await getSession();

  if (!session) {
    return (
      <>
        <Link
          href="/ingresar"
          className="rounded-lg px-2 py-2 hover:bg-zinc-100 sm:px-3 dark:hover:bg-zinc-800"
        >
          Ingresar
        </Link>
        <Link
          href="/registro"
          // On phones "Ingresar" is enough (the login page links to sign-up).
          className="hidden rounded-lg bg-zinc-900 px-3 py-2 text-white hover:bg-zinc-700 sm:inline-flex dark:bg-zinc-100 dark:text-zinc-900"
        >
          Crear cuenta
        </Link>
      </>
    );
  }

  const isAdmin = session.user.role === "ADMIN";
  return (
    <>
      {/* Phones: everything behind one button, or the header overflows the screen. */}
      <div className="sm:hidden">
        <AccountMenu name={session.user.name} isAdmin={isAdmin} />
      </div>
      <div className="hidden items-center gap-2 sm:flex">
        <span className="max-w-40 truncate text-zinc-600 dark:text-zinc-400">
          Hola, {session.user.name}
        </span>
        {isAdmin && (
          <Link
            href="/admin"
            className="rounded-lg px-3 py-2 font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            Panel
          </Link>
        )}
        <Link
          href="/cuenta/pedidos"
          className="rounded-lg px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          Mis pedidos
        </Link>
        <SignOutButton />
      </div>
    </>
  );
}
