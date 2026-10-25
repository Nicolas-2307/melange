import { defineConfig } from "vitest/config";

export default defineConfig({
  // Vite resolves the "@/..." aliases from tsconfig.json natively.
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.{ts,tsx}"],
  },
});
