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

/**
 * Session read from the database, skipping the 5-minute cookie cache: a session that was
 * closed (password reset, role change) stops working at once. `cache` dedupes per request.
 */
const getFreshSession = cache(async () => {
  await connection();
  return auth.api.getSession({ headers: await headers(), query: { disableCookieCache: true } });
});

/**
 * For pages with the customer's own data: redirects to login when there is no session.
 * Reads the database, so a closed session cannot keep opening them from its cached cookie.
 */
export async function requireUser(next: string) {
  const session = await getFreshSession();
  if (!session) redirect(`/ingresar?next=${encodeURIComponent(next)}`);
  return session;
}

/**
 * Authoritative admin check: use it in every admin page AND server action.
 * Reads the role from the database (skipping the session cookie cache) so a role change
 * applies immediately. Non-admins get a 404 so the panel's existence isn't revealed.
 */
export const requireAdmin = cache(async () => {
  const session = await getFreshSession();
  if (!session) redirect(`/ingresar?next=${encodeURIComponent("/admin")}`);
  if (session.user.role !== "ADMIN") notFound();
  return session;
});
