import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">Página no encontrada</h1>
      <p className="text-zinc-600 dark:text-zinc-400">La página que buscas no existe o se movió.</p>
      <Link href="/" className="font-medium underline">
        Volver al inicio
      </Link>
    </main>
  );
}
