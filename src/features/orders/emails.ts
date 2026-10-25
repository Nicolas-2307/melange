import { formatCOP } from "@/lib/format";
import type { EmailMessage } from "@/services/email";

export function orderConfirmationEmail({
  to,
  name,
  number,
  total,
  url,
}: {
  to: string;
  name: string;
  number: number;
  total: number;
  url: string;
}): EmailMessage {
  return {
    to,
    subject: `Recibimos tu pedido #${number} en Melange`,
    text: [
      `Hola, ${name}:`,
      "",
      `Recibimos tu pedido #${number} por ${formatCOP(total)}.`,
      "Puedes ver el detalle y el siguiente paso aquí:",
      url,
      "",
      "Gracias por elegir Melange.",
    ]
      .join("\n")
      .replace(/ /g, " "),
  };
}
