import * as fs from "fs";
import * as path from "path";
import {
  getFilesRecursive,
  validatePortabilityLine,
  type PortabilityError,
} from "./lib/portability-utils.js";

// Premium CLI output styles
const colors = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function runCheck(projectRoot: string) {
  const files = getFilesRecursive(projectRoot);
  const errors: PortabilityError[] = [];

  for (const file of files) {
    // Skip this script itself to avoid false positives on its own regex definition
    if (file === __filename || file.endsWith("portability-utils.ts")) continue;

    try {
      const content = fs.readFileSync(file, "utf8");
      const lines = content.split(/\r?\n/);

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line === undefined) continue;
        validatePortabilityLine(line, i, projectRoot, file, errors);
      }
    } catch (err: unknown) {
      console.error(
        `${colors.yellow}Warning: Could not read file "${path.relative(projectRoot, file)}": ${err instanceof Error ? err.message : String(err)}${colors.reset}`,
      );
    }
  }
  return errors;
}

function main() {
  const projectRoot = path.resolve(__dirname, "..");
  console.log(
    `${colors.cyan}${colors.bold}Running project portability and absolute path check...${colors.reset}\n`,
  );

  const errors = runCheck(projectRoot);

  if (errors.length > 0) {
    console.error(
      `${colors.red}${colors.bold}Portability Check Failed! Found ${errors.length} hardcoded absolute path reference(s):${colors.reset}\n`,
    );

    // Group by file
    const grouped: Record<
      string,
      { file: string; line: number; match: string; content: string }[]
    > = {};
    for (const err of errors) {
      const fileGroup = grouped[err.file] || [];
      fileGroup.push(err);
      grouped[err.file] = fileGroup;
    }

    for (const [file, errs] of Object.entries(grouped)) {
      console.error(
        `${colors.yellow}${colors.bold}📄 File: ${file}${colors.reset}`,
      );
      if (Array.isArray(errs)) {
        for (const err of errs) {
          console.error(
            `  ${colors.red}✗${colors.reset} Line ${err.line}: Found forbidden absolute reference "${err.match}"`,
          );
          console.error(`    Snippet: "${err.content}"`);
        }
      }
      console.error("");
    }

    process.exit(1);
  } else {
    console.log(
      `${colors.green}${colors.bold}✓ Portability check passed successfully! No absolute paths found in the project.${colors.reset}\n`,
    );
    process.exit(0);
  }
}

if (require.main === module) {
  main();
}

export { runCheck, main };
