import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { auth } from "./auth";

/** Current session or null. Server-only (Server Components, Server Actions, Route Handlers). */
export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

/** Redirects to login when there is no session. */
export async function requireUser(next: string) {
  const session = await getSession();
  if (!session) redirect(`/ingresar?next=${encodeURIComponent(next)}`);
  return session;
}

/**
 * Authoritative admin check: use it in every admin page AND server action.
 * Non-admins get a 404 so the panel's existence isn't revealed.
 */
export async function requireAdmin() {
  const session = await requireUser("/admin");
  if (session.user.role !== "ADMIN") notFound();
  return session;
}
