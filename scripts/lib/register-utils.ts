import type {
  SemanticUnit,
  ParsedBlock,
  RawParsedChapter,
} from "../../src/types";
import { validateJyutping } from "./format-utils.js";
import * as parser from "./parser.js";

export interface UnregisteredWord {
  char: string;
  jyutping: string;
  definition: string;
  type: string;
}

export interface DictionaryEntry {
  char: string;
  jyutping: string;
  alt_jyutping?: string[];
  type: string;
  definition?: string;
  notes?: string;
}

/**
 * Finds vocabulary from the chapter units that is not registered in the dictionary.
 * Supports A-not-A question format resolution and type guessing.
 */
export function findUnregisteredWords(
  chapterUnits: SemanticUnit[],
  dictionary: DictionaryEntry[],
): UnregisteredWord[] {
  const unregisteredMap: Record<string, UnregisteredWord> = {};

  for (const unit of chapterUnits) {
    const char = unit.characters.trim();
    const jyutping = unit.jyutping.trim();
    const translation = unit.translation.trim();

    // Look up exact match
    const exactMatch = dictionary.find(
      (entry) =>
        entry.char === char &&
        (entry.jyutping.toLowerCase() === jyutping.toLowerCase() ||
          entry.alt_jyutping?.some(
            (alt) => alt.toLowerCase() === jyutping.toLowerCase(),
          )),
    );

    // Dynamic A-not-A question pattern resolution
    let isAnotA = false;
    if (char.length === 3 && char[1] === "唔" && char[0] === char[2]) {
      const syllables = jyutping.split(/\s+/);
      const syllables0 = String(syllables[0]);
      const syllables2 = String(syllables[2]);
      if (
        syllables.length === 3 &&
        syllables[1] === "m4" &&
        syllables0.toLowerCase() === syllables2.toLowerCase()
      ) {
        const char0 = char[0];
        const baseMatch = dictionary.find(
          (entry) =>
            entry.char === char0 &&
            (entry.jyutping.toLowerCase() === syllables0.toLowerCase() ||
              entry.alt_jyutping?.some(
                (alt) => alt.toLowerCase() === syllables0.toLowerCase(),
              )),
        );
        if (baseMatch) {
          isAnotA = true;
        }
      }
    }

    if (!exactMatch && !isAnotA) {
      const key = `${char}|${jyutping}`;
      if (!unregisteredMap[key]) {
        // Guess word type if the character is registered with a different pronunciation
        const existingEntries = dictionary.filter(
          (entry) => entry.char === char,
        );
        let guessedType = "TODO_TYPE";
        if (existingEntries.length > 0 && existingEntries[0]) {
          guessedType = existingEntries[0].type;
        } else if (translation.toLowerCase().startsWith("to ")) {
          guessedType = "verb";
        }

        unregisteredMap[key] = {
          char,
          jyutping,
          definition: translation,
          type: guessedType,
        };
      }
    }
  }

  return Object.values(unregisteredMap);
}

export const VALID_TYPES = [
  "pronoun",
  "verb",
  "adverb",
  "noun",
  "adjective",
  "expression",
  "classifier",
  "conjunction",
  "preposition",
  "numeral",
  "particle",
  "auxiliary verb",
];

export interface RawEntry {
  char?: unknown;
  character?: unknown;
  jyutping?: unknown;
  definition?: unknown;
  def?: unknown;
  translation?: unknown;
  type?: unknown;
  alt_jyutping?: unknown;
  notes?: unknown;
}

export function validateRegisterEntry(
  entry: RawEntry,
  dictionary: DictionaryEntry[],
  batchKeys: Set<string>,
  prefix = "",
): { validEntry?: DictionaryEntry; error?: string } {
  const character = (entry.char || entry.character || "").toString().trim();
  const jyutping = (entry.jyutping || "").toString().trim();
  const definition = (entry.definition || entry.def || entry.translation || "")
    .toString()
    .trim();
  const type = (entry.type || "").toString().trim().toLowerCase();
  const alt_jyutping = Array.isArray(entry.alt_jyutping)
    ? (entry.alt_jyutping as string[])
    : [];
  const notes = (entry.notes || "").toString().trim();

  if (!character) {
    return { error: `${prefix}Character cannot be empty.` };
  }

  if (!jyutping) {
    return { error: `${prefix}Jyutping cannot be empty.` };
  }

  const jpError = validateJyutping(jyutping);
  if (jpError) {
    return { error: `${prefix}${jpError}` };
  }

  if (!definition) {
    return { error: `${prefix}Definition cannot be empty.` };
  }

  if (!VALID_TYPES.includes(type)) {
    return {
      error: `${prefix}Invalid word type "${entry.type}". Valid types are: ${VALID_TYPES.join(", ")}`,
    };
  }

  const isDuplicateInDict = dictionary.some(
    (dictEntry) =>
      dictEntry.char === character && dictEntry.jyutping === jyutping,
  );

  if (isDuplicateInDict) {
    return {
      error: `${prefix}Word "${character}" with Jyutping "${jyutping}" is already registered in the dictionary.`,
    };
  }

  const batchKey = `${character}|${jyutping}`;
  if (batchKeys.has(batchKey)) {
    return {
      error: `${prefix}Duplicate entry for "${character}" with Jyutping "${jyutping}" found within the batch itself.`,
    };
  }

  const newEntry: DictionaryEntry = {
    char: character,
    jyutping: jyutping,
    definition: definition,
    type: type,
  };
  if (alt_jyutping.length > 0) {
    newEntry.alt_jyutping = alt_jyutping;
  }
  if (notes) {
    newEntry.notes = notes;
  }

  return { validEntry: newEntry };
}

export function sortDictionary(
  dictionary: DictionaryEntry[],
): DictionaryEntry[] {
  return [...dictionary].sort((a, b) => {
    const jpCompare = a.jyutping.localeCompare(b.jyutping);
    if (jpCompare !== 0) return jpCompare;
    return a.char.localeCompare(b.char);
  });
}

export function extractChapterUnits(chapterData: {
  blocks: ParsedBlock[];
}): SemanticUnit[] {
  const chapterUnits: SemanticUnit[] = [];
  for (const block of chapterData.blocks) {
    let rawUnits: SemanticUnit[] = [];
    if (block.type === "prose") {
      rawUnits = parser.extractInlineUnits(block.content);
    } else if (block.type === "cantonese" || block.type === "dialog") {
      rawUnits = parser.extractBlockUnits(block.content);
    } else if (block.type === "exercise") {
      const exerciseData = parser.parseYAML(block.content) as Record<
        string,
        unknown
      >;
      const fields = ["question", "answer", "explanation"];
      for (const field of fields) {
        if (exerciseData[field]) {
          rawUnits.push(
            ...parser.extractBlockUnits(String(exerciseData[field])),
          );
        }
      }
    }
    for (const unit of rawUnits) {
      chapterUnits.push({
        ...unit,
        startLine: block.startLine,
        blockType: block.type,
      });
    }
  }
  return chapterUnits;
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

  // Deduplicate chapter units to keep reports concise
  const uniqueUnitsMap: Record<
    string,
    SemanticUnit & { occurrences: number; lines: number[] }
  > = {};
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

  const uniqueUnits = Object.values(uniqueUnitsMap);

  for (const unit of uniqueUnits) {
    const char = unit.characters.trim();
    const jyutping = unit.jyutping.trim().toLowerCase();
    const translation = unit.translation.trim();

    // Look up in dictionary by exact character and jyutping
    let dictMatch = dictionary.find(
      (entry) =>
        entry.char === char &&
        (entry.jyutping.toLowerCase() === jyutping ||
          entry.alt_jyutping?.some(
            (alt: string) => alt.toLowerCase() === jyutping,
          )),
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
              (entry.jyutping.toLowerCase() === syllables[0] ||
                entry.alt_jyutping?.some(
                  (alt: string) => alt.toLowerCase() === syllables[0],
                )),
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
      const normDictDef = (dictMatch.definition || "").toLowerCase();

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
