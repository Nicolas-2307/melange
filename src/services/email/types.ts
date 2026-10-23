export type EmailMessage = {
  to: string;
  subject: string;
  /** Plain-text body (always sent; also used by the console provider). */
  text: string;
  html?: string;
};

/** Provider-agnostic email sender. One implementation per provider, chosen by EMAIL_PROVIDER. */
export interface EmailProvider {
  send(message: EmailMessage): Promise<void>;
}
