import { isTestFile, getComponentSource } from "../test-utils.js";

export default {
  meta: {
    type: "problem",
    docs: {
      description: "Ensure components using this.dispatch() have event verification in tests.",
    },
  },
  create(context) {
    if (!isTestFile(context)) return {};

    return {
      Program(node) {
        const componentSource = getComponentSource(context);
        if (!componentSource) return;

        const testSource = context.sourceCode.getText();

        if (
          componentSource.includes("this.dispatch(") &&
          (!testSource.includes("addEventListener") || !testSource.includes("vi.fn()"))
        ) {
          context.report({
            node,
            message:
              "Component uses this.dispatch() but test file is missing event verification (addEventListener + vi.fn()).",
          });
        }
      },
    };
  },
};
