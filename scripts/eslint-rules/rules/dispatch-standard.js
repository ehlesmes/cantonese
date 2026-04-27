import { isComponentClass } from "../ast-utils.js";

export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Enforce using this.dispatch() instead of raw dispatchEvent calls.",
    },
  },
  create(context) {
    let inComponent = false;

    return {
      ClassDeclaration(node) {
        if (isComponentClass(node)) inComponent = true;
      },
      "ClassDeclaration:exit"() {
        inComponent = false;
      },
      CallExpression(node) {
        if (!inComponent) return;

        const isDispatchEvent =
          node.callee.type === "MemberExpression" &&
          node.callee.property.name === "dispatchEvent";

        if (isDispatchEvent) {
          context.report({
            node,
            message:
              "Prefer using the this.dispatch() helper to ensure consistent event bubbling and composition across the Shadow DOM.",
          });
        }
      },
    };
  },
};
