import { isComponentClass } from "../ast-utils.js";

export default {
  meta: {
    type: "problem",
    docs: {
      description: "Encapsulate DOM operations within the component's scope.",
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
      MemberExpression(node) {
        if (!inComponent) return;

        // Allow document.createElement and createTextNode, block everything else
        const allowedMethods = ["createElement", "createTextNode"];
        if (
          node.object.name === "document" &&
          !allowedMethods.includes(node.property.name)
        ) {
          context.report({
            node,
            message:
              "Direct 'document' access violates encapsulation. Use 'this.shadowRoot' or 'this.element'.",
          });
        }
      },
    };
  },
};
