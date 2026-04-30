import { isTestFile, getComponentSource } from "../test-utils.js";

export default {
  meta: {
    type: "problem",
    docs: {
      description: "Enforce a 'Validation' describe block for components with validate().",
    },
  },
  create(context) {
    if (!isTestFile(context)) return {};

    return {
      Program(node) {
        const componentSource = getComponentSource(context);
        if (!componentSource) return;

        if (
          componentSource.includes("validate(") &&
          !context.sourceCode.getText().includes('describe("Validation"')
        ) {
          context.report({
            node,
            message:
              "Component defines validate() but test is missing a 'describe(\"Validation\", ...)' block.",
          });
        }
      },
    };
  },
};
