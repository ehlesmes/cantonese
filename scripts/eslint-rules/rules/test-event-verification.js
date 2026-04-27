import fs from "fs";

export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Ensure components using this.dispatch() have event verification in tests.",
    },
  },
  create(context) {
    if (!context.filename.endsWith(".test.js")) return {};
    return {
      Program(node) {
        const componentFile = context.filename.replace(".test.js", ".js");
        if (!fs.existsSync(componentFile)) return;

        const componentSource = fs.readFileSync(componentFile, "utf-8");
        const testSource = context.sourceCode.getText();

        if (
          componentSource.includes("this.dispatch(") &&
          (!testSource.includes("addEventListener") ||
            !testSource.includes("vi.fn()"))
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
