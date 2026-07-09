const js = require("@eslint/js");
const globals = require("globals");
const tseslint = require("typescript-eslint");

module.exports = tseslint.config(
  {
    ignores: [
      "dist/**",
      ".astro/**",
      "tmp/**",
      "test-results/**",
      "coverage/**",
      "coverage-e2e/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "no-unused-vars": "off", // Handled by @typescript-eslint
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { vars: "all", args: "none" },
      ],
      "@typescript-eslint/no-var-requires": "error",
      "@typescript-eslint/no-explicit-any": "off", // Keep flexible for this migration
      "no-console": "off",
      "no-debugger": "error",
      "prefer-const": "error",
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
  },
  {
    files: ["eslint.config.js", "playwright.config.js", "vitest.config.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-var-requires": "off",
    },
  },
  {
    files: ["**/*.test.ts", "**/*.spec.ts"],
    rules: {
      "@typescript-eslint/no-unsafe-function-type": "off",
    },
  },
);
