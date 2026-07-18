import * as fs from "fs";
import * as path from "path";
import * as parser from "./lib/parser";
import {
  verifyChapterContent,
  type DictionaryEntry,
} from "./lib/register-utils.js";

// Premium CLI output styles
const colors = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  dim: "\x1b[2m",
};

export interface VerificationIssue {
  term: string;
  message: string;
  locations: string;
}

export function verifyChapter(
  absolutePath: string,
  dictionary: DictionaryEntry[],
) {
  let chapterData;
  try {
    chapterData = parser.parseChapter(absolutePath);
  } catch (err: unknown) {
    throw new Error(
      `Failed to parse chapter file: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  return verifyChapterContent(chapterData, dictionary);
}

export function runVerification({
  contentDir,
  targetFile,
  dictPath,
}: {
  contentDir: string;
  targetFile?: string | undefined;
  dictPath: string;
}) {
  if (!fs.existsSync(dictPath)) {
    throw new Error(`Master dictionary database not found at "${dictPath}"`);
  }

  let dictionary: DictionaryEntry[];
  try {
    dictionary = JSON.parse(
      fs.readFileSync(dictPath, "utf8"),
    ) as DictionaryEntry[];
  } catch (err: unknown) {
    throw new Error(
      `Failed to parse master dictionary: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  let filesToProcess: string[] = [];

  if (targetFile) {
    const absolutePath = path.resolve(targetFile);
    if (!fs.existsSync(absolutePath)) {
      throw new Error(`Chapter file not found at "${targetFile}"`);
    }
    filesToProcess = [absolutePath];
  } else {
    if (!fs.existsSync(contentDir)) {
      throw new Error(`Content directory not found at "${contentDir}"`);
    }
    const files = fs.readdirSync(contentDir);
    const chapterFiles = files.filter(
      (f: string) =>
        f.endsWith(".md") &&
        f !== "README.md" &&
        f !== "curriculum.md" &&
        f !== "vocabulary.md",
    );
    filesToProcess = chapterFiles.map((f: string) => path.join(contentDir, f));
  }

  const allErrors: Record<string, VerificationIssue[]> = {};
  const allWarnings: Record<string, VerificationIssue[]> = {};
  let totalPassed = 0;

  for (const file of filesToProcess) {
    const { errors, warnings, passedCount } = verifyChapter(file, dictionary);
    const basename = path.basename(file);
    if (errors.length > 0) allErrors[basename] = errors;
    if (warnings.length > 0) allWarnings[basename] = warnings;
    totalPassed += passedCount;
  }

  return { errors: allErrors, warnings: allWarnings, passedCount: totalPassed };
}

export function main() {
  const targetArg = process.argv[2];
  const projectRoot = path.resolve(__dirname, "..");
  const contentDir = path.join(projectRoot, "content");
  const dictPath =
    process.env.DICT_PATH || path.join(contentDir, "dictionary.json");

  if (targetArg) {
    console.log(
      `🔍 ${colors.bold}Checking vocabulary consistency in chapter:${colors.reset} ${colors.cyan}${path.basename(
        targetArg,
      )}${colors.reset}\n`,
    );
  } else {
    console.log(
      `🔍 ${colors.bold}Checking vocabulary consistency in all chapters...${colors.reset}\n`,
    );
  }

  let result;
  try {
    result = runVerification({ contentDir, targetFile: targetArg, dictPath });
  } catch (err: unknown) {
    console.error(
      `${colors.red}${colors.bold}ERROR:${colors.reset} ${err instanceof Error ? err.message : String(err)}`,
    );
    process.exit(1);
  }

  const { errors, warnings, passedCount } = result;

  const errorFiles = Object.keys(errors);
  const warningFiles = Object.keys(warnings);

  let totalErrors = 0;
  let totalWarnings = 0;

  if (errorFiles.length > 0 || warningFiles.length > 0) {
    if (errorFiles.length > 0) {
      for (const file of errorFiles) {
        const fileErrors = errors[file] || [];
        totalErrors += fileErrors.length;
        console.error(
          `${colors.red}${colors.bold}✗ ${file}: Found ${fileErrors.length} unregistered vocabulary error(s):${colors.reset}`,
        );
        for (const err of fileErrors) {
          console.error(
            `  ${colors.red}•${colors.reset} ${colors.bold}${err.term}${colors.reset}\n    ${err.message}\n    ${colors.dim}${err.locations}${colors.reset}\n`,
          );
        }
      }
    }

    if (warningFiles.length > 0) {
      for (const file of warningFiles) {
        const fileWarnings = warnings[file] || [];
        totalWarnings += fileWarnings.length;
        console.error(
          `${colors.yellow}${colors.bold}⚠ ${file}: Found ${fileWarnings.length} translation divergence warning(s):${colors.reset}`,
        );
        for (const warn of fileWarnings) {
          console.error(
            `  ${colors.yellow}•${colors.reset} ${colors.bold}${warn.term}${colors.reset}\n    ${warn.message}\n    ${colors.dim}${warn.locations}${colors.reset}\n`,
          );
        }
      }
    }

    console.log(
      `${colors.bold}Summary:${colors.reset} Passed: ${passedCount}, Errors: ${totalErrors}, Warnings: ${totalWarnings}\n`,
    );

    if (totalErrors > 0) {
      process.exit(1);
    }
  } else {
    if (targetArg) {
      console.log(
        `${colors.green}${colors.bold}✓ All ${passedCount} annotated vocabulary terms perfectly match the master local dictionary!${colors.reset}\n`,
      );
    } else {
      console.log(
        `${colors.green}${colors.bold}✓ All ${passedCount} annotated vocabulary terms across all chapters perfectly match the master local dictionary!${colors.reset}\n`,
      );
    }
  }

  process.exit(0);
}

if (require.main === module) {
  main();
}
