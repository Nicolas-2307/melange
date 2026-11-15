import { db } from "@/lib/db";

/**
 * ADMIN access for the addresses in ADMIN_EMAILS (see docs/adr/0008).
 *
 * The rule that keeps the panel safe: **nobody but the inbox owner may ever hold a password
 * or a session on an account that can become ADMIN.** Closing sessions at promotion time is
 * not enough, because a sign-in already in flight finishes after the cleanup and lands on
 * an account that is ADMIN by then.
 *
 * So these addresses cannot register through the public form. Their only way in is
 * "¿Olvidaste tu contraseña?": the emailed link proves the inbox, sets the password and
 * activates the role.
 */

/** Shown in the header until there is a profile page; the owner did not type it. */
const ADMIN_DISPLAY_NAME = "Administración";

/**
 * Runs before a reset link is issued for an ADMIN_EMAILS address: guarantees the account
 * exists and carries no credentials chosen by someone else.
 *
 * An account that is not ADMIN yet but already has a password was registered before the
 * address was listed in ADMIN_EMAILS, by the owner or by an impostor (we cannot tell). It is
 * replaced by a fresh row with a new id: sign-ins or password changes still in flight keep
 * pointing at the old id and fail, instead of landing on the future admin.
 */
export async function prepareAdminAccount(email: string) {
  const normalized = email.trim().toLowerCase();
  const fresh = {
    email: normalized,
    name: ADMIN_DISPLAY_NAME,
    emailVerified: false,
    privacyAccepted: false,
  };

  try {
    await db.$transaction(async (tx) => {
      const existing = await tx.user.findUnique({
        where: { email: normalized },
        select: { id: true, role: true, _count: { select: { accounts: true } } },
      });
      if (!existing) {
        await tx.user.create({ data: fresh });
        return;
      }
      // Already active, or already clean and waiting for the owner's link: leave it alone
      // (replacing it again would invalidate the link she may be about to open).
      if (existing.role === "ADMIN" || existing._count.accounts === 0) return;

      // Cascades to its accounts, sessions and cart; its orders stay, without an owner.
      await tx.user.delete({ where: { id: existing.id } });
      await tx.user.create({ data: fresh });
    });
  } catch (error) {
    // Two requests at once: the other one already created the row.
    if ((error as { code?: string }).code !== "P2002") throw error;
  }
}

/**
 * Grants ADMIN after a password reset completed with the emailed link. By now the only
 * password on the account is the one just chosen through that link; closing every session
 * again costs nothing (Better Auth already did it for the reset).
 */
export async function promoteToAdmin(userId: string) {
  await db.$transaction([
    db.user.update({ where: { id: userId }, data: { role: "ADMIN", emailVerified: true } }),
    db.session.deleteMany({ where: { userId } }),
  ]);
}
