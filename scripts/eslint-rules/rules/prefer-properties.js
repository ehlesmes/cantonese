import { isComponentClass, isGetterSetterName } from "../ast-utils.js";

export default {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Prefer ES6 get/set keywords over method prefixes like get... or set....",
    },
  },
  create(context) {
    return {
      MethodDefinition(node) {
        // node.parent is ClassBody, node.parent.parent is ClassDeclaration
        if (!isComponentClass(node.parent.parent)) return;

        if (isGetterSetterName(node.key.name)) {
          context.report({
            node,
            message:
              "Prefer native ES6 'get' and 'set' keywords over method prefixes like 'get...' or 'set...' to maintain a clean property-based API.",
          });
        }
      },
    };
  },
};
