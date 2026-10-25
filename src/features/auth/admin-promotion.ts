import { db } from "@/lib/db";

/**
 * Grants ADMIN to an ADMIN_EMAILS account once its inbox ownership is proven.
 *
 * The account may have been registered by someone else before the owner (an attacker
 * can sign up with her address and pick the password). Proving the inbox is not proving
 * who chose that password, so on promotion we also:
 *  - close every existing session (the person who registered could be signed in), and
 *  - when `discardPassword` is set, remove the password, so only the inbox owner can set
 *    a new one through "¿Olvidaste tu contraseña?".
 * The session Better Auth opens right after verification is created after this runs, so
 * the person who clicked the link stays signed in.
 */
export async function promoteToAdmin(
  userId: string,
  { discardPassword }: { discardPassword: boolean },
) {
  await db.$transaction([
    db.user.update({ where: { id: userId }, data: { role: "ADMIN", emailVerified: true } }),
    db.session.deleteMany({ where: { userId } }),
    ...(discardPassword
      ? [
          db.account.updateMany({
            where: { userId, providerId: "credential" },
            data: { password: null },
          }),
        ]
      : []),
  ]);
}
