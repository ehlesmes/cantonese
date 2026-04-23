import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "happy-dom",
    globals: true,
    setupFiles: ["./vitest.setup.js"],
  },
  resolve: {
    alias: {
      "/components": path.resolve(__dirname, "./components"),
    },
  },
});
