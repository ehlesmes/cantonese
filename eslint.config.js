import js from "@eslint/js";
import globals from "globals";
import prettierConfig from "eslint-config-prettier";
import * as archPlugin from "./scripts/eslint-rules/index.js";

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    ignores: ["node_modules/**", "dist/**"],
  },
  js.configs.recommended,
  {
    files: ["**/*.js"],
    plugins: {
      arch: { rules: archPlugin.rules },
    },
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.vitest, // For test files
      },
    },
    rules: {
      "arch/mandatory-lifecycle": "error",
      "arch/mandatory-super-url": "error",
      "arch/no-global-document": "error",
      "arch/event-registration-locality": "error",
      "arch/dispatch-standard": "error",
      "arch/prefer-properties": "warn",
      "arch/stylesheet-adoption": "error",
      "arch/naming-alignment": "error",
      "arch/test-isolation": "error",
      "arch/test-validation-block": "error",
      "arch/test-event-verification": "error",
      "arch/test-data-mocking": "error",
      "no-unused-vars": "error",
      "no-console": ["warn", { allow: ["warn", "error", "info"] }],
      eqeqeq: ["error", "always"],
      curly: ["error", "all"],
      "no-implicit-coercion": "error",
      "prefer-const": "error",
      "no-var": "error",
      quotes: ["error", "double", { avoidEscape: true }],
      "object-shorthand": "error",
      "prefer-template": "error",
      "no-multiple-empty-lines": ["error", { max: 1, maxEOF: 0 }],
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "AssignmentExpression[left.property.name='innerHTML'][right.value='']",
          message:
            "Prefer surgical updates over destructive re-rendering. Respect the DOM as a persistent semantic structure rather than a disposable string buffer. Consider using element.replaceChildren() to maintain intentionality and semantic integrity.",
        },
      ],
    },
  },
  prettierConfig, // Must be last to override conflicting rules
];
