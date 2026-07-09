import * as fs from "fs";
import * as path from "path";
import * as parser from "./lib/parser";

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

export function verifyChapter(absolutePath: string, dictionary: any[]) {
  let chapterData;
  try {
    chapterData = parser.parseChapter(absolutePath);
  } catch (err: any) {
    throw new Error(`Failed to parse chapter file: ${err instanceof Error ? err.message : String(err)}`);
  }

  const chapterUnits: any[] = [];

  for (const block of chapterData.blocks) {
    let rawUnits: any[] = [];
    if (block.type === "prose") {
      rawUnits = parser.extractInlineUnits(block.content);
    } else if (block.type === "cantonese" || block.type === "dialog") {
      rawUnits = parser.extractBlockUnits(block.content);
    } else if (block.type === "exercise") {
      let exerciseData;
      try {
        exerciseData = parser.parseYAML(block.content);
      } catch {
        continue; // bad exercise, validate-format catches this
      }
      const fields = ["question", "answer", "explanation"];
      for (const field of fields) {
        if (exerciseData[field]) {
          rawUnits.push(
            ...parser.extractBlockUnits(String(exerciseData[field])),
          );
        }
      }
    }

    // Attach block starting line info for error reports
    for (const unit of rawUnits) {
      chapterUnits.push({
        ...unit,
        startLine: block.startLine,
        blockType: block.type,
      });
    }
  }

  const errors: any[] = [];
  const warnings: any[] = [];
  let passedCount = 0;

  if (chapterUnits.length === 0) {
    return { errors, warnings, passedCount };
  }

  // Deduplicate chapter units to keep reports concise
  const uniqueUnitsMap: Record<string, any> = {};
  for (const unit of chapterUnits) {
    const key = `${unit.characters}_${unit.jyutping}`;
    if (!uniqueUnitsMap[key]) {
      uniqueUnitsMap[key] = {
        ...unit,
        occurrences: 1,
        lines: [unit.startLine],
      };
    } else {
      uniqueUnitsMap[key].occurrences++;
      if (!uniqueUnitsMap[key].lines.includes(unit.startLine)) {
        uniqueUnitsMap[key].lines.push(unit.startLine);
      }
    }
  }

  const uniqueUnits = Object.values(uniqueUnitsMap);

  for (const unit of uniqueUnits) {
    const char = unit.characters.trim();
    const jyutping = unit.jyutping.trim().toLowerCase();
    const translation = unit.translation.trim();

    // Look up in dictionary by exact character and jyutping
    let dictMatch = dictionary.find(
      (entry: any) =>
        entry.char === char && entry.jyutping.toLowerCase() === jyutping,
    );

    // Dynamic A-not-A question pattern resolution
    if (!dictMatch) {
      if (char.length === 3 && char[1] === "唔" && char[0] === char[2]) {
        const syllables = jyutping.split(/\s+/);
        if (
          syllables.length === 3 &&
          syllables[1] === "m4" &&
          syllables[0] === syllables[2]
        ) {
          // Verify the base verb exists in dictionary
          const baseMatch = dictionary.find(
            (entry: any) =>
              entry.char === char[0] &&
              entry.jyutping.toLowerCase() === syllables[0],
          );
          if (baseMatch) {
            // Mock a dictionary match for validation and semantic check
            dictMatch = {
              char,
              jyutping,
              definition: `${baseMatch.definition} or not?`,
              type: "expression",
            };
          }
        }
      }
    }

    const locations = `[Block starting line(s): ${unit.lines.join(", ")}]`;

    if (!dictMatch) {
      // 1. Critical Error: Term not registered in dictionary
      errors.push({
        term: `${char} (${jyutping})`,
        message: `Term is introduced in chapter but not registered in the dictionary.`,
        locations,
      });
    } else {
      // 2. Semantics check: check translation divergence
      const normChapTrans = translation.toLowerCase();
      const normDictDef = dictMatch.definition.toLowerCase();

      // Check substring matches
      const isSubStrMatch =
        normDictDef.includes(normChapTrans) ||
        normChapTrans.includes(normDictDef);

      // Check keyword intersection overlap for slight grammatical nuance adjustments
      const chapWords = normChapTrans.split(/[^a-z0-9]+/);
      const dictWords = normDictDef.split(/[^a-z0-9]+/);
      const intersection = chapWords.filter(
        (w: string) => w.length > 2 && dictWords.includes(w),
      );

      const hasSemanticOverlap = isSubStrMatch || intersection.length > 0;

      if (!hasSemanticOverlap) {
        // Translation divergence
        warnings.push({
          term: `${char} (${jyutping})`,
          message: `Translation divergence. Chapter translation is "${translation}" but dictionary specifies "${dictMatch.definition}".`,
          locations,
        });
      } else {
        passedCount++;
      }
    }
  }

  return { errors, warnings, passedCount };
}

export function runVerification({ contentDir, targetFile, dictPath }: { contentDir: string; targetFile?: string | undefined; dictPath: string }) {
  if (!fs.existsSync(dictPath)) {
    throw new Error(`Master dictionary database not found at "${dictPath}"`);
  }

  let dictionary;
  try {
    dictionary = JSON.parse(fs.readFileSync(dictPath, "utf8"));
  } catch (err: any) {
    throw new Error(`Failed to parse master dictionary: ${err instanceof Error ? err.message : String(err)}`);
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

  const allErrors: Record<string, any[]> = {};
  const allWarnings: Record<string, any[]> = {};
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
  } catch (err: any) {
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


