import type { SemanticUnit } from "../../src/types";

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
