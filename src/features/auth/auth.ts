import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { after } from "next/server";

import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { getEmailProvider } from "@/services/email";

import { isAdminEmail } from "./admin-email";
import { prepareAdminAccount, promoteToAdmin } from "./admin-promotion";
import { passwordResetEmail, verificationEmail } from "./emails";
import { personName } from "./schemas";

const adminEmail = (email: string) => isAdminEmail(email, env.ADMIN_EMAILS);

/** Exactly what Better Auth answers when the address already has an account. */
const alreadyRegistered = () =>
  new APIError("UNPROCESSABLE_ENTITY", {
    code: "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL",
    message: "User already exists. Use another email.",
  });

export const auth = betterAuth({
  appName: "Melange",
  baseURL: env.SITE_URL,
  trustedOrigins: env.TRUSTED_ORIGINS,
  secret: env.BETTER_AUTH_SECRET,
  database: prismaAdapter(db, { provider: "postgresql" }),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    autoSignIn: true,
    // Password reset: link valid for 1 hour; every open session is closed afterwards.
    resetPasswordTokenExpiresIn: 60 * 60,
    revokeSessionsOnPasswordReset: true,
    // The emailed link proves the inbox, and the password set through it is the only one the
    // account has ever had (see admin-promotion.ts): this is the single way to become ADMIN.
    onPasswordReset: async ({ user }) => {
      if (adminEmail(user.email)) await promoteToAdmin(user.id);
    },
    sendResetPassword: async ({ user, url }) => {
      after(() =>
        getEmailProvider().send(
          passwordResetEmail({
            to: user.email,
            name: user.name,
            url,
            activatesAdmin: adminEmail(user.email) && (user as { role?: string }).role !== "ADMIN",
          }),
        ),
      );
    },
  },

  // Confirming the email is optional for customers and grants nothing by itself.
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      // Not awaited (avoids timing attacks); `after` keeps serverless functions alive until sent.
      after(() =>
        getEmailProvider().send(verificationEmail({ to: user.email, name: user.name, url })),
      );
    },
  },

  // Keeps the session in a signed cookie for 5 minutes, so most pages skip the database
  // lookup. Role changes reach the header within 5 minutes; requireAdmin() always reads
  // the database.
  session: {
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },

  user: {
    additionalFields: {
      role: { type: "string", input: false, defaultValue: "CUSTOMER" },
      // Express authorization to process personal data (Ley 1581 de 2012), sent by the
      // sign-up form checkbox. Stored with the user (its createdAt dates the consent).
      privacyAccepted: { type: "boolean", input: true, required: true },
    },
  },

  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      const email: unknown = ctx.body?.email;
      if (typeof email !== "string" || !adminEmail(email)) return;

      // ADMIN_EMAILS addresses never register through the public form: whoever got there
      // first would choose the password of the future admin. Same answer (after the same
      // kind of lookup) as for any address that already has an account.
      if (ctx.path === "/sign-up/email") {
        await db.user.findUnique({
          where: { email: email.trim().toLowerCase() },
          select: { id: true },
        });
        throw alreadyRegistered();
      }
      if (ctx.path === "/request-password-reset") await prepareAdminAccount(email);
    }),
  },

  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          // Second barrier for the rule above, whatever path tries to create the user.
          if (adminEmail(user.email)) throw alreadyRegistered();
          if ((user as { privacyAccepted?: unknown }).privacyAccepted !== true) {
            throw new APIError("BAD_REQUEST", {
              code: "PRIVACY_NOT_ACCEPTED",
              message: "You must accept the data processing policy.",
            });
          }
          // The form validates it too, but the API can be called directly; the name ends up
          // in emails sent from the store.
          const name = personName.safeParse(user.name);
          if (!name.success) {
            throw new APIError("BAD_REQUEST", { code: "INVALID_NAME", message: "Invalid name." });
          }
          return { data: { ...user, name: name.data } };
        },
      },
    },
  },

  // Only what the store uses stays reachable: sign-up, sign-in, sign-out, password reset and
  // the emailed verification link. The rest of Better Auth's API would let a stolen session
  // do things the interface never offers (and renew its cookie cache after being revoked).
  disabledPaths: [
    "/change-password",
    "/change-email",
    "/update-user",
    "/update-session",
    "/delete-user",
    "/delete-user/callback",
    "/verify-password",
    "/send-verification-email",
    "/list-sessions",
    "/revoke-session",
    "/revoke-sessions",
    "/revoke-other-sessions",
    "/list-accounts",
    "/unlink-account",
    "/link-social",
    "/sign-in/social",
    "/account-info",
    "/refresh-token",
    "/get-access-token",
  ],

  // Stored in the database so limits hold across serverless instances. Enabled in production.
  rateLimit: {
    storage: "database",
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 60, max: 3 },
      "/request-password-reset": { window: 60, max: 3 },
    },
  },

  // Must be the last plugin: lets server actions set auth cookies.
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
