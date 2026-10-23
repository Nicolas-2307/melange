import Link from "next/link";

import type { CatalogCategory } from "../types";

/** Category chips. `current` is the active slug, or undefined for "Todo". */
export function CategoryNav({
  categories,
  current,
}: {
  categories: CatalogCategory[];
  current?: string;
}) {
  const chip = (active: boolean) =>
    `rounded-full border px-4 py-1.5 text-sm transition-colors ${
      active
        ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
        : "border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
    }`;

  return (
    <nav aria-label="Categorías" className="flex flex-wrap gap-2">
      <Link
        href="/productos"
        className={chip(!current)}
        aria-current={!current ? "page" : undefined}
      >
        Todo
      </Link>
      {categories.map((category) => (
        <Link
          key={category.slug}
          href={`/categorias/${category.slug}`}
          className={chip(current === category.slug)}
          aria-current={current === category.slug ? "page" : undefined}
        >
          {category.name}
        </Link>
      ))}
    </nav>
  );
}
