const messages: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "Correo o contraseña incorrectos.",
  USER_ALREADY_EXISTS: "Ya existe una cuenta con ese correo.",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "Ya existe una cuenta con ese correo.",
  PASSWORD_TOO_SHORT: "La contraseña es demasiado corta.",
  PASSWORD_TOO_LONG: "La contraseña es demasiado larga.",
  INVALID_EMAIL: "El correo no es válido.",
  EMAIL_NOT_VERIFIED: "Debes confirmar tu correo antes de continuar.",
  INVALID_TOKEN: "El enlace no es válido o ya venció. Pide uno nuevo.",
  PRIVACY_NOT_ACCEPTED: "Debes aceptar la política de tratamiento de datos.",
};

/** Translates a Better Auth error into a Spanish message for the UI. */
export function authErrorMessage(error: { code?: string; status?: number } | null | undefined) {
  if (error?.status === 429) return "Demasiados intentos. Espera un minuto e inténtalo de nuevo.";
  if (error?.code && messages[error.code]) return messages[error.code];
  return "Algo salió mal. Inténtalo de nuevo.";
}
