import { env } from "@/lib/env";

import { ConsoleEmailProvider } from "./console";
import type { EmailProvider } from "./types";

export type { EmailMessage, EmailProvider } from "./types";

let provider: EmailProvider | undefined;

/** Returns the email provider selected by EMAIL_PROVIDER. */
export function getEmailProvider(): EmailProvider {
  if (!provider) {
    switch (env.EMAIL_PROVIDER) {
      case "console":
        provider = new ConsoleEmailProvider();
        break;
    }
  }
  return provider;
}
