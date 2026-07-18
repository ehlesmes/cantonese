/**
 * Transforms Markdown-style annotations into HTML spans.
 * `Character[Jyutping|Translation]` -> `<span class="vocab-term"...>`
 */
export function compileAnnotationsClient(
  text: string,
  hideTranslation = true,
  tokenHashes: Record<string, string> = {},
) {
  if (!text) return "";
  const blockRegex =
    /([\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaffA-Za-z0-9.-]+)\[([^\]\n|]+)\|([^\]\n]+)\]/g;
  return text.replace(
    blockRegex,
    (_match: string, char: string, jyutping: string, translation: string) => {
      const hash = tokenHashes[char] || "";
      if (hideTranslation) {
        return `<span class="vocab-term" data-audio-hash="${hash}">${char}<span class="tooltip-popover"><strong>${jyutping}</strong></span></span>`;
      }
      return `<span class="vocab-term" data-audio-hash="${hash}">${char}<span class="tooltip-popover"><strong>${jyutping}</strong><br/>${translation}</span></span>`;
    },
  );
}
