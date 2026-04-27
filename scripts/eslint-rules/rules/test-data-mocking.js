export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Enforce vi.stubGlobal('fetch', ...) for tests involving network calls.",
    },
  },
  create(context) {
    if (!context.filename.endsWith(".test.js")) return {};
    return {
      Program(node) {
        const source = context.sourceCode.getText();
        if (source.includes("fetch(") && !source.includes("vi.stubGlobal")) {
          context.report({
            node,
            message:
              "Tests involving fetch must use 'vi.stubGlobal(\"fetch\", ...)' for controlled data mocking.",
          });
        }
      },
    };
  },
};
