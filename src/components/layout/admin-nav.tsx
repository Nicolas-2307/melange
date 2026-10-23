"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Resumen", exact: true },
  { href: "/admin/pedidos", label: "Pedidos" },
  { href: "/admin/calendario", label: "Calendario" },
  { href: "/admin/productos", label: "Productos" },
  { href: "/admin/categorias", label: "Categorías" },
  { href: "/admin/configuracion", label: "Configuración" },
] as const;

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Panel"
      className="flex gap-1 overflow-x-auto overflow-y-hidden border-b border-zinc-200 dark:border-zinc-800"
    >
      {LINKS.map((link) => {
        const active = "exact" in link ? pathname === link.href : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={`-mb-px border-b-2 px-3 py-2 text-sm whitespace-nowrap ${
              active
                ? "border-zinc-900 font-medium dark:border-zinc-100"
                : "border-transparent text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
