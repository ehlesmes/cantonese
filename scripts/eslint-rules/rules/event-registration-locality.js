import { createComponentVisitor } from "../ast-utils.js";

export default {
  meta: {
    type: "problem",
    docs: {
      description: "Enforce registering event listeners only within setupEventListeners().",
    },
  },
  create(context) {
    let inSetupEvents = false;

    return createComponentVisitor({
      MethodDefinition(node) {
        if (node.key.name === "setupEventListeners") {
          inSetupEvents = true;
        }
      },
      "MethodDefinition:exit"(node) {
        if (node.key.name === "setupEventListeners") {
          inSetupEvents = false;
        }
      },
      CallExpression(node) {
        const isAddListener =
          node.callee.type === "MemberExpression" &&
          node.callee.property.name === "addEventListener";

        if (isAddListener && !inSetupEvents) {
          context.report({
            node,
            message:
              "Register event listeners only within setupEventListeners() to keep render() declarative.",
          });
        }
      },
    });
  },
};
