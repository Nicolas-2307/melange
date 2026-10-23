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
