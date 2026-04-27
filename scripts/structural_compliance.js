import fs from "fs";
import path from "path";

const COMPONENTS_DIR = "./components";
const IGNORED_FOLDERS = ["shared"]; // Folders with different internal structures

const errors = [];

function checkDirectoryStructure(dir) {
  const folderName = path.basename(dir);
  if (IGNORED_FOLDERS.includes(folderName)) return;

  const items = fs.readdirSync(dir);
  const jsFiles = items.filter(
    (f) => f.endsWith(".js") && !f.endsWith(".test.js"),
  );

  // 1. Verify that a component directory has a main .js file matching the folder name
  const expectedMainFile = `${folderName}.js`;
  if (jsFiles.length > 0 && !items.includes(expectedMainFile)) {
    errors.push(
      `[Naming] ${dir}: Expected a main file named "${expectedMainFile}" to match the folder name.`,
    );
  }

  jsFiles.forEach((jsFile) => {
    // 2. Verify Style Existence and Compliance
    if (!items.includes("style.css")) {
      errors.push(`[Structure] ${dir}: Component is missing "style.css".`);
    } else {
      const cssPath = path.join(dir, "style.css");
      const cssContent = fs.readFileSync(cssPath, "utf-8");

      // Check for hardcoded colors
      const hexMatch = cssContent.match(/#[0-9a-fA-F]{3,8}/);
      const rgbMatch = cssContent.match(/rgba?\(.*?\)/);
      if (hexMatch || rgbMatch) {
        errors.push(
          `[Styles] ${cssPath}: Hardcoded colors (${
            hexMatch || rgbMatch
          }) detected. Use --md-sys-* tokens.`,
        );
      }

      // Check for :host selector
      if (!cssContent.includes(":host")) {
        errors.push(
          `[Styles] ${cssPath}: Missing ":host" selector. Components must style their custom element root.`,
        );
      }
    }

    // 3. Verify Test Existence
    const testFile = jsFile.replace(".js", ".test.js");
    if (!items.includes(testFile)) {
      errors.push(
        `[Structure] ${dir}: Missing test file "${testFile}" for "${jsFile}".`,
      );
    }
  });
}

function walk(dir) {
  const stat = fs.statSync(dir);
  if (stat.isDirectory()) {
    const items = fs.readdirSync(dir);

    // If it's a leaf directory with JS files, it's a component
    if (items.some((f) => f.endsWith(".js"))) {
      checkDirectoryStructure(dir);
    }

    // Recursively walk subdirectories
    items.forEach((item) => {
      const sub = path.join(dir, item);
      if (fs.statSync(sub).isDirectory()) {
        walk(sub);
      }
    });
  }
}

console.info("🏗️  Verifying File-System Structure Compliance...");
walk(COMPONENTS_DIR);

if (errors.length > 0) {
  console.error("\n❌ Structural compliance check failed:\n");
  errors.forEach((err) => console.error(err));
  process.exit(1);
} else {
  console.info("\n✅ Component structure adheres to project standards.\n");
  process.exit(0);
}
