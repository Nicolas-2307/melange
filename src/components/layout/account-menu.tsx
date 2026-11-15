"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { SignOutButton } from "@/features/auth/components/sign-out-button";

const itemClass = "rounded-lg px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800";

/**
 * Account menu for phones: the greeting, the links and "Cerrar sesión" don't fit next to the
 * cart on a 320 px screen, so they live behind one button. From `sm` up the header shows
 * them inline instead (see site-header.tsx).
 */
export function AccountMenu({ name, isAdmin }: { name: string; isAdmin: boolean }) {
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={container} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="account-menu"
        onClick={() => setOpen((value) => !value)}
        className="rounded-lg px-2 py-2 font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800"
      >
        Cuenta
      </button>
      {open && (
        <div
          id="account-menu"
          className="absolute right-0 z-20 mt-1 flex w-52 flex-col gap-1 rounded-lg border border-zinc-200 bg-background p-2 whitespace-normal shadow-lg dark:border-zinc-800"
        >
          <p className="truncate px-3 py-2 text-zinc-600 dark:text-zinc-400">Hola, {name}</p>
          {/* The header stays mounted between pages: close the menu when a link is used. */}
          {isAdmin && (
            <Link href="/admin" onClick={close} className={`font-medium ${itemClass}`}>
              Panel
            </Link>
          )}
          <Link href="/cuenta/pedidos" onClick={close} className={itemClass}>
            Mis pedidos
          </Link>
          <SignOutButton />
        </div>
      )}
    </div>
  );
}
