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
