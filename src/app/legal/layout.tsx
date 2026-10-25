import Link from "next/link";

import { BUSINESS_IS_PLACEHOLDER } from "@/lib/business";

const LINKS = [
  { href: "/legal/privacidad", label: "Tratamiento de datos" },
  { href: "/legal/terminos", label: "Términos y condiciones" },
  { href: "/legal/devoluciones", label: "Cambios y devoluciones" },
];

export default function LegalLayout({ children }: LayoutProps<"/legal">) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-12">
      {BUSINESS_IS_PLACEHOLDER && (
        <p
          role="note"
          className="rounded-lg border border-amber-500/40 bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200"
        >
          <strong>Plantilla en revisión.</strong> Los textos marcados como [PENDIENTE] se
          completarán con los datos del negocio. Este documento debe revisarlo la propietaria (y
          idealmente un abogado) antes del lanzamiento.
        </p>
      )}
      <nav aria-label="Documentos legales" className="flex flex-wrap gap-3 text-sm">
        {LINKS.map((link) => (
          <Link key={link.href} href={link.href} className="underline">
            {link.label}
          </Link>
        ))}
      </nav>
      <article className="legal flex flex-col gap-4 leading-relaxed [&_h1]:text-3xl [&_h1]:font-semibold [&_h1]:tracking-tight [&_h2]:mt-4 [&_h2]:text-xl [&_h2]:font-semibold [&_li]:ml-5 [&_ol]:list-decimal [&_ul]:list-disc">
        {children}
      </article>
    </main>
  );
}
