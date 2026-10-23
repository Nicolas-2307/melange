import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";

import { auth } from "./auth";

/**
 * Current session or null. Server-only (Server Components, Server Actions, Route Handlers).
 * `cache` dedupes it within one request: header, cart and page share a single lookup.
 */
export const getSession = cache(async () => {
  // Sessions are request-time data; also lets Better Auth use `new Date()` without
  // tripping Cache Components' prerender checks.
  await connection();
  return auth.api.getSession({ headers: await headers() });
});

/** Redirects to login when there is no session. */
export async function requireUser(next: string) {
  const session = await getSession();
  if (!session) redirect(`/ingresar?next=${encodeURIComponent(next)}`);
  return session;
}

/**
 * Authoritative admin check: use it in every admin page AND server action.
 * Reads the role from the database (skipping the session cookie cache) so a role change
 * applies immediately. Non-admins get a 404 so the panel's existence isn't revealed.
 */
export const requireAdmin = cache(async () => {
  await connection();
  const session = await auth.api.getSession({
    headers: await headers(),
    query: { disableCookieCache: true },
  });
  if (!session) redirect(`/ingresar?next=${encodeURIComponent("/admin")}`);
  if (session.user.role !== "ADMIN") notFound();
  return session;
});
