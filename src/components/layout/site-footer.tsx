import Link from "next/link";

import { BUSINESS } from "@/lib/business";

export function SiteFooter() {
  return (
    <footer className="border-t border-zinc-200 text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-8 sm:flex-row sm:justify-between">
        <div className="flex flex-col gap-1">
          <p className="font-medium text-zinc-900 dark:text-zinc-100">{BUSINESS.tradeName}</p>
          <p>{BUSINESS.address}</p>
          <p>
            {BUSINESS.legalName} · {BUSINESS.taxId}
          </p>
        </div>
        <nav aria-label="Legal" className="flex flex-col gap-1">
          <Link href="/legal/privacidad" className="hover:underline">
            Tratamiento de datos personales
          </Link>
          <Link href="/legal/terminos" className="hover:underline">
            Términos y condiciones
          </Link>
          <Link href="/legal/devoluciones" className="hover:underline">
            Cambios y devoluciones
          </Link>
          <a
            href="https://www.sic.gov.co"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            Superintendencia de Industria y Comercio
          </a>
        </nav>
      </div>
    </footer>
  );
}
