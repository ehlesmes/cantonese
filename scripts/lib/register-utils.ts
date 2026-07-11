import type { SemanticUnit } from "../../src/types";
import { validateJyutping } from "../validate-format.js";
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
        entry.jyutping.toLowerCase() === jyutping.toLowerCase(),
    );

    // Dynamic A-not-A question pattern resolution
    let isAnotA = false;
    if (char.length === 3 && char[1] === "唔" && char[0] === char[2]) {
      const syllables = jyutping.split(/\s+/);
      const syllables0 = syllables[0];
      const syllables2 = syllables[2];
      if (
        syllables.length === 3 &&
        syllables[1] === "m4" &&
        syllables0 !== undefined &&
        syllables2 !== undefined &&
        syllables0.toLowerCase() === syllables2.toLowerCase()
      ) {
        const char0 = char[0];
        const baseMatch = dictionary.find(
          (entry) =>
            entry.char === char0 &&
            entry.jyutping.toLowerCase() === syllables0.toLowerCase(),
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

export function validateRegisterEntry(
  entry: any,
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

export function extractChapterUnits(chapterData: { blocks: any[] }): any[] {
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
        continue;
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
    for (const unit of rawUnits) {
      chapterUnits.push(unit);
    }
  }
  return chapterUnits;
}
