import { isComponentClass } from "../ast-utils.js";

export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Enforce registering event listeners only within setupEventListeners().",
    },
  },
  create(context) {
    let inComponent = false;
    let inSetupEvents = false;

    return {
      ClassDeclaration(node) {
        if (isComponentClass(node)) inComponent = true;
      },
      "ClassDeclaration:exit"() {
        inComponent = false;
      },
      MethodDefinition(node) {
        if (node.key.name === "setupEventListeners") inSetupEvents = true;
      },
      "MethodDefinition:exit"(node) {
        if (node.key.name === "setupEventListeners") inSetupEvents = false;
      },
      CallExpression(node) {
        if (!inComponent) return;

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
    };
  },
};
