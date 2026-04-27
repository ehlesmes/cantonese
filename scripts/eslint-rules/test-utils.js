import fs from "fs";

/**
 * Checks if the current file is a test file.
 * @param {RuleContext} context
 * @returns {boolean}
 */
export const isTestFile = (context) => {
  const filename = context.filename || context.getFilename();
  return filename.endsWith(".test.js");
};

/**
 * Gets the source code of the component corresponding to the current test file.
 * Returns null if the component file doesn't exist.
 * @param {RuleContext} context
 * @returns {string|null}
 */
export const getComponentSource = (context) => {
  const testFile = context.filename || context.getFilename();
  const componentFile = testFile.replace(".test.js", ".js");

  if (!fs.existsSync(componentFile)) {
    return null;
  }

  return fs.readFileSync(componentFile, "utf-8");
};
