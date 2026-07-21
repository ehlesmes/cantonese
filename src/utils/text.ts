/**
 * Strips annotations, brackets, and backticks from Cantonese text to get clean spoken text.
 * E.g., `你好[nei5hou2|hello]` -> 你好
 */
export function getCleanSpokenText(text: string | null | undefined): string {
  if (!text) return "";
  let cleaned = text;

  // Replace annotated blocks `Char[Jp|Trans]` with just Char
  const annotationRegex =
    /`?([\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaffA-Za-z0-9.-]+)\[([^\]\n|]+)\|([^\]\n]+)\]`?/g;
  cleaned = cleaned.replace(
    annotationRegex,
    (_match: string, char: string) => char,
  );

  // Clean any lingering bracket parameters
  cleaned = cleaned.replace(/\[[^\]]+\]/g, "");

  return cleaned.trim();
}

/**
 * Splits a raw cantonese string (with annotations) into an array of tokens.
 * Separates punctuation marks into their own tokens.
 */
export function splitCantoneseTokens(
  cantoneseRaw: string | null | undefined,
): string[] {
  if (!cantoneseRaw) return [];
  const spaced = cantoneseRaw.replace(/([，。！？、；：,?!;:])/g, " $1 ");
  const regex = /([^\s[]+\[[^\]]+\]|[^\s[]+)/g;
  return spaced.match(regex) || [];
}

/**
 * Extracts just the character/word from an annotated token (e.g. `Char[Jp|Eng]` -> `Char`).
 */
export function stripAnnotations(token: string | null | undefined): string {
  if (!token) return "";
  const match = token.match(/^([^[]+)/);
  return match ? match[1]! : token;
}

/**
 * Checks if a token represents one or more punctuation marks.
 */
export function isPunctuation(token: string | null | undefined): boolean {
  if (!token) return false;
  const clean = token.replace(/\[[^\]]+\]/g, "").trim();
  return /^[，。！？、；：,?!;:]+$/.test(clean);
}

/**
 * Checks if the entire string consists only of punctuation marks and whitespace.
 */
export function isPunctuationOnly(text: string | null | undefined): boolean {
  if (!text) return false;
  return /^[，。！？、；：,?!;:\s]+$/.test(text);
}

/**
 * Compares two token lists, returning true if they match.
 * Swapping equivalent punctuation marks is allowed.
 */
export function checkPhraseAnswer(
  userTokens: string[],
  expectedTokens: string[],
): boolean {
  if (userTokens.length !== expectedTokens.length) return false;
  for (let i = 0; i < expectedTokens.length; i++) {
    const userT = userTokens[i];
    const correctT = expectedTokens[i];
    if (userT !== correctT) {
      if (isPunctuation(userT) && isPunctuation(correctT)) {
        continue;
      }
      return false;
    }
  }
  return true;
}

export interface MinimalVoiceInfo {
  name: string;
  lang: string;
}

/**
 * Selects the best Cantonese voice from a list based on priority.
 */
export function selectBestCantoneseVoice<T extends MinimalVoiceInfo>(
  voices: T[],
): T | null {
  const hkVoices = voices.filter((v) => {
    const lang = v.lang.toLowerCase();
    return (
      lang === "zh-hk" ||
      lang === "zh-yue" ||
      lang.replace("_", "-") === "zh-hk"
    );
  });

  if (hkVoices.length === 0) return null;

  const siri = hkVoices.find((v) => v.name.toLowerCase().includes("siri"));
  if (siri) return siri;
  const premium = hkVoices.find((v) =>
    v.name.toLowerCase().includes("premium"),
  );
  if (premium) return premium;
  const enhanced = hkVoices.find((v) =>
    v.name.toLowerCase().includes("enhanced"),
  );
  if (enhanced) return enhanced;

  return hkVoices[0]!;
}

export interface DictionaryEntry {
  char: string;
  jyutping: string;
  definition: string;
  type?: string;
  notes?: string;
}

/**
 * Searches the Cantonese dictionary using different query matches.
 */
export function lookupDictionary(
  dictionary: DictionaryEntry[],
  query: string,
): DictionaryEntry[] {
  const trimmed = query.trim();
  if (trimmed === "") return [];

  const hasChinese = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/.test(trimmed);
  const hasDigits = /\d/.test(trimmed);

  if (hasChinese) {
    return dictionary.filter((entry) => entry.char.includes(trimmed));
  } else if (hasDigits) {
    const normalizedQuery = trimmed.toLowerCase().replace(/[- ]/g, "");
    return dictionary.filter((entry) => {
      const normalizedJp = entry.jyutping.toLowerCase().replace(/[- ]/g, "");
      return normalizedJp.includes(normalizedQuery);
    });
  } else {
    const lowerQuery = trimmed.toLowerCase();

    const englishMatches = dictionary.filter((entry) => {
      const defMatch = entry.definition.toLowerCase().includes(lowerQuery);
      const noteMatch = entry.notes
        ? entry.notes.toLowerCase().includes(lowerQuery)
        : false;
      return defMatch || noteMatch;
    });

    const tonelessMatches = dictionary.filter((entry) => {
      const tonelessJp = entry.jyutping
        .toLowerCase()
        .replace(/[1-6]/g, "")
        .replace(/[- ]/g, "");
      const normalizedQuery = lowerQuery.replace(/[- ]/g, "");
      return (
        tonelessJp === normalizedQuery || tonelessJp.includes(normalizedQuery)
      );
    });

    const combined = [...englishMatches];
    for (const entry of tonelessMatches) {
      if (
        !combined.some(
          (e) => e.char === entry.char && e.jyutping === entry.jyutping,
        )
      ) {
        combined.push(entry);
      }
    }
    return combined;
  }
}

/**
 * Generates a stable ID for a phrase based on its text content.
 * Cleans formatting annotations and hashes the remaining string.
 */
export function getStablePhraseId(text: string): string {
  const clean = text
    .replace(
      /`?([\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaffA-Za-z0-9.-]+)\[([^\]\n|]+)\|([^\]\n]+)\]`?/g,
      "$1",
    )
    .replace(/[^\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaffA-Za-z0-9]/g, "");
  let hash = 5381;
  for (let i = 0; i < clean.length; i++) {
    hash = (hash * 33) ^ clean.charCodeAt(i);
  }
  const hashStr = (hash >>> 0).toString(36);
  return `phr-${clean.length}-${hashStr}`;
}

/**
 * Generates a stable ID for a vocabulary item based on character and jyutping.
 */
export function getStableVocabId(character: string, jyutping: string): string {
  return `vocab-${character}_${jyutping.replace(/\s+/g, "")}`;
}
