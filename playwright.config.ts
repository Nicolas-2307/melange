import { defineConfig, devices } from "@playwright/test";

// Runs against a production build on its own port, so it never clashes with your
// `npm run dev` on 3000 (Next allows only one dev server per project folder).
const PORT = Number(process.env.E2E_PORT ?? 3100);

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  // Neon scales to zero: the first query after idle can take several seconds.
  expect: { timeout: 15_000 },
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: "es-CO",
    timezoneId: "America/Bogota",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npm run build && npm run start -- --port ${PORT}`,
    port: PORT,
    timeout: 180_000,
    reuseExistingServer: false,
    env: { NEXT_PUBLIC_SITE_URL: `http://localhost:${PORT}` },
  },
});
