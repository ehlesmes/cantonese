import path from "path";

export default {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Ensure exported class names match their snake_case filenames in PascalCase.",
    },
  },
  create(context) {
    return {
      ExportNamedDeclaration(node) {
        if (node.declaration?.type !== "ClassDeclaration") return;

        const filename = context.filename || context.getFilename();
        const basename = path.basename(filename, ".js");

        // Ignore shared files or index files
        if (basename === "index" || basename === "component") return;

        const expectedName = basename
          .split("_")
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join("");

        const actualName = node.declaration.id.name;

        if (actualName !== expectedName) {
          context.report({
            node: node.declaration.id,
            message: `Exported class name '${actualName}' must match the PascalCase version of the filename '${expectedName}'.`,
          });
        }
      },
    };
  },
};
