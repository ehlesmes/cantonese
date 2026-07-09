import { marked } from "marked";
import crypto from "node:crypto";
import type { CompileMarkdownOptions } from "../types";

// Configure marked options
marked.setOptions({
  gfm: true,
  breaks: false,
});

/**
 * Compiles a raw annotated markdown string (prose) into HTML with tooltips.
 * Converts inline `Char[Jyutping|Translation]` (with backticks) to tooltips.
 *
 * @param text
 * @param [options={}] Options object (e.g. { inline: true })
 * @returns Compiled HTML
 */
export function compileMarkdown(
  text: string | null | undefined,
  options: CompileMarkdownOptions = {}
): string {
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
    (_match: string, char: string, jyutping: string, translation: string) => {
      const hash = crypto
        .createHash("sha256")
        .update(char)
        .digest("hex")
        .slice(0, 16);
      return `<span class="vocab-term" data-audio-hash="${hash}">${char}<span class="tooltip-popover"><strong>${jyutping}</strong><br/>${translation}</span></span>`;
    }
  );

  // Replace plain annotations (without backticks)
  processedText = processedText.replace(
    blockRegex,
    (_match: string, char: string, jyutping: string, translation: string) => {
      const hash = crypto
        .createHash("sha256")
        .update(char)
        .digest("hex")
        .slice(0, 16);
      return `<span class="vocab-term" data-audio-hash="${hash}">${char}<span class="tooltip-popover"><strong>${jyutping}</strong><br/>${translation}</span></span>`;
    }
  );

  const parseOptions: { breaks?: boolean } = {};
  if (options.breaks !== undefined) {
    parseOptions.breaks = options.breaks;
  }

  const htmlString = options.inline
    ? (marked.parseInline(processedText, parseOptions) as string)
    : (marked.parse(processedText, parseOptions) as string);

  // Regex to match blockquote alerts: <blockquote><p>[!NOTE] ... </blockquote>
  const alertRegex =
    /<blockquote>\s*<p>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]([\s\S]*?)<\/blockquote>/gi;

  // Replace blockquotes with div alert cards
  return htmlString.replace(alertRegex, (_match: string, type: string, content: string) => {
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
 * @param text
 * @returns Compiled HTML
 */
export function compileAnnotations(text: string | null | undefined): string {
  if (!text) return "";

  // Regex to match: Char[Jyutping|Translation] (without backticks)
  const blockRegex =
    /([\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaffA-Za-z0-9.-]+)\[([^\]\n|]+)\|([^\]\n]+)\]/g;

  return text.replace(blockRegex, (_match: string, char: string, jyutping: string, translation: string) => {
    const hash = crypto
      .createHash("sha256")
      .update(char)
      .digest("hex")
      .slice(0, 16);
    return `<span class="vocab-term" data-audio-hash="${hash}">${char}<span class="tooltip-popover"><strong>${jyutping}</strong><br/>${translation}</span></span>`;
  });
}
