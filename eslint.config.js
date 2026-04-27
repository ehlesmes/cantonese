import js from "@eslint/js";
import globals from "globals";
import prettierConfig from "eslint-config-prettier";

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    ignores: ["node_modules/**", "dist/**"],
  },
  js.configs.recommended,
  {
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
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "no-console": ["warn", { allow: ["warn", "error"] }],
      eqeqeq: ["error", "always"],
      curly: ["error", "all"],
      "no-implicit-coercion": "error",
      "prefer-const": "error",
      "no-var": "error",
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
