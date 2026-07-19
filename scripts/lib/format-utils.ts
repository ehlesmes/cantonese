import {
  CHINESE_CHAR_REGEX,
  extractInlineUnits,
  extractBlockUnits,
  parseYAML,
} from "./parser.js";
import type { SemanticUnit, RawParsedChapter } from "../../src/types";

/**
 * Validates a single Jyutping syllable.
 * Syllables must consist of lowercase letters followed by a tone digit 1-6.
 */
export function validateJyutping(jyutping: string) {
  if (!/^[a-z]+[1-6](?:[ -]?[a-z]+[1-6])*$/.test(jyutping)) {
    return `Invalid Jyutping format "${jyutping}" (must consist of lowercase syllables each containing letters followed by a tone digit 1-6)`;
  }
  return null;
}

type AddErrorFn = (line: number, msg: string) => void;

interface BlockData {
  type: string;
  startLine: number;
  content: string;
}

function validateFrontmatter(
  frontmatter: Record<string, unknown>,
  filenameSlug: string,
  curriculumEntry: { id: string; title: string } | undefined,
  addError: AddErrorFn,
) {
  if (frontmatter.id === undefined) {
    addError(2, 'Frontmatter is missing required key "id"');
  } else if (typeof frontmatter.id !== "string") {
    addError(
      2,
      `Frontmatter "id" value must be a string (got "${frontmatter.id}")`,
    );
  } else if (frontmatter.id !== filenameSlug) {
    addError(
      2,
      `Frontmatter "id" (${frontmatter.id}) does not match the filename slug (${filenameSlug})`,
    );
  }

  if (!frontmatter.title) {
    addError(2, 'Frontmatter is missing required key "title"');
  } else if (typeof frontmatter.title !== "string") {
    addError(2, 'Frontmatter "title" must be a string');
  }

  if (!frontmatter.description) {
    addError(2, 'Frontmatter is missing required key "description"');
  } else if (typeof frontmatter.description !== "string") {
    addError(2, 'Frontmatter "description" must be a string');
  }

  if (curriculumEntry) {
    if (frontmatter.id !== curriculumEntry.id) {
      addError(
        2,
        `Frontmatter ID (${frontmatter.id}) does not match the curriculum definition (${curriculumEntry.id})`,
      );
    }
    if (frontmatter.title !== curriculumEntry.title) {
      addError(
        2,
        `Frontmatter title ("${frontmatter.title}") does not match the curriculum title ("${curriculumEntry.title}")`,
      );
    }
  }
}

function processUnitsForValidation(
  units: SemanticUnit[],
  line: string,
  currentLineNum: number,
  addError: AddErrorFn,
  rawContextMsg: string,
) {
  let cleanLine = line;
  units.sort((a, b) => b.index - a.index);
  for (const unit of units) {
    const jpError = validateJyutping(unit.jyutping);
    if (jpError) {
      addError(currentLineNum, `${jpError} in ${rawContextMsg} "${unit.raw}"`);
    }
    cleanLine =
      cleanLine.slice(0, unit.index) +
      " ".repeat(unit.raw.length) +
      cleanLine.slice(unit.index + unit.raw.length);
  }
  return cleanLine;
}

function validateProseBlock(block: BlockData, addError: AddErrorFn) {
  const lines = block.content.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const currentLineNum = block.startLine + i;

    if (line.includes("``")) {
      addError(
        currentLineNum,
        `Found invalid double/adjacent backticks ("\x60\x60"). Ensure all inline terms are wrapped in single backticks and separated by spaces.`,
      );
    }

    const units = extractInlineUnits(line);
    const cleanLine = processUnitsForValidation(
      units,
      line,
      currentLineNum,
      addError,
      "inline annotation",
    );

    const rawChineseMatch = CHINESE_CHAR_REGEX.exec(cleanLine);
    if (rawChineseMatch) {
      const contextStart = Math.max(0, rawChineseMatch.index - 10);
      const contextEnd = Math.min(cleanLine.length, rawChineseMatch.index + 10);
      const snippet = cleanLine.slice(contextStart, contextEnd).trim();
      addError(
        currentLineNum,
        `Found unannotated Chinese character "${rawChineseMatch[0]}" at column ${rawChineseMatch.index + 1}. All Chinese text must be formatted as \`Characters[Jyutping|Translation]\`. Snippet: "...${snippet}..."`,
      );
    }
  }
}

function validateCantoneseBlock(block: BlockData, addError: AddErrorFn) {
  const lines = block.content.split(/\r?\n/);
  const sepCount = lines.filter((l: string) => l.trim() === "===").length;

  if (sepCount !== 1) {
    addError(
      block.startLine,
      `Cantonese example block must contain exactly one separator line "===" (found ${sepCount})`,
    );
    return;
  }

  const sepIdx = lines.findIndex((l: string) => l.trim() === "===");

  for (let i = 0; i < sepIdx; i++) {
    const line = lines[i]!;
    const currentLineNum = block.startLine + 1 + i;
    const units = extractBlockUnits(line);
    const cleanLine = processUnitsForValidation(
      units,
      line,
      currentLineNum,
      addError,
      "example annotation",
    );

    const rawChineseMatch = CHINESE_CHAR_REGEX.exec(cleanLine);
    if (rawChineseMatch) {
      addError(
        currentLineNum,
        `Found unannotated Chinese character "${rawChineseMatch[0]}" inside cantonese block. Ensure all Chinese characters are annotated without backticks as Characters[Jyutping|Translation]`,
      );
    }
  }

  for (let i = sepIdx + 1; i < lines.length; i++) {
    const line = lines[i]!;
    const currentLineNum = block.startLine + 1 + i;
    const rawChineseMatch = CHINESE_CHAR_REGEX.exec(line);
    if (rawChineseMatch) {
      addError(
        currentLineNum,
        `English translation section contains illegal Chinese character: "${rawChineseMatch[0]}"`,
      );
    }
  }
}

function validateDialogBlock(block: BlockData, addError: AddErrorFn) {
  const lines = block.content.split(/\r?\n/);
  if (lines.length % 2 !== 0) {
    addError(
      block.startLine,
      `Dialogue block must contain an even number of lines alternating between Speaker turn and English translation`,
    );
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const currentLineNum = block.startLine + 1 + i;

    if (i % 2 === 0) {
      const speakerMatch = /^([A-Za-z]+):\s*(.*)$/.exec(line);
      if (!speakerMatch) {
        addError(
          currentLineNum,
          `Dialogue speaker turn must start with a letter and colon (e.g. "A: "). Got: "${line}"`,
        );
        continue;
      }

      const cantoneseText = String(speakerMatch[2]);
      const units = extractBlockUnits(cantoneseText);
      const cleanLine = processUnitsForValidation(
        units,
        cantoneseText,
        currentLineNum,
        addError,
        "dialogue turn",
      );

      const rawChineseMatch = CHINESE_CHAR_REGEX.exec(cleanLine);
      if (rawChineseMatch) {
        addError(
          currentLineNum,
          `Found unannotated Chinese character "${rawChineseMatch[0]}" inside dialogue speaker turn. All Cantonese text in speaker lines must be annotated as Characters[Jyutping|Translation]`,
        );
      }
    } else {
      const translationMatch = /^\s*===\s+(.*)$/.exec(line);
      if (!translationMatch) {
        addError(
          currentLineNum,
          `Dialogue translation line must be prefixed with exactly "=== ". Got: "${line}"`,
        );
        continue;
      }

      const translationText = String(translationMatch[1]);
      const rawChineseMatch = CHINESE_CHAR_REGEX.exec(translationText);
      if (rawChineseMatch) {
        addError(
          currentLineNum,
          `Dialogue English translation line contains illegal Chinese character: "${rawChineseMatch[0]}"`,
        );
      }
    }
  }
}

function validateExerciseBlock(block: BlockData, addError: AddErrorFn) {
  const data = parseYAML(block.content);
  const required = ["question", "answer", "explanation"];
  const keys = Object.keys(data);

  for (const req of required) {
    if (!(req in data)) {
      addError(
        block.startLine,
        `Exercise block is missing required key "${req}"`,
      );
    }
  }

  for (const key of keys) {
    if (!required.includes(key)) {
      addError(
        block.startLine,
        `Exercise block contains unrecognized key "${key}"`,
      );
    }
  }

  for (const field of required) {
    if (data[field]) {
      const valStr = String(data[field]);
      const units = extractBlockUnits(valStr);
      const cleanVal = processUnitsForValidation(
        units,
        valStr,
        block.startLine,
        addError,
        `inside exercise field "${field}"`,
      );

      const rawChineseMatch = CHINESE_CHAR_REGEX.exec(cleanVal);
      if (rawChineseMatch) {
        addError(
          block.startLine,
          `Found unannotated Chinese character "${rawChineseMatch[0]}" inside exercise field "${field}". All Chinese text inside exercises must be annotated as Characters[Jyutping|Translation]`,
        );
      }
    }
  }
}

/**
 * Validates a single chapter markdown content in memory.
 */
export function validateChapterContent(
  chapterData: RawParsedChapter,
  filenameSlug: string,
  curriculumEntry?: { id: string; title: string },
) {
  const errors: { line: number; message: string }[] = [];
  const addError = (line: number, msg: string) =>
    errors.push({ line, message: msg });

  const frontmatter = chapterData.frontmatter;
  if (!frontmatter) {
    addError(1, "Missing YAML frontmatter block at the top of the file");
  } else {
    validateFrontmatter(frontmatter, filenameSlug, curriculumEntry, addError);
  }

  for (const block of chapterData.blocks) {
    if (block.type === "prose") {
      validateProseBlock(block, addError);
    } else if (block.type === "cantonese") {
      validateCantoneseBlock(block, addError);
    } else if (block.type === "dialog") {
      validateDialogBlock(block, addError);
    } else if (block.type === "exercise") {
      validateExerciseBlock(block, addError);
    } else {
      addError(
        block.startLine,
        `Unsupported code block type "${block.type}". Only "cantonese", "dialog", and "exercise" code blocks are allowed.`,
      );
    }
  }

  return errors;
}

function extractUnitsFromBlock(block: BlockData): SemanticUnit[] {
  let units: SemanticUnit[] = [];
  if (block.type === "prose") {
    units = extractInlineUnits(block.content);
  } else if (block.type === "cantonese" || block.type === "dialog") {
    units = extractBlockUnits(block.content);
  } else if (block.type === "exercise") {
    const exerciseData = parseYAML(block.content);
    const fields = ["question", "answer", "explanation"];
    for (const field of fields) {
      if (exerciseData[field]) {
        units.push(...extractBlockUnits(String(exerciseData[field])));
      }
    }
  }
  return units;
}

/**
 * Checks chronological vocabulary limits in memory.
 */
export function checkChronologicalLimits(
  curriculumChapters: { file: string; id: string }[],
  chaptersDataMap: Record<string, RawParsedChapter>,
) {
  const errors: { file: string; message: string }[] = [];
  const warnings: { chapterId: string; file: string; count: number }[] = [];
  const seenWords = new Set<string>();

  for (const chapter of curriculumChapters) {
    const chapterData = chaptersDataMap[chapter.file];
    if (!chapterData) continue;

    const introducedInThisChapter = new Set<string>();

    for (const block of chapterData.blocks) {
      const units = extractUnitsFromBlock(block);

      for (const unit of units) {
        const char = unit.characters.trim();
        const jyutping = unit.jyutping.trim().toLowerCase();
        const key = `${char}_${jyutping}`;

        if (!seenWords.has(key)) {
          introducedInThisChapter.add(key);
        }
      }
    }

    Array.from(introducedInThisChapter).forEach((key) => {
      seenWords.add(key);
    });

    const newWordsCount = introducedInThisChapter.size;
    if (newWordsCount > 25) {
      errors.push({
        file: chapter.file,
        message: `Chapter "${chapter.id}" introduces ${newWordsCount} new vocabulary words, exceeding the limit of 25. Please split this chapter.`,
      });
    } else if (newWordsCount > 20) {
      warnings.push({
        chapterId: chapter.id,
        file: chapter.file,
        count: newWordsCount,
      });
    }
  }

  return { errors, warnings };
}
