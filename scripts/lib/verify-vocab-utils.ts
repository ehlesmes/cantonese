import * as parser from "./parser.js";
import type {
  ParsedBlock,
  RawParsedChapter,
  SemanticUnit,
} from "../../src/types/index.js";

import { checkAnotA, type DictionaryEntry } from "./register-utils.js";

function extractExerciseUnits(content: string): SemanticUnit[] {
  const exerciseData = parser.parseYAML(content);
  const fields = ["question", "answer", "explanation"];
  return fields.flatMap((field) => {
    if (exerciseData[field]) {
      return parser.extractBlockUnits(String(exerciseData[field]));
    }
    return [];
  });
}

function extractUnitsFromBlock(block: ParsedBlock): SemanticUnit[] {
  let rawUnits: SemanticUnit[] = [];

  if (block.type === "prose") {
    rawUnits = parser.extractInlineUnits(block.content);
  } else if (block.type === "cantonese" || block.type === "dialog") {
    rawUnits = parser.extractBlockUnits(block.content);
  } else if (block.type === "exercise") {
    rawUnits = extractExerciseUnits(block.content);
  }

  return rawUnits.map((unit) => ({
    ...unit,
    startLine: block.startLine,
    blockType: block.type,
  }));
}

export function extractChapterUnits(chapterData: {
  blocks: ParsedBlock[];
}): SemanticUnit[] {
  return chapterData.blocks.flatMap(extractUnitsFromBlock);
}

type UniqueUnit = SemanticUnit & { occurrences: number; lines: number[] };

function deduplicateUnits(chapterUnits: SemanticUnit[]): UniqueUnit[] {
  const uniqueUnitsMap: Record<string, UniqueUnit> = {};
  for (const unit of chapterUnits) {
    const key = `${unit.characters}_${unit.jyutping}`;
    if (!uniqueUnitsMap[key]) {
      uniqueUnitsMap[key] = {
        ...unit,
        occurrences: 1,
        lines: [unit.startLine!],
      };
    } else {
      uniqueUnitsMap[key].occurrences++;
      if (
        unit.startLine &&
        !uniqueUnitsMap[key].lines.includes(unit.startLine)
      ) {
        uniqueUnitsMap[key].lines.push(unit.startLine);
      }
    }
  }
  return Object.values(uniqueUnitsMap);
}

function findDictMatch(
  char: string,
  jyutping: string,
  dictionary: DictionaryEntry[],
): DictionaryEntry | undefined {
  let dictMatch = dictionary.find(
    (entry) =>
      entry.char === char &&
      (entry.jyutping.toLowerCase() === jyutping ||
        entry.alt_jyutping?.some(
          (alt: string) => alt.toLowerCase() === jyutping,
        )),
  );

  if (!dictMatch) {
    const baseMatch = checkAnotA(char, jyutping, dictionary);
    if (baseMatch) {
      dictMatch = {
        char,
        jyutping,
        definition: `${baseMatch.definition} or not?`,
        type: "expression",
      };
    }
  }
  return dictMatch;
}

function hasSemanticOverlap(translation: string, definition: string): boolean {
  const normChapTrans = translation.toLowerCase();
  const normDictDef = definition.toLowerCase();

  const isSubStrMatch =
    normDictDef.includes(normChapTrans) || normChapTrans.includes(normDictDef);

  const chapWords = normChapTrans.split(/[^a-z0-9]+/);
  const dictWords = normDictDef.split(/[^a-z0-9]+/);
  const intersection = chapWords.filter(
    (w: string) => w.length > 2 && dictWords.includes(w),
  );

  return isSubStrMatch || intersection.length > 0;
}

export function verifyChapterContent(
  chapterData: RawParsedChapter,
  dictionary: DictionaryEntry[],
): {
  errors: { term: string; message: string; locations: string }[];
  warnings: { term: string; message: string; locations: string }[];
  passedCount: number;
} {
  const chapterUnits = extractChapterUnits(chapterData);
  const errors: { term: string; message: string; locations: string }[] = [];
  const warnings: { term: string; message: string; locations: string }[] = [];
  let passedCount = 0;

  if (chapterUnits.length === 0) {
    return { errors, warnings, passedCount };
  }

  const uniqueUnits = deduplicateUnits(chapterUnits);

  for (const unit of uniqueUnits) {
    const char = unit.characters.trim();
    const jyutping = unit.jyutping.trim().toLowerCase();
    const translation = unit.translation.trim();

    const dictMatch = findDictMatch(char, jyutping, dictionary);
    const locations = `[Block starting line(s): ${unit.lines.join(", ")}]`;

    if (!dictMatch) {
      errors.push({
        term: `${char} (${jyutping})`,
        message: `Term is introduced in chapter but not registered in the dictionary.`,
        locations,
      });
    } else {
      if (!hasSemanticOverlap(translation, dictMatch.definition || "")) {
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
