import fs from "fs";

export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Enforce a 'Validation' describe block for components with validate().",
    },
  },
  create(context) {
    if (!context.filename.endsWith(".test.js")) return {};
    return {
      Program(node) {
        const componentFile = context.filename.replace(".test.js", ".js");
        if (!fs.existsSync(componentFile)) return;

        const componentSource = fs.readFileSync(componentFile, "utf-8");
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
