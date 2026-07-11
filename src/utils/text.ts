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
 * Checks if a token represents one or more punctuation marks.
 */
export function isPunctuation(token: string | null | undefined): boolean {
  if (!token) return false;
  const clean = token.replace(/\[[^\]]+\]/g, "").trim();
  return /^[，。！？、；：,?!;:]+$/.test(clean);
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
