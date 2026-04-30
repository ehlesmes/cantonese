import { isComponentClass, findConstructor, findSuperCall } from "../ast-utils.js";

const hasValidSuperArg = (superCallNode) => {
  return superCallNode.expression.arguments.some(
    (arg) =>
      // import.meta.url
      (arg.type === "MemberExpression" &&
        arg.object.type === "MetaProperty" &&
        arg.object.meta.name === "import" &&
        arg.object.property.name === "meta" &&
        arg.property.name === "url") ||
      // or a variable named 'baseUrl' (passed down from subclass)
      (arg.type === "Identifier" && arg.name === "baseUrl"),
  );
};

export default {
  meta: {
    type: "problem",
    docs: {
      description: "Enforce passing import.meta.url to super() for style loading.",
    },
  },
  create(context) {
    return {
      ClassDeclaration(node) {
        if (!isComponentClass(node)) return;

        const constructor = findConstructor(node);
        if (!constructor) return;

        const superCall = findSuperCall(constructor);
        if (!superCall || !hasValidSuperArg(superCall)) {
          context.report({
            node: superCall || constructor,
            message:
              "super() must be passed import.meta.url (or 'baseUrl') to ensure component-specific styles are loaded correctly.",
          });
        }
      },
    };
  },
};
