import { z } from "zod";

const email = z.string().trim().toLowerCase().pipe(z.email("Escribe un correo válido"));

/**
 * A person's name. It is printed in emails sent from the store to an address nobody has
 * verified yet, so it must not be able to carry a link or extra lines: letters, digits,
 * spaces and basic punctuation only, and no dot glued to the next word ("evil.com").
 */
export const personName = z
  .string()
  .trim()
  .min(2, "Escribe tu nombre")
  .max(80, "Máximo 80 caracteres")
  .regex(/^(?!.*\.\S)[\p{L}\p{M}\d .,'’-]+$/u, "Usa solo letras, números y espacios");

/** Checkbox "privacyAccepted" (FormData sends "on" only when checked). */
export const privacyConsent = z.literal("on", {
  error: "Debes autorizar el tratamiento de tus datos para continuar",
});

// Same limits as Better Auth's emailAndPassword config (min 8, max 128).
const newPassword = z
  .string()
  .min(8, "La contraseña debe tener al menos 8 caracteres")
  .max(128, "La contraseña debe tener máximo 128 caracteres");

const passwordsMatch = (data: { password: string; confirmPassword: string }) =>
  data.password === data.confirmPassword;
const mismatch = { message: "Las contraseñas no coinciden", path: ["confirmPassword"] };

export const signInSchema = z.object({
  email,
  password: z.string().min(1, "Escribe tu contraseña"),
});

export const signUpSchema = z
  .object({
    name: personName,
    email,
    password: newPassword,
    confirmPassword: z.string(),
    privacyAccepted: privacyConsent,
  })
  .refine(passwordsMatch, mismatch);

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({ password: newPassword, confirmPassword: z.string() })
  .refine(passwordsMatch, mismatch);

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;

/** First error message per field, for showing under each input. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    errors[key] ??= issue.message;
  }
  return errors;
}
