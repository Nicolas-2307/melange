import type { EmailMessage } from "@/services/email";

export function verificationEmail({
  to,
  name,
  url,
}: {
  to: string;
  name: string;
  url: string;
}): EmailMessage {
  return {
    to,
    subject: "Confirma tu correo en Melange",
    text: [
      `Hola, ${name}:`,
      "",
      "Confirma tu correo abriendo este enlace:",
      url,
      "",
      "Si no creaste una cuenta en Melange, ignora este mensaje.",
    ].join("\n"),
  };
}

export function passwordResetEmail({
  to,
  name,
  url,
  activatesAdmin = false,
}: {
  to: string;
  name: string;
  url: string;
  /** The address is in ADMIN_EMAILS and its panel access is not active yet. */
  activatesAdmin?: boolean;
}): EmailMessage {
  const adminNote = activatesAdmin
    ? [
        "",
        "Este correo administra la tienda: al crear tu contraseña con este enlace quedará",
        "activo tu acceso al panel.",
      ]
    : [];
  return {
    to,
    subject: "Restablece tu contraseña de Melange",
    text: [
      `Hola, ${name}:`,
      "",
      "Recibimos una solicitud para cambiar tu contraseña. Abre este enlace (vale 1 hora):",
      url,
      ...adminNote,
      "",
      "Si no la pediste, ignora este mensaje: tu contraseña no cambia.",
    ].join("\n"),
  };
}
