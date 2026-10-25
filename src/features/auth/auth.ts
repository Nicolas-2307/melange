import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { after } from "next/server";

import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { getEmailProvider } from "@/services/email";

import { isAdminEmail } from "./admin-email";
import { verificationEmail } from "./emails";

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
  },

  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      // Not awaited (avoids timing attacks); `after` keeps serverless functions alive until sent.
      after(() =>
        getEmailProvider().send(verificationEmail({ to: user.email, name: user.name, url })),
      );
    },
    // ADMIN is granted only after proving ownership of an ADMIN_EMAILS address: someone
    // registering first with the owner's address can't become admin without that inbox.
    afterEmailVerification: async (user) => {
      if (isAdminEmail(user.email, env.ADMIN_EMAILS)) {
        await db.user.update({ where: { id: user.id }, data: { role: "ADMIN" } });
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
    },
  },

  // Stored in the database so limits hold across serverless instances. Enabled in production.
  rateLimit: {
    storage: "database",
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 60, max: 3 },
    },
  },

  // Must be the last plugin: lets server actions set auth cookies.
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
