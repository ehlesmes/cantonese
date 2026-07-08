const js = require("@eslint/js");
const globals = require("globals");

module.exports = [
  {
    ignores: ["dist/**", ".astro/**", "tmp/**", "test-results/**"],
  },
  js.configs.recommended,
  {
    rules: {
      "no-unused-vars": ["warn", { vars: "all", args: "none" }],
      "no-console": "off",
      "no-debugger": "error",
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
      globals: {
        ...globals.node,
      },
    },
  },
  {
    files: [
      "**/*.test.js",
      "**/*.spec.js",
      "src/**/*.js",
      "src/**/*.jsx",
      "playwright.config.js",
      "astro.config.mjs",
      "vitest.config.js",
    ],
    languageOptions: {
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
];
