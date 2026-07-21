import { validateJyutping } from "./format-utils.js";
import type { SemanticUnit } from "../../src/types/index.js";

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

function isExactMatch(
  char: string,
  jyutping: string,
  dictionary: DictionaryEntry[],
): boolean {
  return dictionary.some(
    (entry) =>
      entry.char === char &&
      (entry.jyutping.toLowerCase() === jyutping.toLowerCase() ||
        entry.alt_jyutping?.some(
          (alt) => alt.toLowerCase() === jyutping.toLowerCase(),
        )),
  );
}

export function checkAnotA(
  char: string,
  jyutping: string,
  dictionary: DictionaryEntry[],
): DictionaryEntry | undefined {
  if (char.length !== 3 || char[1] !== "唔" || char[0] !== char[2]) {
    return undefined;
  }
  const syllables = jyutping.split(/\s+/);
  if (
    syllables.length !== 3 ||
    syllables[1] !== "m4" ||
    syllables[0]?.toLowerCase() !== syllables[2]?.toLowerCase()
  ) {
    return undefined;
  }

  const char0 = char[0];
  const syllables0 = syllables[0]!;

  return dictionary.find(
    (entry) =>
      entry.char === char0 &&
      (entry.jyutping.toLowerCase() === syllables0.toLowerCase() ||
        entry.alt_jyutping?.some(
          (alt) => alt.toLowerCase() === syllables0.toLowerCase(),
        )),
  );
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

    const exactMatch = isExactMatch(char, jyutping, dictionary);
    const isAnotA = !!checkAnotA(char, jyutping, dictionary);

    if (!exactMatch && !isAnotA) {
      const key = `${char}|${jyutping}`;
      if (!unregisteredMap[key]) {
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

function validateEntryFields(
  character: string,
  jyutping: string,
  definition: string,
  type: string,
  prefix: string,
): string | null {
  if (!character) return `${prefix}Character cannot be empty.`;
  if (!jyutping) return `${prefix}Jyutping cannot be empty.`;

  const jpError = validateJyutping(jyutping);
  if (jpError) return `${prefix}${jpError}`;

  if (!definition) return `${prefix}Definition cannot be empty.`;

  if (!VALID_TYPES.includes(type)) {
    return `${prefix}Invalid word type "${type}". Valid types are: ${VALID_TYPES.join(", ")}`;
  }
  return null;
}

function checkDuplicateEntry(
  character: string,
  jyutping: string,
  dictionary: DictionaryEntry[],
  batchKeys: Set<string>,
  prefix: string,
): string | null {
  const isDuplicateInDict = dictionary.some(
    (dictEntry) =>
      dictEntry.char === character && dictEntry.jyutping === jyutping,
  );

  if (isDuplicateInDict) {
    return `${prefix}Word "${character}" with Jyutping "${jyutping}" is already registered in the dictionary.`;
  }

  const batchKey = `${character}|${jyutping}`;
  if (batchKeys.has(batchKey)) {
    return `${prefix}Duplicate entry for "${character}" with Jyutping "${jyutping}" found within the batch itself.`;
  }
  return null;
}

interface ParsedEntry {
  character: string;
  jyutping: string;
  definition: string;
  type: string;
  alt_jyutping: string[];
  notes: string;
}

function parseRawEntry(entry: RawEntry): ParsedEntry {
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

  return { character, jyutping, definition, type, alt_jyutping, notes };
}

export function validateRegisterEntry(
  entry: RawEntry,
  dictionary: DictionaryEntry[],
  batchKeys: Set<string>,
  prefix = "",
): { validEntry?: DictionaryEntry; error?: string } {
  const parsed = parseRawEntry(entry);

  const fieldError = validateEntryFields(
    parsed.character,
    parsed.jyutping,
    parsed.definition,
    parsed.type,
    prefix,
  );
  if (fieldError) return { error: fieldError };

  const dupError = checkDuplicateEntry(
    parsed.character,
    parsed.jyutping,
    dictionary,
    batchKeys,
    prefix,
  );
  if (dupError) return { error: dupError };

  const newEntry: DictionaryEntry = {
    char: parsed.character,
    jyutping: parsed.jyutping,
    definition: parsed.definition,
    type: parsed.type,
  };
  if (parsed.alt_jyutping.length > 0)
    newEntry.alt_jyutping = parsed.alt_jyutping;
  if (parsed.notes) newEntry.notes = parsed.notes;

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

export function processEntries(
  batchEntries: RawEntry[],
  dictionary: DictionaryEntry[],
  isBatch: boolean,
): { processedEntries: DictionaryEntry[]; errors: string[] } {
  const errors: string[] = [];
  const processedEntries: DictionaryEntry[] = [];
  const incomingKeys = new Set<string>();

  for (let idx = 0; idx < batchEntries.length; idx++) {
    const entry = batchEntries[idx]!;
    const prefix = isBatch ? `Entry #${idx + 1}: ` : "";

    const { validEntry, error } = validateRegisterEntry(
      entry,
      dictionary,
      incomingKeys,
      prefix,
    );

    if (error) {
      errors.push(error);
    } else {
      incomingKeys.add(`${validEntry!.char}|${validEntry!.jyutping}`);
      processedEntries.push(validEntry!);
    }
  }

  return { processedEntries, errors };
}
