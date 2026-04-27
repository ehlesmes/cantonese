import { isComponentClass, findConstructor, hasCallTo } from "../ast-utils.js";

export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Enforce mandatory lifecycle calls in Component constructors.",
    },
  },
  create(context) {
    return {
      ClassDeclaration(node) {
        if (!isComponentClass(node)) return;

        const constructor = findConstructor(node);
        if (!constructor) {
          context.report({
            node,
            message: "Component missing mandatory constructor.",
          });
          return;
        }

        const extendsBasePage = node.superClass?.name === "BasePage";

        // 1. Enforce super()
        if (!hasCallTo(constructor, "super")) {
          context.report({
            node: constructor,
            message: "Missing super() call.",
          });
        }

        // 2. Enforce lifecycle (only if NOT extending BasePage, which handles it in its own constructor)
        if (!extendsBasePage) {
          if (!hasCallTo(constructor, "render")) {
            context.report({
              node: constructor,
              message: "Missing this.render() call.",
            });
          }

          // Smart Validation: Only require this.validate() if the constructor accepts parameters
          const hasParams = constructor.value.params.length > 0;
          if (hasParams && !hasCallTo(constructor, "validate")) {
            context.report({
              node: constructor,
              message:
                "Constructor accepts parameters but missing this.validate(data, [...]) call.",
            });
          }
        }

        // 3. Enforce setupEventListeners call if the method is defined locally
        // Skip for BasePage subclasses because BasePage constructor calls it.
        const hasSetupMethod = node.body.body.some(
          (m) => m.key?.name === "setupEventListeners",
        );
        if (
          !extendsBasePage &&
          hasSetupMethod &&
          !hasCallTo(constructor, "setupEventListeners")
        ) {
          context.report({
            node: constructor,
            message:
              "setupEventListeners() defined but never called in constructor.",
          });
        }
      },
    };
  },
};
