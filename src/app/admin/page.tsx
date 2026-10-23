import { requireAdmin } from "@/features/auth/session";

export default async function AdminHomePage() {
  const { user } = await requireAdmin();

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Panel del dueño</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Hola, {user.name}. Aquí gestionarás productos y pedidos (Paso 5).
      </p>
    </>
  );
}
