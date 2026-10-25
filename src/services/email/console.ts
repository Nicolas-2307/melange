import type { EmailMessage, EmailProvider } from "./types";

/** Development provider: prints emails to the terminal instead of sending them. */
export class ConsoleEmailProvider implements EmailProvider {
  async send({ to, subject, text }: EmailMessage): Promise<void> {
    console.info(
      [
        "",
        "📧 ─── Correo (EMAIL_PROVIDER=console) ───",
        `Para: ${to}`,
        `Asunto: ${subject}`,
        "",
        text,
        "───",
        "",
      ].join("\n"),
    );
  }
}
