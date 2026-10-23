import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import type { auth } from "./auth";

// Browser-side auth API. Only the *type* of the server config is imported.
export const authClient = createAuthClient({
  plugins: [inferAdditionalFields<typeof auth>()],
});
