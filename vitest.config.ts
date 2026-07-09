import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    exclude: ["node_modules", "dist", ".astro", "tests/**/*"],
    setupFiles: ["./scripts/setup-tests.ts"],
    coverage: {
      provider: "v8",
      include: ["src/utils/**/*.ts"],
      thresholds: {
        lines: 100,
        functions: 100,
        statements: 100,
        branches: 100,
      },
    },
  },
});
