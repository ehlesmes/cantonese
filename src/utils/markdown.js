import { marked } from "marked";

// Configure marked options
marked.setOptions({
  gfm: true,
  breaks: false,
});

/**
 * Compiles a raw annotated markdown string (prose) into HTML with tooltips.
 * Converts inline `Char[Jyutping|Translation]` (with backticks) to tooltips.
 *
 * @param {string} text
 * @param {object} [options={}] Options object (e.g. { inline: true })
 * @returns {string} Compiled HTML
 */
export function compileMarkdown(text, options = {}) {
  if (!text) return "";

  // Regex to match: `Char[Jyutping|Translation]` (with backticks)
  const inlineRegex =
    /`([\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaffA-Za-z0-9.-]+)\[([^\]\n|]+)\|([^\]\n]+)\]`/g;

  // Regex to match: Char[Jyutping|Translation] (without backticks)
  const blockRegex =
    /([\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaffA-Za-z0-9.-]+)\[([^\]\n|]+)\|([^\]\n]+)\]/g;

  // Replace backtick-wrapped annotations
  let processedText = text.replace(
    inlineRegex,
    (match, char, jyutping, translation) => {
      return `<span class="vocab-term">${char}<span class="tooltip-popover"><strong>${jyutping}</strong><br/>${translation}</span></span>`;
    },
  );

  // Replace plain annotations (without backticks)
  processedText = processedText.replace(
    blockRegex,
    (match, char, jyutping, translation) => {
      return `<span class="vocab-term">${char}<span class="tooltip-popover"><strong>${jyutping}</strong><br/>${translation}</span></span>`;
    },
  );

  const parseOptions = {};
  if (options.breaks !== undefined) {
    parseOptions.breaks = options.breaks;
  }

  // Compile markdown to HTML
  const rawHtml = options.inline
    ? marked.parseInline(processedText, parseOptions)
    : marked.parse(processedText, parseOptions);

  // Regex to match blockquote alerts: <blockquote><p>[!NOTE] ... </blockquote>
  const alertRegex =
    /<blockquote>\s*<p>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]([\s\S]*?)<\/blockquote>/gi;

  // Replace blockquotes with div alert cards
  return rawHtml.replace(alertRegex, (match, type, content) => {
    return `<div class="alert-box alert-${type.toLowerCase()}">
      <div class="alert-title">${type}</div>
      <div class="alert-content"><p>${content.trim()}</div>
    </div>`;
  });
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
    /([\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaffA-Za-z0-9.-]+)\[([^\]\n|]+)\|([^\]\n]+)\]/g;

  return text.replace(blockRegex, (match, char, jyutping, translation) => {
    return `<span class="vocab-term">${char}<span class="tooltip-popover"><strong>${jyutping}</strong><br/>${translation}</span></span>`;
  });
}
