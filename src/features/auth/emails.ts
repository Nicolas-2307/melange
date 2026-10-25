import type { EmailMessage } from "@/services/email";

export function verificationEmail({
  to,
  name,
  url,
  forAdmin = false,
}: {
  to: string;
  name: string;
  url: string;
  /** The address is in ADMIN_EMAILS: explain the extra security step. */
  forAdmin?: boolean;
}): EmailMessage {
  const adminNote = forAdmin
    ? [
        "",
        "Este correo administra la tienda. Al confirmar quedarás dentro del panel, y por",
        "seguridad la contraseña elegida al registrarse se descarta: para tu próximo ingreso",
        "usa «¿Olvidaste tu contraseña?» y crea una nueva.",
      ]
    : [];
  return {
    to,
    subject: "Confirma tu correo en Melange",
    text: [
      `Hola, ${name}:`,
      "",
      "Confirma tu correo abriendo este enlace:",
      url,
      ...adminNote,
      "",
      "Si no creaste una cuenta en Melange, ignora este mensaje.",
    ].join("\n"),
  };
}

export function passwordResetEmail({
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
    subject: "Restablece tu contraseña de Melange",
    text: [
      `Hola, ${name}:`,
      "",
      "Recibimos una solicitud para cambiar tu contraseña. Abre este enlace (vale 1 hora):",
      url,
      "",
      "Si no la pediste, ignora este mensaje: tu contraseña no cambia.",
    ].join("\n"),
  };
}
