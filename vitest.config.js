import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "happy-dom",
    globals: true,
    setupFiles: ["./vitest.setup.js"],
    exclude: ["**/node_modules/**", "**/dist/**", "**/tests/visual/**"],
    environmentOptions: {
      happyDOM: {
        settings: {
          disableCSSFileLoading: true,
          handleDisabledFileLoadingAsSuccess: true,
          disableJavaScriptFileLoading: true,
        },
      },
    },
  },
  resolve: {
    alias: {
      "/components": path.resolve(__dirname, "./components"),
    },
  },
});
