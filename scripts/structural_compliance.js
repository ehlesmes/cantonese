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
    // 2. Verify Style Existence
    if (!items.includes("style.css")) {
      errors.push(`[Structure] ${dir}: Component is missing "style.css".`);
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

console.log("🏗️  Verifying File-System Structure Compliance...");
walk(COMPONENTS_DIR);

if (errors.length > 0) {
  console.error("\n❌ Structural compliance check failed:\n");
  errors.forEach((err) => console.error(err));
  process.exit(1);
} else {
  console.log("\n✅ Component structure adheres to project standards.\n");
  process.exit(0);
}
