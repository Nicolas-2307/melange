import { db } from "@/lib/db";

/**
 * ADMIN access for the addresses in ADMIN_EMAILS (see docs/adr/0008).
 *
 * The rule that keeps the panel safe: **an account only becomes ADMIN if it has never had a
 * password**, and it gets its first one from the emailed reset link in that same step.
 * Cleaning up at promotion time (closing sessions, discarding a password someone else chose)
 * is not enough: a sign-in already in flight finishes after the cleanup and lands on an
 * account that is ADMIN by then.
 *
 * So these addresses cannot register through the public form. Their only way in is
 * "¿Olvidaste tu contraseña?": the link proves the inbox, activates the role and sets the
 * password.
 */

/** Shown in the header until there is a profile page; the owner did not type it. */
const ADMIN_DISPLAY_NAME = "Administración";

/**
 * Makes sure an ADMIN_EMAILS address has an account without credentials chosen by someone
 * else. Runs before a reset link is issued and before a sign-up attempt is answered.
 *
 * An account that is not ADMIN but already has a password was registered before the address
 * was listed in ADMIN_EMAILS, by the owner or by an impostor (we cannot tell). It is replaced
 * by a fresh row with a new id: sign-ins still in flight keep pointing at the old id and fail.
 */
export async function prepareAdminAccount(email: string) {
  const normalized = email.trim().toLowerCase();
  try {
    await db.$transaction(async (tx) => {
      // The database re-checks both conditions when deleting, so an account that was just
      // activated is never removed. Cascades to accounts, sessions and cart; orders stay.
      await tx.user.deleteMany({
        where: { email: normalized, role: { not: "ADMIN" }, accounts: { some: {} } },
      });
      const existing = await tx.user.findUnique({
        where: { email: normalized },
        select: { id: true },
      });
      if (existing) return;
      await tx.user.create({
        data: {
          email: normalized,
          name: ADMIN_DISPLAY_NAME,
          emailVerified: false,
          privacyAccepted: false,
        },
      });
    });
  } catch (error) {
    // Two requests at once: the other one already created the row.
    if ((error as { code?: string }).code !== "P2002") throw error;
  }
}

/**
 * Runs right before a password reset is carried out, and is the only place that grants
 * ADMIN. Looks at the account the reset link belongs to:
 *
 * - ADMIN_EMAILS address that has never had credentials: it becomes ADMIN now, and the
 *   password that this same request sets is the first one it has.
 * - ADMIN_EMAILS address that is not ADMIN and already has credentials: the link was issued
 *   before the address was listed (or before this rule existed). Returns "reject": the reset
 *   must not go through; a new link replaces the account first (prepareAdminAccount).
 * - Anything else (customers, existing admins, unknown or expired links): untouched.
 */
export async function activateAdminOnReset(
  token: string,
  isAdminAddress: (email: string) => boolean,
): Promise<"proceed" | "reject"> {
  const verification = await db.verification.findFirst({
    where: { identifier: `reset-password:${token}` },
    select: { value: true, expiresAt: true },
  });
  // Unknown or expired link: Better Auth answers that itself.
  if (!verification || verification.expiresAt < new Date()) return "proceed";

  const user = await db.user.findUnique({
    where: { id: verification.value },
    select: { id: true, email: true, role: true, _count: { select: { accounts: true } } },
  });
  if (!user || !isAdminAddress(user.email) || user.role === "ADMIN") return "proceed";
  if (user._count.accounts > 0) return "reject";

  // Conditional on still having no credentials, in case two requests race.
  const { count } = await db.user.updateMany({
    where: { id: user.id, accounts: { none: {} } },
    data: { role: "ADMIN", emailVerified: true },
  });
  if (count === 0) return "reject";
  await db.session.deleteMany({ where: { userId: user.id } });
  return "proceed";
}
