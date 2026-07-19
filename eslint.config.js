const js = require("@eslint/js");
const globals = require("globals");
const tseslint = require("typescript-eslint");
const importPlugin = require("eslint-plugin-import");

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
      "no-console": "off",
      "no-debugger": "error",
      "prefer-const": "error",
      complexity: ["error", 12],
      "max-depth": ["error", 4],
      "max-nested-callbacks": ["error", 3],
      "import/first": "error",
    },
    plugins: {
      import: importPlugin,
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
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      "no-unused-vars": "off", // Handled by @typescript-eslint
      "@typescript-eslint/no-unused-vars": [
        "error",
        { vars: "all", args: "after-used" },
      ],
      "@typescript-eslint/no-var-requires": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unsafe-assignment": "error",
      "@typescript-eslint/no-unsafe-member-access": "error",
      "@typescript-eslint/no-unsafe-argument": "error",
      "@typescript-eslint/no-unsafe-return": "error",
      "@typescript-eslint/no-unsafe-call": "error",
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
      complexity: "off",
      "max-depth": "off",
      "max-nested-callbacks": "off",
    },
  },
);
