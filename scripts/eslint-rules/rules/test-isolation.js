export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Enforce document.body.replaceChildren() for test isolation.",
    },
  },
  create(context) {
    if (!context.filename.endsWith(".test.js")) return {};
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
