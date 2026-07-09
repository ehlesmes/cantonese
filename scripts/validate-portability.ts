import * as fs from "fs";
import * as path from "path";

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

// Ignore lists
const IGNORED_DIRS = new Set([
  ".git",
  "node_modules",
  ".antigravitycli",
  "tmp",
  "coverage",
  "dist",
  ".astro",
  ".nyc_output",
  "coverage-e2e",
  "test-results",
]);

const IGNORED_FILES = new Set(["package-lock.json"]);

// Allowed extensions to scan (to avoid scanning binaries or huge lock files)
const SCAN_EXTENSIONS = new Set([
  ".js",
  ".md",
  ".json",
  ".yml",
  ".yaml",
  ".css",
  ".html",
  ".config",
]);

// Forbidden absolute path pattern
// This matches:
// 1. file:///
// 2. /Users/...
// 3. /home/...
const FORBIDDEN_PATTERN = /(file:\/\/\/|\/Users\/|\/home\/)/i;

/**
 * Recursively gets all files in a directory
 * @param {string} dir
 * @returns {Array<string>} list of files
 */
function getFilesRecursive(dir: string): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    if (IGNORED_DIRS.has(file)) continue;
    const fullPath = path.join(dir, file);
    try {
      const stat = fs.statSync(fullPath);
      if (stat && stat.isDirectory()) {
        results = results.concat(getFilesRecursive(fullPath));
      } else {
        if (IGNORED_FILES.has(file)) continue;
        if (SCAN_EXTENSIONS.has(path.extname(file))) {
          results.push(fullPath);
        }
      }
    } catch {
      continue;
    }
  }
  return results;
}

function runCheck(projectRoot: string) {
  const files = getFilesRecursive(projectRoot);
  const errors = [];

  for (const file of files) {
    // Skip this script itself to avoid false positives on its own regex definition
    if (file === __filename) continue;

    try {
      const content = fs.readFileSync(file, "utf8");
      const lines = content.split(/\r?\n/);

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line === undefined) continue;
        const match = FORBIDDEN_PATTERN.exec(line);
        if (match) {
          errors.push({
            file: path.relative(projectRoot, file),
            line: i + 1,
            match: match[0],
            content: line.trim(),
          });
        }
      }
    } catch (err: any) {
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
    const grouped: Record<string, any[]> = {};
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

export { runCheck, FORBIDDEN_PATTERN, main };
