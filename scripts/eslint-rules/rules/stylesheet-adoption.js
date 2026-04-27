import { isComponentClass } from "../ast-utils.js";

export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Ensure imported shared styles are assigned to adoptedStyleSheets.",
    },
  },
  create(context) {
    const importedStyles = new Set();

    return {
      ImportDeclaration(node) {
        node.specifiers.forEach((spec) => {
          if (
            spec.type === "ImportSpecifier" &&
            ["iconStyles", "baseStyles", "buttonStyles"].includes(
              spec.imported.name,
            )
          ) {
            importedStyles.add(spec.local.name);
          }
        });
      },
      ClassDeclaration(node) {
        if (!isComponentClass(node) || importedStyles.size === 0) return;

        const classSource = context.sourceCode.getText(node);
        importedStyles.forEach((style) => {
          // Check if the style is included in an adoptedStyleSheets array
          if (!classSource.includes(style)) {
            context.report({
              node,
              message: `Shared style '${style}' is imported but not used within the class. Did you forget to add it to 'this.shadowRoot.adoptedStyleSheets'?`,
            });
          }
        });
      },
    };
  },
};
