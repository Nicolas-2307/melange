import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { after } from "next/server";

import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { getEmailProvider } from "@/services/email";

import { isAdminEmail } from "./admin-email";
import { promoteToAdmin } from "./admin-promotion";
import { passwordResetEmail, verificationEmail } from "./emails";

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
    // Resetting through the emailed link also proves the inbox: the owner can become ADMIN
    // this way even if someone registered her address first. The new password is hers.
    onPasswordReset: async ({ user }) => {
      if (isAdminEmail(user.email, env.ADMIN_EMAILS)) {
        await promoteToAdmin(user.id, { discardPassword: false });
      }
    },
    sendResetPassword: async ({ user, url }) => {
      after(() =>
        getEmailProvider().send(passwordResetEmail({ to: user.email, name: user.name, url })),
      );
    },
  },

  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      const forAdmin = isAdminEmail(user.email, env.ADMIN_EMAILS);
      // Not awaited (avoids timing attacks); `after` keeps serverless functions alive until sent.
      after(() =>
        getEmailProvider().send(
          verificationEmail({ to: user.email, name: user.name, url, forAdmin }),
        ),
      );
    },
    // ADMIN requires proving the inbox of an ADMIN_EMAILS address, and the password chosen
    // at sign-up is discarded (see admin-promotion.ts for why).
    afterEmailVerification: async (user) => {
      if (isAdminEmail(user.email, env.ADMIN_EMAILS)) {
        await promoteToAdmin(user.id, { discardPassword: true });
      }
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

  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          if ((user as { privacyAccepted?: unknown }).privacyAccepted !== true) {
            throw new APIError("BAD_REQUEST", {
              code: "PRIVACY_NOT_ACCEPTED",
              message: "You must accept the data processing policy.",
            });
          }
          return { data: user };
        },
      },
    },
  },

  // Stored in the database so limits hold across serverless instances. Enabled in production.
  rateLimit: {
    storage: "database",
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 60, max: 3 },
      "/request-password-reset": { window: 60, max: 3 },
      "/send-verification-email": { window: 60, max: 3 },
    },
  },

  // Must be the last plugin: lets server actions set auth cookies.
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
