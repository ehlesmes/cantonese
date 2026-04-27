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
        if (
          !context.sourceCode
            .getText()
            .includes("document.body.replaceChildren()")
        ) {
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
