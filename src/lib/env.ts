import { z } from "zod";

/**
 * Single source of truth for environment variables.
 * Imported from next.config.ts so the app fails at startup/build if anything is missing.
 * Add each new variable here AND in .env.example (and docs/deployment.md).
 */

// Treat `VAR=` (empty) in .env files as "not set".
const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess((value) => (value === "" ? undefined : value), schema.optional());

const serverSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  // Pooled connection (host with "-pooler") used by the app at runtime.
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),

  // Signs session cookies and tokens. At least 32 random characters.
  BETTER_AUTH_SECRET: z.string().min(32, "Debe tener al menos 32 caracteres aleatorios"),
  // Comma-separated list. Each account becomes ADMIN once its email is verified.
  ADMIN_EMAILS: optional(z.string())
    .transform((value) =>
      (value ?? "")
        .split(",")
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean),
    )
    .pipe(z.array(z.email("Cada correo de ADMIN_EMAILS debe ser válido"))),

  // Provider selection: swap providers by config, not code.
  // "wompi" is added in Paso 4.4, once the store has its Wompi account.
  PAYMENT_PROVIDER: z.enum(["whatsapp"]).default("whatsapp"),
  STORAGE_PROVIDER: z.enum(["cloudinary"]).default("cloudinary"),
  EMAIL_PROVIDER: z.enum(["console"]).default("console"),

  // Set by Vercel on every deployment (host only, no "https://"). Previews get a new URL
  // each time, so these are used when NEXT_PUBLIC_SITE_URL is not set.
  VERCEL_URL: optional(z.string()),
  VERCEL_BRANCH_URL: optional(z.string()),
  // "production" | "preview" | "development" on Vercel; unset locally.
  VERCEL_ENV: optional(z.string()),
});

// NEXT_PUBLIC_* values are inlined into the browser bundle: never put secrets here.
const clientSchema = z.object({
  // Fixed public URL (local and production). Optional on Vercel previews.
  NEXT_PUBLIC_SITE_URL: optional(z.url()),
  NEXT_PUBLIC_WHATSAPP_NUMBER: z
    .string()
    .regex(/^57\d{10}$/, "Debe ser un número colombiano con indicativo, sin '+': 57XXXXXXXXXX"),
});

const https = (host: string | undefined) => (host ? `https://${host}` : undefined);

const schema = serverSchema
  .extend(clientSchema.shape)
  // The console provider prints verification and order links to the logs: never in production.
  .refine((vars) => !(vars.VERCEL_ENV === "production" && vars.EMAIL_PROVIDER === "console"), {
    message: "En producción configura un proveedor de correo real (EMAIL_PROVIDER)",
    path: ["EMAIL_PROVIDER"],
  })
  .refine((vars) => vars.NEXT_PUBLIC_SITE_URL || vars.VERCEL_BRANCH_URL || vars.VERCEL_URL, {
    message: "Define NEXT_PUBLIC_SITE_URL (en Vercel se toma de VERCEL_BRANCH_URL)",
    path: ["NEXT_PUBLIC_SITE_URL"],
  })
  .transform((vars) => {
    const siteUrl = (vars.NEXT_PUBLIC_SITE_URL ??
      https(vars.VERCEL_BRANCH_URL) ??
      https(vars.VERCEL_URL)) as string;
    // Origins allowed to call the auth API: the site plus both Vercel URLs of a preview.
    const trustedOrigins = [siteUrl, https(vars.VERCEL_BRANCH_URL), https(vars.VERCEL_URL)].filter(
      (origin, index, all): origin is string => Boolean(origin) && all.indexOf(origin) === index,
    );
    return { ...vars, SITE_URL: siteUrl, TRUSTED_ORIGINS: trustedOrigins };
  });

function parseEnv() {
  const result = schema.safeParse(process.env);
  if (!result.success) {
    console.error("❌ Variables de entorno inválidas:\n" + z.prettifyError(result.error));
    throw new Error("Invalid environment variables. Revisa .env.local contra .env.example.");
  }
  return result.data;
}

export const env = parseEnv();
export type Env = z.output<typeof schema>;
