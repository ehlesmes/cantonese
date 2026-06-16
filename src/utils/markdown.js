import { marked } from "marked";

// Configure marked options
marked.setOptions({
  gfm: true,
  breaks: true,
});

/**
 * Compiles a raw annotated markdown string (prose) into HTML with tooltips.
 * Converts inline `Char[Jyutping|Translation]` (with backticks) to tooltips.
 *
 * @param {string} text
 * @returns {string} Compiled HTML
 */
export function compileMarkdown(text) {
  if (!text) return "";

  // Regex to match: `Char[Jyutping|Translation]` (with backticks)
  const inlineRegex =
    /`([\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]+)\[([^\]\n|]+)\|([^\]\n]+)\]`/g;

  // Replace annotations with HTML spans for tooltips
  const processedText = text.replace(
    inlineRegex,
    (match, char, jyutping, translation) => {
      return `<span class="vocab-term">${char}<span class="tooltip-popover"><strong>${jyutping}</strong><br/>${translation}</span></span>`;
    },
  );

  // Compile markdown to HTML (marked.parse returns a string synchronously unless async option is set)
  return marked.parse(processedText);
}

/**
 * Compiles plain text annotations (without backticks) used in examples/dialogs.
 * Converts Char[Jyutping|Translation] to tooltip markup.
 *
 * @param {string} text
 * @returns {string} Compiled HTML
 */
export function compileAnnotations(text) {
  if (!text) return "";

  // Regex to match: Char[Jyutping|Translation] (without backticks)
  const blockRegex =
    /([\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]+)\[([^\]\n|]+)\|([^\]\n]+)\]/g;

  return text.replace(blockRegex, (match, char, jyutping, translation) => {
    return `<span class="vocab-term">${char}<span class="tooltip-popover"><strong>${jyutping}</strong><br/>${translation}</span></span>`;
  });
}
