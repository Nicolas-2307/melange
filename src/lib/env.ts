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
  PAYMENT_PROVIDER: z.enum(["whatsapp", "wompi"]).default("whatsapp"),
  STORAGE_PROVIDER: z.enum(["cloudinary"]).default("cloudinary"),
  EMAIL_PROVIDER: z.enum(["console"]).default("console"),
});

// NEXT_PUBLIC_* values are inlined into the browser bundle: never put secrets here.
const clientSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url(),
  NEXT_PUBLIC_WHATSAPP_NUMBER: z
    .string()
    .regex(/^57\d{10}$/, "Debe ser un número colombiano con indicativo, sin '+': 57XXXXXXXXXX"),
});

const schema = serverSchema.extend(clientSchema.shape);

function parseEnv() {
  const result = schema.safeParse(process.env);
  if (!result.success) {
    console.error("❌ Variables de entorno inválidas:\n" + z.prettifyError(result.error));
    throw new Error("Invalid environment variables. Revisa .env.local contra .env.example.");
  }
  return result.data;
}

export const env = parseEnv();
export type Env = z.infer<typeof schema>;
