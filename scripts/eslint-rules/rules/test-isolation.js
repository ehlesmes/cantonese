import { isTestFile } from "../test-utils.js";

export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Enforce document.body.replaceChildren() for test isolation.",
    },
  },
  create(context) {
    if (!isTestFile(context)) return {};
    return {
      Program(node) {
        const source = context.sourceCode.getText();
        const usesDom =
          source.includes("document") ||
          source.includes("window") ||
          source.includes("components/");

        if (usesDom && !source.includes("document.body.replaceChildren()")) {
          context.report({
            node,
            message:
              "Test file must call 'document.body.replaceChildren()' to prevent test cross-contamination.",
          });
        }
      },
    };
  },
};
