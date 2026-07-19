import * as fs from "fs";
import * as path from "path";
import * as parser from "./lib/parser";
import {
  validateChapterContent,
  checkChronologicalLimits,
  validateJyutping,
} from "./lib/format-utils";
import type { RawParsedChapter } from "../src/types";

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

/**
 * Validates a single chapter markdown file.
 *
 * @param {string} filePath Absolute or relative path to the file
 * @param {object} [curriculumEntry] Associated curriculum mapping entry if available
 * @returns {Array<object>} List of errors
 */
function validateChapterFile(
  filePath: string,
  curriculumEntry?: { id: string; title: string },
) {
  const errors: { file: string; line: number; message: string }[] = [];
  const addError = (line: number, msg: string) =>
    errors.push({ file: filePath, line, message: msg });

  const basename = path.basename(filePath);
  const slug = basename.replace(".md", "");

  let chapterData;
  try {
    const content = fs.readFileSync(filePath, "utf8");
    chapterData = parser.parseChapter(content);
  } catch (err: unknown) {
    addError(
      0,
      `Failed to parse chapter file: ${err instanceof Error ? err.message : String(err)}`,
    );
    return errors;
  }

  const fileErrors = validateChapterContent(chapterData, slug, curriculumEntry);
  errors.push(
    ...fileErrors.map((e) => ({
      file: filePath,
      line: e.line,
      message: e.message,
    })),
  );

  return errors;
}

/**
 * Main execution orchestration logic (extract for unit testing)
 */
function validateSingleFile(
  targetFile: string,
  curriculumChapters: { id: string; file: string; title: string }[],
  projectRoot: string,
) {
  const errors: { file: string; line: number; message: string }[] = [];
  const filePath = path.resolve(targetFile);

  if (!fs.existsSync(filePath)) {
    errors.push({
      file: path.relative(projectRoot, filePath),
      line: 0,
      message: `File not found: "${targetFile}"`,
    });
    return { errors, warnings: [] };
  }

  const basename = path.basename(filePath);
  const curriculumEntry = curriculumChapters.find((c) => c.file === basename);
  const fileErrors = validateChapterFile(filePath, curriculumEntry);
  errors.push(...fileErrors);

  return { errors, warnings: [] };
}

function validateAllChapters(
  contentDir: string,
  curriculumChapters: { id: string; file: string; title: string }[],
  projectRoot: string,
) {
  const errors: { file: string; line: number; message: string }[] = [];
  const warnings: { chapterId: string; file: string; count: number }[] = [];

  if (!fs.existsSync(contentDir)) {
    errors.push({
      file: path.relative(projectRoot, contentDir),
      line: 0,
      message: `Content directory not found at "${contentDir}"`,
    });
    return { errors, warnings };
  }

  const files = fs.readdirSync(contentDir);
  const chapterFiles = files.filter(
    (f: string) =>
      f.endsWith(".md") &&
      f !== "README.md" &&
      f !== "curriculum.md" &&
      f !== "vocabulary.md",
  );

  for (const file of chapterFiles) {
    const fullPath = path.join(contentDir, file);
    const curriculumEntry = curriculumChapters.find((c) => c.file === file);

    if (!curriculumEntry) {
      errors.push({
        file: path.relative(projectRoot, fullPath),
        line: 0,
        message: `Chapter file "${file}" exists but is not registered in the content/curriculum.md frontmatter`,
      });
    }

    const fileErrors = validateChapterFile(fullPath, curriculumEntry);
    errors.push(...fileErrors);
  }

  const chaptersDataMap: Record<string, RawParsedChapter> = {};
  for (const chapter of curriculumChapters) {
    const filePath = path.join(contentDir, chapter.file);
    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, "utf8");
        chaptersDataMap[chapter.file] = parser.parseChapter(content);
      } catch {
        // ignore
      }
    }
  }

  const limitsRes = checkChronologicalLimits(
    curriculumChapters,
    chaptersDataMap,
  );

  for (const err of limitsRes.errors) {
    errors.push({
      file: path.relative(projectRoot, path.join(contentDir, err.file)),
      line: 0,
      message: err.message,
    });
  }

  for (const warn of limitsRes.warnings) {
    warnings.push({
      chapterId: warn.chapterId,
      file: path.relative(projectRoot, path.join(contentDir, warn.file)),
      count: warn.count,
    });
  }

  return { errors, warnings };
}

function runValidation({
  projectRoot = "",
  contentDir = "",
  curriculumPath = "",
  targetFile,
}: {
  projectRoot?: string;
  contentDir?: string;
  curriculumPath?: string;
  targetFile?: string | undefined;
} = {}) {
  let curriculumChapters: { id: string; file: string; title: string }[] = [];
  const errors: { file: string; line: number; message: string }[] = [];
  const warnings: { chapterId: string; file: string; count: number }[] = [];

  try {
    if (fs.existsSync(curriculumPath)) {
      const content = fs.readFileSync(curriculumPath, "utf8");
      curriculumChapters = parser.parseCurriculum(content);
    }
  } catch (err: unknown) {
    errors.push({
      file:
        projectRoot && curriculumPath
          ? path.relative(projectRoot, curriculumPath)
          : curriculumPath,
      line: 0,
      message: `Failed to parse curriculum.md frontmatter chapter mapping: ${err instanceof Error ? err.message : String(err)}`,
    });
    return { errors, warnings };
  }

  if (targetFile) {
    return validateSingleFile(targetFile, curriculumChapters, projectRoot);
  } else {
    return validateAllChapters(contentDir, curriculumChapters, projectRoot);
  }
}

/**
 * Main execution sequence
 */
function main() {
  const targetArg = process.argv[2];

  const projectRoot = path.resolve(__dirname, "..");
  const contentDir = path.join(projectRoot, "content");
  const curriculumPath = path.join(contentDir, "curriculum.md");

  if (targetArg) {
    console.log(
      `${colors.cyan}Validating single file: ${colors.bold}${path.relative(projectRoot, path.resolve(targetArg))}${colors.reset}\n`,
    );
  } else {
    console.log(
      `${colors.cyan}${colors.bold}Running chapter format validation in Full Mode...${colors.reset}\n`,
    );
  }

  const { errors, warnings } = runValidation({
    projectRoot,
    contentDir,
    curriculumPath,
    targetFile: targetArg,
  });

  if (warnings.length > 0) {
    console.warn(
      `${colors.yellow}${colors.bold}⚠ Vocabulary Count Warning(s):${colors.reset}\n`,
    );
    for (const warn of warnings) {
      console.warn(
        `  ${colors.yellow}•${colors.reset} ${colors.bold}${warn.chapterId}${colors.reset} (${warn.file}) introduces ${warn.count} new words (warning threshold > 20, error threshold > 25).`,
      );
    }
    console.warn("");
  }

  // Report results
  if (errors.length > 0) {
    console.error(
      `${colors.red}${colors.bold}Validation Failed! Found ${errors.length} format error(s):${colors.reset}\n`,
    );

    // Group errors by file
    const grouped: Record<
      string,
      { file: string; line: number; message: string }[]
    > = {};
    for (const err of errors) {
      const relPath = path.relative(projectRoot, err.file);
      if (!grouped[relPath]) grouped[relPath] = [];
      grouped[relPath].push(err);
    }

    for (const [file, errs] of Object.entries(grouped)) {
      console.error(
        `${colors.yellow}${colors.bold}📄 File: ${file}${colors.reset}`,
      );
      if (Array.isArray(errs)) {
        for (const err of errs) {
          const lineStr = err.line > 0 ? `Line ${err.line}: ` : "";
          console.error(
            `  ${colors.red}✗${colors.reset} ${lineStr}${err.message}`,
          );
        }
      }
      console.error("");
    }

    process.exit(1);
  } else {
    console.log(
      `${colors.green}${colors.bold}✓ Formatting validation passed successfully!${colors.reset}\n`,
    );
    process.exit(0);
  }
}

if (require.main === module) {
  main();
}

export { validateJyutping, validateChapterFile, runValidation, main };
