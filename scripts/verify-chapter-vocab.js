const fs = require("fs");
const path = require("path");
const parser = require("./lib/parser");

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

function showUsage() {
  console.log(`
${colors.bold}${colors.cyan}Cantonese Chapter Vocabulary Consistency Checker${colors.reset}
${colors.dim}Cross-references annotated chapter vocabulary against the master local dictionary.${colors.reset}

${colors.bold}Usage:${colors.reset}
  npm run vocab:verify -- <chapter_file_path>

${colors.bold}Example:${colors.reset}
  npm run vocab:verify -- content/01-greetings.md
`);
}

function main() {
  const chapterPath = process.argv[2];

  if (!chapterPath) {
    showUsage();
    process.exit(1);
  }

  const absolutePath = path.resolve(chapterPath);
  if (!fs.existsSync(absolutePath)) {
    console.error(
      `${colors.red}${colors.bold}ERROR: Chapter file not found at "${chapterPath}"${colors.reset}`,
    );
    process.exit(1);
  }

  const dictPath =
    process.env.DICT_PATH || path.join(__dirname, "../content/dictionary.json");
  if (!fs.existsSync(dictPath)) {
    console.error(
      `${colors.red}${colors.bold}ERROR: Master dictionary database not found at "${dictPath}"${colors.reset}`,
    );
    process.exit(1);
  }

  let dictionary;
  try {
    dictionary = JSON.parse(fs.readFileSync(dictPath, "utf8"));
  } catch (err) {
    console.error(
      `${colors.red}${colors.bold}ERROR: Failed to parse master dictionary:${colors.reset} ${err.message}`,
    );
    process.exit(1);
  }

  // Parse chapter data
  let chapterData;
  try {
    chapterData = parser.parseChapter(absolutePath);
  } catch (err) {
    console.error(
      `${colors.red}${colors.bold}ERROR: Failed to parse chapter file:${colors.reset} ${err.message}`,
    );
    process.exit(1);
  }

  const fileBasename = path.basename(absolutePath);
  console.log(
    `🔍 ${colors.bold}Checking vocabulary consistency in chapter:${colors.reset} ${colors.cyan}${fileBasename}${colors.reset}\n`,
  );

  // Extract all vocabulary units from the chapter
  const chapterUnits = [];

  for (const block of chapterData.blocks) {
    let rawUnits = [];
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

  if (chapterUnits.length === 0) {
    console.log(
      `${colors.green}✓ No Cantonese vocabulary annotations found in this chapter.${colors.reset}\n`,
    );
    process.exit(0);
  }

  const errors = [];
  const warnings = [];
  let passedCount = 0;

  // Deduplicate chapter units to keep reports concise
  const uniqueUnitsMap = {};
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
      (entry) =>
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
            (entry) =>
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
        (w) => w.length > 2 && dictWords.includes(w),
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

  // Reporting results
  if (errors.length > 0 || warnings.length > 0) {
    if (errors.length > 0) {
      console.error(
        `${colors.red}${colors.bold}✗ Found ${errors.length} unregistered vocabulary error(s):${colors.reset}\n`,
      );
      for (const err of errors) {
        console.error(
          `  ${colors.red}•${colors.reset} ${colors.bold}${err.term}${colors.reset}\n    ${err.message}\n    ${colors.dim}${err.locations}${colors.reset}\n`,
        );
      }
    }

    if (warnings.length > 0) {
      console.error(
        `${colors.yellow}${colors.bold}⚠ Found ${warnings.length} translation divergence warning(s):${colors.reset}\n`,
      );
      for (const warn of warnings) {
        console.error(
          `  ${colors.yellow}•${colors.reset} ${colors.bold}${warn.term}${colors.reset}\n    ${warn.message}\n    ${colors.dim}${warn.locations}${colors.reset}\n`,
        );
      }
    }

    console.log(
      `${colors.bold}Summary:${colors.reset} Passed: ${passedCount}, Errors: ${errors.length}, Warnings: ${warnings.length}\n`,
    );

    // Exit with 1 if there are critical registration errors
    if (errors.length > 0) {
      process.exit(1);
    }
  } else {
    console.log(
      `${colors.green}${colors.bold}✓ All ${passedCount} annotated vocabulary terms perfectly match the master local dictionary!${colors.reset}\n`,
    );
  }

  process.exit(0);
}

if (require.main === module) {
  main();
}
