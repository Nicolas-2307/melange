import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";

import { requireAdmin } from "@/features/auth/session";
import { AdminNav } from "@/components/layout/admin-nav";

export const metadata: Metadata = { title: "Panel · Melange", robots: { index: false } };

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-10">
      <Suspense fallback={<p className="text-zinc-500">Cargando…</p>}>
        <AdminGate>
          <AdminNav />
          {children}
        </AdminGate>
      </Suspense>
    </main>
  );
}

// Layouts don't re-run on every navigation: pages and server actions must call requireAdmin() too.
async function AdminGate({ children }: { children: ReactNode }) {
  await requireAdmin();
  return children;
}
