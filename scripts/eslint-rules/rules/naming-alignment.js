import path from "path";
import { toPascalCase } from "../ast-utils.js";

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

        const expectedName = toPascalCase(basename);
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
