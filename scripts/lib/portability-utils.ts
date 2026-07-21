import * as fs from "fs";
import * as path from "path";

// Ignore lists
export const IGNORED_DIRS = new Set([
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

export const IGNORED_FILES = new Set(["package-lock.json"]);

// Allowed extensions to scan (to avoid scanning binaries or huge lock files)
export const SCAN_EXTENSIONS = new Set([
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
export const FORBIDDEN_PATTERN = /(file:\/\/\/|\/Users\/|\/home\/)/i;

export interface PortabilityError {
  file: string;
  line: number;
  match: string;
  content: string;
}

export function validatePortabilityLine(
  line: string,
  index: number,
  projectRoot: string,
  file: string,
  errors: PortabilityError[],
) {
  const match = FORBIDDEN_PATTERN.exec(line);
  if (match) {
    errors.push({
      file: path.relative(projectRoot, file),
      line: index + 1,
      match: match[0],
      content: line.trim(),
    });
  }
}

export function shouldScanFile(file: string, isDirectory: boolean): boolean {
  if (isDirectory) {
    return !IGNORED_DIRS.has(file);
  } else {
    return !IGNORED_FILES.has(file) && SCAN_EXTENSIONS.has(path.extname(file));
  }
}

/**
 * Recursively gets all files in a directory
 */
export function getFilesRecursive(dir: string): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    if (!shouldScanFile(file, true)) continue;
    const fullPath = path.join(dir, file);
    try {
      const stat = fs.statSync(fullPath);
      if (stat && stat.isDirectory()) {
        results = results.concat(getFilesRecursive(fullPath));
      } else {
        if (shouldScanFile(file, false)) {
          results.push(fullPath);
        }
      }
    } catch {
      continue;
    }
  }
  return results;
}
