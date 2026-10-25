import { z } from "zod";

const email = z.string().trim().toLowerCase().pipe(z.email("Escribe un correo válido"));

export const signInSchema = z.object({
  email,
  password: z.string().min(1, "Escribe tu contraseña"),
});

export const signUpSchema = z
  .object({
    name: z.string().trim().min(2, "Escribe tu nombre").max(80, "Máximo 80 caracteres"),
    email,
    password: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres")
      .max(128, "La contraseña debe tener máximo 128 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

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
