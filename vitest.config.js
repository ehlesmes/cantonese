import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    exclude: ["node_modules", "dist", ".astro", "tests/**/*"],
    setupFiles: ["./scripts/setup-tests.js"],
  },
});
