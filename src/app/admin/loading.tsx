/** Shown instantly while an admin page loads its data (makes panel navigation feel immediate). */
export default function AdminLoading() {
  return (
    <div className="flex flex-col gap-3" aria-busy="true" aria-live="polite">
      <span className="sr-only">Cargando…</span>
      <div className="h-8 w-48 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
      <div className="h-4 w-72 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="mt-4 h-40 w-full animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-900" />
    </div>
  );
}
