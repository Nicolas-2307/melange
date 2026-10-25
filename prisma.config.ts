import { loadEnvConfig } from "@next/env";
import { defineConfig } from "prisma/config";

// Prisma 7 doesn't load env files: reuse Next.js loading rules (.env.local, .env, …).
loadEnvConfig(process.cwd());

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // CLI (migrations) uses the direct, non-pooled connection.
    // Fallback keeps `prisma generate` working in CI, where no database exists.
    url: process.env.DIRECT_URL ?? "",
  },
});
